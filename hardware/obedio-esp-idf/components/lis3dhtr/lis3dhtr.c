/**
 * @file lis3dhtr.c
 * @brief LIS3DHTR I2C Accelerometer Driver Implementation
 */

#include "lis3dhtr.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/semphr.h"
#include <math.h>

static const char *TAG = "lis3dhtr";

// LIS3DHTR Register Addresses
#define LIS3DHTR_CTRL_REG1   0x20  // Control register 1 (data rate, power mode)
#define LIS3DHTR_CTRL_REG4   0x23  // Control register 4 (range, resolution)
#define LIS3DHTR_OUT_X_L     0x28  // X-axis low byte
#define LIS3DHTR_OUT_X_H     0x29  // X-axis high byte
#define LIS3DHTR_OUT_Y_L     0x2A  // Y-axis low byte
#define LIS3DHTR_OUT_Y_H     0x2B  // Y-axis high byte
#define LIS3DHTR_OUT_Z_L     0x2C  // Z-axis low byte
#define LIS3DHTR_OUT_Z_H     0x2D  // Z-axis high byte

// Configuration values
#define LIS3DHTR_CTRL_REG1_VAL  0x47  // 50Hz, normal mode, XYZ enabled
#define LIS3DHTR_CTRL_REG4_VAL  0x08  // ±2G range, high resolution

// Scale factor for ±2G range
#define LIS3DHTR_SCALE_FACTOR   0.001f  // LSB to g conversion

static i2c_port_t lis_i2c_port = I2C_NUM_0;
static uint8_t lis_i2c_addr = 0x19;
static SemaphoreHandle_t i2c_mutex = NULL;
static bool is_initialized = false;

/**
 * @brief Write to LIS3DHTR register
 *
 * @param reg Register address
 * @param data Data byte to write
 * @return ESP_OK on success
 */
static esp_err_t lis3dhtr_write_reg(uint8_t reg, uint8_t data) {
    if (i2c_mutex == NULL) {
        ESP_LOGE(TAG, "I2C mutex not initialized");
        return ESP_ERR_INVALID_STATE;
    }

    xSemaphoreTake(i2c_mutex, portMAX_DELAY);

    i2c_cmd_handle_t cmd = i2c_cmd_link_create();
    i2c_master_start(cmd);
    i2c_master_write_byte(cmd, (lis_i2c_addr << 1) | I2C_MASTER_WRITE, true);
    i2c_master_write_byte(cmd, reg, true);
    i2c_master_write_byte(cmd, data, true);
    i2c_master_stop(cmd);

    esp_err_t ret = i2c_master_cmd_begin(lis_i2c_port, cmd, pdMS_TO_TICKS(1000));
    i2c_cmd_link_delete(cmd);

    xSemaphoreGive(i2c_mutex);

    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "I2C write failed: %s", esp_err_to_name(ret));
    }

    return ret;
}

/**
 * @brief Read from LIS3DHTR register
 *
 * @param reg Register address
 * @param data Pointer to store read data
 * @return ESP_OK on success
 */
static esp_err_t lis3dhtr_read_reg(uint8_t reg, uint8_t *data) {
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
    i2c_master_write_byte(cmd, (lis_i2c_addr << 1) | I2C_MASTER_WRITE, true);
    i2c_master_write_byte(cmd, reg, true);
    i2c_master_start(cmd);  // Repeated start
    i2c_master_write_byte(cmd, (lis_i2c_addr << 1) | I2C_MASTER_READ, true);
    i2c_master_read_byte(cmd, data, I2C_MASTER_NACK);
    i2c_master_stop(cmd);

    esp_err_t ret = i2c_master_cmd_begin(lis_i2c_port, cmd, pdMS_TO_TICKS(1000));
    i2c_cmd_link_delete(cmd);

    xSemaphoreGive(i2c_mutex);

    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "I2C read failed: %s", esp_err_to_name(ret));
    }

    return ret;
}

esp_err_t lis3dhtr_init(i2c_port_t port, uint8_t addr) {
    lis_i2c_port = port;
    lis_i2c_addr = addr;

    // Create I2C mutex if it doesn't exist
    if (i2c_mutex == NULL) {
        i2c_mutex = xSemaphoreCreateMutex();
        if (i2c_mutex == NULL) {
            ESP_LOGE(TAG, "Failed to create I2C mutex");
            return ESP_ERR_NO_MEM;
        }
    }

    esp_err_t ret;

    // Configure CTRL_REG1: 50Hz data rate, normal mode, XYZ enabled
    ret = lis3dhtr_write_reg(LIS3DHTR_CTRL_REG1, LIS3DHTR_CTRL_REG1_VAL);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to configure CTRL_REG1");
        return ret;
    }

    // Configure CTRL_REG4: ±2G range, high resolution mode
    ret = lis3dhtr_write_reg(LIS3DHTR_CTRL_REG4, LIS3DHTR_CTRL_REG4_VAL);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to configure CTRL_REG4");
        return ret;
    }

    is_initialized = true;

    ESP_LOGI(TAG, "LIS3DHTR initialized at address 0x%02X", addr);
    return ESP_OK;
}

esp_err_t lis3dhtr_read_accel(float *x, float *y, float *z) {
    if (x == NULL || y == NULL || z == NULL) {
        return ESP_ERR_INVALID_ARG;
    }

    esp_err_t ret;
    uint8_t xl, xh, yl, yh, zl, zh;

    // Read X-axis
    ret = lis3dhtr_read_reg(LIS3DHTR_OUT_X_L, &xl);
    if (ret != ESP_OK) {
        return ret;
    }
    ret = lis3dhtr_read_reg(LIS3DHTR_OUT_X_H, &xh);
    if (ret != ESP_OK) {
        return ret;
    }

    // Read Y-axis
    ret = lis3dhtr_read_reg(LIS3DHTR_OUT_Y_L, &yl);
    if (ret != ESP_OK) {
        return ret;
    }
    ret = lis3dhtr_read_reg(LIS3DHTR_OUT_Y_H, &yh);
    if (ret != ESP_OK) {
        return ret;
    }

    // Read Z-axis
    ret = lis3dhtr_read_reg(LIS3DHTR_OUT_Z_L, &zl);
    if (ret != ESP_OK) {
        return ret;
    }
    ret = lis3dhtr_read_reg(LIS3DHTR_OUT_Z_H, &zh);
    if (ret != ESP_OK) {
        return ret;
    }

    // Combine low and high bytes into 16-bit signed values
    int16_t x_raw = (int16_t)((xh << 8) | xl);
    int16_t y_raw = (int16_t)((yh << 8) | yl);
    int16_t z_raw = (int16_t)((zh << 8) | zl);

    // Convert to g using scale factor
    *x = x_raw * LIS3DHTR_SCALE_FACTOR;
    *y = y_raw * LIS3DHTR_SCALE_FACTOR;
    *z = z_raw * LIS3DHTR_SCALE_FACTOR;

    return ESP_OK;
}

float lis3dhtr_get_magnitude(void) {
    float x, y, z;

    if (lis3dhtr_read_accel(&x, &y, &z) != ESP_OK) {
        ESP_LOGE(TAG, "Failed to read acceleration");
        return -1.0f;
    }

    // Calculate magnitude: sqrt(x² + y² + z²)
    float magnitude = sqrtf(x * x + y * y + z * z);

    return magnitude;
}

bool lis3dhtr_is_initialized(void) {
    return is_initialized;
}
