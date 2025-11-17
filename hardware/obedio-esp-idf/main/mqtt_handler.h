/**
 * @file mqtt_handler.h
 * @brief MQTT Handler for OBEDIO Smart Button
 *
 * Manages MQTT connectivity, publishes button events, voice recordings,
 * device registration, and heartbeat messages.
 */

#ifndef MQTT_HANDLER_H
#define MQTT_HANDLER_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>
#include "esp_err.h"

/**
 * @brief Initialize and start MQTT client
 *
 * Loads MQTT broker URI from NVS (falls back to config.h default),
 * establishes connection, and sets up auto-reconnect handling.
 *
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t mqtt_app_start(void);

/**
 * @brief Publish button press event
 *
 * Publishes a button press event to the MQTT broker with device metadata.
 * Topic: obedio/button/{deviceId}/press
 *
 * Format:
 * {
 *   "device_id": "BTN-XXXXXX",
 *   "button": "main|aux1|aux2|aux3|aux4|aux5",
 *   "pressType": "single|double|long|touch|double_touch|shake",
 *   "battery": 85,
 *   "rssi": -45,
 *   "firmwareVersion": "v3.0-esp-idf",
 *   "timestamp": 1699876543210,
 *   "sequenceNumber": 123
 * }
 *
 * @param button Button identifier (e.g., "main", "aux1")
 * @param press_type Press type string (e.g., "single", "double", "long")
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t mqtt_publish_button_press(const char *button, const char *press_type);

/**
 * @brief Publish voice recording
 *
 * Publishes a voice recording to the MQTT broker with audio data encoded in base64.
 * Topic: obedio/button/{deviceId}/voice
 *
 * Format:
 * {
 *   "device_id": "BTN-XXXXXX",
 *   "button": "main",
 *   "pressType": "voice",
 *   "duration": 5.2,
 *   "format": "adpcm",
 *   "sampleRate": 16000,
 *   "audioData": "base64_encoded_audio...",
 *   "timestamp": 1699876543210,
 *   "sequenceNumber": 124
 * }
 *
 * @param audio_data Pointer to audio data buffer
 * @param len Length of audio data in bytes
 * @param duration Recording duration in seconds
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t mqtt_publish_voice(const uint8_t *audio_data, size_t len, float duration);

/**
 * @brief Send device registration message
 *
 * Publishes device registration information to the MQTT broker.
 * Topic: obedio/device/register
 *
 * Format:
 * {
 *   "deviceId": "BTN-XXXXXX",
 *   "type": "smart_button",
 *   "name": "OBEDIO Smart Button",
 *   "firmwareVersion": "v3.0-esp-idf",
 *   "hardwareVersion": "ESP32-S3 Custom PCB v1.0",
 *   "macAddress": "XX:XX:XX:XX:XX:XX",
 *   "ipAddress": "192.168.1.100",
 *   "rssi": -45,
 *   "capabilities": {
 *     "button": true,
 *     "led": true,
 *     "accelerometer": true
 *   }
 * }
 *
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t mqtt_register_device(void);

/**
 * @brief Send heartbeat message
 *
 * Publishes a heartbeat message to the MQTT broker.
 * Topic: obedio/device/heartbeat
 *
 * Format:
 * {
 *   "deviceId": "BTN-XXXXXX",
 *   "timestamp": 1699876543210,
 *   "uptime": 123456,
 *   "rssi": -45,
 *   "battery": 85
 * }
 *
 * Should be called every 30 seconds (HEARTBEAT_INTERVAL_MS).
 *
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t mqtt_send_heartbeat(void);

/**
 * @brief Check if MQTT client is connected
 *
 * @return true if connected to MQTT broker, false otherwise
 */
bool mqtt_is_connected(void);

/**
 * @brief Stop MQTT client
 *
 * Disconnects from the MQTT broker and cleans up resources.
 *
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t mqtt_app_stop(void);

/**
 * @brief Publish Tasmota light toggle command
 *
 * Publishes directly to Tasmota MQTT topic to toggle light.
 * Topic: tasmota_obedio/cmnd/POWER
 * Payload: TOGGLE
 *
 * This is used by the T3 (Light) button to directly control
 * Tasmota devices without going through the backend/frontend.
 *
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t mqtt_publish_tasmota_toggle(void);

/**
 * @brief Publish raw JSON payload to custom topic
 *
 * Publishes a raw JSON string to a specified MQTT topic.
 * Used for custom messages that don't fit standard formats.
 *
 * @param topic MQTT topic (e.g., "obedio/button/BTN-XXX/voice")
 * @param json_payload JSON string payload
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t mqtt_publish_raw(const char *topic, const char *json_payload);

/**
 * @brief Get current LED configuration (RGB and brightness)
 *
 * Retrieves the current LED color and brightness settings from device config.
 *
 * @param r Pointer to store red component (0-255)
 * @param g Pointer to store green component (0-255)
 * @param b Pointer to store blue component (0-255)
 * @param brightness Pointer to store brightness level (0-255)
 */
void mqtt_get_led_config(uint8_t *r, uint8_t *g, uint8_t *b, uint8_t *brightness);

/**
 * @brief Get current long press threshold
 *
 * Retrieves the current long press threshold in milliseconds from device config.
 *
 * @return Long press threshold in milliseconds (200-2000ms, default 700ms)
 */
uint32_t mqtt_get_long_press_threshold(void);

/**
 * @brief Send offline status message before intentional disconnect
 *
 * Publishes an offline status message to the MQTT broker before the device
 * intentionally goes offline (e.g., before OTA reboot, sleep, shutdown).
 *
 * Uses MQTT Last Will and Testament (LWT) pattern:
 * - Topic: obedio/button/{deviceId}/status
 * - LWT message (automatic): {"status": "offline", "reason": "connection_lost"}
 * - Online message (after connect): {"status": "online", ...device info...}
 * - Offline message (before disconnect): {"status": "offline", "reason": "reboot|ota|sleep"}
 *
 * Format:
 * {
 *   "status": "offline",
 *   "deviceId": "BTN-XXXXXX",
 *   "reason": "sleep|reboot|ota|shutdown",
 *   "timestamp": 1699876543210,
 *   "uptime": 123456
 * }
 *
 * @param reason Reason for going offline ("sleep", "reboot", "ota", "shutdown")
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t mqtt_send_offline_status(const char *reason);

#endif // MQTT_HANDLER_H
