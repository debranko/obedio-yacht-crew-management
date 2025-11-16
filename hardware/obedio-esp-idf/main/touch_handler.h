/**
 * @file touch_handler.h
 * @brief ESP32-S3 Capacitive Touch Sensor Handler
 *
 * Handles capacitive touch sensor on GPIO1 (TOUCH_PAD_NUM1)
 * - Auto-calibration on init
 * - Single touch detection
 * - Double-touch detection (<500ms apart)
 * - Debouncing (50ms)
 */

#ifndef TOUCH_HANDLER_H
#define TOUCH_HANDLER_H

#include "config.h"
#include "esp_err.h"

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief Touch callback function type
 *
 * Called when a touch event is detected
 * @param type Touch type (PRESS_TYPE_TOUCH or PRESS_TYPE_DOUBLE_TOUCH)
 */
typedef void (*touch_callback_t)(press_type_t type);

/**
 * @brief Initialize touch sensor handler
 *
 * Initializes ESP32-S3 touch sensor, calibrates threshold,
 * and starts touch monitoring task
 * @param callback Function to call when touch events occur
 * @return ESP_OK on success
 */
esp_err_t touch_handler_init(touch_callback_t callback);

/**
 * @brief Touch handler task
 *
 * Main touch processing task that runs continuously
 * - Monitors touch sensor
 * - Performs debouncing
 * - Detects single and double touches
 * - Calls callback for events
 *
 * @param pvParameters Task parameters (unused)
 */
void touch_handler_task(void *pvParameters);

/**
 * @brief Start touch handler task
 *
 * Creates and starts the FreeRTOS task for touch handling
 * @param priority Task priority
 * @param stack_size Task stack size in bytes
 * @return ESP_OK on success
 */
esp_err_t touch_handler_start_task(uint32_t priority, uint32_t stack_size);

/**
 * @brief Check if touch handler is initialized
 *
 * @return true if initialized, false otherwise
 */
bool touch_handler_is_initialized(void);

/**
 * @brief Check if factory reset is requested at boot
 *
 * Checks if the touch sensor is held during boot for factory reset
 * @return true if factory reset requested, false otherwise
 */
bool touch_check_factory_reset(void);

#ifdef __cplusplus
}
#endif

#endif // TOUCH_HANDLER_H
