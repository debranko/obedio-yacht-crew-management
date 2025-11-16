/**
 * @file touch_handler.c
 * @brief ESP32-S3 Capacitive Touch Sensor Handler Implementation
 *
 * Monitors capacitive touch sensor on GPIO1
 * Implements auto-calibration, debouncing, and double-touch detection
 */

#include "touch_handler.h"
#include "esp_log.h"
#include "esp_timer.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/touch_sens.h"
#include "soc/touch_sensor_channel.h"

static const char *TAG = "touch_handler";

// Touch state tracking
typedef struct {
    bool is_touched;             // Current touch state
    TickType_t touch_start_time; // When touch started
    TickType_t release_time;     // When touch was released
    bool waiting_for_double;     // Waiting for potential double-touch
    uint32_t threshold;          // Calibrated threshold value
    uint32_t baseline;           // Baseline (no-touch) value
} touch_state_t;

static touch_state_t touch_state = {0};
static touch_callback_t event_callback = NULL;
static TaskHandle_t touch_task_handle = NULL;
static bool is_initialized = false;

// New touch sensor handles
static touch_sensor_handle_t touch_sens_handle = NULL;
static touch_channel_handle_t touch_chan_handle = NULL;

/**
 * @brief Calibrate touch sensor
 *
 * Reads baseline value and sets threshold to 80% of baseline
 * @return ESP_OK on success
 */
static esp_err_t calibrate_touch_sensor(void) {
    ESP_LOGI(TAG, "Calibrating touch sensor...");

    // Wait for touch sensor to stabilize
    vTaskDelay(pdMS_TO_TICKS(100));

    // Read baseline value (no touch)
    uint32_t sum = 0;
    const int samples = 10;

    for (int i = 0; i < samples; i++) {
        uint32_t chan_data = 0;
        esp_err_t ret = touch_channel_read_data(touch_chan_handle, TOUCH_CHAN_DATA_TYPE_SMOOTH, &chan_data);
        if (ret != ESP_OK) {
            ESP_LOGE(TAG, "Failed to read touch sensor: %s", esp_err_to_name(ret));
            return ret;
        }
        sum += chan_data;
        vTaskDelay(pdMS_TO_TICKS(10));
    }

    touch_state.baseline = sum / samples;
    touch_state.threshold = (touch_state.baseline * TOUCH_THRESHOLD_PERCENT) / 100;

    ESP_LOGI(TAG, "Touch calibration complete:");
    ESP_LOGI(TAG, "  Baseline: %lu", touch_state.baseline);
    ESP_LOGI(TAG, "  Threshold: %lu (%d%%)", touch_state.threshold, TOUCH_THRESHOLD_PERCENT);

    // Configure threshold for the channel
    touch_channel_config_t chan_cfg = {
        .active_thresh = {touch_state.threshold},
    };
    esp_err_t ret = touch_sensor_reconfig_channel(touch_chan_handle, &chan_cfg);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to set threshold: %s", esp_err_to_name(ret));
        return ret;
    }

    return ESP_OK;
}

/**
 * @brief Check if touch sensor is currently touched
 *
 * @param value Pointer to store current sensor value
 * @return true if touched, false otherwise
 */
static bool is_touch_detected(uint32_t *value) {
    uint32_t chan_data = 0;
    esp_err_t ret = touch_channel_read_data(touch_chan_handle, TOUCH_CHAN_DATA_TYPE_SMOOTH, &chan_data);

    if (ret != ESP_OK) {
        ESP_LOGW(TAG, "Failed to read touch data: %s", esp_err_to_name(ret));
        return false;
    }

    if (value != NULL) {
        *value = chan_data;
    }

    // Touch detected if value falls below threshold
    return (chan_data < touch_state.threshold);
}

/**
 * @brief Process touch sensor state
 */
static void process_touch(void) {
    static bool last_reading = false;
    static TickType_t last_change_time = 0;

    TickType_t current_time = xTaskGetTickCount();
    uint32_t sensor_value;
    bool reading = is_touch_detected(&sensor_value);

    // Debouncing: check if reading has changed
    if (reading != last_reading) {
        last_change_time = current_time;
        last_reading = reading;
    }

    // If enough time has passed, accept the reading
    TickType_t debounce_ticks = pdMS_TO_TICKS(TOUCH_DEBOUNCE_MS);
    if ((current_time - last_change_time) >= debounce_ticks) {
        // Debounced state changed
        if (reading != touch_state.is_touched) {
            touch_state.is_touched = reading;

            if (reading) {
                // Touch started
                touch_state.touch_start_time = current_time;
                ESP_LOGD(TAG, "Touch started (value: %lu, threshold: %lu)",
                         sensor_value, touch_state.threshold);
            } else {
                // Touch released
                touch_state.release_time = current_time;
                TickType_t touch_duration = current_time - touch_state.touch_start_time;
                uint32_t touch_duration_ms = touch_duration * portTICK_PERIOD_MS;

                ESP_LOGD(TAG, "Touch released after %lu ms (value: %lu)",
                         touch_duration_ms, sensor_value);

                // Check if this is a potential double-touch
                if (touch_state.waiting_for_double) {
                    // This is the second touch - double-touch detected
                    touch_state.waiting_for_double = false;
                    ESP_LOGI(TAG, "DOUBLE-TOUCH detected");

                    if (event_callback) {
                        event_callback(PRESS_TYPE_DOUBLE_TOUCH);
                    }
                } else {
                    // This is the first touch - wait for potential double-touch
                    touch_state.waiting_for_double = true;
                }
            }
        }
    }

    // Check for double-touch timeout
    if (touch_state.waiting_for_double && !touch_state.is_touched) {
        TickType_t time_since_release = current_time - touch_state.release_time;
        uint32_t time_since_release_ms = time_since_release * portTICK_PERIOD_MS;

        if (time_since_release_ms >= DOUBLE_TOUCH_WINDOW_MS) {
            // Timeout - this was a single touch
            touch_state.waiting_for_double = false;
            ESP_LOGI(TAG, "SINGLE TOUCH detected");

            if (event_callback) {
                event_callback(PRESS_TYPE_TOUCH);
            }
        }
    }
}

void touch_handler_task(void *pvParameters) {
    ESP_LOGI(TAG, "Touch handler task started");

    while (1) {
        process_touch();

        // Poll every 10ms
        vTaskDelay(pdMS_TO_TICKS(10));
    }
}

esp_err_t touch_handler_init(touch_callback_t callback) {
    ESP_LOGI(TAG, "Initializing touch sensor handler");

    if (callback == NULL) {
        ESP_LOGE(TAG, "Callback cannot be NULL");
        return ESP_ERR_INVALID_ARG;
    }

    event_callback = callback;

    // Configure touch sensor controller
    touch_sensor_sample_config_t sample_cfg = {};
    touch_sensor_config_t sens_cfg = {
        .sample_cfg = &sample_cfg,
    };
    esp_err_t ret = touch_sensor_new_controller(&sens_cfg, &touch_sens_handle);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to create touch sensor controller: %s", esp_err_to_name(ret));
        return ret;
    }

    // Configure the touch channel (channel 1 for GPIO1)
    touch_channel_config_t chan_cfg = {
        .active_thresh = {0},  // Will be set during calibration
    };
    ret = touch_sensor_new_channel(touch_sens_handle, 1, &chan_cfg, &touch_chan_handle);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to create touch channel: %s", esp_err_to_name(ret));
        touch_sensor_del_controller(touch_sens_handle);
        return ret;
    }

    // Enable the touch sensor
    ret = touch_sensor_enable(touch_sens_handle);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to enable touch sensor: %s", esp_err_to_name(ret));
        touch_sensor_del_channel(touch_chan_handle);
        touch_sensor_del_controller(touch_sens_handle);
        return ret;
    }

    // Start continuous scanning
    ret = touch_sensor_start_continuous_scanning(touch_sens_handle);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to start scanning: %s", esp_err_to_name(ret));
        touch_sensor_disable(touch_sens_handle);
        touch_sensor_del_channel(touch_chan_handle);
        touch_sensor_del_controller(touch_sens_handle);
        return ret;
    }

    // Calibrate the touch sensor
    ret = calibrate_touch_sensor();
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to calibrate touch sensor");
        touch_sensor_stop_continuous_scanning(touch_sens_handle);
        touch_sensor_disable(touch_sens_handle);
        touch_sensor_del_channel(touch_chan_handle);
        touch_sensor_del_controller(touch_sens_handle);
        return ret;
    }

    // Initialize touch state
    touch_state.is_touched = false;
    touch_state.touch_start_time = 0;
    touch_state.release_time = 0;
    touch_state.waiting_for_double = false;

    is_initialized = true;

    ESP_LOGI(TAG, "Touch sensor handler initialized successfully");
    return ESP_OK;
}

esp_err_t touch_handler_start_task(uint32_t priority, uint32_t stack_size) {
    if (!is_initialized) {
        ESP_LOGE(TAG, "Touch handler not initialized");
        return ESP_ERR_INVALID_STATE;
    }

    if (touch_task_handle != NULL) {
        ESP_LOGW(TAG, "Touch handler task already running");
        return ESP_OK;
    }

    // Create touch handler task
    BaseType_t task_created = xTaskCreate(
        touch_handler_task,
        "touch_task",
        stack_size,
        NULL,
        priority,
        &touch_task_handle
    );

    if (task_created != pdPASS) {
        ESP_LOGE(TAG, "Failed to create touch handler task");
        return ESP_FAIL;
    }

    ESP_LOGI(TAG, "Touch handler task started");
    return ESP_OK;
}

bool touch_handler_is_initialized(void) {
    return is_initialized;
}

bool touch_check_factory_reset(void) {
    // Check if touch sensor is pressed during boot for factory reset
    // This is a simple check - in production you might want a longer hold time

    if (!is_initialized) {
        // Touch not initialized yet, can't check
        return false;
    }

    uint32_t value;
    bool is_touched = is_touch_detected(&value);

    if (is_touched) {
        ESP_LOGI(TAG, "Touch sensor pressed during boot, checking for factory reset hold...");

        // Wait for 3 seconds to see if touch is held
        TickType_t start_time = xTaskGetTickCount();
        const TickType_t hold_time = pdMS_TO_TICKS(3000);

        while ((xTaskGetTickCount() - start_time) < hold_time) {
            is_touched = is_touch_detected(&value);
            if (!is_touched) {
                ESP_LOGI(TAG, "Touch released before factory reset threshold");
                return false;
            }
            vTaskDelay(pdMS_TO_TICKS(100));
        }

        ESP_LOGW(TAG, "Factory reset triggered by touch sensor hold!");
        return true;
    }

    return false;
}
