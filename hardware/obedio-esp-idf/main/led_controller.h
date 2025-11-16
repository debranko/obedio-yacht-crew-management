/**
 * @file led_controller.h
 * @brief LED Controller for WS2812B NeoPixel Strip
 *
 * Controls 16x WS2812B LEDs via RMT driver
 * Provides color setting, flashing, and rainbow animation
 */

#ifndef LED_CONTROLLER_H
#define LED_CONTROLLER_H

#include "config.h"
#include "esp_err.h"
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief Initialize LED controller
 *
 * Configures RMT driver and LED strip for 16x WS2812B LEDs on GPIO17
 *
 * @return ESP_OK on success
 */
esp_err_t led_controller_init(void);

/**
 * @brief Set all LEDs to a single color
 *
 * @param r Red component (0-255)
 * @param g Green component (0-255)
 * @param b Blue component (0-255)
 * @return ESP_OK on success
 */
esp_err_t led_set_all(uint8_t r, uint8_t g, uint8_t b);

/**
 * @brief Flash LEDs with a specific color briefly
 *
 * Turns on LEDs to specified color, waits for duration, then clears
 *
 * @param color LED color enum value
 * @param duration_ms Duration to keep LEDs on in milliseconds
 * @return ESP_OK on success
 */
esp_err_t led_flash(led_color_t color, uint32_t duration_ms);

/**
 * @brief Turn off all LEDs
 *
 * @return ESP_OK on success
 */
esp_err_t led_clear(void);

/**
 * @brief Rainbow animation task
 *
 * FreeRTOS task that continuously cycles through rainbow colors
 * Updates every 150ms with HSV color cycling
 *
 * @param pvParameters Task parameters (unused)
 */
void led_rainbow_task(void *pvParameters);

/**
 * @brief Start LED rainbow animation task
 *
 * Creates and starts the FreeRTOS task for rainbow animation
 * @param priority Task priority
 * @param stack_size Task stack size in bytes
 * @return ESP_OK on success
 */
esp_err_t led_start_rainbow_task(uint32_t priority, uint32_t stack_size);

/**
 * @brief Stop LED rainbow animation task (for OTA updates)
 *
 * Stops the rainbow animation task and clears all LEDs
 * @return ESP_OK on success
 */
esp_err_t led_stop_rainbow_task(void);

#ifdef __cplusplus
}
#endif

#endif // LED_CONTROLLER_H
