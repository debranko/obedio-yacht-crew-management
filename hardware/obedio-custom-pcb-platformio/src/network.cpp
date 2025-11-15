/**
 * Network Interface Implementation
 * Handles WiFi and MQTT connections
 */

#include "network.h"
#include "config.h"
#include <ArduinoJson.h>

// ==================== GLOBAL NETWORK OBJECTS ====================

WiFiClient espClient;
PubSubClient mqttClient(espClient);

// ==================== WIFI FUNCTIONS ====================

bool connectWiFi() {
    #if ENABLE_SERIAL_DEBUG
    Serial.printf("Connecting to WiFi: %s\n", WIFI_SSID);
    #endif

    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    unsigned long startTime = millis();
    while (WiFi.status() != WL_CONNECTED) {
        if (millis() - startTime > WIFI_TIMEOUT_MS) {
            #if ENABLE_SERIAL_DEBUG
            Serial.println("❌ WiFi connection timeout!");
            #endif
            return false;
        }

        delay(WIFI_RETRY_DELAY_MS);
        #if ENABLE_SERIAL_DEBUG >= 4
        Serial.print(".");
        #endif
    }

    #if ENABLE_SERIAL_DEBUG
    Serial.println("\n✅ WiFi connected!");
    Serial.printf("IP address: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("Signal strength: %d dBm\n", WiFi.RSSI());
    #endif

    return true;
}

int8_t getWiFiRSSI() {
    return WiFi.RSSI();
}

// ==================== MQTT FUNCTIONS ====================

bool connectMQTT(const String& deviceId) {
    mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
    mqttClient.setBufferSize(MQTT_BUFFER_SIZE);
    mqttClient.setKeepAlive(MQTT_KEEPALIVE_SEC);

    #if ENABLE_SERIAL_DEBUG
    Serial.printf("Connecting to MQTT broker: %s:%d\n", MQTT_BROKER, MQTT_PORT);
    #endif

    String clientId = "obedio-custom-pcb-" + deviceId;

    unsigned long startTime = millis();
    int attempts = 0;
    while (!mqttClient.connected() && attempts < 5) {
        if (millis() - startTime > MQTT_TIMEOUT_MS) {
            #if ENABLE_SERIAL_DEBUG
            Serial.println("❌ MQTT connection timeout!");
            #endif
            return false;
        }

        #if ENABLE_SERIAL_DEBUG
        Serial.printf("Attempt %d: ", attempts + 1);
        #endif

        if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASSWORD)) {
            #if ENABLE_SERIAL_DEBUG
            Serial.println("✅ MQTT connected!");
            #endif
            return true;
        } else {
            #if ENABLE_SERIAL_DEBUG
            Serial.printf("❌ Failed (rc=%d)\n", mqttClient.state());
            #endif
            attempts++;
            delay(2000);
        }
    }

    return false;
}

bool isMQTTConnected() {
    return mqttClient.connected();
}

void mqttLoop() {
    mqttClient.loop();
}

void publishButtonPress(const String& deviceId, const char* button,
                       const char* pressType, uint32_t sequenceNumber) {
    if (!mqttClient.connected()) {
        #if ENABLE_SERIAL_DEBUG
        Serial.println("❌ Cannot publish - MQTT not connected");
        #endif
        return;
    }

    // Create MQTT topic
    char topic[128];
    snprintf(topic, sizeof(topic), MQTT_TOPIC_BUTTON_PRESS_FORMAT, deviceId.c_str());

    // Create JSON payload matching backend specification
    StaticJsonDocument<512> doc;
    doc["deviceId"] = deviceId;
    doc["button"] = button;
    doc["pressType"] = pressType;
    doc["battery"] = BATTERY_LEVEL;
    doc["rssi"] = WiFi.RSSI();
    doc["firmwareVersion"] = FIRMWARE_VERSION;
    doc["timestamp"] = millis();
    doc["sequenceNumber"] = sequenceNumber;

    #if strlen(LOCATION_ID) > 0
    doc["locationId"] = LOCATION_ID;
    #endif

    #if strlen(GUEST_ID) > 0
    doc["guestId"] = GUEST_ID;
    #endif

    // Serialize to string
    String payload;
    serializeJson(doc, payload);

    // Publish to MQTT
    bool published = mqttClient.publish(topic, payload.c_str(), false);

    #if ENABLE_SERIAL_DEBUG
    if (published) {
        Serial.printf("📤 Published: %s (%s)\n", button, pressType);
        #if DEBUG_LEVEL >= 4
        Serial.printf("Topic: %s\n", topic);
        Serial.printf("Payload: %s\n", payload.c_str());
        #endif
    } else {
        Serial.println("❌ Publish failed!");
    }
    #endif
}

void registerDevice(const String& deviceId) {
    if (!mqttClient.connected()) {
        #if ENABLE_SERIAL_DEBUG
        Serial.println("⚠️ Cannot register - MQTT not connected");
        #endif
        return;
    }

    #if ENABLE_SERIAL_DEBUG
    Serial.println("📝 Registering device...");
    #endif

    StaticJsonDocument<768> doc;
    doc["deviceId"] = deviceId;
    doc["type"] = "smart_button";
    doc["name"] = FIRMWARE_NAME;
    doc["firmwareVersion"] = FIRMWARE_VERSION;
    doc["hardwareVersion"] = HARDWARE_VERSION;
    doc["macAddress"] = WiFi.macAddress();
    doc["ipAddress"] = WiFi.localIP().toString();
    doc["rssi"] = WiFi.RSSI();

    #if strlen(LOCATION_ID) > 0
    doc["locationId"] = LOCATION_ID;
    #endif

    #if strlen(GUEST_ID) > 0
    doc["guestId"] = GUEST_ID;
    #endif

    JsonObject cap = doc.createNestedObject("capabilities");
    cap["button"] = true;
    cap["led"] = true;
    #if ENABLE_ACCELEROMETER
    cap["accelerometer"] = true;
    #endif

    String payload;
    serializeJson(doc, payload);

    bool published = mqttClient.publish(MQTT_TOPIC_REGISTER, payload.c_str(), false);

    #if ENABLE_SERIAL_DEBUG
    if (published) {
        Serial.println("✅ Device registered");
    } else {
        Serial.println("❌ Registration failed");
    }
    #endif
}

void sendHeartbeat(const String& deviceId) {
    if (!mqttClient.connected()) {
        return;
    }

    StaticJsonDocument<256> doc;
    doc["deviceId"] = deviceId;
    doc["timestamp"] = millis();
    doc["rssi"] = WiFi.RSSI();
    doc["battery"] = BATTERY_LEVEL;
    doc["uptime"] = millis() / 1000;
    doc["freeHeap"] = ESP.getFreeHeap();

    String payload;
    serializeJson(doc, payload);

    mqttClient.publish(MQTT_TOPIC_HEARTBEAT, payload.c_str(), false);

    #if ENABLE_SERIAL_DEBUG >= 3
    Serial.println("💓 Heartbeat sent");
    #endif
}
