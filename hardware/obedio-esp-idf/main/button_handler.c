/**
 * @file button_handler.c
 * @brief Button Handler Implementation
 *
 * Monitors 6 buttons via MCP23017 I2C GPIO expander
 * Implements debouncing, single/double/long press detection
 */

#include "button_handler.h"
#include "mcp23017.h"
#include "mqtt_handler.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

static const char *TAG = "button_handler";

// Button state tracking
typedef struct {
    bool current_state;          // Current debounced state
    bool last_reading;           // Last raw reading
    TickType_t last_change_time; // Last state change time
    TickType_t press_start_time; // When button was pressed
    TickType_t release_time;     // When button was released
    bool long_press_sent;        // Flag to prevent duplicate long press events
    bool waiting_for_double;     // Waiting for potential double-click
} button_state_t;

static button_state_t button_states[BUTTON_COUNT];
static button_callback_t event_callback = NULL;
static TaskHandle_t button_task_handle = NULL;

/**
 * @brief Read button state from MCP23017
 *
 * @param button_index Index of button (0-5)
 * @return true if button is pressed, false otherwise
 */
static bool read_button_raw(uint8_t button_index) {
    if (button_index >= BUTTON_COUNT) {
        return false;
    }

    uint8_t pin = BUTTON_PINS[button_index];
    bool state = mcp23017_read_pin(MCP23017_I2C_ADDR, pin);

    // Button T6 (index 5) uses inverted logic - active HIGH
    if (button_index == 5) {
        return state;  // HIGH = pressed
    } else {
        return !state;  // LOW = pressed (pull-up resistors)
    }
}

/**
 * @brief Process button state with debouncing
 *
 * @param button_index Index of button (0-5)
 */
static void process_button(uint8_t button_index) {
    if (button_index >= BUTTON_COUNT) {
        return;
    }

    button_state_t *state = &button_states[button_index];
    TickType_t current_time = xTaskGetTickCount();
    bool reading = read_button_raw(button_index);

    // Debouncing: check if reading has changed
    if (reading != state->last_reading) {
        state->last_change_time = current_time;
        state->last_reading = reading;
    }

    // If enough time has passed, accept the reading
    TickType_t debounce_ticks = pdMS_TO_TICKS(DEBOUNCE_DELAY_MS);
    if ((current_time - state->last_change_time) >= debounce_ticks) {
        // Debounced state changed
        if (reading != state->current_state) {
            state->current_state = reading;

            if (reading) {
                // Button pressed
                state->press_start_time = current_time;
                state->long_press_sent = false;
                ESP_LOGI(TAG, "Button %s: PRESSED", BUTTON_NAMES[button_index]);

                // Send immediate PRESS event for voice recording
                if (event_callback) {
                    event_callback(BUTTON_NAMES[button_index], PRESS_TYPE_PRESS);
                }
            } else {
                // Button released
                state->release_time = current_time;
                TickType_t press_duration = current_time - state->press_start_time;
                uint32_t press_duration_ms = press_duration * portTICK_PERIOD_MS;

                ESP_LOGD(TAG, "Button %s released after %lu ms",
                         BUTTON_NAMES[button_index], press_duration_ms);

                // If long press was sent, send single press immediately to stop recording
                if (state->long_press_sent) {
                    ESP_LOGI(TAG, "Button %s: RELEASED after long press", BUTTON_NAMES[button_index]);
                    if (event_callback) {
                        event_callback(BUTTON_NAMES[button_index], PRESS_TYPE_SINGLE);
                    }
                }
                // Otherwise, handle short press (send immediately, no double-click for simplicity)
                else {
                    // Send single press immediately for voice recording use case
                    state->waiting_for_double = false;
                    ESP_LOGI(TAG, "Button %s: SINGLE PRESS", BUTTON_NAMES[button_index]);

                    if (event_callback) {
                        event_callback(BUTTON_NAMES[button_index], PRESS_TYPE_SINGLE);
                    }
                }
            }
        }
    }

    // Check for long press (while button is still held)
    if (state->current_state && !state->long_press_sent) {
        TickType_t hold_duration = current_time - state->press_start_time;
        uint32_t hold_duration_ms = hold_duration * portTICK_PERIOD_MS;

        if (hold_duration_ms >= mqtt_get_long_press_threshold()) {
            state->long_press_sent = true;
            state->waiting_for_double = false;  // Cancel any double-click wait
            ESP_LOGI(TAG, "Button %s: LONG PRESS", BUTTON_NAMES[button_index]);

            if (event_callback) {
                event_callback(BUTTON_NAMES[button_index], PRESS_TYPE_LONG);
            }
        }
    }

    // Double-click detection removed - single press sent immediately on release
}

void button_handler_task(void *pvParameters) {
    ESP_LOGI(TAG, "Button handler task started");

    while (1) {
        // Process all buttons
        for (uint8_t i = 0; i < BUTTON_COUNT; i++) {
            process_button(i);
        }

        // Poll every 10ms
        vTaskDelay(pdMS_TO_TICKS(10));
    }
}

esp_err_t button_handler_init(button_callback_t callback) {
    ESP_LOGI(TAG, "Initializing button handler");

    if (callback == NULL) {
        ESP_LOGE(TAG, "Callback cannot be NULL");
        return ESP_ERR_INVALID_ARG;
    }

    event_callback = callback;

    // Initialize MCP23017
    esp_err_t ret = mcp23017_init(I2C_MASTER_NUM, MCP23017_I2C_ADDR);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to initialize MCP23017: %s", esp_err_to_name(ret));
        return ret;
    }

    // Initialize button states
    for (uint8_t i = 0; i < BUTTON_COUNT; i++) {
        button_states[i].current_state = false;
        button_states[i].last_reading = false;
        button_states[i].last_change_time = 0;
        button_states[i].press_start_time = 0;
        button_states[i].release_time = 0;
        button_states[i].long_press_sent = false;
        button_states[i].waiting_for_double = false;
    }

    ESP_LOGI(TAG, "Button handler initialized successfully");
    return ESP_OK;
}

esp_err_t button_handler_start_task(uint32_t priority, uint32_t stack_size) {
    if (event_callback == NULL) {
        ESP_LOGE(TAG, "Button handler not initialized");
        return ESP_ERR_INVALID_STATE;
    }

    if (button_task_handle != NULL) {
        ESP_LOGW(TAG, "Button handler task already running");
        return ESP_OK;
    }

    // Create button handler task
    BaseType_t task_created = xTaskCreate(
        button_handler_task,
        "button_task",
        stack_size,
        NULL,
        priority,
        &button_task_handle
    );

    if (task_created != pdPASS) {
        ESP_LOGE(TAG, "Failed to create button handler task");
        return ESP_FAIL;
    }

    ESP_LOGI(TAG, "Button handler task started");
    return ESP_OK;
}
