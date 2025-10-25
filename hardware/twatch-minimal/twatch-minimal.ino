/**
 * OBEDIO - LilyGO T-Watch S3 - ULTRA MINIMAL (NO DISPLAY)
 *
 * Purpose: Connection test WITHOUT display (TFT_eSPI crashes)
 *
 * What it does:
 * 1. Connects to WiFi (NOVA_1300)
 * 2. Connects to MQTT broker
 * 3. Sends registration message (type: "wearable")
 * 4. Sends heartbeat every 30 seconds
 *
 * NO DISPLAY - only Serial output!
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ==================== HARDCODED CONFIGURATION ====================

// WiFi Credentials
const char* WIFI_SSID = "NOVA_1300";
const char* WIFI_PASSWORD = "need9963";

// MQTT Broker
const char* MQTT_BROKER = "192.168.5.152";
const int MQTT_PORT = 1883;

// Device Info
const char* DEVICE_TYPE = "watch";
const char* DEVICE_NAME = "T-Watch Dev";
const char* FIRMWARE_VERSION = "v0.1-minimal-nodisplay";

// Topics
const char* TOPIC_REGISTER = "obedio/device/register";
const char* TOPIC_HEARTBEAT = "obedio/device/heartbeat";

// Timing
const unsigned long HEARTBEAT_INTERVAL = 30000; // 30 seconds

// ==================== GLOBAL VARIABLES ====================

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

String deviceId = ""; // Will be generated from MAC address
unsigned long lastHeartbeat = 0;
bool isRegistered = false;

// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n========================================");
  Serial.println("OBEDIO - T-Watch Ultra Minimal Test");
  Serial.println("(NO DISPLAY - Serial Only)");
  Serial.println("========================================\n");

  // Connect to WiFi FIRST (needed for MAC address)
  connectWiFi();

  // Generate Device ID from MAC address (AFTER WiFi is initialized)
  generateDeviceId();

  Serial.println("Device ID: " + deviceId);
  Serial.println("Device Type: " + String(DEVICE_TYPE));
  Serial.println("Firmware: " + String(FIRMWARE_VERSION));

  // Connect to MQTT
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setBufferSize(1024); // Increase buffer size from default 256 to 1024 bytes
  mqttClient.setCallback(mqttCallback);
  connectMQTT();

  // Register device
  registerDevice();

  Serial.println("\n✅ Setup complete! Device is connected.\n");
}

// ==================== MAIN LOOP ====================

void loop() {
  // Ensure WiFi connected
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi disconnected! Reconnecting...");
    connectWiFi();
  }

  // Ensure MQTT connected
  if (!mqttClient.connected()) {
    Serial.println("❌ MQTT disconnected! Reconnecting...");
    connectMQTT();
  }

  mqttClient.loop();

  // Send heartbeat
  if (millis() - lastHeartbeat > HEARTBEAT_INTERVAL) {
    sendHeartbeat();
    lastHeartbeat = millis();
  }

  delay(100);
}

// ==================== WiFi FUNCTIONS ====================

void connectWiFi() {
  Serial.println("\n🔌 Connecting to WiFi...");
  Serial.println("SSID: " + String(WIFI_SSID));

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected!");
    Serial.println("IP Address: " + WiFi.localIP().toString());
    Serial.println("RSSI: " + String(WiFi.RSSI()) + " dBm");
  } else {
    Serial.println("\n❌ WiFi connection failed!");
    delay(5000);
    ESP.restart();
  }
}

// ==================== MQTT FUNCTIONS ====================

void connectMQTT() {
  Serial.println("\n🔌 Connecting to MQTT broker...");
  Serial.println("Broker: " + String(MQTT_BROKER) + ":" + String(MQTT_PORT));

  String clientId = "twatch-" + deviceId;

  int attempts = 0;
  while (!mqttClient.connected() && attempts < 5) {
    Serial.println("Attempt " + String(attempts + 1) + "/5...");

    if (mqttClient.connect(clientId.c_str())) {
      Serial.println("✅ MQTT connected!");
      return;
    } else {
      Serial.println("❌ MQTT failed, rc=" + String(mqttClient.state()));
      attempts++;
      delay(2000);
    }
  }

  if (!mqttClient.connected()) {
    Serial.println("❌ MQTT connection failed after 5 attempts!");
    delay(5000);
    ESP.restart();
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.println("\n📥 MQTT message received:");
  Serial.println("Topic: " + String(topic));

  String message = "";
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println("Message: " + message);
}

// ==================== DEVICE REGISTRATION ====================

void registerDevice() {
  Serial.println("\n📤 Registering device with backend...");

  // Check MQTT connection state
  Serial.println("MQTT State: " + String(mqttClient.state()));
  Serial.println("MQTT Connected: " + String(mqttClient.connected()));

  StaticJsonDocument<512> doc;
  doc["deviceId"] = deviceId;
  doc["type"] = DEVICE_TYPE;
  doc["name"] = DEVICE_NAME;
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["hardwareVersion"] = "LilyGO T-Watch S3";
  doc["macAddress"] = WiFi.macAddress();
  doc["ipAddress"] = WiFi.localIP().toString();
  doc["rssi"] = WiFi.RSSI();
  doc["timestamp"] = millis();

  String payload;
  serializeJson(doc, payload);

  Serial.println("Payload: " + payload);
  Serial.println("Payload size: " + String(payload.length()) + " bytes");
  Serial.println("Topic: " + String(TOPIC_REGISTER));

  bool success = mqttClient.publish(TOPIC_REGISTER, payload.c_str(), false);

  if (success) {
    Serial.println("✅ Registration message sent!");
    isRegistered = true;
  } else {
    Serial.println("❌ Registration failed!");
    Serial.println("MQTT State after publish: " + String(mqttClient.state()));
  }
}

void sendHeartbeat() {
  if (!isRegistered) return;

  StaticJsonDocument<256> doc;
  doc["deviceId"] = deviceId;
  doc["type"] = DEVICE_TYPE;
  doc["status"] = "online";
  doc["rssi"] = WiFi.RSSI();
  doc["uptime"] = millis() / 1000;
  doc["freeHeap"] = ESP.getFreeHeap();

  String payload;
  serializeJson(doc, payload);

  bool success = mqttClient.publish(TOPIC_HEARTBEAT, payload.c_str(), false);

  if (success) {
    Serial.println("💓 Heartbeat sent (uptime: " + String(millis() / 1000) + "s)");
  } else {
    Serial.println("❌ Heartbeat failed!");
  }
}

// ==================== UTILITY FUNCTIONS ====================

void generateDeviceId() {
  // Get MAC address using WiFi library (Arduino-compatible)
  String mac = WiFi.macAddress();

  // Remove colons from MAC address (AA:BB:CC:DD:EE:FF -> AABBCCDDEEFF)
  mac.replace(":", "");

  deviceId = "TWATCH-" + mac;
}
