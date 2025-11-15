/**
 * OBEDIO - T-Watch S3 Display Firmware
 *
 * Features:
 * - WiFi + MQTT connection
 * - Display service requests on TFT screen
 * - Vibration alerts
 * - Touch button to acknowledge
 *
 * Hardware: LilyGO T-Watch S3
 * Display: ST7789V 240x240 TFT
 * Touch: CST816S I2C
 * Vibration: Motor on GPIO 4
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <TFT_eSPI.h>
#include <ArduinoJson.h>
#include <Wire.h>

// WiFi credentials
const char* WIFI_SSID = "ALHN-B38A";
const char* WIFI_PASSWORD = "96305619";

// MQTT Broker
const char* MQTT_BROKER = "192.168.5.152";
const int MQTT_PORT = 1883;

// Device Info
const char* DEVICE_TYPE = "watch";
const char* DEVICE_NAME = "T-Watch Display";
const char* FIRMWARE_VERSION = "v0.2-display";
const char* HARDWARE_VERSION = "LilyGO T-Watch S3";

// Hardware pins
#define VIBRATION_PIN 4
#define BACKLIGHT_PIN 38
#define TOUCH_SDA 39
#define TOUCH_SCL 40
#define TOUCH_INT 14
#define TOUCH_RST 13
#define TOUCH_ADDR 0x15

// Display
TFT_eSPI tft = TFT_eSPI();

// Touch state
bool touchAvailable = false;
int touchX = 0;
int touchY = 0;

// MQTT Topics
const char* TOPIC_REGISTER = "obedio/device/register";
const char* TOPIC_HEARTBEAT = "obedio/device/heartbeat";
String TOPIC_NOTIFICATION; // Will be set to "obedio/watch/{deviceId}/notification"
String TOPIC_ACKNOWLEDGE;  // Will be set to "obedio/watch/{deviceId}/acknowledge"

// MQTT Client
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

// Device state
String deviceId = "";
String macAddress = "";
bool isRegistered = false;
unsigned long lastHeartbeat = 0;
const unsigned long HEARTBEAT_INTERVAL = 30000; // 30 seconds

// Notification state
bool hasNotification = false;
String currentRequestId = "";
String currentRequest = "";
String currentLocation = "";
String currentTime = "";
String currentPriority = "normal";

// Display colors
#define BG_COLOR TFT_BLACK
#define TEXT_COLOR TFT_WHITE
#define ACCENT_COLOR 0x07E0  // Green
#define ALERT_COLOR TFT_RED
#define STATUS_COLOR 0x7BEF  // Light gray

// ============================================================================
// SETUP
// ============================================================================

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n===========================================");
  Serial.println("OBEDIO T-Watch Display");
  Serial.println("===========================================\n");

  // Initialize hardware
  Serial.println("🔧 Setting up vibration pin...");
  pinMode(VIBRATION_PIN, OUTPUT);
  digitalWrite(VIBRATION_PIN, LOW);

  Serial.println("💡 Turning on backlight...");
  pinMode(BACKLIGHT_PIN, OUTPUT);
  digitalWrite(BACKLIGHT_PIN, HIGH); // Turn on backlight
  Serial.println("✅ Backlight ON!");

  // Initialize touch
  Serial.println("👆 Initializing touch...");
  Wire.begin(TOUCH_SDA, TOUCH_SCL);
  pinMode(TOUCH_RST, OUTPUT);
  digitalWrite(TOUCH_RST, LOW);
  delay(10);
  digitalWrite(TOUCH_RST, HIGH);
  delay(50);

  // Initialize display
  Serial.println("📺 Initializing display...");
  tft.init();
  Serial.println("✅ TFT init complete!");

  tft.setRotation(0); // Portrait mode
  Serial.println("✅ Rotation set!");

  tft.fillScreen(BG_COLOR);
  Serial.println("✅ Screen cleared!");

  tft.setTextColor(TEXT_COLOR, BG_COLOR);
  Serial.println("✅ Text color set!");

  Serial.println("📺 Showing startup screen...");
  showStartupScreen();
  Serial.println("✅ Startup screen shown!");

  // Connect to WiFi
  connectWiFi();

  // Generate Device ID from MAC address
  generateDeviceId();

  // Show device info on screen
  showDeviceInfo();
  delay(2000);

  // Connect to MQTT
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setBufferSize(1024);
  mqttClient.setCallback(mqttCallback);
  connectMQTT();

  // Register device
  registerDevice();

  // Show ready screen
  showReadyScreen();
}

// ============================================================================
// MAIN LOOP
// ============================================================================

void loop() {
  // Maintain MQTT connection
  if (!mqttClient.connected()) {
    connectMQTT();
  }
  mqttClient.loop();

  // Send heartbeat
  if (millis() - lastHeartbeat > HEARTBEAT_INTERVAL) {
    sendHeartbeat();
    lastHeartbeat = millis();
  }

  // Check for touch input
  if (hasNotification) {
    if (readTouch()) {
      // User tapped screen while notification is active
      acknowledgeNotification();
      hasNotification = false;
      showReadyScreen();
    }
  }

  delay(10);
}

// ============================================================================
// WIFI CONNECTION
// ============================================================================

void connectWiFi() {
  Serial.println("\n📶 Connecting to WiFi...");
  showStatus("Connecting WiFi...", false);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("MAC Address: ");
    Serial.println(WiFi.macAddress());
    Serial.print("Signal Strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");

    showStatus("WiFi Connected", false);
  } else {
    Serial.println("\n❌ WiFi connection failed!");
    showStatus("WiFi Failed!", true);
    delay(5000);
    ESP.restart();
  }
}

// ============================================================================
// DEVICE ID GENERATION
// ============================================================================

void generateDeviceId() {
  // Get MAC address using WiFi library (Arduino-compatible)
  String mac = WiFi.macAddress();
  macAddress = mac;

  // Remove colons from MAC address (AA:BB:CC:DD:EE:FF -> AABBCCDDEEFF)
  mac.replace(":", "");

  deviceId = "TWATCH-" + mac;

  // Set MQTT topics
  TOPIC_NOTIFICATION = "obedio/watch/" + deviceId + "/notification";
  TOPIC_ACKNOWLEDGE = "obedio/watch/" + deviceId + "/acknowledge";

  Serial.println("\n📱 Device Information:");
  Serial.println("Device ID: " + deviceId);
  Serial.println("MAC Address: " + macAddress);
  Serial.println("Notification Topic: " + TOPIC_NOTIFICATION);
  Serial.println("Acknowledge Topic: " + TOPIC_ACKNOWLEDGE);
}

// ============================================================================
// MQTT CONNECTION
// ============================================================================

void connectMQTT() {
  Serial.println("\n📡 Connecting to MQTT broker...");
  showStatus("Connecting MQTT...", false);

  String clientId = "twatch-" + deviceId;

  int attempts = 0;
  while (!mqttClient.connected() && attempts < 5) {
    Serial.print("Attempting MQTT connection... ");

    if (mqttClient.connect(clientId.c_str())) {
      Serial.println("✅ MQTT connected!");
      showStatus("MQTT Connected", false);

      // Subscribe to notification topic
      String topic = TOPIC_NOTIFICATION;
      mqttClient.subscribe(topic.c_str());
      Serial.println("📥 Subscribed to: " + topic);

    } else {
      Serial.print("❌ Failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" - Retrying in 2 seconds...");
      delay(2000);
      attempts++;
    }
  }

  if (!mqttClient.connected()) {
    Serial.println("❌ MQTT connection failed after 5 attempts!");
    showStatus("MQTT Failed!", true);
    delay(5000);
    ESP.restart();
  }
}

// ============================================================================
// MQTT CALLBACK
// ============================================================================

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.println("\n📥 MQTT message received!");
  Serial.print("Topic: ");
  Serial.println(topic);

  // Parse JSON payload
  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, payload, length);

  if (error) {
    Serial.print("❌ JSON parse error: ");
    Serial.println(error.c_str());
    return;
  }

  // Print received message
  serializeJsonPretty(doc, Serial);
  Serial.println();

  // Handle notification
  if (String(topic) == TOPIC_NOTIFICATION) {
    handleNotification(doc);
  }
}

// ============================================================================
// NOTIFICATION HANDLER
// ============================================================================

void handleNotification(JsonDocument& doc) {
  Serial.println("🔔 Processing notification...");

  // Extract notification data
  const char* requestId = doc["requestId"] | "";
  const char* type = doc["type"] | "unknown";
  const char* title = doc["title"] | "Service Request";
  const char* message = doc["message"] | "";
  const char* location = doc["location"] | "Unknown";
  const char* priority = doc["priority"] | "normal";

  Serial.println("Request ID: " + String(requestId));
  Serial.println("Type: " + String(type));
  Serial.println("Title: " + String(title));
  Serial.println("Message: " + String(message));
  Serial.println("Location: " + String(location));
  Serial.println("Priority: " + String(priority));

  // Store notification
  currentRequestId = String(requestId);
  currentRequest = String(message);
  currentLocation = String(location);
  currentTime = getTimeString();
  currentPriority = String(priority);
  hasNotification = true;

  // Show notification on display
  showNotification(String(title), String(message), String(location), String(priority));

  // Vibrate
  if (String(priority) == "urgent") {
    vibratePattern(3); // 3 pulses for urgent
  } else {
    vibratePattern(1); // 1 pulse for normal
  }
}

// ============================================================================
// DEVICE REGISTRATION
// ============================================================================

void registerDevice() {
  Serial.println("\n📤 Registering device with backend...");
  showStatus("Registering...", false);

  // Build registration payload
  StaticJsonDocument<512> doc;
  doc["deviceId"] = deviceId;
  doc["type"] = DEVICE_TYPE;
  doc["name"] = DEVICE_NAME;
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["hardwareVersion"] = HARDWARE_VERSION;
  doc["macAddress"] = macAddress;
  doc["ipAddress"] = WiFi.localIP().toString();
  doc["rssi"] = WiFi.RSSI();
  doc["batteryLevel"] = 100; // TODO: Read actual battery level

  String payload;
  serializeJson(doc, payload);

  Serial.println("Payload: " + payload);

  bool success = mqttClient.publish(TOPIC_REGISTER, payload.c_str(), false);

  if (success) {
    Serial.println("✅ Registration message sent!");
    isRegistered = true;
    showStatus("Registered!", false);
  } else {
    Serial.println("❌ Registration failed!");
    showStatus("Registration Failed!", true);
  }
}

// ============================================================================
// HEARTBEAT
// ============================================================================

void sendHeartbeat() {
  if (!isRegistered) return;

  StaticJsonDocument<256> doc;
  doc["deviceId"] = deviceId;
  doc["type"] = DEVICE_TYPE;
  doc["status"] = "online";
  doc["rssi"] = WiFi.RSSI();
  doc["uptime"] = millis() / 1000;
  doc["freeHeap"] = ESP.getFreeHeap();
  doc["batteryLevel"] = 100; // TODO: Read actual battery level

  String payload;
  serializeJson(doc, payload);

  mqttClient.publish(TOPIC_HEARTBEAT, payload.c_str(), false);

  Serial.println("💓 Heartbeat sent (uptime: " + String(millis() / 1000) + "s)");
}

// ============================================================================
// DISPLAY FUNCTIONS
// ============================================================================

void showStartupScreen() {
  tft.fillScreen(BG_COLOR);
  tft.setTextSize(3);
  tft.setTextColor(ACCENT_COLOR);
  tft.setCursor(40, 80);
  tft.println("OBEDIO");

  tft.setTextSize(2);
  tft.setTextColor(TEXT_COLOR);
  tft.setCursor(60, 130);
  tft.println("T-Watch");

  tft.setTextSize(1);
  tft.setTextColor(STATUS_COLOR);
  tft.setCursor(70, 160);
  tft.println(FIRMWARE_VERSION);
}

void showDeviceInfo() {
  tft.fillScreen(BG_COLOR);
  tft.setTextSize(1);
  tft.setTextColor(ACCENT_COLOR);
  tft.setCursor(10, 20);
  tft.println("Device ID:");

  tft.setTextColor(TEXT_COLOR);
  tft.setCursor(10, 40);
  tft.println(deviceId);

  tft.setTextColor(ACCENT_COLOR);
  tft.setCursor(10, 70);
  tft.println("IP Address:");

  tft.setTextColor(TEXT_COLOR);
  tft.setCursor(10, 90);
  tft.println(WiFi.localIP().toString());

  tft.setTextColor(ACCENT_COLOR);
  tft.setCursor(10, 120);
  tft.println("Signal:");

  tft.setTextColor(TEXT_COLOR);
  tft.setCursor(10, 140);
  tft.print(WiFi.RSSI());
  tft.println(" dBm");
}

void showReadyScreen() {
  tft.fillScreen(BG_COLOR);

  // Header
  tft.fillRect(0, 0, 240, 50, ACCENT_COLOR);
  tft.setTextSize(2);
  tft.setTextColor(BG_COLOR);
  tft.setCursor(50, 15);
  tft.println("OBEDIO");

  // Status
  tft.setTextSize(1);
  tft.setTextColor(TEXT_COLOR);
  tft.setCursor(10, 70);
  tft.println("Status: Ready");

  tft.setCursor(10, 90);
  tft.print("Signal: ");
  tft.print(WiFi.RSSI());
  tft.println(" dBm");

  tft.setCursor(10, 110);
  tft.print("Device: ");
  tft.println(deviceId.substring(7, 19)); // Show last 12 chars

  // Footer
  tft.setTextColor(STATUS_COLOR);
  tft.setCursor(40, 220);
  tft.println("Waiting for requests...");
}

void showNotification(String title, String message, String location, String priority) {
  tft.fillScreen(BG_COLOR);

  // Header with priority color
  uint16_t headerColor = (priority == "urgent") ? ALERT_COLOR : ACCENT_COLOR;
  tft.fillRect(0, 0, 240, 50, headerColor);

  tft.setTextSize(2);
  tft.setTextColor(BG_COLOR);
  tft.setCursor(20, 15);
  tft.println(title);

  // Location
  tft.setTextSize(1);
  tft.setTextColor(ACCENT_COLOR);
  tft.setCursor(10, 70);
  tft.println("Location:");

  tft.setTextSize(2);
  tft.setTextColor(TEXT_COLOR);
  tft.setCursor(10, 90);
  tft.println(location);

  // Message
  tft.setTextSize(1);
  tft.setTextColor(ACCENT_COLOR);
  tft.setCursor(10, 130);
  tft.println("Request:");

  tft.setTextSize(1);
  tft.setTextColor(TEXT_COLOR);
  tft.setCursor(10, 150);

  // Word wrap message
  int lineWidth = 0;
  int maxWidth = 220;
  int y = 150;
  String word = "";

  for (int i = 0; i < message.length(); i++) {
    char c = message.charAt(i);
    if (c == ' ' || i == message.length() - 1) {
      if (i == message.length() - 1 && c != ' ') word += c;

      int wordWidth = word.length() * 6; // Approximate char width
      if (lineWidth + wordWidth > maxWidth) {
        y += 15;
        lineWidth = 0;
        tft.setCursor(10, y);
      }
      tft.print(word);
      tft.print(" ");
      lineWidth += wordWidth + 6;
      word = "";
    } else {
      word += c;
    }
  }

  // Time
  tft.setTextColor(STATUS_COLOR);
  tft.setCursor(10, 195);
  tft.print("Time: ");
  tft.println(currentTime);

  // Acknowledge button
  tft.fillRoundRect(40, 210, 160, 25, 5, ACCENT_COLOR);
  tft.setTextColor(BG_COLOR);
  tft.setTextSize(2);
  tft.setCursor(55, 216);
  tft.println("TAP TO ACK");
}

void showStatus(String status, bool isError) {
  tft.fillRect(0, 200, 240, 40, BG_COLOR);
  tft.setTextSize(1);
  tft.setTextColor(isError ? ALERT_COLOR : ACCENT_COLOR);
  tft.setCursor(10, 220);
  tft.println(status);
}

// ============================================================================
// VIBRATION
// ============================================================================

void vibratePattern(int pulses) {
  Serial.println("📳 Vibrating (" + String(pulses) + " pulses)...");

  for (int i = 0; i < pulses; i++) {
    digitalWrite(VIBRATION_PIN, HIGH);
    delay(200);
    digitalWrite(VIBRATION_PIN, LOW);
    delay(200);
  }
}

// ============================================================================
// TOUCH FUNCTIONS
// ============================================================================

bool readTouch() {
  // Read touch data from CST816S
  Wire.beginTransmission(TOUCH_ADDR);
  Wire.write(0x00); // Register address
  if (Wire.endTransmission() != 0) {
    return false; // Touch controller not responding
  }

  Wire.requestFrom(TOUCH_ADDR, 6);
  if (Wire.available() < 6) {
    return false; // Not enough data
  }

  uint8_t data[6];
  for (int i = 0; i < 6; i++) {
    data[i] = Wire.read();
  }

  // Check if touch is detected
  uint8_t gestureID = data[1];
  uint8_t touchPoints = data[2] & 0x0F;

  if (touchPoints > 0) {
    // Touch detected!
    touchX = ((data[3] & 0x0F) << 8) | data[4];
    touchY = ((data[5] & 0x0F) << 8) | data[6];

    Serial.println("👆 Touch detected at: (" + String(touchX) + ", " + String(touchY) + ")");

    // Debounce - wait for touch release
    delay(200);

    return true;
  }

  return false;
}

void acknowledgeNotification() {
  Serial.println("✅ Acknowledging notification...");

  // Send acknowledgement via MQTT
  StaticJsonDocument<256> doc;
  doc["deviceId"] = deviceId;
  doc["requestId"] = currentRequestId;
  doc["timestamp"] = millis();
  doc["action"] = "acknowledged";

  String payload;
  serializeJson(doc, payload);

  bool success = mqttClient.publish(TOPIC_ACKNOWLEDGE.c_str(), payload.c_str(), false);

  if (success) {
    Serial.println("✅ Acknowledgement sent!");

    // Show confirmation on screen
    tft.fillScreen(BG_COLOR);
    tft.setTextSize(3);
    tft.setTextColor(ACCENT_COLOR);
    tft.setCursor(80, 100);
    tft.println("ACK!");

    tft.setTextSize(1);
    tft.setTextColor(TEXT_COLOR);
    tft.setCursor(40, 140);
    tft.println("Request acknowledged");

    delay(1500);
  } else {
    Serial.println("❌ Failed to send acknowledgement!");
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

String getTimeString() {
  unsigned long uptime = millis() / 1000;
  int hours = uptime / 3600;
  int minutes = (uptime % 3600) / 60;
  int seconds = uptime % 60;

  char timeStr[16];
  sprintf(timeStr, "%02d:%02d:%02d", hours, minutes, seconds);
  return String(timeStr);
}
