/**
 * OBEDIO - Heltec WiFi LoRa 32 V3 - MINIMAL CONNECTION + BUTTON TEST
 *
 * Purpose: Connect to WiFi, register device, and test button press
 *
 * What it does:
 * 1. Connects to WiFi (NOVA_1300)
 * 2. Connects to MQTT broker
 * 3. Sends registration message
 * 4. Shows status on OLED display
 * 5. Sends heartbeat every 30 seconds
 * 6. Button press creates service request (GPIO0 - built-in USER button)
 * 7. LED feedback on button press (GPIO35 - built-in white LED)
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "heltec.h" // Heltec ESP32 library

// ==================== HARDCODED CONFIGURATION ====================

// WiFi Credentials
const char* WIFI_SSID = "NOVA_1300";
const char* WIFI_PASSWORD = "need9963";

// MQTT Broker
const char* MQTT_BROKER = "192.168.5.152";
const int MQTT_PORT = 1883;

// Device Info
const char* DEVICE_TYPE = "smart_button";
const char* DEVICE_NAME = "Heltec Dev Button";
const char* FIRMWARE_VERSION = "v0.3-button";

// Location assignment (HARDCODED - change this to assign button to specific cabin)
const char* LOCATION_ID = "cmh4h002y000dj7191pezz192"; // Cabin 1
const char* GUEST_ID = "cmh4h004a0016j71923ta3t81";    // Cherry Seaborn

// GPIO Pins
#define BUTTON_PIN 0   // Built-in USER button (active LOW)
#define LED_PIN 35     // Built-in white LED

// Topics
const char* TOPIC_REGISTER = "obedio/device/register";
const char* TOPIC_HEARTBEAT = "obedio/device/heartbeat";
String TOPIC_BUTTON_PRESS = "";  // Will be set dynamically: obedio/button/{deviceId}/press
String TOPIC_COMMAND = "";       // Will be set dynamically: obedio/device/{deviceId}/command

// Timing
const unsigned long HEARTBEAT_INTERVAL = 30000; // 30 seconds
const unsigned long DEBOUNCE_DELAY = 300;       // 300ms debounce

// ==================== GLOBAL VARIABLES ====================

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

String deviceId = ""; // Will be generated from MAC address
unsigned long lastHeartbeat = 0;
bool isRegistered = false;

// Button state
bool lastButtonState = HIGH;  // Button is active LOW
unsigned long lastDebounceTime = 0;
bool buttonPressed = false;

// ==================== SETUP ====================

void setup() {
  // Initialize Heltec board (display, LoRa OFF, serial ON)
  Heltec.begin(
    true,  // DisplayEnable
    false, // LoRa Disable (we don't need it now)
    true,  // Serial Enable
    true,  // PABOOST
    470E6  // LoRa frequency (not used)
  );

  // Clear display
  Heltec.display->clear();
  Heltec.display->setFont(ArialMT_Plain_10);

  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n========================================");
  Serial.println("OBEDIO - Heltec Minimal Connection Test");
  Serial.println("========================================\n");

  // Setup GPIO pins FIRST
  pinMode(BUTTON_PIN, INPUT_PULLUP);  // Built-in USER button
  pinMode(LED_PIN, OUTPUT);           // Built-in LED
  digitalWrite(LED_PIN, LOW);         // LED off initially

  // Show initial screen
  displayText("OBEDIO", 0);
  displayText("Heltec Dev", 12);
  displayText("Connecting WiFi...", 40);
  Heltec.display->display();

  // Connect to WiFi FIRST (needed for MAC address)
  connectWiFi();

  // Generate Device ID from MAC address (AFTER WiFi is initialized)
  generateDeviceId();

  // Set dynamic MQTT topics (AFTER device ID is generated)
  TOPIC_BUTTON_PRESS = "obedio/button/" + deviceId + "/press";
  TOPIC_COMMAND = "obedio/device/" + deviceId + "/command";

  Serial.println("Device ID: " + deviceId);
  Serial.println("Device Type: " + String(DEVICE_TYPE));
  Serial.println("Firmware: " + String(FIRMWARE_VERSION));
  Serial.println("Button: GPIO" + String(BUTTON_PIN));
  Serial.println("LED: GPIO" + String(LED_PIN));

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
    displayText("WiFi Lost!", 40, true);
    connectWiFi();
  }

  // Ensure MQTT connected
  if (!mqttClient.connected()) {
    Serial.println("❌ MQTT disconnected! Reconnecting...");
    displayText("MQTT Lost!", 40, true);
    connectMQTT();
  }

  mqttClient.loop();

  // Check button press (with debounce)
  checkButton();

  // Send heartbeat
  if (millis() - lastHeartbeat > HEARTBEAT_INTERVAL) {
    sendHeartbeat();
    lastHeartbeat = millis();
  }

  delay(10);  // Small delay for stability
}

// ==================== WiFi FUNCTIONS ====================

void connectWiFi() {
  Serial.println("\n🔌 Connecting to WiFi...");
  Serial.println("SSID: " + String(WIFI_SSID));

  displayText("WiFi: " + String(WIFI_SSID), 40, true);

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

    displayText("WiFi: Connected", 40, true);
    displayText("IP: " + WiFi.localIP().toString(), 52, false);
    Heltec.display->display();
    delay(2000);
  } else {
    Serial.println("\n❌ WiFi connection failed!");
    displayText("WiFi: FAILED!", 40, true);
    delay(5000);
    ESP.restart();
  }
}

// ==================== MQTT FUNCTIONS ====================

void connectMQTT() {
  Serial.println("\n🔌 Connecting to MQTT broker...");
  Serial.println("Broker: " + String(MQTT_BROKER) + ":" + String(MQTT_PORT));

  displayText("MQTT: Connecting...", 40, true);

  String clientId = "heltec-" + deviceId;

  int attempts = 0;
  while (!mqttClient.connected() && attempts < 5) {
    Serial.println("Attempt " + String(attempts + 1) + "/5...");

    if (mqttClient.connect(clientId.c_str())) {
      Serial.println("✅ MQTT connected!");

      // Subscribe to command topic (for acknowledgments)
      mqttClient.subscribe(TOPIC_COMMAND.c_str());
      Serial.println("✅ Subscribed to: " + TOPIC_COMMAND);

      displayText("MQTT: Connected", 40, true);
      Heltec.display->display();
      delay(1000);

      return;
    } else {
      Serial.println("❌ MQTT failed, rc=" + String(mqttClient.state()));
      attempts++;
      delay(2000);
    }
  }

  if (!mqttClient.connected()) {
    Serial.println("❌ MQTT connection failed after 5 attempts!");
    displayText("MQTT: FAILED!", 40, true);
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

  // Parse JSON message
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, message);

  if (error) {
    Serial.println("❌ JSON parse error: " + String(error.c_str()));
    return;
  }

  // Handle acknowledgment from backend
  if (doc["command"] == "ack") {
    String requestId = doc["requestId"];
    String status = doc["status"];

    Serial.println("✅ Button press acknowledged!");
    Serial.println("Request ID: " + requestId);
    Serial.println("Status: " + status);

    // Show "Accepted!" on display
    Heltec.display->clear();
    Heltec.display->setFont(ArialMT_Plain_16);
    Heltec.display->drawString(0, 20, "ACCEPTED!");
    Heltec.display->setFont(ArialMT_Plain_10);
    Heltec.display->drawString(0, 45, "Request received");
    Heltec.display->display();

    // Blink LED 3 times
    for (int i = 0; i < 3; i++) {
      digitalWrite(LED_PIN, HIGH);
      delay(200);
      digitalWrite(LED_PIN, LOW);
      delay(200);
    }

    // Restore registered screen after 2 seconds
    delay(2000);
    showRegisteredScreen();
  }
}

// ==================== DEVICE REGISTRATION ====================

void registerDevice() {
  Serial.println("\n📤 Registering device with backend...");

  displayText("Registering...", 40, true);

  StaticJsonDocument<512> doc;
  doc["deviceId"] = deviceId;
  doc["type"] = DEVICE_TYPE;
  doc["name"] = DEVICE_NAME;
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["hardwareVersion"] = "Heltec WiFi LoRa 32 V3";
  doc["macAddress"] = WiFi.macAddress();
  doc["ipAddress"] = WiFi.localIP().toString();
  doc["rssi"] = WiFi.RSSI();
  doc["timestamp"] = millis();

  String payload;
  serializeJson(doc, payload);

  Serial.println("Payload: " + payload);

  bool success = mqttClient.publish(TOPIC_REGISTER, payload.c_str(), false);

  if (success) {
    Serial.println("✅ Registration message sent!");
    isRegistered = true;

    // Show registered screen
    showRegisteredScreen();

  } else {
    Serial.println("❌ Registration failed!");
    displayText("Register: FAILED!", 40, true);
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

// ==================== BUTTON FUNCTIONS ====================

void checkButton() {
  // Read button state (active LOW - pressed = LOW)
  bool reading = digitalRead(BUTTON_PIN);

  // Check if button state changed
  if (reading != lastButtonState) {
    lastDebounceTime = millis();
  }

  // If enough time passed and button is stable
  if ((millis() - lastDebounceTime) > DEBOUNCE_DELAY) {
    // If button is pressed (LOW) and wasn't pressed before
    if (reading == LOW && !buttonPressed) {
      buttonPressed = true;
      handleButtonPress();
    }
    // If button is released (HIGH)
    else if (reading == HIGH && buttonPressed) {
      buttonPressed = false;
    }
  }

  lastButtonState = reading;
}

void handleButtonPress() {
  Serial.println("\n🔘 Button pressed!");

  // Turn LED on
  digitalWrite(LED_PIN, HIGH);

  // Show "Sending..." on display
  Heltec.display->clear();
  Heltec.display->setFont(ArialMT_Plain_16);
  Heltec.display->drawString(0, 20, "BUTTON");
  Heltec.display->drawString(0, 40, "PRESSED!");
  Heltec.display->display();

  // Build MQTT message
  StaticJsonDocument<256> doc;
  doc["deviceId"] = deviceId;
  doc["locationId"] = LOCATION_ID;  // Cabin assignment
  doc["guestId"] = GUEST_ID;        // Guest assignment
  doc["button"] = "main";
  doc["pressType"] = "single";
  doc["battery"] = 100;  // TODO: Read from GPIO1 (VBAT_Read)
  doc["rssi"] = WiFi.RSSI();
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["timestamp"] = millis();
  doc["sequenceNumber"] = millis();  // ESP32 spec compliance

  String payload;
  serializeJson(doc, payload);

  Serial.println("Publishing to: " + TOPIC_BUTTON_PRESS);
  Serial.println("Payload: " + payload);

  // Publish to MQTT
  bool success = mqttClient.publish(TOPIC_BUTTON_PRESS.c_str(), payload.c_str(), false);

  if (success) {
    Serial.println("✅ Button press sent!");

    // Show "Sent!" on display
    Heltec.display->clear();
    Heltec.display->setFont(ArialMT_Plain_16);
    Heltec.display->drawString(0, 20, "SENT!");
    Heltec.display->setFont(ArialMT_Plain_10);
    Heltec.display->drawString(0, 45, "Waiting for ACK...");
    Heltec.display->display();

  } else {
    Serial.println("❌ Button press failed!");

    // Show error on display
    Heltec.display->clear();
    Heltec.display->setFont(ArialMT_Plain_16);
    Heltec.display->drawString(0, 20, "FAILED!");
    Heltec.display->display();

    // Turn LED off
    digitalWrite(LED_PIN, LOW);

    // Restore screen after 2 seconds
    delay(2000);
    showRegisteredScreen();
  }
}

// ==================== UTILITY FUNCTIONS ====================

void generateDeviceId() {
  // Get MAC address using WiFi library (Arduino-compatible)
  String mac = WiFi.macAddress();

  // Remove colons from MAC address (AA:BB:CC:DD:EE:FF -> AABBCCDDEEFF)
  mac.replace(":", "");

  deviceId = "HELTEC-" + mac;
}

void showRegisteredScreen() {
  Heltec.display->clear();
  Heltec.display->setFont(ArialMT_Plain_10);
  displayText("✓ REGISTERED", 0);
  displayText("", 12);
  displayText(DEVICE_NAME, 20);
  displayText("ID: " + deviceId.substring(0, 12), 32);
  displayText("", 44);
  displayText("Press button to test", 52);
  Heltec.display->display();
}

void displayText(String text, int y, bool clearFirst) {
  if (clearFirst) {
    Heltec.display->clear();
    Heltec.display->setFont(ArialMT_Plain_10);
  }

  Heltec.display->drawString(0, y, text);

  if (clearFirst) {
    Heltec.display->display();
  }
}
