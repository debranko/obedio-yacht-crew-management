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

/**
 * @brief Update static LED color with brightness scaling
 *
 * Sets all LEDs to the specified RGB color with brightness applied.
 * Brightness is scaled: actual_value = (color_value * brightness) / 255
 *
 * @param r Red component (0-255)
 * @param g Green component (0-255)
 * @param b Blue component (0-255)
 * @param brightness Brightness level (0-255)
 * @return ESP_OK on success
 */
esp_err_t led_update_static(uint8_t r, uint8_t g, uint8_t b, uint8_t brightness);

/**
 * @brief Flash all LEDs blue for button press confirmation
 *
 * Displays all LEDs in blue at maximum brightness for a short duration
 * to confirm successful MQTT message send. Then restores the configured
 * static LED color.
 *
 * @param r Current configured red component (0-255)
 * @param g Current configured green component (0-255)
 * @param b Current configured blue component (0-255)
 * @param brightness Current configured brightness level (0-255)
 * @return ESP_OK on success
 */
esp_err_t led_flash_blue_confirm(uint8_t r, uint8_t g, uint8_t b, uint8_t brightness);

/**
 * @brief Start rotating single blue LED animation for recording
 *
 * Starts a FreeRTOS task that displays a single blue LED rotating in circles
 * to indicate that the center button long press (recording) is active.
 *
 * @param priority Task priority
 * @param stack_size Task stack size in bytes
 * @return ESP_OK on success
 */
esp_err_t led_start_recording_animation(uint32_t priority, uint32_t stack_size);

/**
 * @brief Stop recording animation and restore configured color
 *
 * Stops the rotating blue LED animation, flashes all LEDs blue briefly
 * to confirm the recording action completed, then restores the configured
 * static LED color.
 *
 * @param r Configured red component to restore (0-255)
 * @param g Configured green component to restore (0-255)
 * @param b Configured blue component to restore (0-255)
 * @param brightness Configured brightness level to restore (0-255)
 * @return ESP_OK on success
 */
esp_err_t led_stop_recording_animation(uint8_t r, uint8_t g, uint8_t b, uint8_t brightness);

#ifdef __cplusplus
}
#endif

#endif // LED_CONTROLLER_H
