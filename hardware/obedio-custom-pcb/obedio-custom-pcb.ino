/**
 * OBEDIO Custom PCB - ESP32-S3 Smart Button Firmware
 *
 * Hardware: Custom Obedio Smart Button PCB (ESP32-S3)
 * - 5 Buttons via MCP23017 I2C IO Expander (T1-T5)
 * - 16 LED NeoPixel Ring (WS2812B)
 * - I2S MEMS Microphone (24-bit)
 * - I2S MAX98357A Speaker Amplifier
 * - WiFi connectivity
 * - MQTT communication
 *
 * Features:
 * - T1 (main button): Record audio while held, playback on release, send MQTT event
 * - T2-T5: Send service request button press events
 * - Continuous rainbow LED animation
 * - Auto device registration
 * - Battery and signal monitoring
 *
 * MQTT Topic: obedio/button/{deviceId}/press
 * Backend Integration: Full compatibility with Obedio backend system
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_MCP23X17.h>
#include <Adafruit_NeoPixel.h>
#include <driver/i2s.h>

// ==================== HARDWARE CONFIGURATION ====================

// I2C - MCP23017 IO EXPANDER
#define SDA_PIN 3
#define SCL_PIN 2
#define MCP23017_ADDRESS 0x20

// BUTTONS (on MCP23017 GPA bank)
const uint8_t BUTTON_PINS[] = {7, 6, 5, 4, 3};  // GPA7-GPA3 = T1-T5
const int BUTTON_COUNT = 5;
const char* BUTTON_NAMES[] = {"T1", "T2", "T3", "T4", "T5"};
const char* BUTTON_TYPES[] = {"main", "aux1", "aux2", "aux3", "aux4"};

// NEOPIXEL LED RING
#define LED_PIN 17
#define NUM_LEDS 16

// AUDIO - MEMS MICROPHONE (I2S RX)
#define MIC_BCLK_PIN 33
#define MIC_WS_PIN 38
#define MIC_SD_PIN 34
#define I2S_MIC_PORT I2S_NUM_0

// AUDIO - MAX98357A SPEAKER AMP (I2S TX)
#define SPK_BCLK_PIN 10
#define SPK_WS_PIN 18
#define SPK_SD_PIN 11
#define SPK_SD_MODE_PIN 14
#define I2S_SPK_PORT I2S_NUM_1

// ==================== NETWORK CONFIGURATION ====================

// WiFi credentials
const char* WIFI_SSID = "Obedio";
const char* WIFI_PASSWORD = "BrankomeinBruder:)";

// MQTT broker
const char* MQTT_BROKER = "10.10.0.207";
const int MQTT_PORT = 1883;
const char* MQTT_USER = "";
const char* MQTT_PASSWORD = "";

// Device Info
const char* DEVICE_TYPE = "smart_button";
const char* DEVICE_NAME = "Custom PCB Button";
const char* FIRMWARE_VERSION = "v1.0-custom-pcb";

// Location assignment (OPTIONAL - can be set via backend or left null)
const char* LOCATION_ID = "";  // Empty = auto-assign
const char* GUEST_ID = "";     // Empty = auto-assign

// ==================== AUDIO CONFIGURATION ====================

const int SAMPLE_RATE = 16000;
const int MAX_RECORD_SECONDS = 3;
const int BLOCK_SAMPLES = 256;
const size_t MAX_SAMPLES = (size_t)SAMPLE_RATE * MAX_RECORD_SECONDS;

// ==================== GLOBAL OBJECTS ====================

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);
Adafruit_MCP23X17 mcp;
Adafruit_NeoPixel strip = Adafruit_NeoPixel(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);

// ==================== GLOBAL VARIABLES ====================

String deviceId;
String TOPIC_REGISTER;
String TOPIC_HEARTBEAT;
String TOPIC_BUTTON_PRESS;

// Button debounce
unsigned long lastDebounceTime[BUTTON_COUNT] = {0};
bool lastButtonState[BUTTON_COUNT] = {HIGH, HIGH, HIGH, HIGH, HIGH};
bool buttonState[BUTTON_COUNT] = {HIGH, HIGH, HIGH, HIGH, HIGH};
const unsigned long debounceDelay = 50;

// LED animation
unsigned long previousLEDMillis = 0;
const long LEDInterval = 150;
uint16_t hue = 0;

// Audio buffer
int16_t audioBuffer[MAX_SAMPLES];

// Heartbeat
unsigned long lastHeartbeat = 0;
const unsigned long HEARTBEAT_INTERVAL = 30000;

// Sequence number
uint32_t sequenceNumber = 0;

// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n========================================");
  Serial.println("OBEDIO - Custom PCB ESP32-S3 Button");
  Serial.println("========================================\n");

  // Initialize I2C
  Wire.begin(SDA_PIN, SCL_PIN);

  // Initialize MCP23017
  if (!mcp.begin_I2C(MCP23017_ADDRESS, &Wire)) {
    Serial.println("❌ Failed to find MCP23017!");
    while (1) delay(10);
  }
  Serial.println("✅ MCP23017 initialized");

  // Initialize buttons
  for (int i = 0; i < BUTTON_COUNT; i++) {
    mcp.pinMode(BUTTON_PINS[i], INPUT_PULLUP);
    lastButtonState[i] = HIGH;
    buttonState[i] = HIGH;
    lastDebounceTime[i] = 0;
  }
  Serial.println("✅ Buttons initialized");

  // Initialize NeoPixel
  strip.begin();
  strip.setBrightness(200);
  strip.show();
  Serial.println("✅ NeoPixel initialized");

  // Initialize I2S microphone
  setupMicrophone();
  Serial.println("✅ Microphone initialized");

  // Initialize I2S speaker
  setupSpeaker();
  Serial.println("✅ Speaker initialized");

  // Generate device ID from MAC
  uint8_t mac[6];
  WiFi.macAddress(mac);
  char macStr[13];
  sprintf(macStr, "%02X%02X%02X%02X%02X%02X", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  deviceId = String("BTN-") + String(macStr);

  Serial.print("Device ID: ");
  Serial.println(deviceId);

  // Setup MQTT topics
  TOPIC_REGISTER = "obedio/device/register";
  TOPIC_HEARTBEAT = "obedio/device/heartbeat";
  TOPIC_BUTTON_PRESS = "obedio/button/" + deviceId + "/press";

  // Connect to WiFi
  connectWiFi();

  // Connect to MQTT
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setBufferSize(2048);
  connectMQTT();

  // Register device
  registerDevice();

  // LED startup sequence
  for (int i = 0; i < NUM_LEDS; i++) {
    strip.setPixelColor(i, strip.Color(0, 255, 0));
    strip.show();
    delay(30);
  }
  delay(500);
  strip.clear();
  strip.show();

  Serial.println("\n✅ Device ready! Press buttons to test.\n");
}

// ==================== MAIN LOOP ====================

void loop() {
  // Maintain MQTT connection
  if (!mqttClient.connected()) {
    connectMQTT();
  }
  mqttClient.loop();

  // Check WiFi
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // Check all buttons
  checkButtons();

  // Update LED animation
  rainbow();

  // Send heartbeat
  unsigned long now = millis();
  if (now - lastHeartbeat > HEARTBEAT_INTERVAL) {
    sendHeartbeat();
    lastHeartbeat = now;
  }
}

// ==================== WIFI FUNCTIONS ====================

void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
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
  } else {
    Serial.println("\n❌ WiFi connection failed!");
    delay(5000);
    ESP.restart();
  }
}

// ==================== MQTT FUNCTIONS ====================

void connectMQTT() {
  int attempts = 0;
  while (!mqttClient.connected() && attempts < 5) {
    Serial.print("Connecting to MQTT broker: ");
    Serial.print(MQTT_BROKER);
    Serial.print(":");
    Serial.println(MQTT_PORT);

    String clientId = "obedio-custom-pcb-" + deviceId;

    if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASSWORD)) {
      Serial.println("✅ MQTT connected!");
    } else {
      Serial.print("❌ MQTT connection failed, rc=");
      Serial.println(mqttClient.state());
      attempts++;
      delay(2000);
    }
  }
}

void registerDevice() {
  Serial.println("\n📝 Registering device with backend...");

  StaticJsonDocument<512> doc;
  doc["deviceId"] = deviceId;
  doc["type"] = DEVICE_TYPE;
  doc["name"] = DEVICE_NAME;
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["hardwareVersion"] = "ESP32-S3 Custom PCB";
  doc["macAddress"] = WiFi.macAddress();
  doc["ipAddress"] = WiFi.localIP().toString();
  doc["rssi"] = WiFi.RSSI();

  if (strlen(LOCATION_ID) > 0) {
    doc["locationId"] = LOCATION_ID;
  }
  if (strlen(GUEST_ID) > 0) {
    doc["guestId"] = GUEST_ID;
  }

  JsonObject capabilities = doc.createNestedObject("capabilities");
  capabilities["button"] = true;
  capabilities["audio"] = true;
  capabilities["led"] = true;
  capabilities["voice_recording"] = true;

  String payload;
  serializeJson(doc, payload);

  if (mqttClient.publish(TOPIC_REGISTER.c_str(), payload.c_str(), false)) {
    Serial.println("✅ Device registered!");
  } else {
    Serial.println("❌ Registration failed!");
  }
}

void sendHeartbeat() {
  StaticJsonDocument<256> doc;
  doc["deviceId"] = deviceId;
  doc["timestamp"] = millis();
  doc["rssi"] = WiFi.RSSI();
  doc["battery"] = 100;  // No battery on this PCB
  doc["uptime"] = millis() / 1000;
  doc["freeHeap"] = ESP.getFreeHeap();

  String payload;
  serializeJson(doc, payload);

  if (mqttClient.publish(TOPIC_HEARTBEAT.c_str(), payload.c_str(), false)) {
    Serial.println("💓 Heartbeat sent");
  }
}

// ==================== BUTTON FUNCTIONS ====================

void checkButtons() {
  for (int i = 0; i < BUTTON_COUNT; i++) {
    bool reading = mcp.digitalRead(BUTTON_PINS[i]);

    // Debounce
    if (reading != lastButtonState[i]) {
      lastDebounceTime[i] = millis();
    }

    if ((millis() - lastDebounceTime[i]) > debounceDelay) {
      if (reading != buttonState[i]) {
        buttonState[i] = reading;

        // Button pressed (active LOW)
        if (buttonState[i] == LOW) {
          handleButtonPress(i);
        }
      }
    }

    lastButtonState[i] = reading;
  }
}

void handleButtonPress(int buttonIndex) {
  Serial.println("\n🔘 ========================================");
  Serial.print("🔘 BUTTON PRESSED: ");
  Serial.println(BUTTON_NAMES[buttonIndex]);
  Serial.println("🔘 ========================================\n");

  // Flash LEDs
  for (int i = 0; i < NUM_LEDS; i++) {
    strip.setPixelColor(i, strip.Color(255, 255, 255));
  }
  strip.show();
  delay(100);
  strip.clear();
  strip.show();

  // Special handling for T1 (main button with audio)
  if (buttonIndex == 0) {
    handleT1ButtonWithAudio();
  } else {
    // T2-T5: Regular button press
    publishButtonPress(BUTTON_TYPES[buttonIndex], "single");
  }
}

void handleT1ButtonWithAudio() {
  Serial.println("🎤 T1 Button: Recording audio...");

  // Visual feedback: all LEDs blue while recording
  for (int i = 0; i < NUM_LEDS; i++) {
    strip.setPixelColor(i, strip.Color(0, 0, 255));
  }
  strip.show();

  // Record audio while button is held
  size_t recordedSamples = recordWhileButtonHeld(BUTTON_PINS[0]);

  Serial.print("✅ Recorded ");
  Serial.print(recordedSamples);
  Serial.println(" samples");

  // Visual feedback: LEDs green for playback
  for (int i = 0; i < NUM_LEDS; i++) {
    strip.setPixelColor(i, strip.Color(0, 255, 0));
  }
  strip.show();

  // Play back recorded audio
  if (recordedSamples > 0) {
    Serial.println("🔊 Playing back audio...");
    playAudio(recordedSamples);
    Serial.println("✅ Playback complete");
  }

  strip.clear();
  strip.show();

  // Publish T1_VOICE event
  publishButtonPress("main", "voice");
}

// ==================== MQTT PUBLISH ====================

void publishButtonPress(const char* button, const char* pressType) {
  if (!mqttClient.connected()) {
    Serial.println("❌ Cannot publish - MQTT not connected");
    return;
  }

  // Increment sequence number
  sequenceNumber++;

  // Create JSON payload matching backend specification
  StaticJsonDocument<512> doc;
  doc["deviceId"] = deviceId;
  doc["button"] = button;
  doc["pressType"] = pressType;
  doc["battery"] = 100;
  doc["rssi"] = WiFi.RSSI();
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["timestamp"] = millis();
  doc["sequenceNumber"] = sequenceNumber;

  if (strlen(LOCATION_ID) > 0) {
    doc["locationId"] = LOCATION_ID;
  }
  if (strlen(GUEST_ID) > 0) {
    doc["guestId"] = GUEST_ID;
  }

  String payload;
  serializeJson(doc, payload);

  Serial.println("\n📤 Publishing MQTT message:");
  Serial.print("Topic: ");
  Serial.println(TOPIC_BUTTON_PRESS);
  Serial.print("Payload: ");
  Serial.println(payload);

  bool published = mqttClient.publish(TOPIC_BUTTON_PRESS.c_str(), payload.c_str(), false);

  if (published) {
    Serial.println("✅ Message published successfully!");
  } else {
    Serial.println("❌ Message publish failed!");
  }
}

// ==================== AUDIO FUNCTIONS ====================

void setupMicrophone() {
  i2s_config_t i2s_config_mic = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 4,
    .dma_buf_len = BLOCK_SAMPLES,
    .use_apll = false,
    .tx_desc_auto_clear = false,
    .fixed_mclk = 0
  };

  i2s_pin_config_t pin_config_mic = {
    .bck_io_num = MIC_BCLK_PIN,
    .ws_io_num = MIC_WS_PIN,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num = MIC_SD_PIN
  };

  i2s_driver_install(I2S_MIC_PORT, &i2s_config_mic, 0, NULL);
  i2s_set_pin(I2S_MIC_PORT, &pin_config_mic);
  i2s_zero_dma_buffer(I2S_MIC_PORT);
}

void setupSpeaker() {
  // Enable speaker amp
  pinMode(SPK_SD_MODE_PIN, OUTPUT);
  digitalWrite(SPK_SD_MODE_PIN, HIGH);

  i2s_config_t i2s_config_spk = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 4,
    .dma_buf_len = BLOCK_SAMPLES,
    .use_apll = false,
    .tx_desc_auto_clear = true,
    .fixed_mclk = 0
  };

  i2s_pin_config_t pin_config_spk = {
    .bck_io_num = SPK_BCLK_PIN,
    .ws_io_num = SPK_WS_PIN,
    .data_out_num = SPK_SD_PIN,
    .data_in_num = I2S_PIN_NO_CHANGE
  };

  i2s_driver_install(I2S_SPK_PORT, &i2s_config_spk, 0, NULL);
  i2s_set_pin(I2S_SPK_PORT, &pin_config_spk);
  i2s_zero_dma_buffer(I2S_SPK_PORT);
}

size_t recordWhileButtonHeld(uint8_t mcpPin) {
  // Clear buffer
  memset(audioBuffer, 0, sizeof(audioBuffer));

  size_t index = 0;
  delay(50);  // Small delay to avoid immediate bounce

  while (mcp.digitalRead(mcpPin) == LOW && index < MAX_SAMPLES) {
    int32_t micBlock[BLOCK_SAMPLES];
    size_t bytesRead = 0;

    esp_err_t err = i2s_read(I2S_MIC_PORT, micBlock, sizeof(micBlock), &bytesRead, portMAX_DELAY);

    if (err == ESP_OK && bytesRead > 0) {
      int samples = bytesRead / sizeof(int32_t);

      for (int i = 0; i < samples && index < MAX_SAMPLES; i++) {
        // Convert 32-bit to 16-bit
        int32_t v = micBlock[i] >> 8;  // Drop lower 8 bits
        v >>= 1;  // Lower gain

        // Clamp
        if (v > 32767) v = 32767;
        if (v < -32768) v = -32768;

        audioBuffer[index++] = (int16_t)v;
      }
    }
  }

  return index;
}

void playAudio(size_t samples) {
  size_t samplesPlayed = 0;

  while (samplesPlayed < samples) {
    size_t samplesLeft = samples - samplesPlayed;
    size_t thisBlockSamples = (samplesLeft > BLOCK_SAMPLES) ? BLOCK_SAMPLES : samplesLeft;
    size_t bytesToWrite = thisBlockSamples * sizeof(int16_t);
    size_t bytesWritten = 0;

    esp_err_t err = i2s_write(
      I2S_SPK_PORT,
      audioBuffer + samplesPlayed,
      bytesToWrite,
      &bytesWritten,
      portMAX_DELAY
    );

    if (err != ESP_OK || bytesWritten == 0) {
      Serial.println("❌ Playback error");
      break;
    }

    samplesPlayed += bytesWritten / sizeof(int16_t);
  }
}

// ==================== LED FUNCTIONS ====================

void rainbow() {
  unsigned long currentMillis = millis();

  if (currentMillis - previousLEDMillis >= LEDInterval) {
    previousLEDMillis = currentMillis;

    for (int i = 0; i < NUM_LEDS; i++) {
      int ledHue = (hue + (i * 65536 / NUM_LEDS)) % 65536;
      strip.setPixelColor(i, strip.gamma32(strip.ColorHSV(ledHue)));
    }
    strip.show();

    hue += 256;
    if (hue >= 65536) hue = 0;
  }
}
