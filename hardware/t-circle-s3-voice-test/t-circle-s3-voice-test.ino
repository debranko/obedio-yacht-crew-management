/**
 * ═══════════════════════════════════════════════════════════════════════════
 * T-CIRCLE S3 VOICE RECORDING TEST
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Test firmware for LILYGO T-Circle S3 to verify voice recording and
 * HTTP upload works correctly. This is a reference implementation to
 * isolate reboot issues on the custom Obedio PCB.
 *
 * Features:
 * - Touch & hold to record (release to stop)
 * - Auto-detect V1.0 (I2S) or V1.1 (PDM) microphone
 * - HTTP POST upload to backend (multipart/form-data WAV)
 * - MQTT message with transcription URL
 * - Display feedback (recording, uploading, success, error)
 * - PSRAM audio buffer (no String concatenation!)
 *
 * Hardware: LILYGO T-Circle S3
 * - ESP32-S3R8 (8MB PSRAM, 16MB Flash)
 * - 0.75" TFT 160x160 (GC9D01N)
 * - CST816D Touch Controller
 * - MSM261 (V1.0) or MP34DT05 (V1.1) Microphone
 *
 * Author: Obedio Team
 * Date: 2025
 * ═══════════════════════════════════════════════════════════════════════════
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <driver/i2s.h>
#include <Wire.h>
#include <SPI.h>

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION - EDIT THESE!
// ═══════════════════════════════════════════════════════════════════════════

// WiFi Configuration
const char* WIFI_SSID = "Obedio";
const char* WIFI_PASSWORD = "BrankomeinBruder:)";

// MQTT Configuration
const char* MQTT_BROKER = "10.10.0.207";
const int MQTT_PORT = 1883;

// Backend Configuration
const char* BACKEND_HOST = "10.10.0.207";
const int BACKEND_PORT = 8081;  // HTTP port for ESP32 (HTTPS on 8080)
const char* UPLOAD_ENDPOINT = "/api/upload/upload-audio";

// ═══════════════════════════════════════════════════════════════════════════
// PIN DEFINITIONS - T-Circle S3 (VERIFIED from LILYGO Wiki)
// ═══════════════════════════════════════════════════════════════════════════
// Source: https://wiki.lilygo.cc/get_started/en/Display/T-Circle-S3/
// ═══════════════════════════════════════════════════════════════════════════

// I2S Microphone Pins (V1.0 - MSM261S4030H0R)
// From LILYGO Wiki: https://wiki.lilygo.cc/get_started/en/Display/T-Circle-S3/
#define I2S_MIC_BCLK    7
#define I2S_MIC_WS      9
#define I2S_MIC_DATA    8

// PDM Microphone Pins (V1.1 - MP34DT05-A)
#define PDM_MIC_CLK     9
#define PDM_MIC_DATA    8

// Display Pins (GC9D01N) - Standard 4-wire SPI
// From LILYGO Wiki: CS=13, DC=16, MOSI=17, SCLK=15, BL=18
#define TFT_CS          13
#define TFT_DC          16
#define TFT_RST         -1   // Not connected (use -1)
#define TFT_MOSI        17
#define TFT_SCLK        15
#define TFT_BL          18   // Backlight

// Touch Controller (CST816D on I2C)
// From LILYGO Wiki: SDA=11, SCL=14, INT=12
#define TOUCH_SDA       11
#define TOUCH_SCL       14
#define TOUCH_INT       12
#define TOUCH_RST       -1
#define CST816D_ADDR    0x15

// APA102 LED
// From LILYGO Wiki: DATA=38, CLK=39
#define LED_DATA        38
#define LED_CLK         39

// ═══════════════════════════════════════════════════════════════════════════
// AUDIO CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const int SAMPLE_RATE = 16000;          // Required for Whisper API
const int BITS_PER_SAMPLE = 16;
const int CHANNELS = 1;                 // Mono
const int MAX_RECORD_SECONDS = 10;      // Maximum recording time
const int AUDIO_BUFFER_SIZE = SAMPLE_RATE * MAX_RECORD_SECONDS * 2;  // 320KB

// Software gain to boost weak microphone signal
// MSM261 outputs at ~4% of full scale, 8x provides good boost without clipping
#define AUDIO_GAIN 8
const int DMA_BUFFER_SIZE = 1024;       // 256 samples at 16kHz = 16ms per buffer
const int DMA_BUFFER_COUNT = 16;        // Total: 256ms buffering (increased from 128ms)

// I2S Port
const i2s_port_t I2S_PORT = I2S_NUM_0;

// Microphone type enum
enum MicType {
  MIC_TYPE_UNKNOWN,
  MIC_TYPE_I2S,     // V1.0 - MSM261
  MIC_TYPE_PDM      // V1.1 - MP34DT05
};

// ═══════════════════════════════════════════════════════════════════════════
// DISPLAY CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

#define SCREEN_WIDTH    160
#define SCREEN_HEIGHT   160

// Colors (RGB565)
#define COLOR_BLACK     0x0000
#define COLOR_WHITE     0xFFFF
#define COLOR_RED       0xF800
#define COLOR_GREEN     0x07E0
#define COLOR_BLUE      0x001F
#define COLOR_YELLOW    0xFFE0
#define COLOR_ORANGE    0xFD20
#define COLOR_DARK_RED  0x8000
#define COLOR_DARK_BLUE 0x0010

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL OBJECTS
// ═══════════════════════════════════════════════════════════════════════════

WiFiClient wifiClient;        // For MQTT
PubSubClient mqttClient(wifiClient);
SPIClass* displaySPI = nullptr;

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL VARIABLES
// ═══════════════════════════════════════════════════════════════════════════

// Device
String deviceId = "";

// Microphone
MicType micType = MIC_TYPE_UNKNOWN;
bool micInitialized = false;

// Audio buffers (allocated in PSRAM)
uint8_t* audioBuffer = nullptr;
uint8_t* uploadBuffer = nullptr;
size_t audioLength = 0;

// Recording state
bool isRecording = false;
bool touchPressed = false;
bool lastTouchState = false;
unsigned long recordStartTime = 0;
unsigned long touchStartTime = 0;
const unsigned long LONG_PRESS_THRESHOLD = 500;  // 500ms = long press (voice)

// Display state
enum DisplayState {
  DISPLAY_IDLE,
  DISPLAY_RECORDING,
  DISPLAY_UPLOADING,
  DISPLAY_SUCCESS,
  DISPLAY_ERROR
};
DisplayState currentDisplayState = DISPLAY_IDLE;
unsigned long displayStateTime = 0;
String lastTranscript = "";
String lastError = "";

// Animation
unsigned long lastAnimationUpdate = 0;
int animationFrame = 0;

// ═══════════════════════════════════════════════════════════════════════════
// FORWARD DECLARATIONS
// ═══════════════════════════════════════════════════════════════════════════

void setupWiFi();
void setupMQTT();
void reconnectMQTT();
void testHttpConnectivity();
bool initI2SMicrophone();
bool initPDMMicrophone();
bool initMicrophone();
void setupDisplay();
void setupTouch();
bool isTouchPressed();
void startRecording();
void stopRecording();
size_t recordAudioChunk();
bool uploadAudio();
void sendVoiceMQTT(const char* audioUrl, const char* transcript);
void sendShortPressMQTT();
void buildWavHeader(uint8_t* header, size_t audioLen, int sampleRate);
void updateDisplay();
void displayIdle();
void displayRecording(float seconds);
void displayUploading();
void displaySuccess(const char* transcript);
void displayError(const char* message);
void fillScreen(uint16_t color);
void drawCenteredText(const char* text, int y, uint16_t color);
void drawCircle(int cx, int cy, int r, uint16_t color);
void fillCircle(int cx, int cy, int r, uint16_t color);
String getDeviceId();

// ═══════════════════════════════════════════════════════════════════════════
// SETUP
// ═══════════════════════════════════════════════════════════════════════════

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n═══════════════════════════════════════════════════════════");
  Serial.println("  T-CIRCLE S3 VOICE RECORDING TEST");
  Serial.println("═══════════════════════════════════════════════════════════\n");

  // Check PSRAM
  if (psramFound()) {
    Serial.printf("PSRAM: %d bytes available\n", ESP.getPsramSize());
  } else {
    Serial.println("WARNING: PSRAM not found! Audio may fail.");
  }

  // Allocate audio buffers in PSRAM
  Serial.println("\nAllocating audio buffers in PSRAM...");
  audioBuffer = (uint8_t*)ps_malloc(AUDIO_BUFFER_SIZE);
  uploadBuffer = (uint8_t*)ps_malloc(AUDIO_BUFFER_SIZE + 1000);  // +1000 for headers

  if (!audioBuffer || !uploadBuffer) {
    Serial.println("ERROR: Failed to allocate PSRAM buffers!");
    while (1) delay(1000);
  }
  Serial.printf("  audioBuffer: %d bytes at %p\n", AUDIO_BUFFER_SIZE, audioBuffer);
  Serial.printf("  uploadBuffer: %d bytes at %p\n", AUDIO_BUFFER_SIZE + 1000, uploadBuffer);

  // Initialize display
  Serial.println("\nInitializing display...");
  setupDisplay();
  fillScreen(COLOR_BLACK);
  drawCenteredText("Initializing...", 80, COLOR_WHITE);

  // Initialize touch
  Serial.println("Initializing touch controller...");
  setupTouch();

  // Initialize microphone (auto-detect V1.0 vs V1.1)
  Serial.println("Initializing microphone...");
  if (!initMicrophone()) {
    Serial.println("ERROR: Microphone initialization failed!");
    displayError("Mic init failed!");
    delay(3000);
  }

  // Connect to WiFi FIRST (required for MAC address)
  Serial.println("\nConnecting to WiFi...");
  fillScreen(COLOR_BLACK);
  drawCenteredText("Connecting WiFi...", 80, COLOR_BLUE);
  setupWiFi();

  // Generate Device ID AFTER WiFi init (MAC address now available)
  deviceId = getDeviceId();
  Serial.println("Device ID: " + deviceId);

  // Setup MQTT with longer keepalive
  Serial.println("Setting up MQTT...");
  setupMQTT();

  // Test HTTP connectivity
  Serial.println("\nTesting HTTP connectivity...");
  testHttpConnectivity();

  // Ready!
  Serial.println("\n═══════════════════════════════════════════════════════════");
  Serial.println("  READY - Touch and hold screen to record");
  Serial.println("═══════════════════════════════════════════════════════════\n");

  currentDisplayState = DISPLAY_IDLE;
  updateDisplay();
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN LOOP
// ═══════════════════════════════════════════════════════════════════════════

void loop() {
  // Handle MQTT
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();

  // Check WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected, reconnecting...");
    setupWiFi();
  }

  // Read touch state
  bool currentTouch = isTouchPressed();

  // Touch state change detection
  if (currentTouch && !lastTouchState) {
    // Touch just started - record the time
    touchStartTime = millis();
    Serial.println("Touch started...");
  }
  else if (currentTouch && lastTouchState && !isRecording) {
    // Touch held - check if we should start recording (long press)
    if (millis() - touchStartTime >= LONG_PRESS_THRESHOLD) {
      Serial.println("Long press detected - starting voice recording");
      startRecording();
    }
  }
  else if (!currentTouch && lastTouchState) {
    // Touch just released
    unsigned long pressDuration = millis() - touchStartTime;

    if (isRecording) {
      // Was recording - stop and upload
      Serial.println("Touch released - stopping recording");
      stopRecording();

      if (audioLength > 0) {
        Serial.printf("Recorded %d bytes (%.1f seconds)\n", audioLength, (float)audioLength / (SAMPLE_RATE * 2));

        currentDisplayState = DISPLAY_UPLOADING;
        updateDisplay();

        if (uploadAudio()) {
          currentDisplayState = DISPLAY_SUCCESS;
          displayStateTime = millis();
        } else {
          lastError = "Upload failed!";
          currentDisplayState = DISPLAY_ERROR;
          displayStateTime = millis();
        }
        updateDisplay();
      }
    }
    else if (pressDuration < LONG_PRESS_THRESHOLD) {
      // Short press - send button press MQTT
      Serial.printf("Short press detected (%lu ms) - sending button press\n", pressDuration);
      sendShortPressMQTT();

      // Brief visual feedback
      fillScreen(COLOR_GREEN);
      delay(200);
      currentDisplayState = DISPLAY_IDLE;
      updateDisplay();
    }
  }

  lastTouchState = currentTouch;

  // If recording, capture audio chunks in a tight loop
  if (isRecording) {
    // Record multiple chunks per loop iteration to maximize capture rate
    unsigned long recordLoopStart = millis();
    size_t chunksRecorded = 0;
    size_t emptyReads = 0;

    // Record for up to 50ms before yielding to other tasks
    // Keep trying even if buffer temporarily empty (DMA is continuous)
    while (millis() - recordLoopStart < 50 && audioLength < AUDIO_BUFFER_SIZE) {
      size_t bytesRead = recordAudioChunk();
      if (bytesRead > 0) {
        chunksRecorded++;
        emptyReads = 0;  // Reset empty counter
      } else {
        emptyReads++;
        // Only break if we've had many consecutive empty reads (buffer truly empty)
        if (emptyReads > 5) {
          break;
        }
        // Brief delay then retry - DMA might be filling buffer
        delayMicroseconds(500);  // 0.5ms wait
      }
    }

    // Auto-stop after max time
    if (millis() - recordStartTime >= MAX_RECORD_SECONDS * 1000) {
      Serial.println("Max recording time reached");
      stopRecording();
    }

    // Minimal yield to allow WiFi/system tasks
    yield();
  }

  // Update display animation (much less frequently during recording to avoid interrupting audio)
  unsigned long animationInterval = isRecording ? 1000 : 100;  // 1 second updates during recording
  if (millis() - lastAnimationUpdate > animationInterval) {
    lastAnimationUpdate = millis();
    animationFrame++;
    updateDisplay();
  }

  // Auto-return to idle after success/error display
  if ((currentDisplayState == DISPLAY_SUCCESS || currentDisplayState == DISPLAY_ERROR) &&
      millis() - displayStateTime > 5000) {
    currentDisplayState = DISPLAY_IDLE;
    updateDisplay();
  }

  // Only delay when not recording to maximize audio capture
  if (!isRecording) {
    delay(10);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// WIFI
// ═══════════════════════════════════════════════════════════════════════════

void setupWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting to WiFi");
  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 30) {
    delay(500);
    Serial.print(".");
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.println("IP: " + WiFi.localIP().toString());
    Serial.printf("RSSI: %d dBm\n", WiFi.RSSI());
  } else {
    Serial.println("\nWiFi connection failed!");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MQTT
// ═══════════════════════════════════════════════════════════════════════════

void setupMQTT() {
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setBufferSize(1024);
  mqttClient.setKeepAlive(120);  // 120 seconds keepalive (upload can take 30+ seconds)
  reconnectMQTT();
}

void reconnectMQTT() {
  if (mqttClient.connected()) return;

  String clientId = "tcircle-" + deviceId;
  Serial.print("Connecting to MQTT...");

  if (mqttClient.connect(clientId.c_str())) {
    Serial.println(" connected!");
  } else {
    Serial.printf(" failed, rc=%d\n", mqttClient.state());
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HTTP CONNECTIVITY TEST
// ═══════════════════════════════════════════════════════════════════════════

void testHttpConnectivity() {
  Serial.printf("Testing connection to %s:%d...\n", BACKEND_HOST, BACKEND_PORT);

  // Method 1: Raw TCP connection test
  WiFiClient tcpTestClient;
  Serial.print("  TCP connect test: ");
  if (tcpTestClient.connect(BACKEND_HOST, BACKEND_PORT)) {
    Serial.println("SUCCESS");
    tcpTestClient.stop();
  } else {
    Serial.println("FAILED - Server may not be reachable");
    return;
  }

  delay(100);  // Small delay between tests

  // Method 2: Raw socket HTTP GET to health endpoint
  WiFiClient client;
  client.setTimeout(10000);

  Serial.print("  HTTP GET /api/health (raw socket): ");

  if (!client.connect(BACKEND_HOST, BACKEND_PORT)) {
    Serial.println("Connect FAILED");
    return;
  }

  // Send HTTP request
  client.printf("GET /api/health HTTP/1.1\r\n");
  client.printf("Host: %s:%d\r\n", BACKEND_HOST, BACKEND_PORT);
  client.printf("Connection: close\r\n");
  client.printf("\r\n");

  // Wait for response
  unsigned long startWait = millis();
  while (!client.available() && millis() - startWait < 5000) {
    delay(10);
  }

  if (client.available()) {
    String statusLine = client.readStringUntil('\n');
    statusLine.trim();

    // Parse status code
    int spacePos = statusLine.indexOf(' ');
    if (spacePos > 0) {
      int httpCode = statusLine.substring(spacePos + 1, spacePos + 4).toInt();
      Serial.printf("HTTP %d", httpCode);
      if (httpCode == 200) {
        Serial.println(" - OK!");

        // Skip headers, read body
        while (client.available()) {
          String line = client.readStringUntil('\n');
          line.trim();
          if (line.isEmpty()) break;  // End of headers
        }
        if (client.available()) {
          String body = client.readString();
          Serial.println("  Response: " + body.substring(0, 100));
        }
      } else {
        Serial.println();
      }
    } else {
      Serial.println("FAILED - Invalid response: " + statusLine);
    }
  } else {
    Serial.println("FAILED - No response (timeout)");
  }

  client.stop();
}

// ═══════════════════════════════════════════════════════════════════════════
// MICROPHONE INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

bool initMicrophone() {
  // Try I2S first (V1.0 with MSM261)
  if (initI2SMicrophone()) {
    Serial.println("Detected V1.0 (I2S microphone - MSM261)");
    micType = MIC_TYPE_I2S;
    micInitialized = true;
    return true;
  }

  // Try PDM (V1.1 with MP34DT05)
  if (initPDMMicrophone()) {
    Serial.println("Detected V1.1 (PDM microphone - MP34DT05)");
    micType = MIC_TYPE_PDM;
    micInitialized = true;
    return true;
  }

  Serial.println("ERROR: No microphone detected!");
  return false;
}

bool initI2SMicrophone() {
  i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT,  // MSM261 outputs 32-bit
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = DMA_BUFFER_COUNT,
    .dma_buf_len = DMA_BUFFER_SIZE,
    .use_apll = false,
    .tx_desc_auto_clear = false,
    .fixed_mclk = 0
  };

  i2s_pin_config_t pin_config = {
    .bck_io_num = I2S_MIC_BCLK,
    .ws_io_num = I2S_MIC_WS,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num = I2S_MIC_DATA
  };

  esp_err_t err = i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL);
  if (err != ESP_OK) {
    Serial.printf("I2S driver install failed: %d\n", err);
    return false;
  }

  err = i2s_set_pin(I2S_PORT, &pin_config);
  if (err != ESP_OK) {
    Serial.printf("I2S set pin failed: %d\n", err);
    i2s_driver_uninstall(I2S_PORT);
    return false;
  }

  // Test read to verify microphone is working
  uint8_t testBuffer[128];
  size_t bytesRead = 0;
  err = i2s_read(I2S_PORT, testBuffer, sizeof(testBuffer), &bytesRead, 100);

  if (err != ESP_OK || bytesRead == 0) {
    Serial.println("I2S test read failed");
    i2s_driver_uninstall(I2S_PORT);
    return false;
  }

  Serial.printf("I2S initialized: %d bytes test read\n", bytesRead);
  return true;
}

bool initPDMMicrophone() {
  i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX | I2S_MODE_PDM),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = DMA_BUFFER_COUNT,
    .dma_buf_len = DMA_BUFFER_SIZE,
    .use_apll = false,
    .tx_desc_auto_clear = false,
    .fixed_mclk = 0
  };

  i2s_pin_config_t pin_config = {
    .bck_io_num = I2S_PIN_NO_CHANGE,  // Not used in PDM mode
    .ws_io_num = PDM_MIC_CLK,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num = PDM_MIC_DATA
  };

  esp_err_t err = i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL);
  if (err != ESP_OK) {
    Serial.printf("PDM driver install failed: %d\n", err);
    return false;
  }

  err = i2s_set_pin(I2S_PORT, &pin_config);
  if (err != ESP_OK) {
    Serial.printf("PDM set pin failed: %d\n", err);
    i2s_driver_uninstall(I2S_PORT);
    return false;
  }

  // Test read
  uint8_t testBuffer[128];
  size_t bytesRead = 0;
  err = i2s_read(I2S_PORT, testBuffer, sizeof(testBuffer), &bytesRead, 100);

  if (err != ESP_OK || bytesRead == 0) {
    Serial.println("PDM test read failed");
    i2s_driver_uninstall(I2S_PORT);
    return false;
  }

  Serial.printf("PDM initialized: %d bytes test read\n", bytesRead);
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// TOUCH CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════

void setupTouch() {
  Wire.begin(TOUCH_SDA, TOUCH_SCL);
  Wire.setClock(100000);

  // Check if CST816D is present
  Wire.beginTransmission(CST816D_ADDR);
  if (Wire.endTransmission() == 0) {
    Serial.println("CST816D touch controller found");
  } else {
    Serial.println("WARNING: CST816D not found!");
  }
}

bool isTouchPressed() {
  Wire.beginTransmission(CST816D_ADDR);
  Wire.write(0x02);  // Gesture/touch register
  if (Wire.endTransmission() != 0) {
    return false;
  }

  Wire.requestFrom(CST816D_ADDR, (uint8_t)1);
  if (Wire.available()) {
    uint8_t touchPoints = Wire.read();
    return (touchPoints > 0);
  }

  return false;
}

// ═══════════════════════════════════════════════════════════════════════════
// AUDIO RECORDING
// ═══════════════════════════════════════════════════════════════════════════

void startRecording() {
  isRecording = true;
  recordStartTime = millis();
  audioLength = 0;

  // Clear audio buffer
  memset(audioBuffer, 0, AUDIO_BUFFER_SIZE);

  currentDisplayState = DISPLAY_RECORDING;
  updateDisplay();

  Serial.println("Recording started...");
}

void stopRecording() {
  isRecording = false;
  float duration = (millis() - recordStartTime) / 1000.0;
  Serial.printf("Recording stopped: %.1f seconds, %d bytes\n", duration, audioLength);

  // Analyze recorded audio for debugging
  if (audioLength > 0) {
    int16_t* samples = (int16_t*)audioBuffer;
    int sampleCount = audioLength / 2;
    int16_t minVal = INT16_MAX;
    int16_t maxVal = INT16_MIN;
    int64_t sum = 0;
    int zeroCount = 0;

    for (int i = 0; i < sampleCount; i++) {
      int16_t s = samples[i];
      if (s < minVal) minVal = s;
      if (s > maxVal) maxVal = s;
      sum += abs(s);
      if (s == 0) zeroCount++;
    }

    int avgAmplitude = sum / sampleCount;
    int zeroPercent = (zeroCount * 100) / sampleCount;

    Serial.println("\n=== AUDIO ANALYSIS ===");
    Serial.printf("Samples: %d\n", sampleCount);
    Serial.printf("Min: %d, Max: %d\n", minVal, maxVal);
    Serial.printf("Avg amplitude: %d\n", avgAmplitude);
    Serial.printf("Zero samples: %d%%\n", zeroPercent);
    Serial.printf("Dynamic range: %d\n", maxVal - minVal);

    // Print first 20 samples
    Serial.print("First 20 samples: ");
    for (int i = 0; i < min(20, sampleCount); i++) {
      Serial.printf("%d ", samples[i]);
    }
    Serial.println("\n======================\n");

    // Quality assessment
    if (maxVal - minVal < 100) {
      Serial.println("WARNING: Very low dynamic range - audio may be silent/broken!");
    }
    if (zeroPercent > 50) {
      Serial.println("WARNING: >50% zero samples - microphone may not be working!");
    }
    if (avgAmplitude < 50) {
      Serial.println("WARNING: Very low average amplitude - check microphone!");
    }
  }
}

size_t recordAudioChunk() {
  if (!micInitialized || audioLength >= AUDIO_BUFFER_SIZE) {
    return 0;
  }

  // Temporary buffer for I2S read (larger for better throughput)
  uint8_t i2sBuffer[2048];  // 512 samples * 4 bytes each
  size_t bytesRead = 0;

  // Wait up to 50ms for DMA buffer to have data
  // 2048 bytes = 512 samples = 32ms at 16kHz, so 50ms should be plenty
  esp_err_t err = i2s_read(I2S_PORT, i2sBuffer, sizeof(i2sBuffer), &bytesRead, 50);
  if (err != ESP_OK || bytesRead == 0) {
    return 0;
  }

  // Convert to 16-bit samples
  size_t samplesRead = bytesRead / 4;  // 32-bit samples
  size_t bytesToWrite = samplesRead * 2;  // 16-bit output

  if (audioLength + bytesToWrite > AUDIO_BUFFER_SIZE) {
    bytesToWrite = AUDIO_BUFFER_SIZE - audioLength;
    samplesRead = bytesToWrite / 2;
  }

  // Convert 32-bit samples to 16-bit
  int32_t* samples32 = (int32_t*)i2sBuffer;
  int16_t* samples16 = (int16_t*)(audioBuffer + audioLength);

  // Track min/max for debugging
  static int32_t minSample = INT32_MAX;
  static int32_t maxSample = INT32_MIN;

  for (size_t i = 0; i < samplesRead; i++) {
    // MSM261 outputs 24-bit data LEFT-JUSTIFIED in 32-bit words
    // Format: [24-bit audio (bits 31-8)][8 unused bits (7-0)]
    // Shift 16 bits to get upper 16 bits of 24-bit audio
    int32_t sample32 = samples32[i];
    int16_t sample16 = (int16_t)(sample32 >> 16);

    // Apply software gain to boost weak microphone signal
    // MSM261 outputs at ~4% of full scale, so gain is needed
    int32_t amplified = (int32_t)sample16 * AUDIO_GAIN;

    // Clamp to 16-bit range to prevent overflow/distortion
    if (amplified > 32767) amplified = 32767;
    if (amplified < -32768) amplified = -32768;
    samples16[i] = (int16_t)amplified;

    // Track range for debugging (amplified values)
    if (amplified < minSample) minSample = amplified;
    if (amplified > maxSample) maxSample = amplified;
  }

  // Print audio stats every ~1 second of recording
  static unsigned long lastStatsPrint = 0;
  if (millis() - lastStatsPrint > 1000) {
    Serial.printf("Audio (gain=%dx): min=%ld, max=%ld, samples=%d\n", AUDIO_GAIN, minSample, maxSample, audioLength / 2);
    lastStatsPrint = millis();
    minSample = INT32_MAX;
    maxSample = INT32_MIN;
  }

  audioLength += bytesToWrite;

  return bytesToWrite;
}

// ═══════════════════════════════════════════════════════════════════════════
// HTTP UPLOAD
// ═══════════════════════════════════════════════════════════════════════════

void buildWavHeader(uint8_t* header, size_t audioLen, int sampleRate) {
  int byteRate = sampleRate * CHANNELS * (BITS_PER_SAMPLE / 8);
  int blockAlign = CHANNELS * (BITS_PER_SAMPLE / 8);
  int fileSize = audioLen + 36;

  // RIFF header
  header[0] = 'R'; header[1] = 'I'; header[2] = 'F'; header[3] = 'F';
  header[4] = fileSize & 0xFF;
  header[5] = (fileSize >> 8) & 0xFF;
  header[6] = (fileSize >> 16) & 0xFF;
  header[7] = (fileSize >> 24) & 0xFF;
  header[8] = 'W'; header[9] = 'A'; header[10] = 'V'; header[11] = 'E';

  // fmt chunk
  header[12] = 'f'; header[13] = 'm'; header[14] = 't'; header[15] = ' ';
  header[16] = 16; header[17] = 0; header[18] = 0; header[19] = 0;  // Chunk size
  header[20] = 1; header[21] = 0;  // Audio format (PCM)
  header[22] = CHANNELS; header[23] = 0;  // Channels
  header[24] = sampleRate & 0xFF;
  header[25] = (sampleRate >> 8) & 0xFF;
  header[26] = (sampleRate >> 16) & 0xFF;
  header[27] = (sampleRate >> 24) & 0xFF;
  header[28] = byteRate & 0xFF;
  header[29] = (byteRate >> 8) & 0xFF;
  header[30] = (byteRate >> 16) & 0xFF;
  header[31] = (byteRate >> 24) & 0xFF;
  header[32] = blockAlign; header[33] = 0;
  header[34] = BITS_PER_SAMPLE; header[35] = 0;

  // data chunk
  header[36] = 'd'; header[37] = 'a'; header[38] = 't'; header[39] = 'a';
  header[40] = audioLen & 0xFF;
  header[41] = (audioLen >> 8) & 0xFF;
  header[42] = (audioLen >> 16) & 0xFF;
  header[43] = (audioLen >> 24) & 0xFF;
}

bool uploadAudio() {
  if (audioLength == 0) {
    Serial.println("No audio to upload");
    return false;
  }

  Serial.printf("Uploading %d bytes of audio...\n", audioLength);

  // ============================================================
  // ASYNC UPLOAD ARCHITECTURE (2025-01-25)
  // - ESP32 uploads audio + deviceId
  // - Server returns 200 immediately
  // - ESP32 closes connection without reading response body
  // - Server transcribes in background and creates service request
  // - Dashboard notified via WebSocket (not ESP32 MQTT)
  // ============================================================

  // Build multipart form data
  const char* boundary = "----ObedioBoundary7MA4YWxk";

  // Multipart part 1: deviceId field (so server can create service request)
  char deviceIdField[256];
  snprintf(deviceIdField, sizeof(deviceIdField),
    "--%s\r\n"
    "Content-Disposition: form-data; name=\"deviceId\"\r\n\r\n"
    "%s\r\n",
    boundary, deviceId.c_str());

  // Multipart part 2: audio file
  char audioHeader[256];
  snprintf(audioHeader, sizeof(audioHeader),
    "--%s\r\n"
    "Content-Disposition: form-data; name=\"audio\"; filename=\"recording.wav\"\r\n"
    "Content-Type: audio/wav\r\n\r\n",
    boundary);

  // Multipart footer
  char multipartFooter[64];
  snprintf(multipartFooter, sizeof(multipartFooter), "\r\n--%s--\r\n", boundary);

  // WAV header
  uint8_t wavHeader[44];
  buildWavHeader(wavHeader, audioLength, SAMPLE_RATE);

  // Calculate total content length
  size_t deviceIdLen = strlen(deviceIdField);
  size_t audioHeaderLen = strlen(audioHeader);
  size_t footerLen = strlen(multipartFooter);
  size_t contentLength = deviceIdLen + audioHeaderLen + 44 + audioLength + footerLen;

  Serial.printf("Content length: %d bytes\n", contentLength);
  Serial.printf("Free heap: %d bytes\n", ESP.getFreeHeap());

  // ========================================
  // RAW SOCKET HTTP
  // ========================================
  WiFiClient client;
  client.setTimeout(5000);  // 5 second timeout (server responds immediately now)

  Serial.printf("Connecting to %s:%d...\n", BACKEND_HOST, BACKEND_PORT);

  if (!client.connect(BACKEND_HOST, BACKEND_PORT)) {
    Serial.println("Connection failed!");
    lastError = "No connection";
    return false;
  }
  Serial.println("Connected!");

  // Build HTTP request header
  char httpHeader[512];
  snprintf(httpHeader, sizeof(httpHeader),
    "POST %s HTTP/1.1\r\n"
    "Host: %s:%d\r\n"
    "Content-Type: multipart/form-data; boundary=%s\r\n"
    "Content-Length: %d\r\n"
    "Connection: close\r\n"
    "\r\n",
    UPLOAD_ENDPOINT, BACKEND_HOST, BACKEND_PORT, boundary, contentLength);

  // Send HTTP header
  client.print(httpHeader);

  // Send deviceId field (server needs this to create service request)
  client.print(deviceIdField);

  // Send audio header
  client.print(audioHeader);

  // Send WAV header
  client.write(wavHeader, 44);

  // Send audio data in chunks
  Serial.println("Uploading audio...");
  const size_t CHUNK_SIZE = 4096;
  size_t sent = 0;
  unsigned long lastProgress = millis();

  while (sent < audioLength) {
    size_t toSend = min(CHUNK_SIZE, audioLength - sent);
    size_t written = client.write(audioBuffer + sent, toSend);

    if (written == 0) {
      Serial.println("Write failed!");
      client.stop();
      lastError = "Write failed";
      return false;
    }

    sent += written;

    // Progress update every 500ms
    if (millis() - lastProgress > 500) {
      Serial.printf("  %d / %d bytes (%.0f%%)\n", sent, audioLength, (float)sent / audioLength * 100);
      lastProgress = millis();
    }

    yield();  // Allow WiFi stack to process
  }

  // Send multipart footer
  client.print(multipartFooter);
  Serial.printf("Upload complete: %d bytes sent\n", sent);

  // ============================================================
  // SIMPLIFIED RESPONSE HANDLING
  // Server returns immediately - just check HTTP status code
  // Don't wait for response body (transcription happens in background)
  // ============================================================
  unsigned long startWait = millis();
  while (!client.available() && millis() - startWait < 5000) {
    delay(10);
  }

  if (!client.available()) {
    Serial.println("No response (timeout)");
    client.stop();
    lastError = "Timeout";
    return false;
  }

  // Read ONLY the status line
  String statusLine = client.readStringUntil('\n');
  statusLine.trim();

  // Parse HTTP status code
  int httpCode = 0;
  int spacePos = statusLine.indexOf(' ');
  if (spacePos > 0) {
    httpCode = statusLine.substring(spacePos + 1, spacePos + 4).toInt();
  }

  // Close connection immediately - don't read response body!
  // Server transcribes in background and creates service request
  client.stop();

  Serial.printf("HTTP %d - %s\n", httpCode, httpCode == 200 ? "OK" : "Error");

  if (httpCode == 200) {
    // Server accepted upload - transcription happening in background
    // Service request will be created by server and sent via WebSocket
    lastTranscript = "Processing...";  // Show on display
    Serial.println("✅ Audio uploaded! Server processing in background.");
    return true;
  } else {
    Serial.printf("❌ Upload failed: HTTP %d\n", httpCode);
    lastError = "HTTP " + String(httpCode);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MQTT MESSAGING
// ═══════════════════════════════════════════════════════════════════════════

void sendVoiceMQTT(const char* audioUrl, const char* transcript) {
  // Ensure MQTT is connected (may have disconnected during upload)
  if (!mqttClient.connected()) {
    Serial.println("MQTT disconnected, reconnecting...");
    reconnectMQTT();
  }

  if (!mqttClient.connected()) {
    Serial.println("MQTT reconnection failed, skipping publish");
    return;
  }

  StaticJsonDocument<512> doc;
  doc["deviceId"] = deviceId;
  doc["button"] = "main";
  doc["pressType"] = "long";
  doc["audioUrl"] = audioUrl;
  if (transcript) doc["voiceTranscript"] = transcript;
  doc["timestamp"] = millis();
  doc["battery"] = 100;
  doc["rssi"] = WiFi.RSSI();
  doc["firmwareVersion"] = "t-circle-test-v1.0";

  char payload[512];
  serializeJson(doc, payload);

  String topic = "obedio/button/" + deviceId + "/press";

  if (mqttClient.publish(topic.c_str(), payload)) {
    Serial.println("MQTT published: " + topic);
    Serial.println(payload);
  } else {
    Serial.println("MQTT publish failed");
  }
}

void sendShortPressMQTT() {
  // Ensure MQTT is connected
  if (!mqttClient.connected()) {
    Serial.println("MQTT disconnected, reconnecting...");
    reconnectMQTT();
  }

  if (!mqttClient.connected()) {
    Serial.println("MQTT reconnection failed, skipping publish");
    return;
  }

  StaticJsonDocument<256> doc;
  doc["deviceId"] = deviceId;
  doc["button"] = "main";
  doc["pressType"] = "short";
  doc["timestamp"] = millis();
  doc["battery"] = 100;
  doc["rssi"] = WiFi.RSSI();
  doc["firmwareVersion"] = "t-circle-test-v1.0";

  char payload[256];
  serializeJson(doc, payload);

  String topic = "obedio/button/" + deviceId + "/press";

  if (mqttClient.publish(topic.c_str(), payload)) {
    Serial.println("MQTT published (short press): " + topic);
    Serial.println(payload);
  } else {
    Serial.println("MQTT publish failed");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DISPLAY (Simple SPI implementation)
// ═══════════════════════════════════════════════════════════════════════════

void setupDisplay() {
  // Initialize SPI for display
  displaySPI = new SPIClass(HSPI);
  displaySPI->begin(TFT_SCLK, -1, TFT_MOSI, TFT_CS);
  displaySPI->setFrequency(40000000);  // 40MHz SPI clock for GC9D01N

  pinMode(TFT_CS, OUTPUT);
  pinMode(TFT_DC, OUTPUT);
  pinMode(TFT_BL, OUTPUT);

  digitalWrite(TFT_CS, HIGH);
  digitalWrite(TFT_BL, HIGH);  // Backlight on

  // Reset display - only if TFT_RST is connected (not -1)
  if (TFT_RST >= 0) {
    pinMode(TFT_RST, OUTPUT);
    digitalWrite(TFT_RST, HIGH);
    delay(5);
    digitalWrite(TFT_RST, LOW);
    delay(20);
    digitalWrite(TFT_RST, HIGH);
    delay(150);
    Serial.println("Display reset via RST pin");
  } else {
    // Software reset when no hardware reset pin
    writeCommand(0x01);  // Software Reset
    delay(150);
    Serial.println("Display reset via software command");
  }

  // ========================================
  // GC9D01N Full Initialization Sequence
  // (Based on LILYGO T-Circle S3 reference)
  // ========================================

  writeCommand(0xFE);  // Inter Register Enable 1
  writeCommand(0xEF);  // Inter Register Enable 2

  // Internal voltage settings
  writeCommand(0xB0);
  writeData(0xC0);

  writeCommand(0xB2);
  writeData(0x2F);

  writeCommand(0xB3);
  writeData(0x03);

  writeCommand(0xB6);
  writeData(0x19);

  writeCommand(0xB7);
  writeData(0x01);

  writeCommand(0xAC);
  writeData(0xCB);

  writeCommand(0xAB);
  writeData(0x0E);

  // Frame rate control
  writeCommand(0xB4);
  writeData(0x04);

  // Display settings
  writeCommand(0xA8);
  writeData(0x19);

  // Gamma settings (positive)
  writeCommand(0x60);
  writeData(0x38);
  writeData(0x0B);
  writeData(0x5B);
  writeData(0x56);

  writeCommand(0x61);
  writeData(0x38);
  writeData(0x0B);
  writeData(0x5B);
  writeData(0x56);

  writeCommand(0x62);
  writeData(0x38);
  writeData(0x0B);
  writeData(0x5B);
  writeData(0x56);

  writeCommand(0x63);
  writeData(0xFF);
  writeData(0xB8);
  writeData(0x28);
  writeData(0x20);

  writeCommand(0x64);
  writeData(0x38);
  writeData(0x0B);
  writeData(0x73);
  writeData(0x56);

  writeCommand(0x65);
  writeData(0x38);
  writeData(0x0B);
  writeData(0x5B);
  writeData(0x56);

  writeCommand(0x66);
  writeData(0x38);
  writeData(0x0B);
  writeData(0x5B);
  writeData(0x56);

  writeCommand(0x67);
  writeData(0x00);
  writeData(0x00);
  writeData(0xFF);
  writeData(0xFF);

  // VCOM setting
  writeCommand(0x9D);
  writeData(0x20);

  writeCommand(0x74);
  writeData(0x22);
  writeData(0x0E);
  writeData(0x08);
  writeData(0x20);
  writeData(0x33);
  writeData(0x0A);
  writeData(0x47);
  writeData(0x06);

  // Inversion
  writeCommand(0x98);
  writeData(0x3E);
  writeData(0x07);

  // Memory Access Control - adjust orientation
  writeCommand(0x36);
  writeData(0x00);  // Normal orientation

  // Pixel Format - 16-bit RGB565
  writeCommand(0x3A);
  writeData(0x55);

  // Tearing Effect Line ON
  writeCommand(0x35);
  writeData(0x00);

  // Sleep Out
  writeCommand(0x11);
  delay(120);

  // Display ON
  writeCommand(0x29);
  delay(20);

  // Disable inter register access
  writeCommand(0xFE);
  writeCommand(0xEE);

  Serial.println("Display initialized (GC9D01N)");
}

void writeCommand(uint8_t cmd) {
  digitalWrite(TFT_DC, LOW);
  digitalWrite(TFT_CS, LOW);
  displaySPI->transfer(cmd);
  digitalWrite(TFT_CS, HIGH);
}

void writeData(uint8_t data) {
  digitalWrite(TFT_DC, HIGH);
  digitalWrite(TFT_CS, LOW);
  displaySPI->transfer(data);
  digitalWrite(TFT_CS, HIGH);
}

void setAddrWindow(int x0, int y0, int x1, int y1) {
  writeCommand(0x2A);  // Column Address Set
  writeData(0x00);
  writeData(x0);
  writeData(0x00);
  writeData(x1);

  writeCommand(0x2B);  // Row Address Set
  writeData(0x00);
  writeData(y0);
  writeData(0x00);
  writeData(y1);

  writeCommand(0x2C);  // Memory Write
}

void fillScreen(uint16_t color) {
  setAddrWindow(0, 0, SCREEN_WIDTH - 1, SCREEN_HEIGHT - 1);

  digitalWrite(TFT_DC, HIGH);
  digitalWrite(TFT_CS, LOW);

  uint8_t hi = color >> 8;
  uint8_t lo = color & 0xFF;

  for (int i = 0; i < SCREEN_WIDTH * SCREEN_HEIGHT; i++) {
    displaySPI->transfer(hi);
    displaySPI->transfer(lo);
  }

  digitalWrite(TFT_CS, HIGH);
}

void fillRect(int x, int y, int w, int h, uint16_t color) {
  if (x >= SCREEN_WIDTH || y >= SCREEN_HEIGHT) return;
  if (x + w > SCREEN_WIDTH) w = SCREEN_WIDTH - x;
  if (y + h > SCREEN_HEIGHT) h = SCREEN_HEIGHT - y;

  setAddrWindow(x, y, x + w - 1, y + h - 1);

  digitalWrite(TFT_DC, HIGH);
  digitalWrite(TFT_CS, LOW);

  uint8_t hi = color >> 8;
  uint8_t lo = color & 0xFF;

  for (int i = 0; i < w * h; i++) {
    displaySPI->transfer(hi);
    displaySPI->transfer(lo);
  }

  digitalWrite(TFT_CS, HIGH);
}

void fillCircle(int cx, int cy, int r, uint16_t color) {
  for (int y = -r; y <= r; y++) {
    for (int x = -r; x <= r; x++) {
      if (x*x + y*y <= r*r) {
        int px = cx + x;
        int py = cy + y;
        if (px >= 0 && px < SCREEN_WIDTH && py >= 0 && py < SCREEN_HEIGHT) {
          fillRect(px, py, 1, 1, color);
        }
      }
    }
  }
}

void drawCenteredText(const char* text, int y, uint16_t color) {
  // Simple text rendering - just show a colored bar for now
  // In production, use a proper font library
  int len = strlen(text);
  int x = (SCREEN_WIDTH - len * 6) / 2;
  if (x < 0) x = 0;

  // Draw a simple indicator bar
  fillRect(x, y - 5, len * 6, 10, color);
}

// ═══════════════════════════════════════════════════════════════════════════
// DISPLAY STATE UPDATES
// ═══════════════════════════════════════════════════════════════════════════

void updateDisplay() {
  switch (currentDisplayState) {
    case DISPLAY_IDLE:
      displayIdle();
      break;
    case DISPLAY_RECORDING:
      displayRecording((millis() - recordStartTime) / 1000.0);
      break;
    case DISPLAY_UPLOADING:
      displayUploading();
      break;
    case DISPLAY_SUCCESS:
      displaySuccess(lastTranscript.c_str());
      break;
    case DISPLAY_ERROR:
      displayError(lastError.c_str());
      break;
  }
}

void displayIdle() {
  static bool drawn = false;
  if (!drawn || currentDisplayState == DISPLAY_IDLE) {
    fillScreen(COLOR_BLACK);

    // Draw ready indicator (green circle in center)
    fillCircle(80, 70, 25, COLOR_GREEN);

    // WiFi indicator
    uint16_t wifiColor = (WiFi.status() == WL_CONNECTED) ? COLOR_GREEN : COLOR_RED;
    fillRect(5, 5, 10, 10, wifiColor);

    // MQTT indicator
    uint16_t mqttColor = mqttClient.connected() ? COLOR_GREEN : COLOR_RED;
    fillRect(20, 5, 10, 10, mqttColor);

    // "READY" text area
    fillRect(40, 120, 80, 20, COLOR_GREEN);

    drawn = true;
  }
}

void displayRecording(float seconds) {
  // Pulsing red circle
  fillScreen(COLOR_BLACK);

  int brightness = abs((animationFrame % 20) - 10);
  uint16_t redColor = (brightness > 5) ? COLOR_RED : COLOR_DARK_RED;

  fillCircle(80, 60, 30, redColor);

  // Timer bar
  int barWidth = (int)(seconds / MAX_RECORD_SECONDS * 120);
  fillRect(20, 110, 120, 10, COLOR_DARK_RED);
  fillRect(20, 110, barWidth, 10, COLOR_RED);

  // "REC" indicator
  fillRect(60, 130, 40, 15, COLOR_RED);
}

void displayUploading() {
  fillScreen(COLOR_BLACK);

  // Spinning indicator
  int angle = (animationFrame * 30) % 360;
  int cx = 80;
  int cy = 70;
  int r = 25;

  // Draw circle segments
  for (int i = 0; i < 8; i++) {
    int segAngle = i * 45;
    int brightness = ((angle - segAngle + 360) % 360) < 180 ? 1 : 0;
    uint16_t color = brightness ? COLOR_BLUE : COLOR_DARK_BLUE;

    float rad = segAngle * 3.14159 / 180;
    int x = cx + cos(rad) * r;
    int y = cy + sin(rad) * r;
    fillCircle(x, y, 5, color);
  }

  // "UPLOADING" bar
  fillRect(30, 120, 100, 15, COLOR_BLUE);
}

void displaySuccess(const char* transcript) {
  static bool drawn = false;
  if (!drawn) {
    fillScreen(COLOR_BLACK);

    // Green checkmark area
    fillCircle(80, 60, 30, COLOR_GREEN);

    // Transcript preview bar
    fillRect(10, 110, 140, 40, COLOR_GREEN);

    drawn = true;
  }

  // Reset drawn flag when leaving success state
  if (currentDisplayState != DISPLAY_SUCCESS) {
    drawn = false;
  }
}

void displayError(const char* message) {
  static bool drawn = false;
  if (!drawn) {
    fillScreen(COLOR_RED);

    // X mark (two rectangles)
    fillRect(60, 40, 40, 10, COLOR_WHITE);
    fillRect(75, 25, 10, 40, COLOR_WHITE);

    // Error message bar
    fillRect(10, 100, 140, 30, COLOR_WHITE);

    drawn = true;
  }

  if (currentDisplayState != DISPLAY_ERROR) {
    drawn = false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

String getDeviceId() {
  uint8_t mac[6];
  WiFi.macAddress(mac);
  char buf[20];
  snprintf(buf, sizeof(buf), "TCR-%02X%02X%02X", mac[3], mac[4], mac[5]);
  return String(buf);
}
