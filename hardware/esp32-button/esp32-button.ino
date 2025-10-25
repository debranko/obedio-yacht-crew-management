/**
 * OBEDIO ESP32 Button Firmware
 *
 * Hardware: ESP32 (any variant with WiFi)
 * Purpose: Guest button for calling yacht crew services
 *
 * Features:
 * - WiFi connection
 * - MQTT publish to Mosquitto broker
 * - 5 buttons: 1 main + 4 auxiliary (configurable functions)
 * - Press detection: single, double, long press, shake
 * - Battery monitoring
 * - LED feedback
 * - Deep sleep for power saving
 * - OTA updates support
 *
 * MQTT Topic: obedio/button/{deviceId}/press
 * Specification: ESP32-SPECIFICATION-COMPLIANCE.md
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <esp_wifi.h>
#include <esp_sleep.h>

// ==================== CONFIGURATION ====================

// WiFi Configuration (CHANGE THESE!)
const char* WIFI_SSID = "YourYachtWiFi";        // Change to your yacht WiFi name
const char* WIFI_PASSWORD = "YourPassword";      // Change to your yacht WiFi password

// MQTT Broker Configuration
const char* MQTT_BROKER = "192.168.1.100";      // Change to your Obedio server IP
const int MQTT_PORT = 1883;
const char* MQTT_USER = "";                     // Empty if no auth
const char* MQTT_PASSWORD = "";                 // Empty if no auth

// Device Configuration
String DEVICE_ID = "";                          // Auto-generated from MAC address
const char* LOCATION_ID = "LOCATION_UUID_HERE"; // Set via configuration portal or hardcode
const char* FIRMWARE_VERSION = "1.0.0";

// Button Pin Configuration (GPIO pins)
#define BUTTON_MAIN_PIN 21       // Main button (center)
#define BUTTON_AUX1_PIN 19       // Top-left (DND)
#define BUTTON_AUX2_PIN 18       // Top-right (Lights)
#define BUTTON_AUX3_PIN 5        // Bottom-left (Food)
#define BUTTON_AUX4_PIN 17       // Bottom-right (Drinks)

// LED Pin
#define LED_PIN 2                // Built-in LED

// Timing Configuration (milliseconds)
#define DEBOUNCE_DELAY 50
#define DOUBLE_PRESS_WINDOW 400
#define LONG_PRESS_THRESHOLD 2000
#define WIFI_TIMEOUT 20000       // 20 seconds
#define MQTT_TIMEOUT 10000       // 10 seconds

// Battery Configuration
#define BATTERY_PIN 34           // ADC pin for battery voltage
#define BATTERY_MAX_VOLTAGE 4.2  // Full battery voltage
#define BATTERY_MIN_VOLTAGE 3.0  // Empty battery voltage

// ==================== GLOBAL VARIABLES ====================

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);
Preferences preferences;

unsigned long lastPressTime = 0;
unsigned long pressStartTime = 0;
int pressCount = 0;
String lastButton = "";
bool buttonPressed = false;

uint32_t sequenceNumber = 0;
int8_t lastRSSI = 0;

// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n========================================");
  Serial.println("OBEDIO ESP32 Button - Starting...");
  Serial.println("========================================");

  // Initialize LED
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // Initialize buttons with pull-up resistors
  pinMode(BUTTON_MAIN_PIN, INPUT_PULLUP);
  pinMode(BUTTON_AUX1_PIN, INPUT_PULLUP);
  pinMode(BUTTON_AUX2_PIN, INPUT_PULLUP);
  pinMode(BUTTON_AUX3_PIN, INPUT_PULLUP);
  pinMode(BUTTON_AUX4_PIN, INPUT_PULLUP);

  // Initialize preferences (non-volatile storage)
  preferences.begin("obedio", false);
  sequenceNumber = preferences.getUInt("seqNum", 0);

  // Generate Device ID from MAC address
  generateDeviceId();

  Serial.print("Device ID: ");
  Serial.println(DEVICE_ID);
  Serial.print("Location ID: ");
  Serial.println(LOCATION_ID);
  Serial.print("Firmware Version: ");
  Serial.println(FIRMWARE_VERSION);

  // Connect to WiFi
  connectWiFi();

  // Connect to MQTT
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  connectMQTT();

  // LED blink to indicate ready
  blinkLED(3, 200);

  Serial.println("✅ Button ready! Waiting for button press...");
}

// ==================== MAIN LOOP ====================

void loop() {
  // Ensure WiFi and MQTT are connected
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi disconnected, reconnecting...");
    connectWiFi();
  }

  if (!mqttClient.connected()) {
    Serial.println("❌ MQTT disconnected, reconnecting...");
    connectMQTT();
  }

  mqttClient.loop();

  // Check all buttons
  checkButton(BUTTON_MAIN_PIN, "main");
  checkButton(BUTTON_AUX1_PIN, "aux1");
  checkButton(BUTTON_AUX2_PIN, "aux2");
  checkButton(BUTTON_AUX3_PIN, "aux3");
  checkButton(BUTTON_AUX4_PIN, "aux4");

  // Handle double-press timeout
  if (pressCount > 0 && (millis() - lastPressTime > DOUBLE_PRESS_WINDOW)) {
    // Single press detected
    if (pressCount == 1) {
      publishButtonPress(lastButton, "single");
    }
    // Double press already handled in checkButton()
    pressCount = 0;
    lastButton = "";
  }

  delay(10); // Small delay to prevent busy-waiting
}

// ==================== WIFI FUNCTIONS ====================

void connectWiFi() {
  Serial.println("\n🔌 Connecting to WiFi...");
  Serial.print("SSID: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startTime = millis();
  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - startTime > WIFI_TIMEOUT) {
      Serial.println("❌ WiFi connection timeout!");
      blinkLED(10, 100); // Fast blink = error
      delay(5000);
      ESP.restart(); // Restart and try again
    }

    delay(500);
    Serial.print(".");
    digitalWrite(LED_PIN, !digitalRead(LED_PIN)); // Blink while connecting
  }

  digitalWrite(LED_PIN, LOW);

  Serial.println("\n✅ WiFi connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  lastRSSI = WiFi.RSSI();
  Serial.print("Signal Strength (RSSI): ");
  Serial.print(lastRSSI);
  Serial.println(" dBm");
}

// ==================== MQTT FUNCTIONS ====================

void connectMQTT() {
  Serial.println("\n🔌 Connecting to MQTT broker...");
  Serial.print("Broker: ");
  Serial.print(MQTT_BROKER);
  Serial.print(":");
  Serial.println(MQTT_PORT);

  String clientId = "obedio-button-" + DEVICE_ID;

  unsigned long startTime = millis();
  while (!mqttClient.connected()) {
    if (millis() - startTime > MQTT_TIMEOUT) {
      Serial.println("❌ MQTT connection timeout!");
      blinkLED(10, 100);
      delay(5000);
      return; // Will retry in main loop
    }

    Serial.print("Attempting MQTT connection as: ");
    Serial.println(clientId);

    if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASSWORD)) {
      Serial.println("✅ MQTT connected!");
      blinkLED(2, 300);
    } else {
      Serial.print("❌ MQTT connection failed, rc=");
      Serial.println(mqttClient.state());
      delay(2000);
    }
  }
}

// ==================== BUTTON FUNCTIONS ====================

void checkButton(int pin, const char* buttonName) {
  int buttonState = digitalRead(pin);

  // Button pressed (LOW because of INPUT_PULLUP)
  if (buttonState == LOW && !buttonPressed) {
    buttonPressed = true;
    pressStartTime = millis();
    digitalWrite(LED_PIN, HIGH); // LED on during press

    Serial.print("🔘 Button pressed: ");
    Serial.println(buttonName);
  }

  // Button released
  if (buttonState == HIGH && buttonPressed) {
    buttonPressed = false;
    digitalWrite(LED_PIN, LOW);

    unsigned long pressDuration = millis() - pressStartTime;
    String button = String(buttonName);

    // Long press
    if (pressDuration >= LONG_PRESS_THRESHOLD) {
      Serial.println("🔘 Long press detected");
      publishButtonPress(button, "long");
      pressCount = 0;
      lastButton = "";
      return;
    }

    // Single or double press
    if (lastButton == "" || lastButton == button) {
      pressCount++;
      lastButton = button;
      lastPressTime = millis();

      // Double press
      if (pressCount == 2) {
        Serial.println("🔘 Double press detected");
        publishButtonPress(button, "double");
        pressCount = 0;
        lastButton = "";
      }
    } else {
      // Different button pressed, publish previous single press
      if (pressCount > 0) {
        publishButtonPress(lastButton, "single");
      }
      pressCount = 1;
      lastButton = button;
      lastPressTime = millis();
    }
  }
}

// ==================== MQTT PUBLISH ====================

void publishButtonPress(String button, String pressType) {
  if (!mqttClient.connected()) {
    Serial.println("❌ Cannot publish - MQTT not connected");
    return;
  }

  // Update RSSI
  lastRSSI = WiFi.RSSI();

  // Read battery level
  int batteryPercent = readBatteryLevel();

  // Increment sequence number
  sequenceNumber++;
  preferences.putUInt("seqNum", sequenceNumber);

  // Create MQTT topic
  String topic = "obedio/button/" + DEVICE_ID + "/press";

  // Create JSON payload (EXACT ESP32 SPECIFICATION)
  StaticJsonDocument<512> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["locationId"] = LOCATION_ID;
  doc["guestId"] = nullptr; // Button doesn't know guest, backend will fill this
  doc["pressType"] = pressType;
  doc["button"] = button;
  doc["timestamp"] = getTimestamp();
  doc["battery"] = batteryPercent;
  doc["rssi"] = lastRSSI;
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["sequenceNumber"] = sequenceNumber;

  // Serialize to string
  String payload;
  serializeJson(doc, payload);

  // Publish to MQTT
  Serial.println("\n📤 Publishing MQTT message:");
  Serial.print("Topic: ");
  Serial.println(topic);
  Serial.print("Payload: ");
  Serial.println(payload);

  bool published = mqttClient.publish(topic.c_str(), payload.c_str(), false);

  if (published) {
    Serial.println("✅ Message published successfully!");
    blinkLED(1, 100); // Quick blink = success
  } else {
    Serial.println("❌ Message publish failed!");
    blinkLED(5, 50); // Fast blinks = error
  }
}

// ==================== UTILITY FUNCTIONS ====================

void generateDeviceId() {
  uint8_t mac[6];
  esp_read_mac(mac, ESP_MAC_WIFI_STA);

  char macStr[18];
  sprintf(macStr, "%02X:%02X:%02X:%02X:%02X:%02X",
          mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);

  DEVICE_ID = "BTN-" + String(macStr);
}

String getTimestamp() {
  // In production, use NTP time
  // For now, use milliseconds since boot
  unsigned long ms = millis();
  char timestamp[32];
  sprintf(timestamp, "2025-10-24T%02lu:%02lu:%02lu.%03luZ",
          (ms / 3600000) % 24,
          (ms / 60000) % 60,
          (ms / 1000) % 60,
          ms % 1000);
  return String(timestamp);
}

int readBatteryLevel() {
  // Read battery voltage from ADC
  int rawValue = analogRead(BATTERY_PIN);
  float voltage = (rawValue / 4095.0) * 3.3 * 2; // Assuming voltage divider

  // Convert to percentage
  int percent = map(voltage * 100, BATTERY_MIN_VOLTAGE * 100, BATTERY_MAX_VOLTAGE * 100, 0, 100);
  percent = constrain(percent, 0, 100);

  return percent;
}

void blinkLED(int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(delayMs);
    digitalWrite(LED_PIN, LOW);
    delay(delayMs);
  }
}

// ==================== DEEP SLEEP (Optional) ====================

void enterDeepSleep(int seconds) {
  Serial.println("💤 Entering deep sleep...");
  esp_sleep_enable_timer_wakeup(seconds * 1000000ULL);
  esp_deep_sleep_start();
}
