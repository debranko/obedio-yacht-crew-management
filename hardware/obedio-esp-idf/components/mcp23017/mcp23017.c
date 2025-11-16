/**
 * @file mcp23017.c
 * @brief MCP23017 I2C GPIO Expander Driver Implementation
 */

#include "mcp23017.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/semphr.h"

static const char *TAG = "mcp23017";

// MCP23017 Register Addresses (IOCON.BANK = 0)
#define MCP23017_IODIRA     0x00  // I/O Direction Register A
#define MCP23017_IODIRB     0x01  // I/O Direction Register B
#define MCP23017_IPOLA      0x02  // Input Polarity Register A
#define MCP23017_IPOLB      0x03  // Input Polarity Register B
#define MCP23017_GPINTENA   0x04  // Interrupt-on-change Enable A
#define MCP23017_GPINTENB   0x05  // Interrupt-on-change Enable B
#define MCP23017_DEFVALA    0x06  // Default Compare Register A
#define MCP23017_DEFVALB    0x07  // Default Compare Register B
#define MCP23017_INTCONA    0x08  // Interrupt Control Register A
#define MCP23017_INTCONB    0x09  // Interrupt Control Register B
#define MCP23017_IOCON      0x0A  // Configuration Register
#define MCP23017_GPPUA      0x0C  // Pull-up Resistor Register A
#define MCP23017_GPPUB      0x0D  // Pull-up Resistor Register B
#define MCP23017_INTFA      0x0E  // Interrupt Flag Register A
#define MCP23017_INTFB      0x0F  // Interrupt Flag Register B
#define MCP23017_INTCAPA    0x10  // Interrupt Capture Register A
#define MCP23017_INTCAPB    0x11  // Interrupt Capture Register B
#define MCP23017_GPIOA      0x12  // GPIO Register A
#define MCP23017_GPIOB      0x13  // GPIO Register B
#define MCP23017_OLATA      0x14  // Output Latch Register A
#define MCP23017_OLATB      0x15  // Output Latch Register B

static i2c_port_t mcp_i2c_port = I2C_NUM_0;
static SemaphoreHandle_t i2c_mutex = NULL;

esp_err_t mcp23017_init(i2c_port_t port, uint8_t addr) {
    mcp_i2c_port = port;

    // Create I2C mutex if it doesn't exist
    if (i2c_mutex == NULL) {
        i2c_mutex = xSemaphoreCreateMutex();
        if (i2c_mutex == NULL) {
            ESP_LOGE(TAG, "Failed to create I2C mutex");
            return ESP_ERR_NO_MEM;
        }
    }

    esp_err_t ret;

    // Set all GPIOA pins as inputs (0xFF = all inputs)
    ret = mcp23017_write_reg(addr, MCP23017_IODIRA, 0xFF);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to configure IODIRA");
        return ret;
    }

    // Enable pull-ups on all GPIOA pins (0xFF = all enabled)
    ret = mcp23017_write_reg(addr, MCP23017_GPPUA, 0xFF);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to configure GPPUA");
        return ret;
    }

    // Set all GPIOB pins as inputs (for future expansion)
    ret = mcp23017_write_reg(addr, MCP23017_IODIRB, 0xFF);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to configure IODIRB");
        return ret;
    }

    ESP_LOGI(TAG, "MCP23017 initialized at address 0x%02X", addr);
    return ESP_OK;
}

esp_err_t mcp23017_write_reg(uint8_t addr, uint8_t reg, uint8_t data) {
    if (i2c_mutex == NULL) {
        ESP_LOGE(TAG, "I2C mutex not initialized");
        return ESP_ERR_INVALID_STATE;
    }

    xSemaphoreTake(i2c_mutex, portMAX_DELAY);

    i2c_cmd_handle_t cmd = i2c_cmd_link_create();
    i2c_master_start(cmd);
    i2c_master_write_byte(cmd, (addr << 1) | I2C_MASTER_WRITE, true);
    i2c_master_write_byte(cmd, reg, true);
    i2c_master_write_byte(cmd, data, true);
    i2c_master_stop(cmd);

    esp_err_t ret = i2c_master_cmd_begin(mcp_i2c_port, cmd, pdMS_TO_TICKS(1000));
    i2c_cmd_link_delete(cmd);

    xSemaphoreGive(i2c_mutex);

    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "I2C write failed: %s", esp_err_to_name(ret));
    }

    return ret;
}

esp_err_t mcp23017_read_reg(uint8_t addr, uint8_t reg, uint8_t *data) {
    if (i2c_mutex == NULL) {
        ESP_LOGE(TAG, "I2C mutex not initialized");
        return ESP_ERR_INVALID_STATE;
    }

    if (data == NULL) {
        return ESP_ERR_INVALID_ARG;
    }

    xSemaphoreTake(i2c_mutex, portMAX_DELAY);

    i2c_cmd_handle_t cmd = i2c_cmd_link_create();
    i2c_master_start(cmd);
    i2c_master_write_byte(cmd, (addr << 1) | I2C_MASTER_WRITE, true);
    i2c_master_write_byte(cmd, reg, true);
    i2c_master_start(cmd);  // Repeated start
    i2c_master_write_byte(cmd, (addr << 1) | I2C_MASTER_READ, true);
    i2c_master_read_byte(cmd, data, I2C_MASTER_NACK);
    i2c_master_stop(cmd);

    esp_err_t ret = i2c_master_cmd_begin(mcp_i2c_port, cmd, pdMS_TO_TICKS(1000));
    i2c_cmd_link_delete(cmd);

    xSemaphoreGive(i2c_mutex);

    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "I2C read failed: %s", esp_err_to_name(ret));
    }

    return ret;
}

bool mcp23017_read_pin(uint8_t addr, uint8_t pin) {
    uint8_t gpio_state;

    if (pin > 7) {
        ESP_LOGE(TAG, "Invalid pin number: %d (must be 0-7)", pin);
        return false;
    }

    if (mcp23017_read_reg(addr, MCP23017_GPIOA, &gpio_state) != ESP_OK) {
        ESP_LOGE(TAG, "Failed to read GPIOA");
        return false;
    }

    return (gpio_state & (1 << pin)) != 0;
}

esp_err_t mcp23017_read_gpioa(uint8_t addr, uint8_t *gpio_state) {
    return mcp23017_read_reg(addr, MCP23017_GPIOA, gpio_state);
}
