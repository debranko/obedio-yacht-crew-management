/**
 * MQTT Handler Implementation
 * Additional MQTT utility functions
 */

#include "mqtt_handler.h"
#include "config.h"

void mqttCallback(char* topic, byte* payload, unsigned int length) {
    // Add subscription message handling here if needed
    // For example: commands from backend, OTA updates, etc.

    #if ENABLE_SERIAL_DEBUG >= 4
    Serial.printf("📥 MQTT message on topic: %s\n", topic);
    #endif
}
