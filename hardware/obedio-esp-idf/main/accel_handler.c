/**
 * @file accel_handler.c
 * @brief Accelerometer Handler Implementation
 */

#include "accel_handler.h"
#include "lis3dhtr.h"
#include "led_controller.h"
#include "esp_log.h"
#include "esp_timer.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

static const char *TAG = "accel_handler";

// Shake callback function pointer
static shake_callback_t shake_callback = NULL;

// Last shake timestamp for debouncing
static uint64_t last_shake_time = 0;

// Task handle
static TaskHandle_t accel_task_handle = NULL;
static bool is_initialized = false;

esp_err_t accel_handler_init(shake_callback_t callback)
{
    ESP_LOGI(TAG, "Initializing accelerometer handler");

    // Store callback function
    shake_callback = callback;

    // Initialize LIS3DHTR accelerometer
    esp_err_t ret = lis3dhtr_init(I2C_MASTER_NUM, LIS3DHTR_I2C_ADDR);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to initialize LIS3DHTR: %s", esp_err_to_name(ret));
        return ret;
    }

    is_initialized = true;

    ESP_LOGI(TAG, "Accelerometer initialized (threshold: %.2f G, debounce: %d ms)",
             SHAKE_THRESHOLD, SHAKE_DEBOUNCE_MS);

    return ESP_OK;
}

void accel_handler_task(void *pvParameters)
{
    ESP_LOGI(TAG, "Starting accelerometer monitoring task");

    // Sample period = 1000ms / 50Hz = 20ms
    const TickType_t sample_period = pdMS_TO_TICKS(1000 / ACCEL_SAMPLE_RATE_HZ);

    while (1) {
        // Read acceleration magnitude
        float magnitude = lis3dhtr_get_magnitude();

        if (magnitude < 0) {
            // Error reading accelerometer
            ESP_LOGW(TAG, "Failed to read accelerometer magnitude");
            vTaskDelay(sample_period);
            continue;
        }

        // Check for shake event
        if (magnitude > SHAKE_THRESHOLD) {
            // Get current time in milliseconds
            uint64_t current_time = MILLIS();

            // Check if debounce period has elapsed
            if ((current_time - last_shake_time) > SHAKE_DEBOUNCE_MS) {
                ESP_LOGI(TAG, "Shake detected! Magnitude: %.2f G", magnitude);

                // Update last shake time
                last_shake_time = current_time;

                // Flash red LEDs
                led_flash(LED_COLOR_RED, 200);

                // Call callback function if registered
                if (shake_callback != NULL) {
                    shake_callback();
                }
            }
        }

        // Wait for next sample period
        vTaskDelay(sample_period);
    }
}

esp_err_t accel_handler_start_task(uint32_t priority, uint32_t stack_size) {
    if (!is_initialized) {
        ESP_LOGE(TAG, "Accelerometer handler not initialized");
        return ESP_ERR_INVALID_STATE;
    }

    if (accel_task_handle != NULL) {
        ESP_LOGW(TAG, "Accelerometer handler task already running");
        return ESP_OK;
    }

    // Create accelerometer handler task
    BaseType_t task_created = xTaskCreate(
        accel_handler_task,
        "accel_task",
        stack_size,
        NULL,
        priority,
        &accel_task_handle
    );

    if (task_created != pdPASS) {
        ESP_LOGE(TAG, "Failed to create accelerometer handler task");
        return ESP_FAIL;
    }

    ESP_LOGI(TAG, "Accelerometer handler task started");
    return ESP_OK;
}
