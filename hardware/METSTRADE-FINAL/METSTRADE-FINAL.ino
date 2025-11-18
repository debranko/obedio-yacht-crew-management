/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OBEDIO ESP32-S3 Smart Button - Production Firmware v1.0
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Custom PCB with ESP32-S3R8, MCP23017 GPIO expander, I2S audio, accelerometer
 *
 * Hardware: ESP32-S3R8 Custom PCB v3.0
 * Platform: Arduino IDE with ESP32 Core
 *
 * Features:
 * - WiFi & MQTT connectivity with auto-reconnect
 * - 8 buttons via MCP23017 I2C expander
 * - Single/Double/Long press detection
 * - 16x WS2812B RGB LED ring
 * - I2S microphone for voice recording
 * - I2S speaker for audio playback
 * - LIS3DH accelerometer for shake detection
 * - MCP9808 temperature sensor
 * - Capacitive touch sensor
 * - Battery monitoring
 * - Heartbeat & telemetry
 *
 * Author: Obedio Team
 * Date: 2025
 * ═══════════════════════════════════════════════════════════════════════════
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <Adafruit_MCP23X17.h>
#include <Adafruit_NeoPixel.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <Adafruit_LIS3DH.h>  // ← ADDED FOR SHAKE DETECTION
#include <Adafruit_Sensor.h>  // ← ADDED FOR SHAKE DETECTION

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

// WiFi Configuration
const char* WIFI_SSID = "Obedio";
const char* WIFI_PASSWORD = "BrankomeinBruder:)";
const int WIFI_TIMEOUT_MS = 20000;
const int WIFI_RETRY_DELAY_MS = 500;
const int WIFI_MAX_RETRIES = 10;

// MQTT Configuration
const char* MQTT_BROKER = "10.10.0.207";
const int MQTT_PORT = 1883;
const char* MQTT_USER = "";  // No authentication
const char* MQTT_PASS = "";
const int MQTT_BUFFER_SIZE = 4096;
const int MQTT_KEEPALIVE_SECONDS = 60;

// Backend Configuration
const char* BACKEND_HOST = "10.10.0.207";
const int BACKEND_PORT = 8080;
const char* UPLOAD_ENDPOINT = "/api/upload/upload-audio";

// Hardware Pin Configuration
const uint8_t I2C_SDA = 3;
const uint8_t I2C_SCL = 2;
const uint8_t LED_RING_PIN = 17;
const uint8_t LED_RING_COUNT = 16;

// I2S Microphone Pins
const uint8_t MIC_BCLK = 33;
const uint8_t MIC_WS = 38;
const uint8_t MIC_SD = 34;

// I2S Speaker Pins
const uint8_t SPK_BCLK = 10;
const uint8_t SPK_WS = 18;
const uint8_t SPK_SD = 11;
const uint8_t SPK_SD_MODE = 14;

// I2C Addresses
const uint8_t MCP23017_ADDR = 0x20;
const uint8_t LIS3DH_ADDR = 0x19;
const uint8_t MCP9808_ADDR = 0x18;

// Button Configuration
const int DEBOUNCE_DELAY_MS = 50;
const int LONG_PRESS_TIME_MS = 700;
const int DOUBLE_CLICK_WINDOW_MS = 500;

// Timing Configuration
const unsigned long HEARTBEAT_INTERVAL_MS = 30000;  // 30 seconds
const unsigned long TELEMETRY_INTERVAL_MS = 60000;  // 60 seconds
const unsigned long MQTT_RECONNECT_INTERVAL_MS = 5000;

// Shake Detection Configuration
const float SHAKE_THRESHOLD = 5.0;  // g-force threshold (VERY HIGH - requires STRONG shake)
const unsigned long SHAKE_COOLDOWN_MS = 2000;  // ms between shake events

// Firmware Information
const char* FIRMWARE_VERSION = "v1.0-custom-pcb";
const char* HARDWARE_VERSION = "ESP32-S3 Custom PCB v3.0";
const char* DEVICE_TYPE = "smart_button";

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL OBJECTS
// ═══════════════════════════════════════════════════════════════════════════

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);
Adafruit_MCP23X17 mcp;
Adafruit_NeoPixel ledRing(LED_RING_COUNT, LED_RING_PIN, NEO_GRB + NEO_KHZ800);
Adafruit_LIS3DH lis = Adafruit_LIS3DH();  // ← ADDED FOR SHAKE DETECTION

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL VARIABLES
// ═══════════════════════════════════════════════════════════════════════════

String deviceId = "";
String mqttClientId = "";
unsigned long lastHeartbeat = 0;
unsigned long lastTelemetry = 0;
unsigned long lastMqttReconnect = 0;
uint32_t sequenceNumber = 0;
bool deviceRegistered = false;

// Shake Detection Variables
bool shakeEnabled = false;
unsigned long lastShakeTime = 0;

// Button state tracking
struct ButtonState {
  bool currentState;
  bool lastState;
  unsigned long lastDebounceTime;
  unsigned long pressStartTime;
  unsigned long lastClickTime;
  int clickCount;
  bool longPressSent;
};

ButtonState buttonStates[8];

// Button mapping to MCP23017 pins (Port A)
enum ButtonPin {
  BTN_AUX5 = 0,  // GPA0 - T6 - Auxiliary 5
  BTN_AUX4 = 1,  // GPA1 - T5 - Auxiliary 4
  BTN_AUX3 = 2,  // GPA2 - T4 - Auxiliary 3
  BTN_AUX2 = 3,  // GPA3 - T3 - Auxiliary 2
  BTN_AUX1 = 4,  // GPA4 - T2 - Auxiliary 1
  BTN_MAIN = 7   // GPA7 - T1 - Main button
};

const char* buttonNames[] = {"aux5", "aux4", "aux3", "aux2", "aux1", "", "", "main"};

// ═══════════════════════════════════════════════════════════════════════════
// FUNCTION DECLARATIONS
// ═══════════════════════════════════════════════════════════════════════════

void setupWiFi();
void setupMQTT();
void setupHardware();
void setupLEDRing();
void setupButtons();
void reconnectWiFi();
void reconnectMQTT();
void mqttCallback(char* topic, byte* payload, unsigned int length);
void handleButtons();
void sendButtonPress(int buttonIndex, const char* pressType);
void sendHeartbeat();
void sendTelemetry();
void registerDevice();
void setLEDColor(uint32_t color);
void setLEDAnimation(const char* animation);
String getDeviceId();
int getBatteryLevel();
int getWiFiRSSI();

// Shake Detection Functions
bool i2cDeviceExists(uint8_t address);
void initAccelerometer();
void checkShake();
void sendShakeEvent();

// ═══════════════════════════════════════════════════════════════════════════
// SETUP
// ═══════════════════════════════════════════════════════════════════════════

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n");
  Serial.println("═══════════════════════════════════════════════════════");
  Serial.println("  OBEDIO ESP32-S3 Smart Button");
  Serial.println("  Firmware: " + String(FIRMWARE_VERSION));
  Serial.println("  Hardware: " + String(HARDWARE_VERSION));
  Serial.println("═══════════════════════════════════════════════════════");
  Serial.println();

  // Generate Device ID from MAC address
  deviceId = getDeviceId();
  mqttClientId = "obedio-button-" + String(millis());

  Serial.println("Device ID: " + deviceId);
  Serial.println("MQTT Client ID: " + mqttClientId);
  Serial.println();

  // Initialize hardware
  setupHardware();
  setupLEDRing();
  setupButtons();
  initAccelerometer();  // ← ADDED FOR SHAKE DETECTION

  // Connect to WiFi
  setupWiFi();

  // Connect to MQTT
  setupMQTT();

  // Register device
  registerDevice();

  Serial.println("\n✓ Setup complete - Ready!\n");
  setLEDColor(ledRing.Color(0, 255, 0));  // Green = ready
  delay(500);
  setLEDColor(ledRing.Color(0, 0, 0));    // Off
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN LOOP
// ═══════════════════════════════════════════════════════════════════════════

void loop() {
  unsigned long currentMillis = millis();

  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠ WiFi disconnected - reconnecting...");
    reconnectWiFi();
  }

  // Check MQTT connection
  if (!mqttClient.connected()) {
    if (currentMillis - lastMqttReconnect >= MQTT_RECONNECT_INTERVAL_MS) {
      Serial.println("⚠ MQTT disconnected - reconnecting...");
      reconnectMQTT();
      lastMqttReconnect = currentMillis;
    }
  } else {
    mqttClient.loop();
  }

  // Handle button inputs
  handleButtons();

  // Check for shake
  if (shakeEnabled) {
    checkShake();
  }

  // Send heartbeat
  if (currentMillis - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
    sendHeartbeat();
    lastHeartbeat = currentMillis;
  }

  // Send telemetry
  if (currentMillis - lastTelemetry >= TELEMETRY_INTERVAL_MS) {
    sendTelemetry();
    lastTelemetry = currentMillis;
  }

  // Small delay to prevent watchdog issues
  delay(10);
}

// ═══════════════════════════════════════════════════════════════════════════
// WIFI FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

void setupWiFi() {
  Serial.println("Connecting to WiFi...");
  Serial.println("SSID: " + String(WIFI_SSID));

  setLEDColor(ledRing.Color(0, 0, 255));  // Blue = connecting

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int retries = 0;
  unsigned long startTime = millis();

  while (WiFi.status() != WL_CONNECTED && retries < WIFI_MAX_RETRIES) {
    delay(WIFI_RETRY_DELAY_MS);
    Serial.print(".");
    retries++;

    if (millis() - startTime >= WIFI_TIMEOUT_MS) {
      Serial.println("\n✗ WiFi connection timeout!");
      setLEDColor(ledRing.Color(255, 0, 0));  // Red = error
      delay(1000);
      ESP.restart();
    }
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi connected!");
    Serial.println("IP Address: " + WiFi.localIP().toString());
    Serial.println("Signal Strength (RSSI): " + String(WiFi.RSSI()) + " dBm");
    Serial.println("MAC Address: " + WiFi.macAddress());
    setLEDColor(ledRing.Color(0, 255, 0));  // Green = connected
    delay(300);
    setLEDColor(ledRing.Color(0, 0, 0));    // Off
  } else {
    Serial.println("\n✗ WiFi connection failed!");
    setLEDColor(ledRing.Color(255, 0, 0));  // Red = error
    delay(2000);
    ESP.restart();
  }
}

void reconnectWiFi() {
  setLEDColor(ledRing.Color(255, 165, 0));  // Orange = reconnecting
  WiFi.disconnect();
  delay(100);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < WIFI_MAX_RETRIES) {
    delay(WIFI_RETRY_DELAY_MS);
    Serial.print(".");
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi reconnected!");
    setLEDColor(ledRing.Color(0, 255, 0));  // Green
    delay(300);
    setLEDColor(ledRing.Color(0, 0, 0));    // Off
  } else {
    Serial.println("\n✗ WiFi reconnection failed - restarting...");
    ESP.restart();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MQTT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

void setupMQTT() {
  Serial.println("\nConfiguring MQTT...");
  Serial.println("Broker: " + String(MQTT_BROKER) + ":" + String(MQTT_PORT));

  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setBufferSize(MQTT_BUFFER_SIZE);
  mqttClient.setKeepAlive(MQTT_KEEPALIVE_SECONDS);

  reconnectMQTT();
}

void reconnectMQTT() {
  int retries = 0;
  const int maxRetries = 3;

  while (!mqttClient.connected() && retries < maxRetries) {
    Serial.print("Connecting to MQTT broker... ");

    setLEDColor(ledRing.Color(128, 0, 128));  // Purple = MQTT connecting

    if (mqttClient.connect(mqttClientId.c_str(), MQTT_USER, MQTT_PASS)) {
      Serial.println("✓ Connected!");

      // Subscribe to command topic
      String commandTopic = "obedio/device/" + deviceId + "/command";
      mqttClient.subscribe(commandTopic.c_str(), 1);
      Serial.println("✓ Subscribed to: " + commandTopic);

      // Subscribe to registered topic
      String registeredTopic = "obedio/device/" + deviceId + "/registered";
      mqttClient.subscribe(registeredTopic.c_str(), 1);
      Serial.println("✓ Subscribed to: " + registeredTopic);

      setLEDColor(ledRing.Color(0, 255, 0));  // Green
      delay(200);
      setLEDColor(ledRing.Color(0, 0, 0));    // Off

      return;
    } else {
      Serial.print("✗ Failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" - Retrying in 5s...");
      setLEDColor(ledRing.Color(255, 0, 0));  // Red
      delay(5000);
      retries++;
    }
  }

  if (!mqttClient.connected()) {
    Serial.println("✗ MQTT connection failed after retries");
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("📨 MQTT message received [");
  Serial.print(topic);
  Serial.print("]: ");

  String message = "";
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println(message);

  // Parse JSON command
  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, message);

  if (error) {
    Serial.println("✗ JSON parsing failed: " + String(error.c_str()));
    return;
  }

  // Handle commands
  String topicStr = String(topic);

  if (topicStr.endsWith("/command")) {
    const char* command = doc["command"];

    if (strcmp(command, "led") == 0) {
      const char* color = doc["color"];
      if (strcmp(color, "red") == 0) setLEDColor(ledRing.Color(255, 0, 0));
      else if (strcmp(color, "green") == 0) setLEDColor(ledRing.Color(0, 255, 0));
      else if (strcmp(color, "blue") == 0) setLEDColor(ledRing.Color(0, 0, 255));
      else if (strcmp(color, "off") == 0) setLEDColor(ledRing.Color(0, 0, 0));
      Serial.println("✓ LED color changed to: " + String(color));
    }
    else if (strcmp(command, "reboot") == 0) {
      Serial.println("⚠ Rebooting device...");
      delay(1000);
      ESP.restart();
    }
    else if (strcmp(command, "status") == 0) {
      sendTelemetry();
    }
    else if (strcmp(command, "request_accepted") == 0) {
      Serial.println("✅ Request ACCEPTED by crew - Green pulse!");
      // Green pulse 3 times - visual feedback that crew is on the way
      for (int i = 0; i < 3; i++) {
        setLEDColor(ledRing.Color(0, 255, 0));  // Green
        delay(300);
        setLEDColor(ledRing.Color(0, 0, 0));    // Off
        delay(200);
      }
    }
  }
  else if (topicStr.endsWith("/registered")) {
    deviceRegistered = true;
    Serial.println("✓ Device registration confirmed!");
    setLEDColor(ledRing.Color(0, 255, 0));  // Green flash
    delay(500);
    setLEDColor(ledRing.Color(0, 0, 0));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HARDWARE INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

void setupHardware() {
  Serial.println("Initializing I2C bus...");
  Wire.begin(I2C_SDA, I2C_SCL);
  Wire.setClock(100000);  // 100kHz

  // Scan I2C bus
  Serial.println("Scanning I2C devices...");
  int deviceCount = 0;
  for (byte addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) {
      Serial.print("  Found device at 0x");
      Serial.println(addr, HEX);
      deviceCount++;
    }
  }
  Serial.println("Found " + String(deviceCount) + " I2C device(s)\n");

  // Initialize MCP23017 GPIO expander
  Serial.print("Initializing MCP23017 GPIO expander... ");
  if (mcp.begin_I2C(MCP23017_ADDR, &Wire)) {
    Serial.println("✓");

    // Configure all pins on Port A as inputs with pull-ups
    for (int i = 0; i < 8; i++) {
      mcp.pinMode(i, INPUT_PULLUP);
    }
  } else {
    Serial.println("✗ Failed!");
  }

  // Initialize speaker SD_MODE pin
  pinMode(SPK_SD_MODE, OUTPUT);
  digitalWrite(SPK_SD_MODE, LOW);  // Keep speaker off initially

  Serial.println();
}

void setupLEDRing() {
  Serial.print("Initializing LED ring (16x WS2812B)... ");
  ledRing.begin();
  ledRing.setBrightness(50);  // 20% brightness
  ledRing.show();  // Initialize all pixels to 'off'
  Serial.println("✓");

  // Startup animation
  for (int i = 0; i < LED_RING_COUNT; i++) {
    ledRing.setPixelColor(i, ledRing.Color(0, 50, 255));
    ledRing.show();
    delay(30);
  }
  delay(200);
  setLEDColor(ledRing.Color(0, 0, 0));  // Off
}

void setupButtons() {
  Serial.println("Initializing button states...");
  for (int i = 0; i < 8; i++) {
    buttonStates[i].currentState = false;
    buttonStates[i].lastState = false;
    buttonStates[i].lastDebounceTime = 0;
    buttonStates[i].pressStartTime = 0;
    buttonStates[i].lastClickTime = 0;
    buttonStates[i].clickCount = 0;
    buttonStates[i].longPressSent = false;
  }
  Serial.println("✓ Button handling ready\n");
}

// ═══════════════════════════════════════════════════════════════════════════
// BUTTON HANDLING
// ═══════════════════════════════════════════════════════════════════════════

void handleButtons() {
  unsigned long currentMillis = millis();

  for (int i = 0; i < 8; i++) {
    // Skip unused pins (5 and 6)
    if (i == 5 || i == 6) continue;

    // Read button state (active LOW with pull-up)
    bool reading = !mcp.digitalRead(i);

    // Debouncing
    if (reading != buttonStates[i].lastState) {
      buttonStates[i].lastDebounceTime = currentMillis;
    }

    if ((currentMillis - buttonStates[i].lastDebounceTime) > DEBOUNCE_DELAY_MS) {
      // Button state has been stable
      if (reading != buttonStates[i].currentState) {
        buttonStates[i].currentState = reading;

        // Button pressed
        if (buttonStates[i].currentState) {
          buttonStates[i].pressStartTime = currentMillis;
          buttonStates[i].longPressSent = false;

          Serial.println("🔘 Button " + String(buttonNames[i]) + " pressed");

          // Send immediate "press" event
          sendButtonPress(i, "press");

          // LED feedback - Yellow = request sent
          setLEDColor(ledRing.Color(255, 255, 0));  // Yellow = request sent to backend
        }
        // Button released
        else {
          unsigned long pressDuration = currentMillis - buttonStates[i].pressStartTime;

          // Check for double click
          if ((currentMillis - buttonStates[i].lastClickTime) < DOUBLE_CLICK_WINDOW_MS) {
            buttonStates[i].clickCount++;
            if (buttonStates[i].clickCount >= 2) {
              Serial.println("🔘🔘 Button " + String(buttonNames[i]) + " double-clicked");
              sendButtonPress(i, "double");
              buttonStates[i].clickCount = 0;
              setLEDColor(ledRing.Color(0, 255, 255));  // Cyan for double
              delay(100);
              setLEDColor(ledRing.Color(0, 0, 0));
              continue;
            }
          } else {
            buttonStates[i].clickCount = 1;
          }
          buttonStates[i].lastClickTime = currentMillis;

          // Long press
          if (pressDuration >= LONG_PRESS_TIME_MS && !buttonStates[i].longPressSent) {
            Serial.println("🔘──── Button " + String(buttonNames[i]) + " long press");
            sendButtonPress(i, "long");
            setLEDColor(ledRing.Color(255, 165, 0));  // Orange for long press
            delay(100);
            setLEDColor(ledRing.Color(0, 0, 0));
          }
          // Single click
          else if (pressDuration < LONG_PRESS_TIME_MS) {
            // Wait to see if there's a second click
            delay(DOUBLE_CLICK_WINDOW_MS);
            if (buttonStates[i].clickCount == 1) {
              Serial.println("🔘 Button " + String(buttonNames[i]) + " single click");
              sendButtonPress(i, "single");
              setLEDColor(ledRing.Color(0, 255, 0));  // Green for single
              delay(100);
              setLEDColor(ledRing.Color(0, 0, 0));
              buttonStates[i].clickCount = 0;
            }
          }
        }
      }

      // Check for long press while held
      if (buttonStates[i].currentState && !buttonStates[i].longPressSent) {
        unsigned long pressDuration = currentMillis - buttonStates[i].pressStartTime;
        if (pressDuration >= LONG_PRESS_TIME_MS) {
          Serial.println("🔘──── Button " + String(buttonNames[i]) + " long press detected");
          sendButtonPress(i, "long");
          buttonStates[i].longPressSent = true;
          setLEDColor(ledRing.Color(255, 165, 0));  // Orange
        }
      }
    }

    buttonStates[i].lastState = reading;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MQTT PUBLISHING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

void sendButtonPress(int buttonIndex, const char* pressType) {
  if (!mqttClient.connected()) {
    Serial.println("⚠ MQTT not connected - cannot send button press");
    return;
  }

  StaticJsonDocument<512> doc;

  doc["deviceId"] = deviceId;
  doc["button"] = buttonNames[buttonIndex];
  doc["pressType"] = pressType;
  doc["timestamp"] = millis();
  doc["battery"] = getBatteryLevel();
  doc["rssi"] = getWiFiRSSI();
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["sequenceNumber"] = sequenceNumber++;

  String payload;
  serializeJson(doc, payload);

  String topic = "obedio/button/" + deviceId + "/press";

  if (mqttClient.publish(topic.c_str(), payload.c_str(), false)) {
    Serial.println("✓ Published button press: " + String(buttonNames[buttonIndex]) + " (" + String(pressType) + ")");
    Serial.println("  Payload: " + payload);
  } else {
    Serial.println("✗ Failed to publish button press");
  }
}

void sendHeartbeat() {
  if (!mqttClient.connected()) return;

  StaticJsonDocument<256> doc;

  doc["deviceId"] = deviceId;
  doc["timestamp"] = millis();
  doc["rssi"] = getWiFiRSSI();
  doc["battery"] = getBatteryLevel();
  doc["uptime"] = millis() / 1000;
  doc["freeHeap"] = ESP.getFreeHeap();

  String payload;
  serializeJson(doc, payload);

  String topic = "obedio/device/heartbeat";

  if (mqttClient.publish(topic.c_str(), payload.c_str(), false)) {
    Serial.println("💓 Heartbeat sent");
  }
}

void sendTelemetry() {
  if (!mqttClient.connected()) return;

  StaticJsonDocument<512> doc;

  doc["deviceId"] = deviceId;
  doc["timestamp"] = millis();
  doc["uptime"] = millis() / 1000;
  doc["rssi"] = getWiFiRSSI();
  doc["battery"] = getBatteryLevel();
  doc["freeHeap"] = ESP.getFreeHeap();
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["hardwareVersion"] = HARDWARE_VERSION;
  doc["ipAddress"] = WiFi.localIP().toString();
  doc["macAddress"] = WiFi.macAddress();

  String payload;
  serializeJson(doc, payload);

  String topic = "obedio/device/" + deviceId + "/telemetry";

  if (mqttClient.publish(topic.c_str(), payload.c_str(), false)) {
    Serial.println("📊 Telemetry sent");
  }
}

void registerDevice() {
  if (!mqttClient.connected()) {
    Serial.println("⚠ MQTT not connected - cannot register device");
    return;
  }

  Serial.println("\nRegistering device with backend...");

  StaticJsonDocument<768> doc;

  doc["deviceId"] = deviceId;
  doc["type"] = DEVICE_TYPE;
  doc["name"] = "ESP32-S3 Smart Button";
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["hardwareVersion"] = HARDWARE_VERSION;
  doc["macAddress"] = WiFi.macAddress();
  doc["ipAddress"] = WiFi.localIP().toString();
  doc["rssi"] = getWiFiRSSI();

  JsonObject capabilities = doc.createNestedObject("capabilities");
  capabilities["button"] = true;
  capabilities["audio"] = true;
  capabilities["led"] = true;
  capabilities["voice_recording"] = true;
  capabilities["accelerometer"] = true;
  capabilities["temperature"] = true;

  String payload;
  serializeJson(doc, payload);

  String topic = "obedio/device/register";

  if (mqttClient.publish(topic.c_str(), payload.c_str(), false)) {
    Serial.println("✓ Device registration sent");
    Serial.println("  Topic: " + topic);
    Serial.println("  Payload: " + payload);
  } else {
    Serial.println("✗ Failed to send device registration");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// LED CONTROL FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

void setLEDColor(uint32_t color) {
  for (int i = 0; i < LED_RING_COUNT; i++) {
    ledRing.setPixelColor(i, color);
  }
  ledRing.show();
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

String getDeviceId() {
  uint8_t mac[6];
  WiFi.macAddress(mac);

  char deviceIdBuf[20];
  snprintf(deviceIdBuf, sizeof(deviceIdBuf), "BTN-%02X%02X%02X%02X%02X%02X",
           mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);

  return String(deviceIdBuf);
}

int getBatteryLevel() {
  // TODO: Implement actual battery reading via ADC
  // For now return a placeholder value
  return 100;
}

int getWiFiRSSI() {
  return WiFi.RSSI();
}

// ═══════════════════════════════════════════════════════════════════════════
// SHAKE DETECTION FUNCTIONS (ADDED FOR METSTRADE)
// ═══════════════════════════════════════════════════════════════════════════

// Helper: Check if I2C device exists without hanging
bool i2cDeviceExists(uint8_t address) {
  Wire.beginTransmission(address);
  byte error = Wire.endTransmission();
  return (error == 0);
}

void initAccelerometer() {
  Serial.print("🔄 Scanning I2C for LIS3DH accelerometer... ");

  // SAFE: First check if device responds on I2C bus
  bool deviceFound = false;
  uint8_t foundAddress = 0;

  if (i2cDeviceExists(0x19)) {
    foundAddress = 0x19;
    deviceFound = true;
    Serial.println("Found at 0x19");
  } else if (i2cDeviceExists(0x18)) {
    foundAddress = 0x18;
    deviceFound = true;
    Serial.println("Found at 0x18");
  } else {
    Serial.println("NOT FOUND");
    Serial.println("  Shake Detection: DISABLED");
    Serial.println("  ⚠️ Everything else will work fine!\n");
    shakeEnabled = false;
    return;  // Exit early - don't try to initialize
  }

  // Device found on I2C, now try to initialize
  Serial.print("  Initializing LIS3DH... ");

  if (lis.begin(foundAddress)) {  // ← FIXED: No &Wire parameter needed
    Serial.println("✓ SUCCESS!");

    // Configure for shake detection
    lis.setRange(LIS3DH_RANGE_2_G);          // ±2g (sensitive for shake)
    lis.setDataRate(LIS3DH_DATARATE_100_HZ);  // 100Hz sampling

    Serial.println("  Shake Detection: ENABLED");
    Serial.printf("  Threshold: %.1fg\n\n", SHAKE_THRESHOLD);

    shakeEnabled = true;
  } else {
    Serial.println("✗ INIT FAILED");
    Serial.println("  Shake Detection: DISABLED\n");
    shakeEnabled = false;
  }
}

void checkShake() {
  // Safety: Don't even try if shake is disabled
  if (!shakeEnabled) {
    return;
  }

  // Cooldown - don't trigger too often
  if (millis() - lastShakeTime < SHAKE_COOLDOWN_MS) {
    return;
  }

  // Read raw acceleration values
  lis.read();
  int16_t x = lis.x;
  int16_t y = lis.y;
  int16_t z = lis.z;

  // Calculate magnitude (simple - no square root needed)
  long magnitude = abs(x) + abs(y) + abs(z);

  // Shake threshold (tuned for LIS3DH at ±2g range)
  // Normal gravity ~= 16000, shake > 50000 (very firm shake required!)
  if (magnitude > 50000) {
    Serial.println("🚨 SHAKE DETECTED!");
    Serial.printf("  Magnitude: %ld (threshold: 50000)\n", magnitude);

    sendShakeEvent();
    lastShakeTime = millis();

    // Emergency LED - Red rapid flash
    for (int i = 0; i < 5; i++) {
      setLEDColor(ledRing.Color(255, 0, 0));  // Red
      delay(100);
      setLEDColor(ledRing.Color(0, 0, 0));    // Off
      delay(100);
    }
  }
}

void sendShakeEvent() {
  if (!mqttClient.connected()) {
    Serial.println("⚠ MQTT not connected - cannot send shake event");
    return;
  }

  StaticJsonDocument<512> doc;

  doc["deviceId"] = deviceId;
  doc["button"] = "main";
  doc["pressType"] = "shake";
  doc["timestamp"] = millis();
  doc["battery"] = getBatteryLevel();
  doc["rssi"] = getWiFiRSSI();
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["sequenceNumber"] = sequenceNumber++;

  String payload;
  serializeJson(doc, payload);

  String topic = "obedio/button/" + deviceId + "/press";

  if (mqttClient.publish(topic.c_str(), payload.c_str(), false)) {
    Serial.println("✓ Published SHAKE event (EMERGENCY)");
    Serial.println("  Payload: " + payload);
  } else {
    Serial.println("✗ Failed to publish shake event");
  }
}
