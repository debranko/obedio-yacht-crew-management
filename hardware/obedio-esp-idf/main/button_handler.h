/**
 * @file button_handler.h
 * @brief Button Handler for 6 MCP23017 Buttons
 *
 * Handles 6 buttons via MCP23017 I2C GPIO expander
 * - Debouncing (50ms)
 * - Single press detection
 * - Double-click detection (<500ms)
 * - Long press detection (>=700ms)
 * - Button T6 uses inverted logic (active HIGH)
 */

#ifndef BUTTON_HANDLER_H
#define BUTTON_HANDLER_H

#include "config.h"
#include "esp_err.h"

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief Button callback function type
 *
 * Called when a button press event is detected
 * @param button Button name (e.g., "T1", "T2", etc.)
 * @param type Press type (PRESS_TYPE_SINGLE, PRESS_TYPE_DOUBLE, PRESS_TYPE_LONG)
 */
typedef void (*button_callback_t)(const char *button, press_type_t type);

/**
 * @brief Initialize button handler
 *
 * Sets up MCP23017 I2C communication and starts button monitoring task
 * @param callback Function to call when button press events occur
 * @return ESP_OK on success
 */
esp_err_t button_handler_init(button_callback_t callback);

/**
 * @brief Start button handler task
 *
 * Creates and starts the button handler FreeRTOS task
 * @param priority Task priority
 * @param stack_size Task stack size in bytes
 * @return ESP_OK on success
 */
esp_err_t button_handler_start_task(uint32_t priority, uint32_t stack_size);

/**
 * @brief Button handler task
 *
 * Main button processing task that runs continuously
 * - Polls buttons every 10ms
 * - Performs debouncing
 * - Detects press types
 * - Calls callback for events
 *
 * @param pvParameters Task parameters (unused)
 */
void button_handler_task(void *pvParameters);

#ifdef __cplusplus
}
#endif

#endif // BUTTON_HANDLER_H
