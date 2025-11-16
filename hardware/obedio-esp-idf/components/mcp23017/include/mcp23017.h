/**
 * @file mcp23017.h
 * @brief MCP23017 I2C GPIO Expander Driver
 *
 * 16-bit I/O expander with I2C interface
 * Used for 6 button inputs on GPA bank
 */

#ifndef MCP23017_H
#define MCP23017_H

#include "esp_err.h"
#include "driver/i2c.h"
#include <stdbool.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief Initialize MCP23017
 *
 * @param port I2C port number
 * @param addr I2C device address (typically 0x20-0x27)
 * @return ESP_OK on success
 */
esp_err_t mcp23017_init(i2c_port_t port, uint8_t addr);

/**
 * @brief Write to MCP23017 register
 *
 * @param addr I2C device address
 * @param reg Register address
 * @param data Data byte to write
 * @return ESP_OK on success
 */
esp_err_t mcp23017_write_reg(uint8_t addr, uint8_t reg, uint8_t data);

/**
 * @brief Read from MCP23017 register
 *
 * @param addr I2C device address
 * @param reg Register address
 * @param data Pointer to store read data
 * @return ESP_OK on success
 */
esp_err_t mcp23017_read_reg(uint8_t addr, uint8_t reg, uint8_t *data);

/**
 * @brief Read single pin state from GPIOA bank
 *
 * @param addr I2C device address
 * @param pin Pin number (0-7 for GPIOA)
 * @return true if HIGH, false if LOW
 */
bool mcp23017_read_pin(uint8_t addr, uint8_t pin);

/**
 * @brief Read all GPIOA pins at once
 *
 * @param addr I2C device address
 * @param gpio_state Pointer to store 8-bit GPIO state
 * @return ESP_OK on success
 */
esp_err_t mcp23017_read_gpioa(uint8_t addr, uint8_t *gpio_state);

#ifdef __cplusplus
}
#endif

#endif // MCP23017_H
