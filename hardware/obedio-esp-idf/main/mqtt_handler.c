/**
 * @file mqtt_handler.c
 * @brief MQTT Handler implementation for OBEDIO Smart Button
 */

#include "mqtt_handler.h"
#include "wifi_manager.h"
#include "config.h"
#include "ota_handler.h"
#include "led_controller.h"

#include <string.h>
#include <stdio.h>
#include <sys/time.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/timers.h"
#include "esp_system.h"
#include "esp_log.h"
#include "esp_timer.h"
#include "nvs_flash.h"
#include "nvs.h"
#include "mqtt_client.h"
#include "cJSON.h"
#include "mbedtls/base64.h"

static const char *TAG = "mqtt_handler";

// Static variables
static esp_mqtt_client_handle_t s_mqtt_client = NULL;
static bool s_is_connected = false;
static uint32_t s_sequence_number = 0;
static TimerHandle_t s_heartbeat_timer = NULL;
static char *s_pending_ota_url = NULL;

/**
 * @brief OTA task - runs OTA update in separate task to avoid blocking MQTT
 */
static void ota_task(void *pvParameters)
{
    char *firmware_url = (char *)pvParameters;

    ESP_LOGI(TAG, "OTA task started, updating from: %s", firmware_url);

    // Stop LED animation to prevent flash cache access during OTA
    ESP_LOGI(TAG, "Stopping LED task before OTA...");
    led_stop_rainbow_task();

    // Wait a moment for LED task to fully stop
    vTaskDelay(pdMS_TO_TICKS(100));

    ESP_LOGI(TAG, "LED task stopped, starting OTA download...");

    // Perform OTA update (will reboot if successful)
    esp_err_t ret = ota_update_from_url(firmware_url);

    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "OTA update failed!");
        led_flash(LED_COLOR_RED, 1000);

        // Restart LED animation if OTA failed
        led_start_rainbow_task(3, 3072);
    }

    // Free the URL string
    free(firmware_url);

    // Delete this task
    vTaskDelete(NULL);
}

/**
 * @brief Get current timestamp in milliseconds
 */
static uint64_t get_timestamp_ms(void)
{
    struct timeval tv;
    gettimeofday(&tv, NULL);
    return (uint64_t)(tv.tv_sec) * 1000ULL + (uint64_t)(tv.tv_usec) / 1000ULL;
}

/**
 * @brief Get uptime in milliseconds
 */
static uint64_t get_uptime_ms(void)
{
    return esp_timer_get_time() / 1000ULL;
}

/**
 * @brief Get battery percentage (placeholder)
 *
 * TODO: Implement actual battery monitoring
 */
static uint8_t get_battery_percentage(void)
{
    // Placeholder - return 100% for now
    return 100;
}

/**
 * @brief Encode data to base64
 */
static char* base64_encode(const uint8_t *data, size_t len)
{
    size_t encoded_len = 0;

    // Calculate required buffer size
    mbedtls_base64_encode(NULL, 0, &encoded_len, data, len);

    // Allocate buffer
    char *encoded = malloc(encoded_len + 1);
    if (encoded == NULL) {
        ESP_LOGE(TAG, "Failed to allocate base64 buffer");
        return NULL;
    }

    // Encode
    int ret = mbedtls_base64_encode((unsigned char *)encoded, encoded_len, &encoded_len, data, len);
    if (ret != 0) {
        ESP_LOGE(TAG, "Base64 encoding failed: %d", ret);
        free(encoded);
        return NULL;
    }

    encoded[encoded_len] = '\0';
    return encoded;
}

/**
 * @brief MQTT event handler
 */
static void mqtt_event_handler(void *handler_args, esp_event_base_t base, int32_t event_id, void *event_data)
{
    esp_mqtt_event_handle_t event = (esp_mqtt_event_handle_t)event_data;

    switch ((esp_mqtt_event_id_t)event_id) {
        case MQTT_EVENT_CONNECTED:
            ESP_LOGI(TAG, "MQTT connected to broker");
            s_is_connected = true;

            // Subscribe to OTA topic
            char ota_topic[128];
            snprintf(ota_topic, sizeof(ota_topic), "obedio/button/%s/ota", wifi_get_device_id());
            int msg_id = esp_mqtt_client_subscribe(s_mqtt_client, ota_topic, 1);
            ESP_LOGI(TAG, "Subscribed to OTA topic: %s (msg_id=%d)", ota_topic, msg_id);

            // Register device on connection
            mqtt_register_device();
            break;

        case MQTT_EVENT_DISCONNECTED:
            ESP_LOGW(TAG, "MQTT disconnected from broker");
            s_is_connected = false;
            break;

        case MQTT_EVENT_SUBSCRIBED:
            ESP_LOGI(TAG, "MQTT subscribed, msg_id=%d", event->msg_id);
            break;

        case MQTT_EVENT_UNSUBSCRIBED:
            ESP_LOGI(TAG, "MQTT unsubscribed, msg_id=%d", event->msg_id);
            break;

        case MQTT_EVENT_PUBLISHED:
            ESP_LOGD(TAG, "MQTT published, msg_id=%d", event->msg_id);
            break;

        case MQTT_EVENT_DATA:
            ESP_LOGI(TAG, "MQTT data received");
            ESP_LOGI(TAG, "Topic: %.*s", event->topic_len, event->topic);
            ESP_LOGI(TAG, "Data: %.*s", event->data_len, event->data);

            // Check if this is an OTA message
            if (strstr(event->topic, "/ota") != NULL) {
                ESP_LOGI(TAG, "OTA update request received!");

                // Flash purple LEDs to indicate OTA starting
                led_flash(LED_COLOR_PURPLE, 500);

                // Parse JSON payload to get URL
                cJSON *json = cJSON_ParseWithLength(event->data, event->data_len);
                if (json != NULL) {
                    cJSON *url_obj = cJSON_GetObjectItem(json, "url");
                    if (url_obj != NULL && cJSON_IsString(url_obj)) {
                        const char *firmware_url = url_obj->valuestring;
                        ESP_LOGI(TAG, "Firmware URL: %s", firmware_url);

                        // Copy URL string (will be freed by OTA task)
                        char *url_copy = strdup(firmware_url);
                        if (url_copy != NULL) {
                            // Create OTA task with large stack (8KB) to avoid watchdog issues
                            BaseType_t ret = xTaskCreate(
                                ota_task,
                                "ota_task",
                                8192,  // 8KB stack
                                url_copy,
                                5,  // High priority
                                NULL
                            );

                            if (ret != pdPASS) {
                                ESP_LOGE(TAG, "Failed to create OTA task!");
                                led_flash(LED_COLOR_RED, 1000);
                                free(url_copy);
                            } else {
                                ESP_LOGI(TAG, "OTA task created successfully");
                            }
                        } else {
                            ESP_LOGE(TAG, "Failed to allocate memory for OTA URL");
                            led_flash(LED_COLOR_RED, 500);
                        }
                    } else {
                        ESP_LOGE(TAG, "OTA message missing 'url' field");
                        led_flash(LED_COLOR_RED, 500);
                    }
                    cJSON_Delete(json);
                } else {
                    ESP_LOGE(TAG, "Failed to parse OTA JSON");
                    led_flash(LED_COLOR_RED, 500);
                }
            }
            break;

        case MQTT_EVENT_ERROR:
            ESP_LOGE(TAG, "MQTT error event");
            if (event->error_handle->error_type == MQTT_ERROR_TYPE_TCP_TRANSPORT) {
                ESP_LOGE(TAG, "Last error code reported from esp-tls: 0x%x", event->error_handle->esp_tls_last_esp_err);
                ESP_LOGE(TAG, "Last tls stack error number: 0x%x", event->error_handle->esp_tls_stack_err);
                ESP_LOGE(TAG, "Last captured errno : %d (%s)", event->error_handle->esp_transport_sock_errno,
                         strerror(event->error_handle->esp_transport_sock_errno));
            } else if (event->error_handle->error_type == MQTT_ERROR_TYPE_CONNECTION_REFUSED) {
                ESP_LOGE(TAG, "Connection refused error: 0x%x", event->error_handle->connect_return_code);
            } else {
                ESP_LOGW(TAG, "Unknown error type: 0x%x", event->error_handle->error_type);
            }
            break;

        default:
            ESP_LOGD(TAG, "MQTT event id: %d", event->event_id);
            break;
    }
}

/**
 * @brief Load MQTT broker URI from NVS
 */
static esp_err_t load_mqtt_uri(char *uri, size_t uri_len)
{
    nvs_handle_t nvs_handle;
    esp_err_t err = nvs_open(NVS_NAMESPACE, NVS_READONLY, &nvs_handle);

    if (err == ESP_OK) {
        size_t required_size = uri_len;
        err = nvs_get_str(nvs_handle, NVS_KEY_MQTT_URI, uri, &required_size);
        nvs_close(nvs_handle);
    }

    if (err != ESP_OK) {
        // Fall back to config.h default
        ESP_LOGW(TAG, "Using default MQTT URI from config.h");
        strncpy(uri, MQTT_BROKER_URI, uri_len - 1);
        uri[uri_len - 1] = '\0';
        return ESP_OK;  // Not an error, just using defaults
    }

    ESP_LOGI(TAG, "Loaded MQTT URI from NVS");
    return ESP_OK;
}

/**
 * @brief Heartbeat timer callback
 */
static void heartbeat_timer_callback(TimerHandle_t xTimer)
{
    mqtt_send_heartbeat();
}

esp_err_t mqtt_app_start(void)
{
    // Load MQTT URI
    char mqtt_uri[128] = {0};
    load_mqtt_uri(mqtt_uri, sizeof(mqtt_uri));

    ESP_LOGI(TAG, "Connecting to MQTT broker: %s", mqtt_uri);

    // Configure MQTT client
    esp_mqtt_client_config_t mqtt_cfg = {
        .broker.address.uri = mqtt_uri,
        .buffer.size = MQTT_BUFFER_SIZE,
        .buffer.out_size = MQTT_BUFFER_SIZE,
    };

    s_mqtt_client = esp_mqtt_client_init(&mqtt_cfg);
    if (s_mqtt_client == NULL) {
        ESP_LOGE(TAG, "Failed to initialize MQTT client");
        return ESP_FAIL;
    }

    // Register event handler
    esp_err_t err = esp_mqtt_client_register_event(s_mqtt_client, ESP_EVENT_ANY_ID, mqtt_event_handler, NULL);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to register MQTT event handler: %s", esp_err_to_name(err));
        return err;
    }

    // Start MQTT client
    err = esp_mqtt_client_start(s_mqtt_client);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to start MQTT client: %s", esp_err_to_name(err));
        return err;
    }

    ESP_LOGI(TAG, "MQTT client started");

    // Create heartbeat timer (30 second interval)
    s_heartbeat_timer = xTimerCreate("heartbeat",
                                     pdMS_TO_TICKS(HEARTBEAT_INTERVAL_MS),
                                     pdTRUE,  // Auto-reload
                                     NULL,
                                     heartbeat_timer_callback);

    if (s_heartbeat_timer != NULL) {
        xTimerStart(s_heartbeat_timer, 0);
        ESP_LOGI(TAG, "Heartbeat timer started");
    } else {
        ESP_LOGE(TAG, "Failed to create heartbeat timer");
    }

    return ESP_OK;
}

esp_err_t mqtt_publish_button_press(const char *button, const char *press_type)
{
    if (s_mqtt_client == NULL || !s_is_connected) {
        ESP_LOGW(TAG, "MQTT not connected, cannot publish button press");
        return ESP_FAIL;
    }

    // Create JSON object
    cJSON *root = cJSON_CreateObject();
    if (root == NULL) {
        ESP_LOGE(TAG, "Failed to create JSON object");
        return ESP_FAIL;
    }

    // Add fields
    cJSON_AddStringToObject(root, "device_id", wifi_get_device_id());
    cJSON_AddStringToObject(root, "button", button);
    cJSON_AddStringToObject(root, "pressType", press_type);
    cJSON_AddNumberToObject(root, "battery", get_battery_percentage());
    cJSON_AddNumberToObject(root, "rssi", wifi_get_rssi());
    cJSON_AddStringToObject(root, "firmwareVersion", FIRMWARE_VERSION);
    cJSON_AddNumberToObject(root, "timestamp", get_timestamp_ms());
    cJSON_AddNumberToObject(root, "sequenceNumber", s_sequence_number++);

    // Convert to string
    char *json_str = cJSON_PrintUnformatted(root);
    cJSON_Delete(root);

    if (json_str == NULL) {
        ESP_LOGE(TAG, "Failed to serialize JSON");
        return ESP_FAIL;
    }

    // Build topic
    char topic[128];
    snprintf(topic, sizeof(topic), MQTT_TOPIC_BUTTON_FMT, wifi_get_device_id());

    // Publish
    int msg_id = esp_mqtt_client_publish(s_mqtt_client, topic, json_str, 0, 1, 0);

    ESP_LOGI(TAG, "Published button press: %s/%s (msg_id=%d)", button, press_type, msg_id);
    ESP_LOGD(TAG, "Payload: %s", json_str);

    free(json_str);

    return (msg_id >= 0) ? ESP_OK : ESP_FAIL;
}

esp_err_t mqtt_publish_voice(const uint8_t *audio_data, size_t len, float duration)
{
    if (s_mqtt_client == NULL || !s_is_connected) {
        ESP_LOGW(TAG, "MQTT not connected, cannot publish voice");
        return ESP_FAIL;
    }

    if (audio_data == NULL || len == 0) {
        ESP_LOGE(TAG, "Invalid audio data");
        return ESP_ERR_INVALID_ARG;
    }

    // Encode audio to base64
    char *encoded_audio = base64_encode(audio_data, len);
    if (encoded_audio == NULL) {
        return ESP_FAIL;
    }

    // Create JSON object
    cJSON *root = cJSON_CreateObject();
    if (root == NULL) {
        ESP_LOGE(TAG, "Failed to create JSON object");
        free(encoded_audio);
        return ESP_FAIL;
    }

    // Add fields
    cJSON_AddStringToObject(root, "device_id", wifi_get_device_id());
    cJSON_AddStringToObject(root, "button", "main");
    cJSON_AddStringToObject(root, "pressType", "voice");
    cJSON_AddNumberToObject(root, "duration", duration);
    cJSON_AddStringToObject(root, "format", "adpcm");
    cJSON_AddNumberToObject(root, "sampleRate", AUDIO_SAMPLE_RATE);
    cJSON_AddStringToObject(root, "audioData", encoded_audio);
    cJSON_AddNumberToObject(root, "timestamp", get_timestamp_ms());
    cJSON_AddNumberToObject(root, "sequenceNumber", s_sequence_number++);

    // Convert to string
    char *json_str = cJSON_PrintUnformatted(root);
    cJSON_Delete(root);
    free(encoded_audio);

    if (json_str == NULL) {
        ESP_LOGE(TAG, "Failed to serialize JSON");
        return ESP_FAIL;
    }

    // Build topic
    char topic[128];
    snprintf(topic, sizeof(topic), MQTT_TOPIC_VOICE_FMT, wifi_get_device_id());

    // Calculate JSON length
    size_t json_len = strlen(json_str);
    ESP_LOGI(TAG, "Voice message JSON size: %zu bytes (audio: %zu bytes)", json_len, len);

    // Publish with explicit length to support large payloads
    int msg_id = esp_mqtt_client_publish(s_mqtt_client, topic, json_str, json_len, 1, 0);

    ESP_LOGI(TAG, "Published voice message: %.2fs, %zu bytes audio, %zu bytes JSON (msg_id=%d)",
             duration, len, json_len, msg_id);

    free(json_str);

    return (msg_id >= 0) ? ESP_OK : ESP_FAIL;
}

esp_err_t mqtt_register_device(void)
{
    if (s_mqtt_client == NULL || !s_is_connected) {
        ESP_LOGW(TAG, "MQTT not connected, cannot register device");
        return ESP_FAIL;
    }

    // Create JSON object
    cJSON *root = cJSON_CreateObject();
    if (root == NULL) {
        ESP_LOGE(TAG, "Failed to create JSON object");
        return ESP_FAIL;
    }

    // Add device info
    cJSON_AddStringToObject(root, "deviceId", wifi_get_device_id());
    cJSON_AddStringToObject(root, "type", "smart_button");
    cJSON_AddStringToObject(root, "name", "OBEDIO Smart Button");
    cJSON_AddStringToObject(root, "firmwareVersion", FIRMWARE_VERSION);
    cJSON_AddStringToObject(root, "hardwareVersion", HARDWARE_VERSION);
    cJSON_AddStringToObject(root, "macAddress", wifi_get_mac_address());
    cJSON_AddStringToObject(root, "ipAddress", wifi_get_ip_address());
    cJSON_AddNumberToObject(root, "rssi", wifi_get_rssi());

    // Add capabilities
    cJSON *capabilities = cJSON_CreateObject();
    if (capabilities != NULL) {
        cJSON_AddBoolToObject(capabilities, "button", true);
        cJSON_AddBoolToObject(capabilities, "led", true);
        cJSON_AddBoolToObject(capabilities, "accelerometer", true);
        cJSON_AddItemToObject(root, "capabilities", capabilities);
    }

    // Convert to string
    char *json_str = cJSON_PrintUnformatted(root);
    cJSON_Delete(root);

    if (json_str == NULL) {
        ESP_LOGE(TAG, "Failed to serialize JSON");
        return ESP_FAIL;
    }

    // Publish to registration topic
    int msg_id = esp_mqtt_client_publish(s_mqtt_client, MQTT_TOPIC_REGISTER, json_str, 0, 1, 0);

    ESP_LOGI(TAG, "Published device registration (msg_id=%d)", msg_id);
    ESP_LOGD(TAG, "Payload: %s", json_str);

    free(json_str);

    return (msg_id >= 0) ? ESP_OK : ESP_FAIL;
}

esp_err_t mqtt_send_heartbeat(void)
{
    if (s_mqtt_client == NULL || !s_is_connected) {
        ESP_LOGD(TAG, "MQTT not connected, skipping heartbeat");
        return ESP_FAIL;
    }

    // Create JSON object
    cJSON *root = cJSON_CreateObject();
    if (root == NULL) {
        ESP_LOGE(TAG, "Failed to create JSON object");
        return ESP_FAIL;
    }

    // Add fields
    cJSON_AddStringToObject(root, "deviceId", wifi_get_device_id());
    cJSON_AddNumberToObject(root, "timestamp", get_timestamp_ms());
    cJSON_AddNumberToObject(root, "uptime", get_uptime_ms());
    cJSON_AddNumberToObject(root, "rssi", wifi_get_rssi());
    cJSON_AddNumberToObject(root, "battery", get_battery_percentage());

    // Convert to string
    char *json_str = cJSON_PrintUnformatted(root);
    cJSON_Delete(root);

    if (json_str == NULL) {
        ESP_LOGE(TAG, "Failed to serialize JSON");
        return ESP_FAIL;
    }

    // Publish to heartbeat topic
    int msg_id = esp_mqtt_client_publish(s_mqtt_client, MQTT_TOPIC_HEARTBEAT, json_str, 0, 0, 0);

    ESP_LOGD(TAG, "Published heartbeat (msg_id=%d)", msg_id);

    free(json_str);

    return (msg_id >= 0) ? ESP_OK : ESP_FAIL;
}

bool mqtt_is_connected(void)
{
    return s_is_connected;
}

esp_err_t mqtt_app_stop(void)
{
    if (s_heartbeat_timer != NULL) {
        xTimerStop(s_heartbeat_timer, 0);
        xTimerDelete(s_heartbeat_timer, 0);
        s_heartbeat_timer = NULL;
    }

    if (s_mqtt_client != NULL) {
        esp_mqtt_client_stop(s_mqtt_client);
        esp_mqtt_client_destroy(s_mqtt_client);
        s_mqtt_client = NULL;
    }

    s_is_connected = false;
    ESP_LOGI(TAG, "MQTT client stopped");

    return ESP_OK;
}
