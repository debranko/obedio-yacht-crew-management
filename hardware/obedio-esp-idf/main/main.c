/*
 * Obedio Yacht Crew Management - ESP32 Firmware
 * Main Application Entry Point
 *
 * This file initializes all hardware peripherals, network services,
 * and FreeRTOS tasks for the crew management device.
 */

#include <stdio.h>
#include <string.h>
#include <stdarg.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"
#include "esp_timer.h"
#include "nvs_flash.h"
#include "driver/i2c.h"
#include "lwip/sockets.h"
#include "lwip/netdb.h"

#include "config.h"
#include "device_manager.h"
#include "wifi_manager.h"
#include "mqtt_handler.h"
#include "button_handler.h"
#include "touch_handler.h"
#include "accel_handler.h"
#include "led_controller.h"
#include "audio_recorder.h"
#include "web_server.h"
#include "ota_handler.h"
#include "mcp23017.h"
#include "lis3dhtr.h"
#include "esp_ota_ops.h"

static const char *TAG = "MAIN";

// Voice recording state
static bool is_recording = false;
static int64_t recording_start_time = 0;  // Timestamp when recording started (microseconds)

// UDP logging
static int udp_log_socket = -1;
static struct sockaddr_in udp_log_addr;
static vprintf_like_t original_vprintf = NULL;

// Forward declarations
static void button_press_callback(const char *button, press_type_t type);
static void touch_press_callback(press_type_t type);
static void shake_detected_callback(void);
static esp_err_t i2c_bus_init(void);
static void startup_led_animation(void);
static void heartbeat_timer_callback(void *arg);
static esp_err_t init_udp_logging(const char *host, uint16_t port);
static int udp_vprintf(const char *fmt, va_list args);

/**
 * Initialize I2C bus for all peripherals
 */
static esp_err_t i2c_bus_init(void)
{
    i2c_config_t i2c_config = {
        .mode = I2C_MODE_MASTER,
        .sda_io_num = I2C_MASTER_SDA_IO,
        .scl_io_num = I2C_MASTER_SCL_IO,
        .sda_pullup_en = GPIO_PULLUP_ENABLE,
        .scl_pullup_en = GPIO_PULLUP_ENABLE,
        .master.clk_speed = I2C_MASTER_FREQ_HZ,
    };

    esp_err_t ret = i2c_param_config(I2C_NUM_0, &i2c_config);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to configure I2C parameters: %s", esp_err_to_name(ret));
        return ret;
    }

    ret = i2c_driver_install(I2C_NUM_0, I2C_MODE_MASTER, 0, 0, 0);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to install I2C driver: %s", esp_err_to_name(ret));
        return ret;
    }

    ESP_LOGI(TAG, "I2C bus initialized successfully");
    return ESP_OK;
}

/**
 * Startup LED animation - green wipe to indicate successful initialization
 */
static void startup_led_animation(void)
{
    ESP_LOGI(TAG, "Playing startup animation");

    // Flash green LEDs to indicate successful initialization
    led_flash(LED_COLOR_GREEN, 500);

    ESP_LOGI(TAG, "Startup animation complete");
}

/**
 * Button press event callback
 * Handles single, double, and long press events
 * Special handling for voice recording on long press
 */
static void button_press_callback(const char *button, press_type_t type)
{
    ESP_LOGI(TAG, "Button callback: %s, type: %d", button, type);

    // Handle T1 (main) button PRESS - track start time
    if (strcmp(button, "T1") == 0 && type == PRESS_TYPE_PRESS) {
        ESP_LOGI(TAG, "T1 (main) button pressed - tracking for duration");
        is_recording = true;  // Use this flag to track button is held
        recording_start_time = esp_timer_get_time();  // Store start time (microseconds)
        return;
    }

    // Handle T1 (main) button RELEASE - check duration to decide short vs long press
    if (is_recording && strcmp(button, "T1") == 0 && type == PRESS_TYPE_SINGLE) {
        // Calculate press duration in milliseconds
        int64_t current_time = esp_timer_get_time();
        int64_t duration_ms = (current_time - recording_start_time) / 1000;
        is_recording = false;

        ESP_LOGI(TAG, "T1 (main) button released after %lld ms", duration_ms);

        if (duration_ms < 500) {
            // Short press (< 0.5s) - Send normal button notification
            ESP_LOGI(TAG, "Short press - sending button notification");
            led_flash(LED_COLOR_WHITE, 100);
            mqtt_publish_button_press("main", "single");
            ESP_LOGI(TAG, "Button notification sent: main - single");
        } else {
            // Long press (>= 0.5s) - Send voice event (without actual audio for now)
            ESP_LOGI(TAG, "Long press - sending voice event");
            led_flash(LED_COLOR_BLUE, 200);  // Blue = voice event
            mqtt_publish_button_press("main", "voice");
            ESP_LOGI(TAG, "Voice event sent: main - voice");
        }
        return;
    }

    // IMPORTANT: Filter out ALL T1 (main button) events that aren't handled above
    // This prevents LONG press events from being published while button is held
    if (strcmp(button, "T1") == 0) {
        return;  // Don't publish any other T1 events
    }

    // SPECIAL CASE: T3 (Light button) - Direct Tasmota control
    // Publishes directly to "tasmota_obedio/cmnd/POWER" with "TOGGLE"
    // Does NOT publish to backend/frontend - local device-to-device control only
    if (strcmp(button, "T3") == 0 && (type == PRESS_TYPE_SINGLE || type == PRESS_TYPE_LONG)) {
        ESP_LOGI(TAG, "T3 (Light) button pressed - sending Tasmota TOGGLE");
        led_flash(LED_COLOR_YELLOW, 100);  // Yellow flash to indicate light command
        mqtt_publish_tasmota_toggle();
        ESP_LOGI(TAG, "Tasmota toggle command sent - no backend event");
        return;  // Skip normal button press publication
    }

    // Ignore PRESS_TYPE_PRESS for all other buttons (T2-T6)
    if (type == PRESS_TYPE_PRESS) {
        return;
    }

    // Flash different colors based on press type
    switch (type) {
        case PRESS_TYPE_SINGLE:
            led_flash(LED_COLOR_WHITE, 100);
            break;
        case PRESS_TYPE_DOUBLE:
            led_flash(LED_COLOR_YELLOW, 100);
            break;
        case PRESS_TYPE_LONG:
            led_flash(LED_COLOR_CYAN, 100);
            break;
        default:
            break;
    }

    // Convert press type to string
    const char *press_type_str;
    switch (type) {
        case PRESS_TYPE_SINGLE:
            press_type_str = "single";
            break;
        case PRESS_TYPE_DOUBLE:
            press_type_str = "double";
            break;
        case PRESS_TYPE_LONG:
            press_type_str = "long";
            break;
        default:
            press_type_str = "unknown";
            break;
    }

    // Publish button event via MQTT
    mqtt_publish_button_press(button, press_type_str);
    ESP_LOGI(TAG, "Button event published: %s - %s", button, press_type_str);
}

/**
 * Touch sensor event callback
 */
static void touch_press_callback(press_type_t type)
{
    ESP_LOGI(TAG, "Touch callback: type %d", type);

    // Flash LED based on touch type
    switch (type) {
        case PRESS_TYPE_TOUCH:
            led_flash(LED_COLOR_CYAN, 100);
            break;
        case PRESS_TYPE_DOUBLE_TOUCH:
            led_flash(LED_COLOR_PURPLE, 100);
            break;
        default:
            led_flash(LED_COLOR_WHITE, 100);
            break;
    }

    // Convert touch type to string
    const char *touch_type_str;
    switch (type) {
        case PRESS_TYPE_TOUCH:
            touch_type_str = "single";
            break;
        case PRESS_TYPE_DOUBLE_TOUCH:
            touch_type_str = "double";
            break;
        default:
            touch_type_str = "unknown";
            break;
    }

    // Publish touch event via MQTT (using button press with "touch" button)
    mqtt_publish_button_press("touch", touch_type_str);
    ESP_LOGI(TAG, "Touch event published: %s", touch_type_str);
}

/**
 * Accelerometer shake detection callback
 */
static void shake_detected_callback(void)
{
    ESP_LOGI(TAG, "Shake detected!");

    // Flash red LEDs to indicate shake
    led_flash(LED_COLOR_RED, 200);

    // Publish shake event via MQTT (using button press with "shake" button)
    mqtt_publish_button_press("shake", "shake");
    ESP_LOGI(TAG, "Shake event published");
}

/**
 * MQTT heartbeat timer callback (called every 30 seconds)
 */
static void heartbeat_timer_callback(void *arg)
{
    mqtt_send_heartbeat();
    ESP_LOGD(TAG, "Heartbeat sent");
}

/**
 * UDP vprintf handler - sends logs via UDP
 */
static int udp_vprintf(const char *fmt, va_list args)
{
    char log_buffer[512];
    int len = vsnprintf(log_buffer, sizeof(log_buffer), fmt, args);

    // Also print to serial
    if (original_vprintf) {
        va_list args_copy;
        va_copy(args_copy, args);
        original_vprintf(fmt, args_copy);
        va_end(args_copy);
    }

    // Send via UDP if socket is valid
    if (udp_log_socket >= 0 && len > 0) {
        sendto(udp_log_socket, log_buffer, len, 0,
               (struct sockaddr *)&udp_log_addr, sizeof(udp_log_addr));
    }

    return len;
}

/**
 * Initialize UDP logging
 */
static esp_err_t init_udp_logging(const char *host, uint16_t port)
{
    ESP_LOGI(TAG, "Initializing UDP logging to %s:%d", host, port);

    // Create UDP socket
    udp_log_socket = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
    if (udp_log_socket < 0) {
        ESP_LOGE(TAG, "Failed to create UDP socket");
        return ESP_FAIL;
    }

    // Configure destination address
    memset(&udp_log_addr, 0, sizeof(udp_log_addr));
    udp_log_addr.sin_family = AF_INET;
    udp_log_addr.sin_port = htons(port);
    inet_pton(AF_INET, host, &udp_log_addr.sin_addr);

    // Redirect vprintf to UDP
    original_vprintf = esp_log_set_vprintf(udp_vprintf);

    ESP_LOGI(TAG, "UDP logging enabled - logs streaming to %s:%d", host, port);
    return ESP_OK;
}

/**
 * Main application entry point
 */
void app_main(void)
{
    esp_err_t ret;

    // Print firmware and hardware information
    ESP_LOGI(TAG, "===========================================");
    ESP_LOGI(TAG, "  Obedio Yacht Crew Management Device");
    ESP_LOGI(TAG, "  Firmware Version: %s", FIRMWARE_VERSION);
    ESP_LOGI(TAG, "  BUILD HASH: %s", FIRMWARE_BUILD_HASH);
    ESP_LOGI(TAG, "  Hardware Version: %s", HARDWARE_VERSION);
    ESP_LOGI(TAG, "===========================================");

    // CRITICAL: Validate OTA update IMMEDIATELY on boot (before WiFi, within watchdog timeout)
    ESP_LOGI(TAG, "=== OTA Validation Check ===");
    const esp_partition_t *running = esp_ota_get_running_partition();
    const esp_partition_t *boot = esp_ota_get_boot_partition();

    ESP_LOGI(TAG, "Running partition: %s (offset: 0x%lx, size: 0x%lx)",
             running->label, running->address, running->size);
    ESP_LOGI(TAG, "Boot partition: %s (offset: 0x%lx, size: 0x%lx)",
             boot->label, boot->address, boot->size);

    esp_ota_img_states_t ota_state;
    esp_err_t state_ret = esp_ota_get_state_partition(running, &ota_state);

    if (state_ret == ESP_OK) {
        ESP_LOGI(TAG, "OTA state value: %d (0=NEW, 1=PENDING_VERIFY, 2=VALID, 3=ABORTED, 4=INVALID, -1=UNDEFINED)", ota_state);

        // Validate if firmware is NEW, PENDING_VERIFY, or UNDEFINED
        if (ota_state == ESP_OTA_IMG_PENDING_VERIFY ||
            ota_state == ESP_OTA_IMG_NEW ||
            ota_state == ESP_OTA_IMG_UNDEFINED) {

            ESP_LOGI(TAG, "⚠️  Firmware needs validation - calling mark_app_valid NOW");
            esp_err_t mark_ret = esp_ota_mark_app_valid_cancel_rollback();

            if (mark_ret == ESP_OK) {
                ESP_LOGI(TAG, "✅ OTA VALIDATED SUCCESSFULLY - rollback canceled!");
            } else {
                ESP_LOGE(TAG, "❌ OTA validation FAILED: %s", esp_err_to_name(mark_ret));
            }
        } else if (ota_state == ESP_OTA_IMG_VALID) {
            ESP_LOGI(TAG, "✅ Firmware already marked as VALID - no action needed");
        } else {
            ESP_LOGW(TAG, "⚠️  Unexpected OTA state: %d", ota_state);
        }
    } else {
        ESP_LOGW(TAG, "Could not get OTA state: %s - calling validation as fallback", esp_err_to_name(state_ret));
        esp_err_t mark_ret = esp_ota_mark_app_valid_cancel_rollback();
        ESP_LOGI(TAG, "Fallback validation result: %s", esp_err_to_name(mark_ret));
    }

    // Step 1: Initialize NVS flash
    ESP_LOGI(TAG, "Initializing NVS flash...");
    ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_LOGW(TAG, "NVS partition was truncated, erasing...");
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);
    ESP_LOGI(TAG, "NVS flash initialized");

    // Step 2: Initialize device manager and load config
    ESP_LOGI(TAG, "Initializing device manager...");
    ret = device_manager_init();
    ESP_ERROR_CHECK(ret);
    ESP_LOGI(TAG, "Device manager initialized");

    // Step 3: Check for factory reset (T6 touch pad held during boot)
    ESP_LOGI(TAG, "Checking for factory reset request...");
    if (touch_check_factory_reset()) {
        ESP_LOGW(TAG, "Factory reset requested!");
        device_manager_factory_reset();
        ESP_LOGI(TAG, "Factory reset complete, rebooting...");
        vTaskDelay(pdMS_TO_TICKS(1000));
        esp_restart();
    }

    // Step 4: Load configuration from NVS
    ESP_LOGI(TAG, "Loading device configuration...");
    device_config_t config;
    ret = device_manager_load_config(&config);
    if (ret != ESP_OK) {
        ESP_LOGW(TAG, "Failed to load config, using defaults");
    } else {
        ESP_LOGI(TAG, "Configuration loaded - Device: %s, Location: %s",
                 config.device_name, config.location_id);
    }

    // Step 5: Initialize I2C bus
    ESP_LOGI(TAG, "Initializing I2C bus...");
    ret = i2c_bus_init();
    ESP_ERROR_CHECK(ret);

    // Step 6: Initialize MCP23017 (button GPIO expander)
    ESP_LOGI(TAG, "Initializing MCP23017...");
    ret = mcp23017_init(I2C_NUM_0, MCP23017_I2C_ADDR);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "FATAL: MCP23017 initialization failed!");
        // Flash red LEDs indefinitely to indicate critical failure
        while (1) {
            led_set_all(255, 0, 0);  // Red
            vTaskDelay(pdMS_TO_TICKS(500));
            led_clear();
            vTaskDelay(pdMS_TO_TICKS(500));
        }
    }
    ESP_LOGI(TAG, "MCP23017 initialized");

    // Step 7: Initialize LIS3DHTR (accelerometer)
    ESP_LOGI(TAG, "Initializing LIS3DHTR accelerometer...");
    ret = lis3dhtr_init(I2C_NUM_0, LIS3DHTR_I2C_ADDR);
    if (ret != ESP_OK) {
        ESP_LOGW(TAG, "LIS3DHTR initialization failed, continuing without accelerometer");
    } else {
        ESP_LOGI(TAG, "LIS3DHTR initialized");
    }

    // Step 8: Initialize LED controller
    ESP_LOGI(TAG, "Initializing LED controller...");
    ret = led_controller_init();
    ESP_ERROR_CHECK(ret);
    ESP_LOGI(TAG, "LED controller initialized");

    // Step 9: Play startup animation (green wipe)
    startup_led_animation();

    // Step 10: Initialize touch sensor
    ESP_LOGI(TAG, "Initializing touch sensor...");
    ret = touch_handler_init(touch_press_callback);
    if (ret != ESP_OK) {
        ESP_LOGW(TAG, "Touch sensor initialization failed, continuing without touch");
    } else {
        ESP_LOGI(TAG, "Touch sensor initialized");
    }

    // Step 11: Initialize audio recorder
    ESP_LOGI(TAG, "Initializing audio recorder...");
    ret = audio_recorder_init();
    if (ret != ESP_OK) {
        ESP_LOGW(TAG, "Audio recorder initialization failed, voice features disabled");
    } else {
        ESP_LOGI(TAG, "Audio recorder initialized");
    }

    // Step 12: Initialize WiFi (with AP fallback if STA fails)
    ESP_LOGI(TAG, "Initializing WiFi...");
    ret = wifi_init_sta();
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "WiFi initialization completely failed");
        // Device will not have network connectivity
    } else {
        if (wifi_is_ap_mode()) {
            ESP_LOGI(TAG, "WiFi initialized in AP mode (setup required)");
            ESP_LOGI(TAG, "Connect to WiFi network and visit http://192.168.4.1 to configure");
        } else {
            ESP_LOGI(TAG, "WiFi initialized in STA mode");

            // Initialize UDP logging for wireless debugging
            ESP_LOGI(TAG, "Enabling wireless UDP logging...");
            ret = init_udp_logging("10.10.0.10", 5555);
            if (ret != ESP_OK) {
                ESP_LOGW(TAG, "UDP logging failed to initialize (continuing without it)");
            }
        }
    }

    // Step 13: Initialize MQTT
    ESP_LOGI(TAG, "Initializing MQTT...");
    ret = mqtt_app_start();
    if (ret != ESP_OK) {
        ESP_LOGW(TAG, "MQTT initialization failed, will retry in background");
    } else {
        ESP_LOGI(TAG, "MQTT initialized");
    }

    // Step 14: Initialize web server
    // TEMPORARILY DISABLED - causing heap corruption crash
    ESP_LOGW(TAG, "Web server DISABLED temporarily");
    /*
    ESP_LOGI(TAG, "Initializing web server...");
    ret = web_server_start();
    if (ret != ESP_OK) {
        ESP_LOGW(TAG, "Web server initialization failed");
    } else {
        ESP_LOGI(TAG, "Web server initialized");
    }
    */

    // Step 15: Initialize OTA handler
    ESP_LOGI(TAG, "Initializing OTA handler...");
    ret = ota_handler_init();
    if (ret != ESP_OK) {
        ESP_LOGW(TAG, "OTA handler initialization failed");
    } else {
        ESP_LOGI(TAG, "OTA handler initialized - MQTT OTA updates enabled");
    }

    // Step 16: Initialize button handler and create task
    ESP_LOGI(TAG, "Initializing button handler...");
    ret = button_handler_init(button_press_callback);
    ESP_ERROR_CHECK(ret);

    ret = button_handler_start_task(5, 4096);
    ESP_ERROR_CHECK(ret);
    ESP_LOGI(TAG, "Button handler task started (priority 5, stack 4096)");

    // Step 17: Create touch handler task
    if (touch_handler_is_initialized()) {
        ESP_LOGI(TAG, "Starting touch handler task...");
        ret = touch_handler_start_task(5, 3072);
        if (ret == ESP_OK) {
            ESP_LOGI(TAG, "Touch handler task started (priority 5, stack 3072)");
        } else {
            ESP_LOGW(TAG, "Failed to start touch handler task");
        }
    }

    // Step 18: Initialize accelerometer handler and create task
    // TEMPORARILY DISABLED - causing false shake detections
    ESP_LOGW(TAG, "Accelerometer shake detection disabled");
    /*
    if (lis3dhtr_is_initialized()) {
        ESP_LOGI(TAG, "Initializing accelerometer handler...");
        ret = accel_handler_init(shake_detected_callback);
        if (ret == ESP_OK) {
            ret = accel_handler_start_task(4, 3072);
            if (ret == ESP_OK) {
                ESP_LOGI(TAG, "Accelerometer handler task started (priority 4, stack 3072)");
            } else {
                ESP_LOGW(TAG, "Failed to start accelerometer handler task");
            }
        } else {
            ESP_LOGW(TAG, "Failed to initialize accelerometer handler");
        }
    }
    */

    // Step 19: Initialize static LED display with default color (config will override via MQTT)
    ESP_LOGI(TAG, "Initializing static LED display with default color RGB(%d,%d,%d) brightness=%d...",
             LED_RED, LED_GREEN, LED_BLUE, LED_BRIGHTNESS);
    ret = led_update_static(LED_RED, LED_GREEN, LED_BLUE, LED_BRIGHTNESS);
    if (ret == ESP_OK) {
        ESP_LOGI(TAG, "Static LED display initialized successfully");
    } else {
        ESP_LOGW(TAG, "Failed to initialize static LED display");
    }

    // Step 20: Create MQTT heartbeat timer (30 seconds)
    ESP_LOGI(TAG, "Creating MQTT heartbeat timer...");
    const esp_timer_create_args_t heartbeat_timer_args = {
        .callback = &heartbeat_timer_callback,
        .name = "mqtt_heartbeat"
    };
    esp_timer_handle_t heartbeat_timer;
    ret = esp_timer_create(&heartbeat_timer_args, &heartbeat_timer);
    if (ret == ESP_OK) {
        ret = esp_timer_start_periodic(heartbeat_timer, 30 * 1000000);  // 30 seconds in microseconds
        if (ret == ESP_OK) {
            ESP_LOGI(TAG, "MQTT heartbeat timer started (30s interval)");
        } else {
            ESP_LOGW(TAG, "Failed to start heartbeat timer");
        }
    } else {
        ESP_LOGW(TAG, "Failed to create heartbeat timer");
    }

    // Setup complete!
    ESP_LOGI(TAG, "===========================================");
    ESP_LOGI(TAG, "  Setup complete! Device ready.");
    ESP_LOGI(TAG, "===========================================");

    // Print memory statistics
    ESP_LOGI(TAG, "Free heap: %lu bytes", esp_get_free_heap_size());
    ESP_LOGI(TAG, "Minimum free heap: %lu bytes", esp_get_minimum_free_heap_size());
}
