/**
 * @file accel_handler.h
 * @brief Accelerometer Handler for LIS3DHTR
 *
 * Monitors accelerometer for shake detection
 * Triggers callback on shake events with debouncing
 */

#ifndef ACCEL_HANDLER_H
#define ACCEL_HANDLER_H

#include "config.h"
#include "esp_err.h"
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief Shake event callback function type
 *
 * Called when a shake is detected (magnitude > SHAKE_THRESHOLD)
 */
typedef void (*shake_callback_t)(void);

/**
 * @brief Initialize accelerometer handler
 *
 * Initializes the LIS3DHTR accelerometer and sets up shake detection
 *
 * @param callback Function to call when shake is detected (can be NULL)
 * @return ESP_OK on success
 */
esp_err_t accel_handler_init(shake_callback_t callback);

/**
 * @brief Start accelerometer handler task
 *
 * Creates and starts the accelerometer handler FreeRTOS task
 * @param priority Task priority
 * @param stack_size Task stack size in bytes
 * @return ESP_OK on success
 */
esp_err_t accel_handler_start_task(uint32_t priority, uint32_t stack_size);

/**
 * @brief Accelerometer monitoring task
 *
 * FreeRTOS task that continuously monitors accelerometer
 * Samples at 50Hz and detects shake events
 * Debounces shake events with 2-second cooldown
 *
 * @param pvParameters Task parameters (unused)
 */
void accel_handler_task(void *pvParameters);

#ifdef __cplusplus
}
#endif

#endif // ACCEL_HANDLER_H
