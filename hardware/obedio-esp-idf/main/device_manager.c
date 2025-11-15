/**
 * @file device_manager.c
 * @brief Device configuration manager implementation
 */

#include "device_manager.h"
#include "config.h"
#include "nvs_flash.h"
#include "nvs.h"
#include "esp_log.h"
#include "esp_system.h"
#include "esp_mac.h"
#include "esp_timer.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include <string.h>
#include <stdio.h>

static const char *TAG = "DeviceManager";

// Global device configuration instance
device_config_t g_device_config;

// External function declarations for LED and button handlers
extern esp_err_t led_controller_init(void);
extern esp_err_t led_set_all(uint8_t r, uint8_t g, uint8_t b);
extern esp_err_t led_clear(void);

// MCP23017 I2C helper functions (minimal implementation for factory reset check)
#include "driver/i2c.h"

#define MCP23017_GPIOA      0x12  // GPIO register A
#define MCP23017_IODIRA     0x00  // I/O direction register A

static esp_err_t mcp23017_read_gpio(uint8_t *gpio_state);
static esp_err_t mcp23017_set_direction(uint8_t direction);

esp_err_t device_manager_init(void)
{
    ESP_LOGI(TAG, "Initializing device manager");

    // Initialize NVS
    esp_err_t err = nvs_flash_init();
    if (err == ESP_ERR_NVS_NO_FREE_PAGES || err == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_LOGW(TAG, "NVS partition was truncated, erasing...");
        ESP_ERROR_CHECK(nvs_flash_erase());
        err = nvs_flash_init();
    }
    ESP_ERROR_CHECK(err);

    ESP_LOGI(TAG, "NVS initialized successfully");

    // Check for factory reset button press
    err = device_manager_check_factory_reset_button();
    if (err == ESP_ERR_INVALID_STATE) {
        // Factory reset was triggered, this will restart the device
        return err;
    }

    ESP_LOGI(TAG, "Device manager initialized successfully");
    return ESP_OK;
}

esp_err_t device_manager_load_config(device_config_t *config)
{
    if (config == NULL) {
        ESP_LOGE(TAG, "Config pointer is NULL");
        return ESP_ERR_INVALID_ARG;
    }

    ESP_LOGI(TAG, "Loading device configuration from NVS");

    // Initialize with defaults
    device_manager_get_default_config(config);

    nvs_handle_t nvs_handle;
    esp_err_t err = nvs_open(NVS_NAMESPACE, NVS_READONLY, &nvs_handle);
    if (err != ESP_OK) {
        ESP_LOGW(TAG, "NVS namespace not found, using defaults");
        return ESP_OK;  // Use defaults if namespace doesn't exist
    }

    // Load strings
    size_t len;

    len = sizeof(config->wifi_ssid);
    err = nvs_get_str(nvs_handle, NVS_KEY_WIFI_SSID, config->wifi_ssid, &len);
    if (err != ESP_OK && err != ESP_ERR_NVS_NOT_FOUND) {
        ESP_LOGW(TAG, "Failed to read wifi_ssid: %s", esp_err_to_name(err));
    }

    len = sizeof(config->wifi_password);
    err = nvs_get_str(nvs_handle, NVS_KEY_WIFI_PASS, config->wifi_password, &len);
    if (err != ESP_OK && err != ESP_ERR_NVS_NOT_FOUND) {
        ESP_LOGW(TAG, "Failed to read wifi_pass: %s", esp_err_to_name(err));
    }

    len = sizeof(config->mqtt_uri);
    err = nvs_get_str(nvs_handle, NVS_KEY_MQTT_URI, config->mqtt_uri, &len);
    if (err != ESP_OK && err != ESP_ERR_NVS_NOT_FOUND) {
        ESP_LOGW(TAG, "Failed to read mqtt_uri: %s", esp_err_to_name(err));
    }

    len = sizeof(config->device_name);
    err = nvs_get_str(nvs_handle, NVS_KEY_DEVICE_NAME, config->device_name, &len);
    if (err != ESP_OK && err != ESP_ERR_NVS_NOT_FOUND) {
        ESP_LOGW(TAG, "Failed to read device_name: %s", esp_err_to_name(err));
    }

    len = sizeof(config->location_id);
    err = nvs_get_str(nvs_handle, NVS_KEY_LOCATION_ID, config->location_id, &len);
    if (err != ESP_OK && err != ESP_ERR_NVS_NOT_FOUND) {
        ESP_LOGW(TAG, "Failed to read location_id: %s", esp_err_to_name(err));
    }

    // Load numeric values
    uint8_t u8_val;
    err = nvs_get_u8(nvs_handle, NVS_KEY_LED_BRIGHTNESS, &u8_val);
    if (err == ESP_OK) {
        config->led_brightness = u8_val;
    }

    err = nvs_get_u8(nvs_handle, NVS_KEY_TOUCH_THRESH, &u8_val);
    if (err == ESP_OK) {
        config->touch_threshold = u8_val;
    }

    // Load shake threshold (stored as int32, scaled by 100)
    int32_t i32_val;
    err = nvs_get_i32(nvs_handle, NVS_KEY_SHAKE_THRESH, &i32_val);
    if (err == ESP_OK) {
        config->shake_threshold = (float)i32_val / 100.0f;
    }

    nvs_close(nvs_handle);

    ESP_LOGI(TAG, "Configuration loaded successfully");
    ESP_LOGI(TAG, "  Device ID: %s", config->device_id);
    ESP_LOGI(TAG, "  WiFi SSID: %s", config->wifi_ssid);
    ESP_LOGI(TAG, "  MQTT URI: %s", config->mqtt_uri);
    ESP_LOGI(TAG, "  Device Name: %s", config->device_name);
    ESP_LOGI(TAG, "  Location ID: %s", config->location_id);
    ESP_LOGI(TAG, "  LED Brightness: %d", config->led_brightness);
    ESP_LOGI(TAG, "  Shake Threshold: %.2f", config->shake_threshold);
    ESP_LOGI(TAG, "  Touch Threshold: %d", config->touch_threshold);

    return ESP_OK;
}

esp_err_t device_manager_save_config(const device_config_t *config)
{
    if (config == NULL) {
        ESP_LOGE(TAG, "Config pointer is NULL");
        return ESP_ERR_INVALID_ARG;
    }

    ESP_LOGI(TAG, "Saving device configuration to NVS");

    nvs_handle_t nvs_handle;
    esp_err_t err = nvs_open(NVS_NAMESPACE, NVS_READWRITE, &nvs_handle);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to open NVS: %s", esp_err_to_name(err));
        return err;
    }

    // Save strings
    err = nvs_set_str(nvs_handle, NVS_KEY_WIFI_SSID, config->wifi_ssid);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to write wifi_ssid: %s", esp_err_to_name(err));
        nvs_close(nvs_handle);
        return err;
    }

    err = nvs_set_str(nvs_handle, NVS_KEY_WIFI_PASS, config->wifi_password);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to write wifi_pass: %s", esp_err_to_name(err));
        nvs_close(nvs_handle);
        return err;
    }

    err = nvs_set_str(nvs_handle, NVS_KEY_MQTT_URI, config->mqtt_uri);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to write mqtt_uri: %s", esp_err_to_name(err));
        nvs_close(nvs_handle);
        return err;
    }

    err = nvs_set_str(nvs_handle, NVS_KEY_DEVICE_NAME, config->device_name);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to write device_name: %s", esp_err_to_name(err));
        nvs_close(nvs_handle);
        return err;
    }

    err = nvs_set_str(nvs_handle, NVS_KEY_LOCATION_ID, config->location_id);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to write location_id: %s", esp_err_to_name(err));
        nvs_close(nvs_handle);
        return err;
    }

    // Save numeric values
    err = nvs_set_u8(nvs_handle, NVS_KEY_LED_BRIGHTNESS, config->led_brightness);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to write led_brightness: %s", esp_err_to_name(err));
        nvs_close(nvs_handle);
        return err;
    }

    err = nvs_set_u8(nvs_handle, NVS_KEY_TOUCH_THRESH, config->touch_threshold);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to write touch_thresh: %s", esp_err_to_name(err));
        nvs_close(nvs_handle);
        return err;
    }

    // Save shake threshold (scale by 100 to store as int32)
    int32_t shake_thresh_scaled = (int32_t)(config->shake_threshold * 100.0f);
    err = nvs_set_i32(nvs_handle, NVS_KEY_SHAKE_THRESH, shake_thresh_scaled);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to write shake_thresh: %s", esp_err_to_name(err));
        nvs_close(nvs_handle);
        return err;
    }

    // Commit changes
    err = nvs_commit(nvs_handle);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to commit NVS: %s", esp_err_to_name(err));
        nvs_close(nvs_handle);
        return err;
    }

    nvs_close(nvs_handle);

    ESP_LOGI(TAG, "Configuration saved successfully");
    return ESP_OK;
}

esp_err_t device_manager_factory_reset(void)
{
    ESP_LOGW(TAG, "Performing factory reset!");

    // Erase NVS namespace
    nvs_handle_t nvs_handle;
    esp_err_t err = nvs_open(NVS_NAMESPACE, NVS_READWRITE, &nvs_handle);
    if (err == ESP_OK) {
        err = nvs_erase_all(nvs_handle);
        if (err != ESP_OK) {
            ESP_LOGE(TAG, "Failed to erase NVS: %s", esp_err_to_name(err));
        } else {
            nvs_commit(nvs_handle);
            ESP_LOGI(TAG, "NVS erased successfully");
        }
        nvs_close(nvs_handle);
    }

    ESP_LOGW(TAG, "Factory reset complete, restarting...");
    vTaskDelay(pdMS_TO_TICKS(1000));  // Give time for logs to flush

    // Restart device
    esp_restart();

    return ESP_OK;  // Will never reach here
}

esp_err_t device_manager_check_factory_reset_button(void)
{
    ESP_LOGI(TAG, "Checking for factory reset button press");

    // Initialize I2C for MCP23017 communication
    i2c_config_t conf = {
        .mode = I2C_MODE_MASTER,
        .sda_io_num = I2C_MASTER_SDA_IO,
        .scl_io_num = I2C_MASTER_SCL_IO,
        .sda_pullup_en = GPIO_PULLUP_ENABLE,
        .scl_pullup_en = GPIO_PULLUP_ENABLE,
        .master.clk_speed = I2C_MASTER_FREQ_HZ,
    };

    esp_err_t err = i2c_param_config(I2C_MASTER_NUM, &conf);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "I2C config failed: %s", esp_err_to_name(err));
        return err;
    }

    err = i2c_driver_install(I2C_MASTER_NUM, conf.mode, 0, 0, 0);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "I2C driver install failed: %s", esp_err_to_name(err));
        return err;
    }

    // Set MCP23017 GPIOA as inputs
    err = mcp23017_set_direction(0xFF);
    if (err != ESP_OK) {
        ESP_LOGW(TAG, "Failed to configure MCP23017");
        i2c_driver_delete(I2C_MASTER_NUM);
        return ESP_OK;  // Continue boot even if MCP23017 not responding
    }

    // Check T6 button state (button index 5, pin 0 on MCP23017)
    uint8_t gpio_state;
    err = mcp23017_read_gpio(&gpio_state);
    if (err != ESP_OK) {
        ESP_LOGW(TAG, "Failed to read MCP23017 GPIO");
        i2c_driver_delete(I2C_MASTER_NUM);
        return ESP_OK;
    }

    // T6 uses inverted logic (active HIGH), pin 0
    bool button_pressed = (gpio_state & 0x01);

    if (!button_pressed) {
        ESP_LOGI(TAG, "Factory reset button not pressed");
        i2c_driver_delete(I2C_MASTER_NUM);
        return ESP_OK;
    }

    ESP_LOGW(TAG, "Factory reset button detected! Hold for %d seconds...", FACTORY_RESET_TIME_MS / 1000);

    // Initialize LED controller for rainbow animation
    led_controller_init();

    // Count how long button is held
    uint32_t start_time = esp_timer_get_time() / 1000;  // Convert to ms
    uint32_t elapsed = 0;
    uint8_t hue = 0;

    while (elapsed < FACTORY_RESET_TIME_MS) {
        // Check if button is still pressed
        err = mcp23017_read_gpio(&gpio_state);
        if (err != ESP_OK || !(gpio_state & 0x01)) {
            ESP_LOGI(TAG, "Factory reset cancelled (button released)");
            led_clear();
            i2c_driver_delete(I2C_MASTER_NUM);
            return ESP_OK;
        }

        // Rainbow LED animation
        uint8_t r, g, b;
        // Simple HSV to RGB conversion for rainbow effect
        uint8_t region = hue / 43;
        uint8_t remainder = (hue - (region * 43)) * 6;

        switch (region) {
            case 0: r = 255; g = remainder; b = 0; break;
            case 1: r = 255 - remainder; g = 255; b = 0; break;
            case 2: r = 0; g = 255; b = remainder; break;
            case 3: r = 0; g = 255 - remainder; b = 255; break;
            case 4: r = remainder; g = 0; b = 255; break;
            default: r = 255; g = 0; b = 255 - remainder; break;
        }

        led_set_all(r, g, b);
        hue = (hue + 5) % 256;

        vTaskDelay(pdMS_TO_TICKS(50));
        elapsed = (esp_timer_get_time() / 1000) - start_time;
    }

    // Button held for full duration
    ESP_LOGW(TAG, "Factory reset confirmed!");

    // Flash red LEDs to confirm
    led_set_all(255, 0, 0);
    vTaskDelay(pdMS_TO_TICKS(500));
    led_clear();
    vTaskDelay(pdMS_TO_TICKS(200));
    led_set_all(255, 0, 0);
    vTaskDelay(pdMS_TO_TICKS(500));
    led_clear();

    i2c_driver_delete(I2C_MASTER_NUM);

    // Perform factory reset
    device_manager_factory_reset();

    return ESP_ERR_INVALID_STATE;  // Will never reach here
}

esp_err_t device_manager_get_device_id(char *device_id)
{
    if (device_id == NULL) {
        ESP_LOGE(TAG, "Device ID buffer is NULL");
        return ESP_ERR_INVALID_ARG;
    }

    uint8_t mac[6];
    esp_err_t err = esp_efuse_mac_get_default(mac);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to get MAC address: %s", esp_err_to_name(err));
        return err;
    }

    // Generate device ID: obedio-XXXXXX (last 6 hex digits of MAC)
    snprintf(device_id, 32, "%s-%02x%02x%02x",
             MDNS_HOSTNAME_PREFIX, mac[3], mac[4], mac[5]);

    return ESP_OK;
}

bool device_manager_validate_config(const device_config_t *config)
{
    if (config == NULL) {
        return false;
    }

    // Check required fields
    if (strlen(config->device_id) == 0) {
        ESP_LOGW(TAG, "Device ID is empty");
        return false;
    }

    if (strlen(config->wifi_ssid) == 0) {
        ESP_LOGW(TAG, "WiFi SSID is empty");
        return false;
    }

    if (strlen(config->mqtt_uri) == 0) {
        ESP_LOGW(TAG, "MQTT URI is empty");
        return false;
    }

    // Validate numeric ranges
    if (config->led_brightness > 255) {
        ESP_LOGW(TAG, "LED brightness out of range");
        return false;
    }

    if (config->shake_threshold <= 0 || config->shake_threshold > 10.0f) {
        ESP_LOGW(TAG, "Shake threshold out of range");
        return false;
    }

    if (config->touch_threshold > 100) {
        ESP_LOGW(TAG, "Touch threshold out of range");
        return false;
    }

    return true;
}

esp_err_t device_manager_get_default_config(device_config_t *config)
{
    if (config == NULL) {
        ESP_LOGE(TAG, "Config pointer is NULL");
        return ESP_ERR_INVALID_ARG;
    }

    // Clear structure
    memset(config, 0, sizeof(device_config_t));

    // Generate device ID
    device_manager_get_device_id(config->device_id);

    // Set default values from config.h
    strncpy(config->wifi_ssid, WIFI_SSID, sizeof(config->wifi_ssid) - 1);
    strncpy(config->wifi_password, WIFI_PASSWORD, sizeof(config->wifi_password) - 1);
    strncpy(config->mqtt_uri, MQTT_BROKER_URI, sizeof(config->mqtt_uri) - 1);
    strncpy(config->device_name, config->device_id, sizeof(config->device_name) - 1);
    strncpy(config->location_id, "default", sizeof(config->location_id) - 1);

    config->led_brightness = LED_BRIGHTNESS;
    config->shake_threshold = SHAKE_THRESHOLD;
    config->touch_threshold = TOUCH_THRESHOLD_PERCENT;
    config->factory_reset_pending = false;

    return ESP_OK;
}

// MCP23017 I2C helper functions
static esp_err_t mcp23017_write_register(uint8_t reg, uint8_t value)
{
    i2c_cmd_handle_t cmd = i2c_cmd_link_create();
    i2c_master_start(cmd);
    i2c_master_write_byte(cmd, (MCP23017_I2C_ADDR << 1) | I2C_MASTER_WRITE, true);
    i2c_master_write_byte(cmd, reg, true);
    i2c_master_write_byte(cmd, value, true);
    i2c_master_stop(cmd);

    esp_err_t err = i2c_master_cmd_begin(I2C_MASTER_NUM, cmd, pdMS_TO_TICKS(100));
    i2c_cmd_link_delete(cmd);

    return err;
}

static esp_err_t mcp23017_read_register(uint8_t reg, uint8_t *value)
{
    i2c_cmd_handle_t cmd = i2c_cmd_link_create();
    i2c_master_start(cmd);
    i2c_master_write_byte(cmd, (MCP23017_I2C_ADDR << 1) | I2C_MASTER_WRITE, true);
    i2c_master_write_byte(cmd, reg, true);
    i2c_master_start(cmd);
    i2c_master_write_byte(cmd, (MCP23017_I2C_ADDR << 1) | I2C_MASTER_READ, true);
    i2c_master_read_byte(cmd, value, I2C_MASTER_NACK);
    i2c_master_stop(cmd);

    esp_err_t err = i2c_master_cmd_begin(I2C_MASTER_NUM, cmd, pdMS_TO_TICKS(100));
    i2c_cmd_link_delete(cmd);

    return err;
}

static esp_err_t mcp23017_set_direction(uint8_t direction)
{
    return mcp23017_write_register(MCP23017_IODIRA, direction);
}

static esp_err_t mcp23017_read_gpio(uint8_t *gpio_state)
{
    return mcp23017_read_register(MCP23017_GPIOA, gpio_state);
}
