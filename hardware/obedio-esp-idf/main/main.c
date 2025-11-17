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
#include "driver/i2c_master.h"
#include "lwip/sockets.h"
#include "lwip/netdb.h"
#include "cJSON.h"

#include "config.h"
#include "device_manager.h"
#include "wifi_manager.h"
#include "mqtt_handler.h"
#include "button_handler.h"
// #include "touch_handler.h"  // Disabled for ESP-IDF v5.3 compatibility
#include "accel_handler.h"
#include "led_controller.h"
#include "audio_recorder.h"
#include "audio_http_upload.h"
#include "web_server.h"
#include "ota_handler.h"
#include "mcp23017.h"
#include "lis3dhtr.h"
#include "esp_ota_ops.h"
// #include "power_manager.h"  // Disabled for ESP-IDF v5.3 compatibility

static const char *TAG = "MAIN";

// Voice recording state
static bool is_recording = false;
static int64_t recording_start_time = 0;  // Timestamp when recording started (microseconds)

// I2C bus handle
static i2c_master_bus_handle_t i2c_bus_handle = NULL;

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
    i2c_master_bus_config_t bus_config = {
        .clk_source = I2C_CLK_SRC_DEFAULT,
        .i2c_port = I2C_NUM_0,
        .scl_io_num = I2C_MASTER_SCL_IO,
        .sda_io_num = I2C_MASTER_SDA_IO,
        .glitch_ignore_cnt = 7,
        .flags.enable_internal_pullup = true,
    };

    esp_err_t ret = i2c_new_master_bus(&bus_config, &i2c_bus_handle);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to create I2C master bus: %s", esp_err_to_name(ret));
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
 * Interactive LED feedback: Blue flash on MQTT publish, rotating blue LED during T1 long press
 */
static void button_press_callback(const char *button, press_type_t type)
{
    ESP_LOGI(TAG, "Button callback: %s, type: %d", button, type);

    // Record user activity to reset sleep timer
    // power_manager_activity();  // Disabled for ESP-IDF v5.3 compatibility

    // Get current LED configuration for restore after feedback
    uint8_t led_r, led_g, led_b, led_brightness;
    mqtt_get_led_config(&led_r, &led_g, &led_b, &led_brightness);

    // === T1 (CENTER BUTTON) SPECIAL HANDLING ===

    // T1 LONG PRESS (700ms threshold reached while button still held)
    // Start rotating blue LED animation to indicate "recording is active"
    if (strcmp(button, "T1") == 0 && type == PRESS_TYPE_LONG) {
        ESP_LOGI(TAG, "T1 long press detected - starting recording LED animation");
        is_recording = true;
        recording_start_time = esp_timer_get_time();
        led_start_recording_animation(PRIORITY_LED_TASK, STACK_SIZE_LED);
        return;  // Don't publish MQTT yet - wait for release
    }

    // T1 RELEASE after long press
    // Record audio, upload via HTTP, publish MQTT with URL
    if (is_recording && strcmp(button, "T1") == 0 && type == PRESS_TYPE_SINGLE) {
        ESP_LOGI(TAG, "T1 released after long press - recording and uploading audio");
        is_recording = false;

        // Calculate recording duration
        int64_t duration_us = esp_timer_get_time() - recording_start_time;
        uint32_t duration_ms = (uint32_t)(duration_us / 1000);

        // Limit to 10 seconds
        if (duration_ms > 10000) {
            duration_ms = 10000;
        }

        ESP_LOGI(TAG, "Recording duration: %lu ms", duration_ms);

        // Stop animation, flash blue confirmation, restore config color
        led_stop_recording_animation(led_r, led_g, led_b, led_brightness);

        // Record and upload audio
        char audio_url[256] = {0};
        esp_err_t ret = audio_record_and_upload(
            "http://10.10.0.10:8080/api/voice/upload",
            audio_url,
            sizeof(audio_url),
            duration_ms
        );

        if (ret == ESP_OK) {
            ESP_LOGI(TAG, "Audio uploaded successfully: %s", audio_url);

            // Get device ID
            char device_id[32];
            device_manager_get_device_id(device_id);

            // Publish MQTT with audio URL
            cJSON *json = cJSON_CreateObject();
            cJSON_AddStringToObject(json, "deviceId", device_id);
            cJSON_AddStringToObject(json, "button", "main");
            cJSON_AddStringToObject(json, "pressType", "voice");
            cJSON_AddStringToObject(json, "audioUrl", audio_url);
            cJSON_AddNumberToObject(json, "duration", (float)duration_ms / 1000.0f);
            cJSON_AddNumberToObject(json, "timestamp", esp_timer_get_time() / 1000);

            char *json_str = cJSON_PrintUnformatted(json);
            char topic[128];
            snprintf(topic, sizeof(topic), "obedio/button/%s/voice", device_id);
            mqtt_publish_raw(topic, json_str);

            cJSON_Delete(json);
            free(json_str);

            ESP_LOGI(TAG, "Voice event published with audio URL");
        } else {
            ESP_LOGE(TAG, "Audio upload failed: %s", esp_err_to_name(ret));
            // Still publish button event without audio URL
            mqtt_publish_button_press("main", "voice");
        }

        return;
    }

    // T1 SHORT PRESS (released before 700ms threshold)
    // Flash blue, restore config color, publish MQTT
    if (strcmp(button, "T1") == 0 && type == PRESS_TYPE_SINGLE && !is_recording) {
        ESP_LOGI(TAG, "T1 short press - publishing button event");

        // Publish button event first
        mqtt_publish_button_press("main", "single");

        // Flash blue confirmation and restore config color
        led_flash_blue_confirm(led_r, led_g, led_b, led_brightness);

        ESP_LOGI(TAG, "Button event published: main - single");
        return;
    }

    // Filter out PRESS_TYPE_PRESS events for T1 (we don't do anything on initial press)
    if (strcmp(button, "T1") == 0 && type == PRESS_TYPE_PRESS) {
        return;
    }

    // === T3 (LIGHT BUTTON) SPECIAL CASE ===
    // Direct Tasmota control - does NOT publish to backend
    if (strcmp(button, "T3") == 0 && (type == PRESS_TYPE_SINGLE || type == PRESS_TYPE_LONG)) {
        ESP_LOGI(TAG, "T3 (Light) button pressed - sending Tasmota TOGGLE");

        // Publish Tasmota command
        mqtt_publish_tasmota_toggle();

        // Flash blue confirmation and restore config color
        led_flash_blue_confirm(led_r, led_g, led_b, led_brightness);

        ESP_LOGI(TAG, "Tasmota toggle command sent");
        return;
    }

    // === ALL OTHER BUTTONS (T2, T4, T5, T6) ===

    // Ignore PRESS_TYPE_PRESS events (no action on button down)
    if (type == PRESS_TYPE_PRESS) {
        return;
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

    // Flash blue confirmation and restore config color
    led_flash_blue_confirm(led_r, led_g, led_b, led_brightness);

    ESP_LOGI(TAG, "Button event published: %s - %s", button, press_type_str);
}

/**
 * Touch sensor event callback
 */
static void touch_press_callback(press_type_t type)
{
    ESP_LOGI(TAG, "Touch callback: type %d", type);

    // Record user activity to reset sleep timer
    // power_manager_activity();  // Disabled for ESP-IDF v5.3 compatibility

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

    // Record user activity to reset sleep timer
    // power_manager_activity();  // Disabled for ESP-IDF v5.3 compatibility

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
    // Touch handler disabled for ESP-IDF v5.3 compatibility
    ESP_LOGI(TAG, "Factory reset check disabled (touch handler disabled)");
    // if (touch_check_factory_reset()) {
    if (false) {  // Factory reset disabled temporarily
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
    ret = mcp23017_init(i2c_bus_handle, MCP23017_I2C_ADDR);
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
    ret = lis3dhtr_init(i2c_bus_handle, LIS3DHTR_I2C_ADDR);
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
    // Disabled for ESP-IDF v5.3 compatibility
    /*
    ESP_LOGI(TAG, "Initializing touch sensor...");
    ret = touch_handler_init(touch_press_callback);
    if (ret != ESP_OK) {
        ESP_LOGW(TAG, "Touch sensor initialization failed, continuing without touch");
    } else {
        ESP_LOGI(TAG, "Touch sensor initialized");
    }
    */
    ESP_LOGI(TAG, "Touch sensor disabled (ESP-IDF v5.3 compatibility)");

    // Step 11: Initialize audio HTTP upload (replaces old audio_recorder)
    ESP_LOGI(TAG, "Initializing audio HTTP upload...");
    ret = audio_http_upload_init();
    if (ret != ESP_OK) {
        ESP_LOGW(TAG, "Audio HTTP upload initialization failed, voice features disabled");
    } else {
        ESP_LOGI(TAG, "Audio HTTP upload initialized - voice recording via HTTP POST");
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
    // Disabled for ESP-IDF v5.3 compatibility
    /*
    if (touch_handler_is_initialized()) {
        ESP_LOGI(TAG, "Starting touch handler task...");
        ret = touch_handler_start_task(5, 3072);
        if (ret == ESP_OK) {
            ESP_LOGI(TAG, "Touch handler task started (priority 5, stack 3072)");
        } else {
            ESP_LOGW(TAG, "Failed to start touch handler task");
        }
    }
    */
    ESP_LOGI(TAG, "Touch handler task disabled (ESP-IDF v5.3 compatibility)");

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

    // Step 21: Initialize and start power manager
    // TEMPORARILY DISABLED FOR DEBUGGING OTA ROLLBACK ISSUE
    ESP_LOGW(TAG, "Power manager DISABLED for debugging");
    /*
    ESP_LOGI(TAG, "Initializing power manager...");
    ret = power_manager_init(config.sleep_timeout_sec);
    if (ret == ESP_OK) {
        ESP_LOGI(TAG, "Power manager initialized (sleep timeout: %lu sec)", config.sleep_timeout_sec);

        ret = power_manager_start_task(3, 3072);  // Priority 3, stack 3072
        if (ret == ESP_OK) {
            ESP_LOGI(TAG, "Power manager task started - automatic sleep enabled");
        } else {
            ESP_LOGW(TAG, "Failed to start power manager task");
        }
    } else {
        ESP_LOGW(TAG, "Failed to initialize power manager");
    }
    */

    // Setup complete!
    ESP_LOGI(TAG, "===========================================");
    ESP_LOGI(TAG, "  Setup complete! Device ready.");
    ESP_LOGI(TAG, "===========================================");

    // Print memory statistics
    ESP_LOGI(TAG, "Free heap: %lu bytes", esp_get_free_heap_size());
    ESP_LOGI(TAG, "Minimum free heap: %lu bytes", esp_get_minimum_free_heap_size());
}
