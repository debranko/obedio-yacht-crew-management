/*
 * OBEDIO - LilyGO T3-S3 Smart Button
 *
 * Hardware: LilyGO T3-S3 v1.0
 * - ESP32-S3 chip
 * - SSD1306 OLED Display (128x64, I2C)
 * - SX1262/76/80 LoRa module (not used in this version)
 * - Built-in Boot button (GPIO 0)
 *
 * Function: Physical button for guest service requests
 * - Press button to send service request
 * - OLED shows status
 * - Connects via WiFi and MQTT
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <U8g2lib.h>

// ============================================
// HARDWARE CONFIGURATION
// ============================================

// OLED Display (SSD1306, 128x64, I2C)
#define OLED_SDA 18
#define OLED_SCL 17
#define OLED_RST -1  // No reset pin

// Button
#define BUTTON_PIN 0  // Boot button

// ============================================
// DEVICE CONFIGURATION
// ============================================

// WiFi credentials
const char* WIFI_SSID = "NOVA_1300";
const char* WIFI_PASSWORD = "need9963";

// MQTT broker
const char* MQTT_BROKER = "192.168.5.152";
const int MQTT_PORT = 1883;
const char* MQTT_USER = "";
const char* MQTT_PASSWORD = "";

// Device Info
const char* DEVICE_TYPE = "smart_button";
const char* DEVICE_NAME = "T3-S3 Button";
const char* FIRMWARE_VERSION = "v1.0-t3s3";

// Location assignment (HARDCODED - change this to assign button to specific cabin)
const char* LOCATION_ID = "cmh4h002y000dj7191pezz192"; // Cabin 1
const char* GUEST_ID = "cmh4h004a0016j71923ta3t81";    // Cherry Seaborn

// ============================================
// MQTT TOPICS
// ============================================

String deviceId;
String TOPIC_REGISTER;
String TOPIC_HEARTBEAT;
String TOPIC_BUTTON_PRESS;
String TOPIC_STATUS;

// ============================================
// GLOBALS
// ============================================

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);
U8G2_SSD1306_128X64_NONAME_F_HW_I2C display(U8G2_R0, OLED_RST, OLED_SCL, OLED_SDA);

unsigned long lastHeartbeat = 0;
const unsigned long HEARTBEAT_INTERVAL = 30000; // 30 seconds

bool buttonPressed = false;
unsigned long lastButtonPress = 0;
const unsigned long DEBOUNCE_DELAY = 500; // 500ms debounce

// ============================================
// FORWARD DECLARATIONS
// ============================================

void setupWiFi();
void setupMQTT();
void mqttCallback(char* topic, byte* payload, unsigned int length);
void reconnectMQTT();
void registerDevice();
void sendHeartbeat();
void handleButtonPress();
void displayStatus(const char* line1, const char* line2 = "", const char* line3 = "");

// ============================================
// SETUP
// ============================================

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n========================================");
  Serial.println("OBEDIO - LilyGO T3-S3 Smart Button");
  Serial.println("========================================\n");

  // Initialize button
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  // Initialize OLED display
  display.begin();
  display.clearBuffer();
  display.setFont(u8g2_font_ncenB08_tr);
  displayStatus("OBEDIO", "T3-S3 Button", "Starting...");

  // Generate device ID from MAC address
  uint8_t mac[6];
  WiFi.macAddress(mac);
  char macStr[13];
  sprintf(macStr, "%02X%02X%02X%02X%02X%02X", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  deviceId = String("T3S3-") + String(macStr);

  Serial.print("Device ID: ");
  Serial.println(deviceId);

  // Setup MQTT topics
  TOPIC_REGISTER = "obedio/device/register";
  TOPIC_HEARTBEAT = "obedio/device/heartbeat";
  TOPIC_BUTTON_PRESS = "obedio/button/" + deviceId + "/press";
  TOPIC_STATUS = "obedio/button/" + deviceId + "/status";

  // Connect to WiFi
  setupWiFi();

  // Setup MQTT
  setupMQTT();

  // Register device
  registerDevice();

  displayStatus("READY", "Press button", "for service");
  Serial.println("\n✅ Device ready! Press button to test.\n");
}

// ============================================
// MAIN LOOP
// ============================================

void loop() {
  // Maintain MQTT connection
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();

  // Check button (active LOW, pulled up)
  int buttonState = digitalRead(BUTTON_PIN);
  if (buttonState == LOW && !buttonPressed) {
    unsigned long now = millis();
    if (now - lastButtonPress > DEBOUNCE_DELAY) {
      buttonPressed = true;
      lastButtonPress = now;
      handleButtonPress();
    }
  } else if (buttonState == HIGH && buttonPressed) {
    buttonPressed = false;
  }

  // Send heartbeat
  unsigned long now = millis();
  if (now - lastHeartbeat > HEARTBEAT_INTERVAL) {
    sendHeartbeat();
    lastHeartbeat = now;
  }
}

// ============================================
// WiFi FUNCTIONS
// ============================================

void setupWiFi() {
  Serial.print("Connecting to WiFi");
  displayStatus("WiFi", "Connecting...");

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal strength (RSSI): ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");

    displayStatus("WiFi OK", WiFi.localIP().toString().c_str());
    delay(2000);
  } else {
    Serial.println("\n❌ WiFi connection failed!");
    displayStatus("WiFi FAILED", "Check creds");
  }
}

// ============================================
// MQTT FUNCTIONS
// ============================================

void setupMQTT() {
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setBufferSize(1024);
  reconnectMQTT();
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("📩 MQTT message received on topic: ");
  Serial.println(topic);

  char message[length + 1];
  memcpy(message, payload, length);
  message[length] = '\0';

  Serial.print("Payload: ");
  Serial.println(message);
}

void reconnectMQTT() {
  int attempts = 0;
  while (!mqttClient.connected() && attempts < 5) {
    Serial.print("Connecting to MQTT broker...");
    displayStatus("MQTT", "Connecting...");

    String clientId = "T3S3-" + deviceId;

    if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASSWORD)) {
      Serial.println(" ✅ Connected!");
      displayStatus("MQTT OK");
      delay(1000);

      // Subscribe to status topic
      mqttClient.subscribe(TOPIC_STATUS.c_str());
      Serial.print("📡 Subscribed to: ");
      Serial.println(TOPIC_STATUS);

    } else {
      Serial.print(" ❌ Failed, rc=");
      Serial.println(mqttClient.state());
      attempts++;
      delay(2000);
    }
  }
}

// ============================================
// DEVICE REGISTRATION
// ============================================

void registerDevice() {
  Serial.println("\n📝 Registering device with backend...");

  StaticJsonDocument<512> doc;
  doc["deviceId"] = deviceId;
  doc["type"] = DEVICE_TYPE;
  doc["name"] = DEVICE_NAME;
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["locationId"] = LOCATION_ID;
  doc["guestId"] = GUEST_ID;

  JsonObject capabilities = doc.createNestedObject("capabilities");
  capabilities["button"] = true;
  capabilities["display"] = true;
  capabilities["lora"] = true;

  JsonObject network = doc.createNestedObject("network");
  network["wifi"] = true;
  network["ip"] = WiFi.localIP().toString();
  network["rssi"] = WiFi.RSSI();

  String payload;
  serializeJson(doc, payload);

  if (mqttClient.publish(TOPIC_REGISTER.c_str(), payload.c_str(), false)) {
    Serial.println("✅ Device registered!");
    Serial.print("Payload: ");
    Serial.println(payload);
  } else {
    Serial.println("❌ Registration failed!");
  }
}

// ============================================
// HEARTBEAT
// ============================================

void sendHeartbeat() {
  StaticJsonDocument<256> doc;
  doc["deviceId"] = deviceId;
  doc["timestamp"] = millis();
  doc["rssi"] = WiFi.RSSI();
  doc["battery"] = 100; // Not available on T3-S3
  doc["uptime"] = millis() / 1000;

  String payload;
  serializeJson(doc, payload);

  if (mqttClient.publish(TOPIC_HEARTBEAT.c_str(), payload.c_str(), false)) {
    Serial.println("💓 Heartbeat sent");
  }
}

// ============================================
// BUTTON HANDLING
// ============================================

void handleButtonPress() {
  Serial.println("\n🔘 ========================================");
  Serial.println("🔘 BUTTON PRESSED!");
  Serial.println("🔘 ========================================\n");

  displayStatus("BUTTON", "PRESSED!", "Sending...");

  // Build MQTT message
  StaticJsonDocument<256> doc;
  doc["deviceId"] = deviceId;
  doc["locationId"] = LOCATION_ID;  // Cabin assignment
  doc["guestId"] = GUEST_ID;        // Guest assignment
  doc["button"] = "main";
  doc["pressType"] = "single";
  doc["battery"] = 100;
  doc["rssi"] = WiFi.RSSI();
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["timestamp"] = millis();
  doc["sequenceNumber"] = millis();  // ESP32 spec compliance

  String payload;
  serializeJson(doc, payload);

  // Publish to MQTT
  if (mqttClient.publish(TOPIC_BUTTON_PRESS.c_str(), payload.c_str(), false)) {
    Serial.println("✅ Button press sent to backend!");
    Serial.print("Topic: ");
    Serial.println(TOPIC_BUTTON_PRESS);
    Serial.print("Payload: ");
    Serial.println(payload);

    displayStatus("SENT!", "Request", "created");
    delay(2000);
    displayStatus("READY", "Press button", "for service");

  } else {
    Serial.println("❌ Failed to send button press!");
    displayStatus("FAILED!", "Try again");
    delay(2000);
    displayStatus("READY", "Press button", "for service");
  }

  Serial.println("\n🔘 ========================================\n");
}

// ============================================
// DISPLAY FUNCTIONS
// ============================================

void displayStatus(const char* line1, const char* line2, const char* line3) {
  display.clearBuffer();

  // Line 1 - Bold/large
  display.setFont(u8g2_font_ncenB10_tr);
  display.drawStr(0, 15, line1);

  // Line 2 - Normal
  if (strlen(line2) > 0) {
    display.setFont(u8g2_font_ncenB08_tr);
    display.drawStr(0, 35, line2);
  }

  // Line 3 - Small
  if (strlen(line3) > 0) {
    display.setFont(u8g2_font_ncenB08_tr);
    display.drawStr(0, 50, line3);
  }

  display.sendBuffer();
}
