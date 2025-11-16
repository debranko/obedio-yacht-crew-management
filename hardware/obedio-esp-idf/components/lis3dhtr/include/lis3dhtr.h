/**
 * @file lis3dhtr.h
 * @brief LIS3DHTR I2C Accelerometer Driver
 *
 * 3-axis digital accelerometer with I2C interface
 * Configured for ±2G range, 50Hz data rate
 */

#ifndef LIS3DHTR_H
#define LIS3DHTR_H

#include "esp_err.h"
#include "driver/i2c.h"
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief Initialize LIS3DHTR accelerometer
 *
 * Configures the sensor for:
 * - 50Hz data rate
 * - Normal mode
 * - ±2G range
 * - High resolution mode
 * - X, Y, Z axes enabled
 *
 * @param port I2C port number
 * @param addr I2C device address (typically 0x18 or 0x19)
 * @return ESP_OK on success
 */
esp_err_t lis3dhtr_init(i2c_port_t port, uint8_t addr);

/**
 * @brief Read acceleration values from all three axes
 *
 * @param x Pointer to store X-axis acceleration (g)
 * @param y Pointer to store Y-axis acceleration (g)
 * @param z Pointer to store Z-axis acceleration (g)
 * @return ESP_OK on success
 */
esp_err_t lis3dhtr_read_accel(float *x, float *y, float *z);

/**
 * @brief Get acceleration magnitude
 *
 * Calculates the magnitude of the acceleration vector:
 * magnitude = sqrt(x² + y² + z²)
 *
 * @return Acceleration magnitude in g, or -1.0 on error
 */
float lis3dhtr_get_magnitude(void);

/**
 * @brief Check if LIS3DHTR is initialized
 *
 * @return true if initialized, false otherwise
 */
bool lis3dhtr_is_initialized(void);

#ifdef __cplusplus
}
#endif

#endif // LIS3DHTR_H
