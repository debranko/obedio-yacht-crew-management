/**
 * ============================================================
 * OBEDIO ESP32-S3 Smart Button - FINAL Voice Recording Firmware
 * ============================================================
 *
 * Hardware: ESP32-S3 Custom PCB v3.0
 *
 * Features:
 * - Hold T1 (main button) → Record voice
 * - Release T1 → Upload to server → Transcribe → Display in web app
 * - T2-T5 → Auxiliary buttons (LED patterns)
 * - LED ring animations (recording, uploading, success, error)
 * - MQTT integration
 * - WiFi connectivity
 *
 * GPIO Map:
 * - I2C: SDA=GPIO3, SCL=GPIO2 (MCP23017 + LIS3DH)
 * - Buttons: T1-T5 via MCP23017 port A (GPA7-GPA3)
 * - LED Ring: GPIO17 (16x WS2812B)
 * - Microphone: BCLK=GPIO33, WS=GPIO38, SD=GPIO34 (I2S RX)
 * - Speaker: BCLK=GPIO10, WS=GPIO18, SD=GPIO11, SD_MODE=GPIO14 (I2S TX)
 *
 * Author: Obedio Team
 * Date: 2025-01-16
 */

#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <PubSubClient.h>
#include <Adafruit_MCP23X17.h>
#include <Adafruit_NeoPixel.h>
#include <ArduinoJson.h>
#include <LIS3DHTR.h>  // ← SHAKE DETECTION!
#include "driver/i2s.h"

// ==================== CONFIGURATION ====================

// WiFi Credentials
const char* WIFI_SSID     = "Obedio";
const char* WIFI_PASSWORD = "BrankomeinBruder:)";

// Backend Server
const char* BACKEND_HOST = "10.10.0.207";
const uint16_t BACKEND_PORT = 8080;
const char* UPLOAD_ENDPOINT = "/api/upload/upload-audio";

// MQTT Broker
const char* MQTT_HOST = "10.10.0.207";
const uint16_t MQTT_PORT = 1883;

// I2C Configuration (MCP23017 + LIS3DH)
#define I2C_SDA_PIN  3
#define I2C_SCL_PIN  2
#define MCP_ADDR     0x20
#define LIS3DH_ADDR  0x19  // ← Accelerometer for shake detection

// Button Configuration (MCP23017 Port A)
// T1=GPA7 (main), T2=GPA6, T3=GPA5, T4=GPA4, T5=GPA3
const uint8_t BUTTON_PINS[] = {7, 6, 5, 4, 3};
const int BUTTON_COUNT = 5;

// LED Ring Configuration
#define LED_PIN   17
#define NUM_LEDS  16

// I2S Microphone Configuration (RX)
#define I2S_MIC_PORT  I2S_NUM_0
#define MIC_BCLK_PIN  33
#define MIC_WS_PIN    38
#define MIC_SD_PIN    34

// I2S Speaker Configuration (TX, MAX98357A)
#define I2S_SPK_PORT     I2S_NUM_1
#define SPK_BCLK_PIN     10
#define SPK_WS_PIN       18
#define SPK_SD_PIN       11
#define SPK_SD_MODE_PIN  14

// Audio Parameters
const int SAMPLE_RATE        = 16000;  // 16 kHz for voice
const int MAX_RECORD_SECONDS = 3;      // 3 seconds (96KB RAM - SAFE)
const int BLOCK_SAMPLES      = 256;
const size_t MAX_SAMPLES     = (size_t)SAMPLE_RATE * MAX_RECORD_SECONDS;

// Button Timing
const unsigned long DEBOUNCE_DELAY       = 50;   // ms
const unsigned long LONG_PRESS_THRESHOLD = 500;  // ms

// Heartbeat Interval
const unsigned long HEARTBEAT_INTERVAL = 60000;  // 60 seconds

// ==================== GLOBAL VARIABLES ====================

Adafruit_MCP23X17 mcp;
Adafruit_NeoPixel strip(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);
LIS3DHTR<TwoWire> accel;  // ← Accelerometer for shake detection

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

String deviceId = "BTN-";  // Will be filled with MAC address

// Button State
unsigned long lastDebounceTime[BUTTON_COUNT];
bool lastButtonState[BUTTON_COUNT];
bool buttonState[BUTTON_COUNT];

// Main Button (T1) State
bool mainPressed = false;
bool mainRecording = false;
unsigned long mainPressStart = 0;

// Audio Buffer
int16_t* audioBuffer = nullptr;
size_t recordedSamples = 0;

// Shake Detection Configuration
float shakeThreshold = 2.5;             // G-force threshold (2.5g = sensitive)
const int SHAKE_MIN_COUNT = 3;          // Minimum shake movements required
const int SHAKE_TIME_WINDOW_MS = 500;   // Time window for shake detection
const int SHAKE_COOLDOWN_MS = 2000;     // Cooldown between shake events
unsigned long shakeEventTimes[10];      // Circular buffer for shake timestamps
int shakeEventIndex = 0;
unsigned long lastShakeDetectionTime = 0;
bool shakeEnabled = true;               // Can be disabled via device config

// Heartbeat Timer
unsigned long lastHeartbeat = 0;

// LED Animation State
unsigned long ledAnimationFrame = 0;

// ==================== FUNCTION DECLARATIONS ====================

void setupWiFi();
void setupMQTT();
void ensureMQTT();
void mqttCallback(char* topic, byte* payload, unsigned int length);
void publishButtonPress(const String& button, const String& pressType, const String& audioUrl = "", const String& transcript = "");

void initI2C();
void initMCP23017();
void initLEDRing();
void initI2SMicrophone();
void initI2SSpeaker();
void initAccelerometer();
void handleShakeDetection();
void sendShakeEvent();

void updateButtons();
void handleMainButtonPress();
void handleMainButtonRelease();
void checkLongPress();
void handleAuxButtonPress(int index);

size_t recordAudio();
bool uploadAudio(String& audioUrl, String& transcript);
void playRecordedAudio(size_t samples);

void ledFill(uint8_t r, uint8_t g, uint8_t b);
void ledSpinning(uint8_t r, uint8_t g, uint8_t b);
void ledPulse(uint8_t r, uint8_t g, uint8_t b);
void ledSuccess();
void ledError();

void playBeep();

// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n\n========================================");
  Serial.println("OBEDIO ESP32-S3 Smart Button - Voice");
  Serial.println("========================================\n");

  // ✅ CHECK PSRAM - CRITICAL!
  if (psramFound()) {
    Serial.printf("✅ PSRAM detected: %d bytes (%d MB)\n", ESP.getPsramSize(), ESP.getPsramSize() / 1048576);
    Serial.printf("   PSRAM free: %d bytes\n", ESP.getFreePsram());
  } else {
    Serial.println("❌ PSRAM NOT FOUND!");
    Serial.println("⚠️  Go to Tools → PSRAM → OPI PSRAM");
    ledError();
    while (true) delay(1000);
  }
  Serial.printf("SRAM free: %d bytes\n\n", ESP.getFreeHeap());

  // Initialize hardware
  initI2C();
  initMCP23017();
  initLEDRing();
  initI2SSpeaker();
  initI2SMicrophone();
  initAccelerometer();  // ← SHAKE DETECTION!

  // Allocate audio buffer in PSRAM (8MB) instead of SRAM (512KB)
  audioBuffer = (int16_t*)ps_malloc(MAX_SAMPLES * sizeof(int16_t));
  if (audioBuffer == nullptr) {
    Serial.println("❌ Failed to allocate audio buffer in PSRAM!");
    Serial.println("⚠️  Trying SRAM fallback...");
    audioBuffer = (int16_t*)malloc(MAX_SAMPLES * sizeof(int16_t));
  }

  if (audioBuffer == nullptr) {
    Serial.println("❌ Failed to allocate audio buffer!");
    ledError();
    while (true) delay(1000);
  }

  Serial.printf("✅ Audio buffer allocated: %d bytes in %s\n",
    MAX_SAMPLES * sizeof(int16_t),
    heap_caps_get_free_size(MALLOC_CAP_SPIRAM) > 0 ? "PSRAM" : "SRAM"
  );

  // Connect to WiFi and MQTT
  setupWiFi();
  setupMQTT();

  // Ready!
  ledFill(0, 255, 0);  // Green
  delay(500);
  ledFill(0, 0, 0);    // Off

  Serial.println("\n✅ Firmware ready!");
  Serial.println("📌 Hold T1 to record voice message\n");
}

// ==================== MAIN LOOP ====================

void loop() {
  // Ensure connectivity
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ WiFi disconnected, reconnecting...");
    setupWiFi();
  }
  ensureMQTT();
  mqttClient.loop();

  // Update inputs
  updateButtons();
  checkLongPress();

  // Shake detection
  if (shakeEnabled) {
    handleShakeDetection();
  }

  // Heartbeat
  unsigned long now = millis();
  if (now - lastHeartbeat >= HEARTBEAT_INTERVAL) {
    lastHeartbeat = now;
    publishButtonPress("heartbeat", "status");
  }

  delay(10);
}

// ==================== WIFI & MQTT ====================

void setupWiFi() {
  Serial.printf("📡 Connecting to WiFi: %s\n", WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n✅ WiFi connected! IP: %s\n", WiFi.localIP().toString().c_str());

    // Generate Device ID from MAC
    uint8_t mac[6];
    WiFi.macAddress(mac);
    deviceId = "BTN-";
    for (int i = 0; i < 6; i++) {
      char hex[3];
      sprintf(hex, "%02X", mac[i]);
      deviceId += hex;
    }
    Serial.printf("🆔 Device ID: %s\n", deviceId.c_str());
  } else {
    Serial.println("\n❌ WiFi connection failed!");
  }
}

void setupMQTT() {
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  ensureMQTT();
}

void ensureMQTT() {
  if (mqttClient.connected()) return;

  Serial.print("📡 Connecting to MQTT broker...");

  int attempts = 0;
  while (!mqttClient.connected() && attempts < 3) {
    if (mqttClient.connect(deviceId.c_str())) {
      Serial.println(" ✅ Connected!");

      // Subscribe to device commands
      String cmdTopic = "obedio/device/" + deviceId + "/command";
      mqttClient.subscribe(cmdTopic.c_str());
      Serial.printf("📥 Subscribed to: %s\n", cmdTopic.c_str());

      // Register device
      String regPayload = "{\"deviceId\":\"" + deviceId + "\",\"type\":\"smart_button\",\"firmwareVersion\":\"v3.0-voice\"}";
      mqttClient.publish("obedio/device/register", regPayload.c_str());

    } else {
      Serial.printf(" ❌ Failed (rc=%d), retrying...\n", mqttClient.state());
      delay(1000);
      attempts++;
    }
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String msg;
  for (unsigned int i = 0; i < length; i++) {
    msg += (char)payload[i];
  }
  Serial.printf("📥 MQTT [%s]: %s\n", topic, msg.c_str());

  // Handle command "accepted"
  if (msg.indexOf("accepted") != -1) {
    ledSuccess();
    playBeep();
  }
}

void publishButtonPress(const String& button, const String& pressType, const String& audioUrl, const String& transcript) {
  String topic = "obedio/button/" + deviceId + "/press";

  StaticJsonDocument<1024> doc;
  doc["deviceId"] = deviceId;
  doc["button"] = button;
  doc["pressType"] = pressType;
  doc["battery"] = 100;
  doc["rssi"] = WiFi.RSSI();
  doc["firmwareVersion"] = "v3.0-voice";
  doc["timestamp"] = millis();

  if (audioUrl.length() > 0) {
    doc["audioUrl"] = audioUrl;
  }
  if (transcript.length() > 0) {
    doc["voiceTranscript"] = transcript;
  }

  String payload;
  serializeJson(doc, payload);

  mqttClient.publish(topic.c_str(), payload.c_str());
  Serial.printf("📤 MQTT Published: %s\n", payload.c_str());
}

// ==================== HARDWARE INIT ====================

void initI2C() {
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  Serial.printf("✅ I2C initialized (SDA=%d, SCL=%d)\n", I2C_SDA_PIN, I2C_SCL_PIN);
}

void initMCP23017() {
  if (!mcp.begin_I2C(MCP_ADDR, &Wire)) {
    Serial.println("❌ MCP23017 not found!");
    while (true) delay(1000);
  }

  for (int i = 0; i < BUTTON_COUNT; i++) {
    mcp.pinMode(BUTTON_PINS[i], INPUT_PULLUP);
    lastButtonState[i] = HIGH;
    buttonState[i] = HIGH;
    lastDebounceTime[i] = 0;
  }

  Serial.println("✅ MCP23017 initialized (5 buttons)");
}

void initLEDRing() {
  strip.begin();
  strip.setBrightness(150);
  strip.show();
  Serial.printf("✅ LED Ring initialized (%d LEDs)\n", NUM_LEDS);
}

void initI2SMicrophone() {
  i2s_config_t mic_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 4,
    .dma_buf_len = BLOCK_SAMPLES,
    .use_apll = false,
    .tx_desc_auto_clear = false,
    .fixed_mclk = 0
  };

  i2s_pin_config_t mic_pins = {
    .bck_io_num = MIC_BCLK_PIN,
    .ws_io_num = MIC_WS_PIN,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num = MIC_SD_PIN
  };

  esp_err_t err = i2s_driver_install(I2S_MIC_PORT, &mic_config, 0, NULL);
  if (err != ESP_OK) {
    Serial.printf("❌ I2S MIC install error: %d\n", err);
    return;
  }

  err = i2s_set_pin(I2S_MIC_PORT, &mic_pins);
  if (err != ESP_OK) {
    Serial.printf("❌ I2S MIC pin error: %d\n", err);
    return;
  }

  i2s_zero_dma_buffer(I2S_MIC_PORT);
  Serial.println("✅ I2S Microphone initialized (16kHz)");
}

void initI2SSpeaker() {
  pinMode(SPK_SD_MODE_PIN, OUTPUT);
  digitalWrite(SPK_SD_MODE_PIN, HIGH);  // Enable amplifier

  i2s_config_t spk_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 4,
    .dma_buf_len = BLOCK_SAMPLES,
    .use_apll = false,
    .tx_desc_auto_clear = true,
    .fixed_mclk = 0
  };

  i2s_pin_config_t spk_pins = {
    .bck_io_num = SPK_BCLK_PIN,
    .ws_io_num = SPK_WS_PIN,
    .data_out_num = SPK_SD_PIN,
    .data_in_num = I2S_PIN_NO_CHANGE
  };

  esp_err_t err = i2s_driver_install(I2S_SPK_PORT, &spk_config, 0, NULL);
  if (err != ESP_OK) {
    Serial.printf("❌ I2S SPK install error: %d\n", err);
    return;
  }

  err = i2s_set_pin(I2S_SPK_PORT, &spk_pins);
  if (err != ESP_OK) {
    Serial.printf("❌ I2S SPK pin error: %d\n", err);
    return;
  }

  i2s_zero_dma_buffer(I2S_SPK_PORT);
  Serial.println("✅ I2S Speaker initialized");
}

// ==================== BUTTON HANDLING ====================

void updateButtons() {
  unsigned long now = millis();

  for (int i = 0; i < BUTTON_COUNT; i++) {
    bool reading = mcp.digitalRead(BUTTON_PINS[i]);

    if (reading != lastButtonState[i]) {
      lastDebounceTime[i] = now;
    }

    if ((now - lastDebounceTime[i]) > DEBOUNCE_DELAY) {
      if (reading != buttonState[i]) {
        buttonState[i] = reading;

        // Button pressed (LOW = pressed)
        if (buttonState[i] == LOW) {
          if (i == 0) {
            handleMainButtonPress();
          } else {
            handleAuxButtonPress(i);
          }
        }
        // Button released (HIGH = released)
        else {
          if (i == 0) {
            handleMainButtonRelease();
          }
        }
      }
    }

    lastButtonState[i] = reading;
  }
}

void handleMainButtonPress() {
  mainPressed = true;
  mainPressStart = millis();
  Serial.println("🔘 T1 pressed");
}

void handleMainButtonRelease() {
  if (!mainPressed) return;
  mainPressed = false;

  unsigned long pressDuration = millis() - mainPressStart;
  Serial.printf("🔘 T1 released (held %lums)\n", pressDuration);

  if (mainRecording) {
    // Stop recording and upload
    mainRecording = false;
    Serial.printf("🎤 Recording stopped (%d samples)\n", recordedSamples);

    if (recordedSamples > SAMPLE_RATE / 2) {  // At least 0.5 seconds
      // Show uploading animation
      ledPulse(255, 255, 0);  // Yellow pulse

      String audioUrl, transcript;
      bool success = uploadAudio(audioUrl, transcript);

      if (success) {
        Serial.println("✅ Upload successful!");
        publishButtonPress("main", "long", audioUrl, transcript);
        ledSuccess();
      } else {
        Serial.println("❌ Upload failed!");
        publishButtonPress("main", "long", "", "[Upload failed]");
        ledError();
      }

      // PLAY BACK THE RECORDED AUDIO ON SPEAKER
      Serial.println("🔊 Playing back recorded audio...");
      ledFill(0, 255, 255);  // Cyan = playback
      playRecordedAudio(recordedSamples);
      ledFill(0, 0, 0);  // Off
    } else {
      Serial.println("⚠️ Recording too short");
      ledError();
    }

    recordedSamples = 0;
  } else {
    // Short press - regular service call
    Serial.println("📞 Short press - Service Call");
    publishButtonPress("main", "single");
    ledFill(100, 100, 100);
    delay(200);
    ledFill(0, 0, 0);
  }
}

void checkLongPress() {
  if (mainPressed && !mainRecording) {
    unsigned long now = millis();
    if (now - mainPressStart >= LONG_PRESS_THRESHOLD) {
      // Start recording
      mainRecording = true;
      Serial.println("🎤 Long press detected - Recording started!");
      recordedSamples = recordAudio();
    }
  }
}

void handleAuxButtonPress(int index) {
  Serial.printf("🔘 T%d pressed\n", index + 1);

  // Aux button actions
  const char* buttonNames[] = {"", "aux1", "aux2", "aux3", "aux4"};
  publishButtonPress(buttonNames[index], "single");

  // LED patterns for aux buttons
  switch (index) {
    case 1:  // T2
      ledFill(0, 0, 255);  // Blue
      break;
    case 2:  // T3
      ledFill(0, 255, 0);  // Green
      break;
    case 3:  // T4
      ledFill(255, 255, 0);  // Yellow
      break;
    case 4:  // T5
      ledFill(255, 0, 255);  // Magenta
      break;
  }
  delay(300);
  ledFill(0, 0, 0);
}

// ==================== AUDIO RECORDING ====================

size_t recordAudio() {
  size_t index = 0;
  memset(audioBuffer, 0, MAX_SAMPLES * sizeof(int16_t));

  i2s_zero_dma_buffer(I2S_MIC_PORT);

  Serial.println("🎙️ Recording audio...");

  unsigned long startTime = millis();

  while (mainPressed && index < MAX_SAMPLES) {
    int32_t micBlock[BLOCK_SAMPLES];
    size_t bytesRead = 0;

    esp_err_t err = i2s_read(
      I2S_MIC_PORT,
      (void*)micBlock,
      sizeof(micBlock),
      &bytesRead,
      100 / portTICK_PERIOD_MS
    );

    if (err != ESP_OK || bytesRead == 0) {
      break;
    }

    int samples = bytesRead / sizeof(int32_t);
    for (int i = 0; i < samples && index < MAX_SAMPLES; i++) {
      // Convert 32-bit to 16-bit
      int32_t v = micBlock[i] >> 11;  // Shift and scale
      if (v > 32767)  v = 32767;
      if (v < -32768) v = -32768;
      audioBuffer[index++] = (int16_t)v;
    }

    // LED animation during recording
    if (index % 1000 == 0) {
      ledSpinning(0, 0, 255);  // Blue spinning
    }

    // Safety timeout
    if (millis() - startTime > MAX_RECORD_SECONDS * 1000UL) {
      break;
    }
  }

  float duration = (float)index / SAMPLE_RATE;
  Serial.printf("✅ Recorded %.1f seconds (%d samples)\n", duration, index);

  return index;
}

// ==================== HTTP UPLOAD ====================

bool uploadAudio(String& audioUrl, String& transcript) {
  if (recordedSamples == 0) {
    Serial.println("❌ No audio to upload");
    return false;
  }

  HTTPClient http;
  String url = "http://" + String(BACKEND_HOST) + ":" + String(BACKEND_PORT) + String(UPLOAD_ENDPOINT);

  Serial.printf("📤 Uploading to: %s\n", url.c_str());

  http.begin(url);
  http.setTimeout(30000);  // 30 second timeout

  // Create WAV header
  uint32_t dataSize = recordedSamples * sizeof(int16_t);
  uint8_t wavHeader[44];

  // RIFF header
  memcpy(wavHeader, "RIFF", 4);
  *((uint32_t*)(wavHeader + 4)) = dataSize + 36;
  memcpy(wavHeader + 8, "WAVE", 4);

  // fmt chunk
  memcpy(wavHeader + 12, "fmt ", 4);
  *((uint32_t*)(wavHeader + 16)) = 16;  // fmt chunk size
  *((uint16_t*)(wavHeader + 20)) = 1;   // PCM format
  *((uint16_t*)(wavHeader + 22)) = 1;   // Mono
  *((uint32_t*)(wavHeader + 24)) = SAMPLE_RATE;
  *((uint32_t*)(wavHeader + 28)) = SAMPLE_RATE * 2;  // Byte rate
  *((uint16_t*)(wavHeader + 32)) = 2;   // Block align
  *((uint16_t*)(wavHeader + 34)) = 16;  // Bits per sample

  // data chunk
  memcpy(wavHeader + 36, "data", 4);
  *((uint32_t*)(wavHeader + 40)) = dataSize;

  // Create multipart form data
  String boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
  String contentType = "multipart/form-data; boundary=" + boundary;

  http.addHeader("Content-Type", contentType);

  // Build multipart body
  String header = "--" + boundary + "\r\n";
  header += "Content-Disposition: form-data; name=\"audio\"; filename=\"recording.wav\"\r\n";
  header += "Content-Type: audio/wav\r\n\r\n";

  String footer = "\r\n--" + boundary + "--\r\n";

  // Calculate total size
  size_t totalSize = header.length() + 44 + dataSize + footer.length();

  // Send POST request
  WiFiClient* stream = http.getStreamPtr();
  http.addHeader("Content-Length", String(totalSize));

  http.POST((uint8_t*)nullptr, 0);  // Start POST

  // Send header
  stream->print(header);

  // Send WAV header
  stream->write(wavHeader, 44);

  // Send audio data in chunks
  const size_t chunkSize = 2048;
  uint8_t* audioData = (uint8_t*)audioBuffer;
  for (size_t i = 0; i < dataSize; i += chunkSize) {
    size_t remaining = dataSize - i;
    size_t toSend = (remaining < chunkSize) ? remaining : chunkSize;
    stream->write(audioData + i, toSend);
  }

  // Send footer
  stream->print(footer);

  // Get response
  int httpCode = http.GET();  // Actually reads response from POST

  bool success = false;
  if (httpCode == 200 || httpCode == 201) {
    String response = http.getString();
    Serial.printf("✅ Upload OK (HTTP %d)\n", httpCode);
    Serial.println("Response: " + response);

    // Parse JSON response
    StaticJsonDocument<1024> doc;
    DeserializationError error = deserializeJson(doc, response);

    if (!error) {
      if (doc["success"] == true && doc.containsKey("data")) {
        audioUrl = doc["data"]["audioUrl"].as<String>();
        if (doc["data"].containsKey("translation")) {
          transcript = doc["data"]["translation"].as<String>();
        } else if (doc["data"].containsKey("transcript")) {
          transcript = doc["data"]["transcript"].as<String>();
        }

        Serial.println("🎵 Audio URL: " + audioUrl);
        Serial.println("📝 Transcript: " + transcript);
        success = true;
      }
    } else {
      Serial.println("❌ JSON parse error: " + String(error.c_str()));
    }
  } else {
    Serial.printf("❌ Upload failed: HTTP %d\n", httpCode);
    Serial.println(http.getString());
  }

  http.end();
  return success;
}

// ==================== LED ANIMATIONS ====================

void ledFill(uint8_t r, uint8_t g, uint8_t b) {
  for (int i = 0; i < NUM_LEDS; i++) {
    strip.setPixelColor(i, strip.Color(r, g, b));
  }
  strip.show();
}

void ledSpinning(uint8_t r, uint8_t g, uint8_t b) {
  static uint8_t pos = 0;
  pos = (pos + 1) % NUM_LEDS;

  for (int i = 0; i < NUM_LEDS; i++) {
    uint8_t brightness = (i == pos) ? 255 : 20;
    strip.setPixelColor(i, strip.Color(
      r * brightness / 255,
      g * brightness / 255,
      b * brightness / 255
    ));
  }
  strip.show();
  delay(50);
}

void ledPulse(uint8_t r, uint8_t g, uint8_t b) {
  for (int brightness = 0; brightness < 255; brightness += 15) {
    ledFill(r * brightness / 255, g * brightness / 255, b * brightness / 255);
    delay(20);
  }
  for (int brightness = 255; brightness > 0; brightness -= 15) {
    ledFill(r * brightness / 255, g * brightness / 255, b * brightness / 255);
    delay(20);
  }
}

void ledSuccess() {
  // Green flash
  for (int i = 0; i < 3; i++) {
    ledFill(0, 255, 0);
    delay(100);
    ledFill(0, 0, 0);
    delay(100);
  }
}

void ledError() {
  // Red flash
  for (int i = 0; i < 5; i++) {
    ledFill(255, 0, 0);
    delay(150);
    ledFill(0, 0, 0);
    delay(150);
  }
}

// ==================== AUDIO PLAYBACK ====================

void playRecordedAudio(size_t samples) {
  if (samples == 0 || audioBuffer == nullptr) {
    Serial.println("⚠️ No audio to play");
    return;
  }

  Serial.printf("🔊 Playing %d samples...\n", samples);

  size_t samplesPlayed = 0;
  while (samplesPlayed < samples) {
    size_t remaining = samples - samplesPlayed;
    size_t chunkSize = (remaining > BLOCK_SAMPLES) ? BLOCK_SAMPLES : remaining;

    size_t bytesToWrite = chunkSize * sizeof(int16_t);
    size_t bytesWritten = 0;

    esp_err_t err = i2s_write(
      I2S_SPK_PORT,
      (const void*)(audioBuffer + samplesPlayed),
      bytesToWrite,
      &bytesWritten,
      portMAX_DELAY
    );

    if (err != ESP_OK || bytesWritten == 0) {
      Serial.println("❌ I2S write error during playback");
      break;
    }

    samplesPlayed += bytesWritten / sizeof(int16_t);
  }

  Serial.println("✅ Playback finished");
}

// ==================== SPEAKER ====================

void playBeep() {
  const int freq = 1000;  // 1kHz beep
  const int durationMs = 200;
  const int totalSamples = SAMPLE_RATE * durationMs / 1000;

  for (int i = 0; i < totalSamples; i++) {
    float phase = (2.0 * PI * freq * i) / SAMPLE_RATE;
    int16_t sample = (sin(phase) > 0) ? 10000 : -10000;

    size_t written;
    i2s_write(I2S_SPK_PORT, &sample, sizeof(sample), &written, 10 / portTICK_PERIOD_MS);
  }
}

// ==================== SHAKE DETECTION ====================

void initAccelerometer() {
  Serial.print("🔄 Initializing LIS3DH accelerometer... ");

  // Initialize shake event buffer
  for (int i = 0; i < 10; i++) {
    shakeEventTimes[i] = 0;
  }

  // Initialize accelerometer with I2C
  if (accel.begin(Wire, LIS3DH_ADDR)) {
    // Configure accelerometer
    accel.setOutputDataRate(LIS3DHTR_DATARATE_50HZ);  // 50Hz sampling rate
    accel.setFullScaleRange(LIS3DHTR_RANGE_16G);      // ±16g range for shake detection
    accel.setHighSolution(true);                       // High resolution mode

    Serial.println("✅");
    Serial.println("  Data Rate: 50Hz");
    Serial.println("  Range: ±16g");
    Serial.printf("  Shake Threshold: %.1fg\n", shakeThreshold);
    Serial.println("  Shake Detection: " + String(shakeEnabled ? "Enabled" : "Disabled"));
  } else {
    Serial.println("❌ Failed!");
    Serial.println("⚠️  Shake detection will be disabled");
    shakeEnabled = false;
  }
  Serial.println();
}

void handleShakeDetection() {
  unsigned long currentMillis = millis();

  // Enforce cooldown period between shake detections
  if (currentMillis - lastShakeDetectionTime < SHAKE_COOLDOWN_MS) {
    return;
  }

  // Read acceleration values (in g's)
  float x = accel.getAccelerationX();
  float y = accel.getAccelerationY();
  float z = accel.getAccelerationZ();

  // Calculate total acceleration magnitude
  float magnitude = sqrt(x*x + y*y + z*z);

  // Remove gravity component (1g) to get actual motion
  float motion = abs(magnitude - 1.0);

  // Check if motion exceeds threshold
  if (motion > shakeThreshold) {
    // Record this shake event in circular buffer
    shakeEventTimes[shakeEventIndex] = currentMillis;
    shakeEventIndex = (shakeEventIndex + 1) % 10;  // Wrap around

    // Count recent shake events within time window
    int recentShakeCount = 0;
    for (int i = 0; i < 10; i++) {
      if (shakeEventTimes[i] > 0 && (currentMillis - shakeEventTimes[i]) < SHAKE_TIME_WINDOW_MS) {
        recentShakeCount++;
      }
    }

    // If we have enough shakes in the time window, trigger shake event
    if (recentShakeCount >= SHAKE_MIN_COUNT) {
      Serial.println("🚨 SHAKE DETECTED!");
      Serial.println("  Motion: " + String(motion) + "g");
      Serial.println("  Threshold: " + String(shakeThreshold) + "g");
      Serial.println("  Shake count: " + String(recentShakeCount) + " in " + String(SHAKE_TIME_WINDOW_MS) + "ms");

      // Send shake event
      sendShakeEvent();

      // LED feedback - Red flash for emergency shake
      ledFill(255, 0, 0);  // Red
      delay(200);
      ledFill(0, 0, 0);    // Off
      delay(100);
      ledFill(255, 0, 0);  // Red flash again
      delay(200);
      ledFill(0, 0, 0);    // Off

      // Reset shake event buffer
      for (int i = 0; i < 10; i++) {
        shakeEventTimes[i] = 0;
      }

      // Update last detection time to enforce cooldown
      lastShakeDetectionTime = currentMillis;
    }
  }
}

void sendShakeEvent() {
  String audioUrl = "";
  String transcript = "";
  publishButtonPress("main", "shake", audioUrl, transcript);
  Serial.println("✅ Shake event published via MQTT");
}
