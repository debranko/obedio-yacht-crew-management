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

static i2c_master_dev_handle_t lis_dev_handle = NULL;
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
    if (lis_dev_handle == NULL) {
        ESP_LOGE(TAG, "LIS3DHTR not initialized");
        return ESP_ERR_INVALID_STATE;
    }

    if (i2c_mutex == NULL) {
        ESP_LOGE(TAG, "I2C mutex not initialized");
        return ESP_ERR_INVALID_STATE;
    }

    xSemaphoreTake(i2c_mutex, portMAX_DELAY);

    uint8_t write_buf[2] = {reg, data};
    esp_err_t ret = i2c_master_transmit(lis_dev_handle, write_buf, sizeof(write_buf), 1000);

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
    if (lis_dev_handle == NULL) {
        ESP_LOGE(TAG, "LIS3DHTR not initialized");
        return ESP_ERR_INVALID_STATE;
    }

    if (i2c_mutex == NULL) {
        ESP_LOGE(TAG, "I2C mutex not initialized");
        return ESP_ERR_INVALID_STATE;
    }

    if (data == NULL) {
        return ESP_ERR_INVALID_ARG;
    }

    xSemaphoreTake(i2c_mutex, portMAX_DELAY);

    // Use transmit_receive for write-then-read operation
    esp_err_t ret = i2c_master_transmit_receive(lis_dev_handle, &reg, 1, data, 1, 1000);

    xSemaphoreGive(i2c_mutex);

    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "I2C read failed: %s", esp_err_to_name(ret));
    }

    return ret;
}

esp_err_t lis3dhtr_init(i2c_master_bus_handle_t bus_handle, uint8_t addr) {
    if (bus_handle == NULL) {
        ESP_LOGE(TAG, "Invalid bus handle");
        return ESP_ERR_INVALID_ARG;
    }

    // Create I2C mutex if it doesn't exist
    if (i2c_mutex == NULL) {
        i2c_mutex = xSemaphoreCreateMutex();
        if (i2c_mutex == NULL) {
            ESP_LOGE(TAG, "Failed to create I2C mutex");
            return ESP_ERR_NO_MEM;
        }
    }

    // Configure device on the I2C bus
    i2c_device_config_t dev_cfg = {
        .dev_addr_length = I2C_ADDR_BIT_LEN_7,
        .device_address = addr,
        .scl_speed_hz = 400000,  // 400kHz
    };

    esp_err_t ret = i2c_master_bus_add_device(bus_handle, &dev_cfg, &lis_dev_handle);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to add device to I2C bus: %s", esp_err_to_name(ret));
        return ret;
    }

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
