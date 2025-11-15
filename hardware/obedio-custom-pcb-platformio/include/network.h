/**
 * Network Interface Header
 * Handles WiFi and MQTT connections
 */

#ifndef NETWORK_H
#define NETWORK_H

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>

// ==================== WIFI FUNCTIONS ====================

/**
 * Connect to WiFi network
 * @return true if connected, false otherwise
 */
bool connectWiFi();

/**
 * Get WiFi signal strength (RSSI)
 * @return RSSI in dBm
 */
int8_t getWiFiRSSI();

// ==================== MQTT FUNCTIONS ====================

/**
 * Connect to MQTT broker
 * @param deviceId Device identifier for client ID
 * @return true if connected, false otherwise
 */
bool connectMQTT(const String& deviceId);

/**
 * Check if MQTT is connected
 * @return true if connected, false otherwise
 */
bool isMQTTConnected();

/**
 * Process MQTT messages (must be called in loop)
 */
void mqttLoop();

/**
 * Publish button press event to MQTT
 * @param deviceId Device identifier
 * @param button Button type (main, aux1-5)
 * @param pressType Press type (single, double, long, shake, voice)
 * @param sequenceNumber Message sequence number
 */
void publishButtonPress(const String& deviceId, const char* button,
                       const char* pressType, uint32_t sequenceNumber);

/**
 * Register device with backend
 * @param deviceId Device identifier
 */
void registerDevice(const String& deviceId);

/**
 * Send heartbeat to backend
 * @param deviceId Device identifier
 */
void sendHeartbeat(const String& deviceId);

// ==================== GLOBAL NETWORK OBJECTS ====================

extern WiFiClient espClient;
extern PubSubClient mqttClient;

#endif // NETWORK_H
