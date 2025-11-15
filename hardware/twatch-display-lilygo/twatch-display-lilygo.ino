/**
 * OBEDIO - T-Watch S3 Firmware WITH DISPLAY
 *
 * Uses LilyGO T-Watch Library for proper hardware initialization
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
 *
 * Required Libraries:
 * - TTGO TWatch Library (LilyGO): https://github.com/Xinyuan-LilyGO/TTGO_TWatch_Library
 * - TFT_eSPI (already included in TWatch Library)
 * - ArduinoJson v7
 * - PubSubClient
 */

// T-Watch model definition for T-Watch S3
#define LILYGO_WATCH_2020_V3

#include <LilyGoWatch.h>       // LilyGO T-Watch Library

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

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
const char* FIRMWARE_VERSION = "v2.0-display";
const char* HARDWARE_VERSION = "LilyGO T-Watch S3";

// MQTT Topics
const char* TOPIC_REGISTER = "obedio/device/register";
const char* TOPIC_HEARTBEAT = "obedio/device/heartbeat";
String TOPIC_NOTIFICATION;
String TOPIC_ACKNOWLEDGE;

// ============================================
// GLOBAL VARIABLES
// ============================================

TTGOClass *watch = nullptr;  // T-Watch instance
TFT_eSPI *tft = nullptr;     // Display instance

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

// Device state
String deviceId = "";
String macAddress = "";
bool isRegistered = false;
unsigned long lastHeartbeat = 0;
const unsigned long HEARTBEAT_INTERVAL = 30000;

// Notification state
bool hasActiveRequest = false;
String currentRequestId = "";
String currentGuest = "";
String currentLocation = "";
String currentPriority = "normal";
unsigned long notificationTime = 0;

// Touch state
bool touched = false;
uint16_t touchX = 0;
uint16_t touchY = 0;

// ============================================
// FORWARD DECLARATIONS
// ============================================

void setupWiFi();
void setupMQTT();
void mqttCallback(char* topic, byte* payload, unsigned int length);
void reconnectMQTT();
void registerDevice();
void sendHeartbeat();
void handleNotification(JsonDocument& doc);
void acknowledgeNotification();
void displayIdle();
void displayNotification();
void displayAcknowledged();
void checkTouch();

// ============================================
// SETUP
// ============================================

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n========================================");
  Serial.println("OBEDIO - T-Watch S3 with Display");
  Serial.println("========================================\n");

  // Initialize T-Watch hardware
  watch = TTGOClass::getWatch();
  watch->begin();

  // Wake up display
  watch->openBL();
  watch->bl->adjust(100);  // Brightness 0-255

  // Get TFT instance
  tft = watch->tft;

  // Initialize display
  tft->setRotation(0);  // Portrait mode
  tft->fillScreen(TFT_BLACK);
  tft->setTextColor(TFT_WHITE, TFT_BLACK);

  // Show splash screen
  tft->setTextSize(2);
  tft->setCursor(60, 100);
  tft->println("OBEDIO");
  tft->setTextSize(1);
  tft->setCursor(50, 130);
  tft->println("T-Watch Display");

  delay(2000);

  // Generate device ID from MAC
  uint8_t mac[6];
  WiFi.macAddress(mac);
  char macStr[13];
  sprintf(macStr, "%02X%02X%02X%02X%02X%02X", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  deviceId = String("TWATCH-") + String(macStr);
  macAddress = String(macStr);

  Serial.print("Device ID: ");
  Serial.println(deviceId);

  // Setup MQTT topics
  TOPIC_NOTIFICATION = "obedio/watch/" + deviceId + "/notification";
  TOPIC_ACKNOWLEDGE = "obedio/watch/" + deviceId + "/acknowledge";

  // Connect WiFi
  setupWiFi();

  // Setup MQTT
  setupMQTT();

  // Register device
  registerDevice();

  // Show idle screen
  displayIdle();

  Serial.println("\n✅ T-Watch ready with display!\n");
}

// ============================================
// MAIN LOOP
// ============================================

void loop() {
  // Keep MQTT connection alive
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();

  // Check for touch input
  checkTouch();

  // Send heartbeat
  unsigned long now = millis();
  if (now - lastHeartbeat > HEARTBEAT_INTERVAL) {
    sendHeartbeat();
    lastHeartbeat = now;
  }

  delay(50);
}

// ============================================
// WIFI
// ============================================

void setupWiFi() {
  Serial.print("Connecting to WiFi");

  tft->fillScreen(TFT_BLACK);
  tft->setTextSize(2);
  tft->setCursor(40, 100);
  tft->println("WiFi...");

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
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());

    tft->fillScreen(TFT_BLACK);
    tft->setTextSize(1);
    tft->setCursor(20, 100);
    tft->println("WiFi Connected");
    tft->setCursor(20, 120);
    tft->print("IP: ");
    tft->println(WiFi.localIP());
    delay(2000);
  } else {
    Serial.println("\n❌ WiFi failed!");
    tft->fillScreen(TFT_RED);
    tft->setTextSize(2);
    tft->setCursor(20, 100);
    tft->setTextColor(TFT_WHITE, TFT_RED);
    tft->println("WiFi FAILED");
  }
}

// ============================================
// MQTT
// ============================================

void setupMQTT() {
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setBufferSize(1024);
  reconnectMQTT();
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("📩 MQTT message on topic: ");
  Serial.println(topic);

  // Parse JSON
  StaticJsonDocument<1024> doc;
  DeserializationError error = deserializeJson(doc, payload, length);

  if (error) {
    Serial.print("❌ JSON parse error: ");
    Serial.println(error.c_str());
    return;
  }

  // Handle notification
  String topicStr = String(topic);
  if (topicStr.indexOf("/notification") > 0) {
    handleNotification(doc);
  }
}

void reconnectMQTT() {
  int attempts = 0;
  while (!mqttClient.connected() && attempts < 5) {
    Serial.print("Connecting to MQTT...");

    String clientId = "TWatch-" + deviceId;

    if (mqttClient.connect(clientId.c_str())) {
      Serial.println(" ✅ Connected!");

      // Subscribe to notification topic
      mqttClient.subscribe(TOPIC_NOTIFICATION.c_str());
      Serial.print("📡 Subscribed to: ");
      Serial.println(TOPIC_NOTIFICATION);

    } else {
      Serial.print(" ❌ Failed, rc=");
      Serial.println(mqttClient.state());
      attempts++;
      delay(2000);
    }
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
  doc["macAddress"] = macAddress;

  JsonObject capabilities = doc.createNestedObject("capabilities");
  capabilities["display"] = true;
  capabilities["touch"] = true;
  capabilities["wifi"] = true;

  JsonObject network = doc.createNestedObject("network");
  network["wifi"] = true;
  network["rssi"] = WiFi.RSSI();
  network["ip"] = WiFi.localIP().toString();

  String payload;
  serializeJson(doc, payload);

  if (mqttClient.publish(TOPIC_REGISTER.c_str(), payload.c_str())) {
    Serial.println("✅ Device registered!");
    isRegistered = true;
  }
}

void sendHeartbeat() {
  StaticJsonDocument<256> doc;
  doc["deviceId"] = deviceId;
  doc["type"] = DEVICE_TYPE;
  doc["status"] = "online";
  doc["rssi"] = WiFi.RSSI();
  doc["uptime"] = millis() / 1000;
  doc["freeHeap"] = ESP.getFreeHeap();
  doc["batteryLevel"] = 100;  // T-Watch S3 doesn't have battery monitoring easily accessible

  String payload;
  serializeJson(doc, payload);

  mqttClient.publish(TOPIC_HEARTBEAT.c_str(), payload.c_str());
  Serial.println("💓 Heartbeat sent");
}

// ============================================
// NOTIFICATION HANDLING
// ============================================

void handleNotification(JsonDocument& doc) {
  Serial.println("\n🔔 ========================================");
  Serial.println("🔔 NEW SERVICE REQUEST!");
  Serial.println("🔔 ========================================\n");

  currentRequestId = doc["requestId"].as<String>();
  currentGuest = doc["guest"].as<String>();
  currentLocation = doc["location"].as<String>();
  currentPriority = doc["priority"] | "normal";

  Serial.print("Request ID: ");
  Serial.println(currentRequestId);
  Serial.print("Guest: ");
  Serial.println(currentGuest);
  Serial.print("Location: ");
  Serial.println(currentLocation);
  Serial.print("Priority: ");
  Serial.println(currentPriority);

  hasActiveRequest = true;
  notificationTime = millis();

  // Display notification on screen
  displayNotification();

  // If GPIO 14 is LOW, auto-acknowledge (backward compatibility)
  pinMode(14, INPUT_PULLUP);
  if (digitalRead(14) == LOW) {
    delay(100);
    if (digitalRead(14) == LOW) {
      Serial.println("🔘 GPIO 14 LOW - Auto-acknowledging...");
      acknowledgeNotification();
    }
  }

  Serial.println("🔔 ========================================\n");
}

void acknowledgeNotification() {
  if (!hasActiveRequest) {
    Serial.println("⚠️ No active request to acknowledge");
    return;
  }

  Serial.println("\n✅ ========================================");
  Serial.println("✅ ACKNOWLEDGING REQUEST");
  Serial.println("✅ ========================================\n");

  StaticJsonDocument<256> doc;
  doc["deviceId"] = deviceId;
  doc["requestId"] = currentRequestId;
  doc["timestamp"] = millis();
  doc["action"] = "accepted";
  doc["status"] = "in_progress";

  String payload;
  serializeJson(doc, payload);

  if (mqttClient.publish(TOPIC_ACKNOWLEDGE.c_str(), payload.c_str())) {
    Serial.println("✅ Acknowledgement sent!");
    Serial.print("Request ID: ");
    Serial.println(currentRequestId);

    hasActiveRequest = false;

    // Display acknowledged screen
    displayAcknowledged();
    delay(2000);
    displayIdle();
  }

  Serial.println("✅ ========================================\n");
}

// ============================================
// DISPLAY FUNCTIONS
// ============================================

void displayIdle() {
  tft->fillScreen(TFT_BLACK);

  // Header
  tft->setTextSize(2);
  tft->setTextColor(TFT_GREEN, TFT_BLACK);
  tft->setCursor(40, 40);
  tft->println("OBEDIO");

  // Status
  tft->setTextSize(1);
  tft->setTextColor(TFT_WHITE, TFT_BLACK);
  tft->setCursor(60, 80);
  tft->println("T-Watch Ready");

  // Device ID (small)
  tft->setTextColor(TFT_DARKGREY, TFT_BLACK);
  tft->setCursor(20, 200);
  tft->println(deviceId);

  // WiFi status
  tft->setCursor(20, 215);
  tft->print("WiFi: ");
  if (WiFi.status() == WL_CONNECTED) {
    tft->setTextColor(TFT_GREEN, TFT_BLACK);
    tft->println("Connected");
  } else {
    tft->setTextColor(TFT_RED, TFT_BLACK);
    tft->println("Disconnected");
  }
}

void displayNotification() {
  tft->fillScreen(TFT_NAVY);

  // Priority indicator (top bar)
  uint16_t priorityColor = TFT_ORANGE;
  if (currentPriority == "urgent") priorityColor = TFT_ORANGE;
  if (currentPriority == "emergency") priorityColor = TFT_RED;
  tft->fillRect(0, 0, 240, 30, priorityColor);

  // Title
  tft->setTextSize(2);
  tft->setTextColor(TFT_WHITE, priorityColor);
  tft->setCursor(30, 8);
  tft->println("NEW REQUEST");

  // Guest name
  tft->setTextColor(TFT_WHITE, TFT_NAVY);
  tft->setTextSize(2);
  tft->setCursor(20, 60);
  tft->println("Guest:");
  tft->setCursor(20, 85);
  tft->setTextColor(TFT_YELLOW, TFT_NAVY);

  // Truncate guest name if too long
  String guestShort = currentGuest;
  if (guestShort.length() > 15) {
    guestShort = guestShort.substring(0, 15) + "...";
  }
  tft->println(guestShort);

  // Location
  tft->setTextColor(TFT_WHITE, TFT_NAVY);
  tft->setTextSize(2);
  tft->setCursor(20, 120);
  tft->println("Location:");
  tft->setCursor(20, 145);
  tft->setTextColor(TFT_CYAN, TFT_NAVY);

  // Truncate location if too long
  String locationShort = currentLocation;
  if (locationShort.length() > 15) {
    locationShort = locationShort.substring(0, 15) + "...";
  }
  tft->println(locationShort);

  // Accept button (bottom)
  tft->fillRoundRect(40, 190, 160, 40, 10, TFT_GREEN);
  tft->setTextSize(2);
  tft->setTextColor(TFT_BLACK, TFT_GREEN);
  tft->setCursor(65, 202);
  tft->println("ACCEPT");
}

void displayAcknowledged() {
  tft->fillScreen(TFT_GREEN);

  tft->setTextSize(3);
  tft->setTextColor(TFT_WHITE, TFT_GREEN);
  tft->setCursor(50, 100);
  tft->println("ACCEPTED");

  tft->setTextSize(1);
  tft->setCursor(60, 140);
  tft->println("On my way!");
}

// ============================================
// TOUCH INPUT
// ============================================

void checkTouch() {
  if (!hasActiveRequest) return;

  // Get touch data
  if (watch->getTouch(touchX, touchY)) {
    Serial.print("Touch detected at: ");
    Serial.print(touchX);
    Serial.print(", ");
    Serial.println(touchY);

    // Check if touch is in "ACCEPT" button area (bottom of screen)
    if (touchY > 190 && touchY < 230) {
      Serial.println("✅ Accept button touched!");
      acknowledgeNotification();
      delay(300);  // Debounce
    }
  }
}
