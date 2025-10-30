/**
 * OBEDIO - T-Watch S3 Firmware WITH DISPLAY (SIMPLE VERSION)
 *
 * Direct TFT_eSPI implementation - NO LilyGo library needed!
 *
 * Features:
 * - TFT Display (240x240) showing notifications
 * - Touch button for acknowledge
 * - WiFi + MQTT connection
 * - Service request notifications
 * - Real-time status display
 *
 * Hardware: LilyGO T-Watch S3 (2022 version)
 *
 * IMPORTANT: Before compiling, go to Arduino IDE:
 * Tools -> Board -> ESP32 Arduino -> "ESP32S3 Dev Module"
 * Tools -> PSRAM -> "OPI PSRAM"
 * Tools -> Partition Scheme -> "Huge APP (3MB No OTA/1MB SPIFFS)"
 *
 * Required Libraries:
 * - TFT_eSPI: https://github.com/Bodmer/TFT_eSPI
 * - ArduinoJson v7
 * - PubSubClient
 */

#include <TFT_eSPI.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ============================================
// HARDWARE PIN DEFINITIONS (T-Watch S3)
// ============================================

#define TFT_BL 45        // Backlight
#define TP_INT 14        // Touch interrupt

// ============================================
// CONFIGURATION
// ============================================

// WiFi credentials
const char* WIFI_SSID = "NOVA_1300";
const char* WIFI_PASSWORD = "need9963";

// MQTT Broker
const char* MQTT_BROKER = "192.168.5.152";
const int MQTT_PORT = 1883;

// Device Info
const char* DEVICE_TYPE = "watch";
const char* DEVICE_NAME = "T-Watch OBEDIO";
const char* FIRMWARE_VERSION = "v2.1-simple";
const char* HARDWARE_VERSION = "LilyGO T-Watch S3";

// MQTT Topics
const char* TOPIC_REGISTER = "obedio/device/register";
const char* TOPIC_HEARTBEAT = "obedio/device/heartbeat";
String TOPIC_NOTIFICATION;
String TOPIC_ACKNOWLEDGE;

// Unique Device ID (will be MAC address)
String deviceId;

// ============================================
// GLOBAL OBJECTS
// ============================================

TFT_eSPI tft = TFT_eSPI();
WiFiClient espClient;
PubSubClient mqtt(espClient);

// ============================================
// STATE VARIABLES
// ============================================

bool hasNotification = false;
String currentRequestId = "";
String currentGuest = "";
String currentLocation = "";
String currentPriority = "normal";
unsigned long lastHeartbeat = 0;
const unsigned long HEARTBEAT_INTERVAL = 30000; // 30 seconds

// UI Colors
uint16_t COLOR_BG = TFT_BLACK;
uint16_t COLOR_TEXT = TFT_WHITE;
uint16_t COLOR_NORMAL = 0x041F;    // Dark blue
uint16_t COLOR_URGENT = 0xFD20;    // Orange
uint16_t COLOR_EMERGENCY = 0xF800; // Red
uint16_t COLOR_GREEN = TFT_GREEN;

// ============================================
// DISPLAY FUNCTIONS
// ============================================

void initDisplay() {
  Serial.println("🖥️ Initializing display...");

  // Initialize TFT
  tft.init();
  tft.setRotation(0);
  tft.fillScreen(COLOR_BG);

  // Enable backlight
  pinMode(TFT_BL, OUTPUT);
  digitalWrite(TFT_BL, HIGH);

  Serial.println("✅ Display initialized");
}

void displayIdle() {
  tft.fillScreen(COLOR_BG);
  tft.setTextColor(TFT_WHITE);
  tft.setTextDatum(MC_DATUM);

  // Header
  tft.setTextSize(2);
  tft.drawString("OBEDIO", 120, 40);

  tft.setTextSize(1);
  tft.setTextColor(TFT_DARKGREY);
  tft.drawString("Yacht Service", 120, 70);

  // Status icon
  tft.fillCircle(120, 120, 30, TFT_DARKGREY);
  tft.setTextSize(3);
  tft.setTextColor(TFT_WHITE);
  tft.drawString("W", 120, 120);

  // Bottom text
  tft.setTextSize(1);
  tft.setTextColor(TFT_DARKGREY);
  tft.drawString("Ready for service", 120, 180);
  tft.drawString("Waiting for requests...", 120, 200);
}

void displayNotification() {
  // Get priority color
  uint16_t priorityColor = COLOR_NORMAL;
  if (currentPriority == "urgent") {
    priorityColor = COLOR_URGENT;
  } else if (currentPriority == "emergency") {
    priorityColor = COLOR_EMERGENCY;
  }

  // Clear screen with dark background
  tft.fillScreen(0x0841); // Very dark blue

  // Priority bar at top
  tft.fillRect(0, 0, 240, 40, priorityColor);

  // Title
  tft.setTextColor(TFT_WHITE);
  tft.setTextDatum(MC_DATUM);
  tft.setTextSize(2);
  tft.drawString("NEW REQUEST", 120, 20);

  // Guest name
  tft.setTextSize(2);
  tft.setTextColor(TFT_WHITE);
  tft.drawString("Guest:", 120, 70);
  tft.setTextSize(1);
  tft.drawString(currentGuest.c_str(), 120, 95);

  // Location
  tft.setTextSize(2);
  tft.drawString("Location:", 120, 125);
  tft.setTextSize(1);
  tft.drawString(currentLocation.c_str(), 120, 150);

  // Accept button
  tft.fillRoundRect(40, 190, 160, 40, 10, COLOR_GREEN);
  tft.setTextColor(TFT_BLACK);
  tft.setTextSize(2);
  tft.drawString("ACCEPT", 120, 210);
}

void displayAcknowledged() {
  tft.fillScreen(0x0420); // Dark green

  tft.setTextColor(TFT_WHITE);
  tft.setTextDatum(MC_DATUM);

  // Checkmark
  tft.fillCircle(120, 80, 40, COLOR_GREEN);
  tft.setTextSize(4);
  tft.setTextColor(TFT_BLACK);
  tft.drawString("✓", 120, 80);

  // Text
  tft.setTextSize(2);
  tft.setTextColor(TFT_WHITE);
  tft.drawString("ACCEPTED", 120, 150);

  tft.setTextSize(1);
  tft.drawString("Serving:", 120, 185);
  tft.drawString(currentGuest.c_str(), 120, 205);
}

// ============================================
// TOUCH DETECTION (SIMPLE VERSION)
// ============================================

// For simple version, we'll use a physical button on GPIO 0
// Or use the touch screen interrupt
#define BUTTON_PIN 0

void checkButton() {
  if (digitalRead(BUTTON_PIN) == LOW) { // Button pressed
    delay(50); // Debounce
    if (digitalRead(BUTTON_PIN) == LOW && hasNotification) {
      acknowledgeNotification();
      while (digitalRead(BUTTON_PIN) == LOW); // Wait for release
    }
  }
}

// ============================================
// MQTT FUNCTIONS
// ============================================

void acknowledgeNotification() {
  if (!hasNotification || currentRequestId.isEmpty()) return;

  Serial.println("✅ Acknowledging service request...");

  // Create acknowledge message
  StaticJsonDocument<256> doc;
  doc["requestId"] = currentRequestId;
  doc["action"] = "accept";
  doc["status"] = "acknowledged";
  doc["timestamp"] = millis();

  String message;
  serializeJson(doc, message);

  // Publish acknowledge
  mqtt.publish(TOPIC_ACKNOWLEDGE.c_str(), message.c_str());

  Serial.println("📤 Acknowledge sent");

  // Update display
  displayAcknowledged();

  // Reset notification state after 3 seconds
  delay(3000);
  hasNotification = false;
  currentRequestId = "";
  displayIdle();
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  Serial.printf("📨 MQTT message on topic: %s\n", topic);

  // Parse JSON
  StaticJsonDocument<1024> doc;
  DeserializationError error = deserializeJson(doc, payload, length);

  if (error) {
    Serial.printf("❌ JSON parse error: %s\n", error.c_str());
    return;
  }

  // Handle notification
  if (String(topic) == TOPIC_NOTIFICATION) {
    currentRequestId = doc["requestId"].as<String>();
    currentGuest = doc["guest"].as<String>();
    currentLocation = doc["location"].as<String>();
    currentPriority = doc["priority"].as<String>();

    Serial.printf("🔔 New service request from %s at %s (Priority: %s)\n",
                  currentGuest.c_str(), currentLocation.c_str(), currentPriority.c_str());

    hasNotification = true;
    displayNotification();
  }
}

void registerDevice() {
  Serial.println("📝 Registering device...");

  StaticJsonDocument<512> doc;
  doc["deviceId"] = deviceId;
  doc["type"] = DEVICE_TYPE;
  doc["name"] = DEVICE_NAME;
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["hardwareVersion"] = HARDWARE_VERSION;
  doc["capabilities"]["display"] = true;
  doc["capabilities"]["touch"] = true;
  doc["capabilities"]["notification"] = true;

  String message;
  serializeJson(doc, message);

  mqtt.publish(TOPIC_REGISTER, message.c_str());
  Serial.println("✅ Device registered");
}

void sendHeartbeat() {
  StaticJsonDocument<256> doc;
  doc["deviceId"] = deviceId;
  doc["type"] = DEVICE_TYPE;
  doc["status"] = "online";
  doc["uptime"] = millis();
  doc["hasNotification"] = hasNotification;

  String message;
  serializeJson(doc, message);

  mqtt.publish(TOPIC_HEARTBEAT, message.c_str());
}

void connectMqtt() {
  Serial.println("🔌 Connecting to MQTT broker...");

  while (!mqtt.connected()) {
    String clientId = "TWatch-" + deviceId;

    if (mqtt.connect(clientId.c_str())) {
      Serial.println("✅ MQTT connected");

      // Subscribe to notification topic
      mqtt.subscribe(TOPIC_NOTIFICATION.c_str());
      Serial.printf("✅ Subscribed to: %s\n", TOPIC_NOTIFICATION.c_str());

      // Register device
      registerDevice();
    } else {
      Serial.printf("❌ MQTT connection failed, rc=%d. Retrying in 5s...\n", mqtt.state());
      delay(5000);
    }
  }
}

void connectWiFi() {
  Serial.printf("📶 Connecting to WiFi: %s\n", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected");
    Serial.printf("📍 IP address: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n❌ WiFi connection failed");
  }
}

// ============================================
// SETUP
// ============================================

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n");
  Serial.println("========================================");
  Serial.println("   OBEDIO T-Watch S3 (SIMPLE VERSION)");
  Serial.println("========================================");

  // Initialize button
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  // Initialize display
  initDisplay();
  displayIdle();

  // Get device ID from MAC address
  uint8_t mac[6];
  WiFi.macAddress(mac);
  deviceId = String(mac[0], HEX) + String(mac[1], HEX) +
             String(mac[2], HEX) + String(mac[3], HEX) +
             String(mac[4], HEX) + String(mac[5], HEX);
  deviceId.toUpperCase();

  Serial.printf("🆔 Device ID: %s\n", deviceId.c_str());

  // Setup MQTT topics
  TOPIC_NOTIFICATION = "obedio/watch/" + deviceId + "/notification";
  TOPIC_ACKNOWLEDGE = "obedio/watch/" + deviceId + "/acknowledge";

  // Connect WiFi
  connectWiFi();

  // Setup MQTT
  mqtt.setServer(MQTT_BROKER, MQTT_PORT);
  mqtt.setCallback(onMqttMessage);
  mqtt.setBufferSize(2048);

  // Connect MQTT
  connectMqtt();

  Serial.println("✅ Setup complete - T-Watch ready!");
}

// ============================================
// MAIN LOOP
// ============================================

void loop() {
  // Maintain MQTT connection
  if (!mqtt.connected()) {
    connectMqtt();
  }
  mqtt.loop();

  // Check button
  checkButton();

  // Send heartbeat
  if (millis() - lastHeartbeat > HEARTBEAT_INTERVAL) {
    sendHeartbeat();
    lastHeartbeat = millis();
  }

  delay(10);
}
