/**
 * @file power_manager.c
 * @brief Power Management Implementation
 *
 * Implements automatic light sleep with activity tracking and GPIO wake.
 */

#include "power_manager.h"
#include "config.h"
#include "esp_log.h"
#include "esp_sleep.h"
#include "esp_pm.h"
#include "esp_timer.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/gpio.h"
#include "driver/rtc_io.h"

static const char *TAG = "power_mgr";

// Power manager state
static struct {
    uint32_t sleep_timeout_sec;  // Inactivity timeout before sleep
    int64_t last_activity_us;    // Last activity timestamp (microseconds)
    bool is_sleeping;            // Currently in sleep mode
    uint32_t sleep_prevent_count; // Sleep prevention lock counter
    TaskHandle_t task_handle;    // Power manager task handle
} s_pm_state = {
    .sleep_timeout_sec = 30,
    .last_activity_us = 0,
    .is_sleeping = false,
    .sleep_prevent_count = 0,
    .task_handle = NULL,
};

/**
 * Configure wake sources for light sleep
 */
static esp_err_t configure_wake_sources(void)
{
    esp_err_t ret;

    // Keep RTC peripherals (including I2C) powered during sleep
    // This allows button polling to continue during sleep for instant response
    ret = esp_sleep_pd_config(ESP_PD_DOMAIN_RTC_PERIPH, ESP_PD_OPTION_ON);
    if (ret != ESP_OK) {
        ESP_LOGW(TAG, "Failed to configure RTC peripheral power: %s", esp_err_to_name(ret));
        return ret;
    }

    ESP_LOGI(TAG, "RTC peripherals (I2C) will stay powered during sleep");
    ESP_LOGI(TAG, "Buttons will wake device instantly via I2C polling");
    return ESP_OK;
}

/**
 * Enter light sleep mode
 */
static void enter_light_sleep(void)
{
    if (s_pm_state.sleep_prevent_count > 0) {
        ESP_LOGD(TAG, "Sleep prevented (lock count: %lu)", s_pm_state.sleep_prevent_count);
        return;
    }

    ESP_LOGI(TAG, "=== Entering light sleep ===");
    s_pm_state.is_sleeping = true;

    // Configure wake sources
    esp_err_t ret = configure_wake_sources();
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to configure wake sources");
        s_pm_state.is_sleeping = false;
        return;
    }

    // Enter light sleep
    // Note: WiFi/BLE will be suspended automatically by ESP-IDF
    // Tasks continue running but at lower frequency
    int64_t sleep_start = esp_timer_get_time();

    ret = esp_light_sleep_start();

    int64_t sleep_duration_ms = (esp_timer_get_time() - sleep_start) / 1000;

    s_pm_state.is_sleeping = false;

    // Check wake cause
    esp_sleep_wakeup_cause_t wake_cause = esp_sleep_get_wakeup_cause();

    switch (wake_cause) {
        case ESP_SLEEP_WAKEUP_EXT0:
            ESP_LOGI(TAG, "Woke from touch/GPIO after %lld ms", sleep_duration_ms);
            power_manager_activity();  // Touch detected = activity
            break;

        default:
            ESP_LOGD(TAG, "Woke from %d after %lld ms", wake_cause, sleep_duration_ms);
            break;
    }
}

/**
 * Power manager background task
 * Monitors inactivity and triggers sleep when timeout expires
 */
static void power_manager_task(void *pvParameters)
{
    ESP_LOGI(TAG, "Power manager task started (timeout: %lu sec)", s_pm_state.sleep_timeout_sec);

    // Initialize last activity to now
    s_pm_state.last_activity_us = esp_timer_get_time();

    while (1) {
        // Calculate idle time
        int64_t current_time_us = esp_timer_get_time();
        int64_t idle_time_sec = (current_time_us - s_pm_state.last_activity_us) / 1000000;

        // Check if we should sleep
        if (idle_time_sec >= s_pm_state.sleep_timeout_sec) {
            ESP_LOGI(TAG, "Idle for %lld sec (timeout: %lu sec) - entering sleep",
                     idle_time_sec, s_pm_state.sleep_timeout_sec);

            enter_light_sleep();

            // Reset activity timer after wake
            s_pm_state.last_activity_us = esp_timer_get_time();
        }

        // Check every second
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}

esp_err_t power_manager_init(uint32_t sleep_timeout_sec)
{
    ESP_LOGI(TAG, "Initializing power manager (timeout: %lu sec)", sleep_timeout_sec);

    // Validate timeout
    if (sleep_timeout_sec < 10 || sleep_timeout_sec > 300) {
        ESP_LOGW(TAG, "Invalid sleep timeout %lu sec, using default 30s", sleep_timeout_sec);
        sleep_timeout_sec = 30;
    }

    s_pm_state.sleep_timeout_sec = sleep_timeout_sec;
    s_pm_state.last_activity_us = esp_timer_get_time();
    s_pm_state.is_sleeping = false;
    s_pm_state.sleep_prevent_count = 0;

    ESP_LOGI(TAG, "Power manager initialized");
    return ESP_OK;
}

esp_err_t power_manager_start_task(uint32_t priority, uint32_t stack_size)
{
    if (s_pm_state.task_handle != NULL) {
        ESP_LOGW(TAG, "Power manager task already running");
        return ESP_OK;
    }

    BaseType_t task_created = xTaskCreate(
        power_manager_task,
        "power_mgr",
        stack_size,
        NULL,
        priority,
        &s_pm_state.task_handle
    );

    if (task_created != pdPASS) {
        ESP_LOGE(TAG, "Failed to create power manager task");
        return ESP_FAIL;
    }

    ESP_LOGI(TAG, "Power manager task started");
    return ESP_OK;
}

void power_manager_activity(void)
{
    s_pm_state.last_activity_us = esp_timer_get_time();

    if (s_pm_state.is_sleeping) {
        ESP_LOGD(TAG, "Activity detected while sleeping - will wake");
    }
}

void power_manager_set_timeout(uint32_t sleep_timeout_sec)
{
    if (sleep_timeout_sec < 10 || sleep_timeout_sec > 300) {
        ESP_LOGW(TAG, "Invalid sleep timeout %lu sec (must be 10-300)", sleep_timeout_sec);
        return;
    }

    s_pm_state.sleep_timeout_sec = sleep_timeout_sec;
    ESP_LOGI(TAG, "Sleep timeout updated to %lu sec", sleep_timeout_sec);
}

uint32_t power_manager_get_timeout(void)
{
    return s_pm_state.sleep_timeout_sec;
}

bool power_manager_is_sleeping(void)
{
    return s_pm_state.is_sleeping;
}

void power_manager_sleep_now(void)
{
    ESP_LOGI(TAG, "Manual sleep triggered");
    // Force sleep by setting last activity to far in the past
    s_pm_state.last_activity_us = 0;
}

void power_manager_prevent_sleep(void)
{
    s_pm_state.sleep_prevent_count++;
    ESP_LOGD(TAG, "Sleep prevented (lock count: %lu)", s_pm_state.sleep_prevent_count);
}

void power_manager_allow_sleep(void)
{
    if (s_pm_state.sleep_prevent_count > 0) {
        s_pm_state.sleep_prevent_count--;
        ESP_LOGD(TAG, "Sleep allowed (lock count: %lu)", s_pm_state.sleep_prevent_count);
    }
}
