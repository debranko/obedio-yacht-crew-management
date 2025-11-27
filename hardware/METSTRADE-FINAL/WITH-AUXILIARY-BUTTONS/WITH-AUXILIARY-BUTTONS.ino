/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OBEDIO ESP32-S3 Smart Button - WITH AUXILIARY BUTTONS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Complete implementation matching virtual button simulator
 *
 * Features:
 * ✓ Main button (GPA7) - Short press → Service call, Long press → Voice recording
 * ✓ Auxiliary Button 1 (GPA6) - DND Toggle
 * ✓ Auxiliary Button 2 (GPA5) - Lights Control
 * ✓ Auxiliary Button 3 (GPA4) - Prepare Food
 * ✓ Auxiliary Button 4 (GPA3) - Extra Function
 * ✓ Shake detection - Emergency call
 * ✓ LED ring feedback (16x WS2812B)
 * ✓ Speaker audio feedback (MAX98357A) - Plays when request accepted
 * ✓ WiFi + MQTT integration
 *
 * Hardware: ESP32-S3 Custom PCB v3.0
 * Author: Obedio Team
 * Version: v1.0-aux-buttons
 * ═══════════════════════════════════════════════════════════════════════════
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <Adafruit_MCP23X17.h>
#include <Adafruit_NeoPixel.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <Adafruit_LIS3DH.h>
#include <Adafruit_Sensor.h>
#include <driver/i2s.h>

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

// WiFi Configuration
const char* WIFI_SSID = "Obedio";
const char* WIFI_PASSWORD = "BrankomeinBruder:)";

// MQTT Configuration
const char* MQTT_BROKER = "10.10.0.207";
const int MQTT_PORT = 1883;
const int MQTT_BUFFER_SIZE = 4096;

// Backend Configuration
const char* BACKEND_HOST = "10.10.0.207";
const int BACKEND_PORT = 8081;  // HTTP port (8080 is HTTPS - ESP32 can't do TLS)
const char* UPLOAD_ENDPOINT = "/api/upload/upload-audio";

// Hardware Pin Configuration (from schematic ESP32S3_Smart_Button_v3.0.pdf)
const uint8_t I2C_SDA = 3;
const uint8_t I2C_SCL = 2;
const uint8_t LED_RING_PIN = 17;
const uint8_t LED_RING_COUNT = 16;

// I2S Microphone Pins (MSM261S4030H0R)
const uint8_t MIC_WS = 38;      // LRCLK/WS
const uint8_t MIC_SD = 34;      // DOUT/SD
const uint8_t MIC_SCK = 33;     // BCLK/SCK

// I2S Speaker Pins (MAX98357A)
const uint8_t SPK_BCLK = 10;
const uint8_t SPK_WS = 18;      // LRCLK
const uint8_t SPK_SD = 11;      // SDATA
const uint8_t SPK_SD_MODE = 14; // SD_MODE - HIGH=on, LOW=off

// I2C Addresses
const uint8_t MCP23017_ADDR = 0x20;  // GPIO expander
const uint8_t LIS3DH_ADDR = 0x19;     // Accelerometer

// Button Pins on MCP23017 (matching virtual simulator)
const uint8_t BTN_MAIN = 7;   // GPA7 - Main button (call/voice)
const uint8_t BTN_AUX1 = 6;   // GPA6 - DND Toggle
const uint8_t BTN_AUX2 = 5;   // GPA5 - Lights Control
const uint8_t BTN_AUX3 = 4;   // GPA4 - Prepare Food
const uint8_t BTN_AUX4 = 3;   // GPA3 - Extra function

// Timing Configuration
const int DEBOUNCE_DELAY_MS = 50;
const int LONG_PRESS_TIME_MS = 700;
const unsigned long HEARTBEAT_INTERVAL_MS = 30000;
const unsigned long SHAKE_COOLDOWN_MS = 2000;
const float SHAKE_THRESHOLD = 5.0;

// Audio Recording Configuration
const int SAMPLE_RATE = 16000;
const int RECORD_TIME_SECONDS = 10;
const int I2S_BUFFER_SIZE = 1024;        // Increased from 512 for better audio
const int DMA_BUFFER_COUNT = 16;          // Increased from 4 for 16KB total DMA
const int AUDIO_BUFFER_SIZE = SAMPLE_RATE * RECORD_TIME_SECONDS * 2;  // 320KB for 10s
const i2s_port_t I2S_MIC_PORT = I2S_NUM_0;   // Microphone uses I2S0
const i2s_port_t I2S_SPK_PORT = I2S_NUM_1;   // Speaker uses I2S1
const int AUDIO_GAIN = 8;                 // Boost weak microphone signal
const int SPEAKER_SAMPLE_RATE = 16000;    // Speaker playback rate

// Firmware Information
const char* FIRMWARE_VERSION = "v1.1-psram-async";  // Fixed: PSRAM buffers, async upload, port 8081
const char* DEVICE_TYPE = "smart_button";

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL OBJECTS
// ═══════════════════════════════════════════════════════════════════════════

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);
Adafruit_MCP23X17 mcp;
Adafruit_NeoPixel ledRing(LED_RING_COUNT, LED_RING_PIN, NEO_GRB + NEO_KHZ800);
Adafruit_LIS3DH* lis = nullptr;  // Pointer - created later to avoid RMT conflict

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL VARIABLES
// ═══════════════════════════════════════════════════════════════════════════

String deviceId = "";
String mqttClientId = "";
unsigned long lastHeartbeat = 0;
uint32_t sequenceNumber = 0;
bool shakeEnabled = false;
unsigned long lastShakeTime = 0;
bool i2sMicInitialized = false;
bool i2sSpkInitialized = false;

// PSRAM Audio Buffers (allocated in setup())
uint8_t* audioBuffer = nullptr;
size_t audioLength = 0;
bool psramAvailable = false;

// LED animation state
uint8_t spinPosition = 0;
unsigned long lastSpinUpdate = 0;

// Main button state
bool btnMainCurrent = false;
bool btnMainLast = false;
unsigned long btnMainDebounce = 0;
unsigned long btnMainPressStart = 0;
bool btnMainLongPressSent = false;
bool isRecording = false;

// Auxiliary button states
bool btnAux1Current = false;
bool btnAux1Last = false;
unsigned long btnAux1Debounce = 0;

bool btnAux2Current = false;
bool btnAux2Last = false;
unsigned long btnAux2Debounce = 0;

bool btnAux3Current = false;
bool btnAux3Last = false;
unsigned long btnAux3Debounce = 0;

bool btnAux4Current = false;
bool btnAux4Last = false;
unsigned long btnAux4Debounce = 0;

// ═══════════════════════════════════════════════════════════════════════════
// FUNCTION DECLARATIONS
// ═══════════════════════════════════════════════════════════════════════════

void setupWiFi();
void setupMQTT();
void reconnectMQTT();
void setupHardware();
void setupLEDRing();
void setupI2S();
void handleMainButton();
void handleAuxButtons();
void sendButtonPress(const char* button, const char* pressType, const char* audioUrl = NULL, const char* transcript = NULL);
void sendHeartbeat();
bool i2cDeviceExists(uint8_t address);
void initAccelerometer();
void checkShake();
void sendShakeEvent();
String getDeviceId();
void setLEDColor(uint32_t color);
void setLEDPulse(uint32_t color, int pulses);
void spinLEDStep(uint32_t color);
void showConfirmation();
void playAcceptedSound();
void setupSpeaker();
void buildWavHeader(uint8_t* header, size_t audioLen, int sampleRate);
bool recordAndUploadAudio();
void mqttCallback(char* topic, byte* payload, unsigned int length);

// ═══════════════════════════════════════════════════════════════════════════
// SETUP
// ═══════════════════════════════════════════════════════════════════════════

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n═══════════════════════════════════════════════════════");
  Serial.println("  OBEDIO ESP32-S3 WITH AUXILIARY BUTTONS");
  Serial.println("  Firmware: " + String(FIRMWARE_VERSION));
  Serial.println("═══════════════════════════════════════════════════════\n");

  // Check and allocate PSRAM for audio buffers
  if (psramFound()) {
    psramAvailable = true;
    Serial.printf("✓ PSRAM found: %d bytes available\n", ESP.getPsramSize());

    // Allocate audio buffer in PSRAM
    audioBuffer = (uint8_t*)ps_malloc(AUDIO_BUFFER_SIZE);
    if (audioBuffer) {
      Serial.printf("✓ Audio buffer allocated: %d bytes in PSRAM\n", AUDIO_BUFFER_SIZE);
    } else {
      Serial.println("✗ Failed to allocate PSRAM audio buffer!");
      psramAvailable = false;
    }
  } else {
    Serial.println("⚠ PSRAM not found - using smaller heap buffer");
    psramAvailable = false;
    // Fallback: allocate smaller buffer in regular heap (only 3 seconds)
    audioBuffer = (uint8_t*)malloc(SAMPLE_RATE * 3 * 2);  // 96KB for 3s
    if (audioBuffer) {
      Serial.println("✓ Fallback buffer allocated: 96KB in heap (3s max)");
    } else {
      Serial.println("✗ Failed to allocate any audio buffer!");
    }
  }

  // Generate Device ID
  deviceId = getDeviceId();
  mqttClientId = "obedio-button-" + String(millis());
  Serial.println("Device ID: " + deviceId + "\n");

  // Initialize hardware (I2C bus, MCP23017, speaker pin)
  setupHardware();
  setupLEDRing();

  // Connect to network
  setupWiFi();
  setupMQTT();

  // Initialize accelerometer (optional - won't block if missing)
  initAccelerometer();

  // I2S microphone will initialize on first recording (lazy init)
  Serial.println("⚠ I2S microphone: Lazy init (will initialize on first recording)\n");

  Serial.println("✓ Setup complete - Ready!\n");
  setLEDPulse(ledRing.Color(0, 255, 0), 2);
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN LOOP
// ═══════════════════════════════════════════════════════════════════════════

void loop() {
  unsigned long currentMillis = millis();

  // WiFi check
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠ WiFi disconnected - reconnecting...");
    setupWiFi();
  }

  // MQTT check
  if (!mqttClient.connected()) {
    reconnectMQTT();
  } else {
    mqttClient.loop();
  }

  // Handle all buttons
  handleMainButton();
  handleAuxButtons();

  // Check shake
  if (shakeEnabled) {
    checkShake();
  }

  // Heartbeat
  if (currentMillis - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
    sendHeartbeat();
    lastHeartbeat = currentMillis;
  }

  delay(10);
}

// ═══════════════════════════════════════════════════════════════════════════
// WIFI
// ═══════════════════════════════════════════════════════════════════════════

void setupWiFi() {
  Serial.println("Connecting to WiFi: " + String(WIFI_SSID));
  setLEDColor(ledRing.Color(0, 0, 255));

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 20) {
    delay(500);
    Serial.print(".");
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi connected!");
    Serial.println("IP: " + WiFi.localIP().toString());
    Serial.println("RSSI: " + String(WiFi.RSSI()) + " dBm\n");
    setLEDPulse(ledRing.Color(0, 255, 0), 2);
  } else {
    Serial.println("\n✗ WiFi failed - restarting...");
    delay(2000);
    ESP.restart();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MQTT
// ═══════════════════════════════════════════════════════════════════════════

void setupMQTT() {
  Serial.println("Configuring MQTT: " + String(MQTT_BROKER));
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setBufferSize(MQTT_BUFFER_SIZE);
  mqttClient.setKeepAlive(60);
  mqttClient.setCallback(mqttCallback);
  reconnectMQTT();
}

// MQTT Callback for receiving commands
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  // Parse JSON payload
  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, payload, length);

  if (error) {
    Serial.println("⚠ Failed to parse MQTT message");
    return;
  }

  const char* command = doc["command"];
  if (command && strcmp(command, "ack") == 0) {
    Serial.println("✅ Server confirmed! Showing confirmation LED");
    showConfirmation();
  }
  else if (command && strcmp(command, "request_accepted") == 0) {
    Serial.println("🎉 Request accepted by crew! Playing confirmation sound");
    playAcceptedSound();
    showConfirmation();
  }
}

void reconnectMQTT() {
  int retries = 0;
  while (!mqttClient.connected() && retries < 3) {
    Serial.print("Connecting to MQTT... ");
    setLEDColor(ledRing.Color(128, 0, 128));

    if (mqttClient.connect(mqttClientId.c_str())) {
      Serial.println("✓ Connected!\n");
      String commandTopic = "obedio/device/" + deviceId + "/command";
      mqttClient.subscribe(commandTopic.c_str(), 1);
      setLEDPulse(ledRing.Color(0, 255, 0), 1);
      return;
    } else {
      Serial.println("✗ Failed, rc=" + String(mqttClient.state()));
      setLEDColor(ledRing.Color(255, 0, 0));
      delay(5000);
      retries++;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HARDWARE INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

void setupHardware() {
  Serial.println("Initializing I2C bus...");
  Wire.begin(I2C_SDA, I2C_SCL);
  Wire.setClock(100000);

  // Initialize MCP23017 GPIO expander
  Serial.print("Initializing MCP23017... ");
  if (mcp.begin_I2C(MCP23017_ADDR, &Wire)) {
    Serial.println("✓");
    // Configure all buttons as INPUT_PULLUP
    mcp.pinMode(BTN_MAIN, INPUT_PULLUP);
    mcp.pinMode(BTN_AUX1, INPUT_PULLUP);
    mcp.pinMode(BTN_AUX2, INPUT_PULLUP);
    mcp.pinMode(BTN_AUX3, INPUT_PULLUP);
    mcp.pinMode(BTN_AUX4, INPUT_PULLUP);
    Serial.println("✓ All buttons configured (Main + 4 Aux)");
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

void setupI2S() {
  if (i2sMicInitialized) {
    Serial.println("⚠ I2S already initialized");
    return;
  }

  Serial.print("🎙️ Initializing I2S microphone... ");

  i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = DMA_BUFFER_COUNT,    // 16 buffers (was 4)
    .dma_buf_len = I2S_BUFFER_SIZE,       // 1024 bytes each (was 512)
    .use_apll = false,
    .tx_desc_auto_clear = false,
    .fixed_mclk = 0
  };

  i2s_pin_config_t pin_config = {
    .bck_io_num = MIC_SCK,
    .ws_io_num = MIC_WS,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num = MIC_SD
  };

  esp_err_t err = i2s_driver_install(I2S_MIC_PORT, &i2s_config, 0, NULL);
  if (err != ESP_OK) {
    Serial.printf("✗ Failed to install driver: %d\n", err);
    i2sMicInitialized = false;
    return;
  }

  err = i2s_set_pin(I2S_MIC_PORT, &pin_config);
  if (err != ESP_OK) {
    Serial.printf("✗ Failed to set pins: %d\n", err);
    i2sMicInitialized = false;
    return;
  }

  i2sMicInitialized = true;
  Serial.println("✓");
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN BUTTON HANDLING
// ═══════════════════════════════════════════════════════════════════════════

void handleMainButton() {
  unsigned long currentMillis = millis();

  // Read button from MCP23017 (active LOW with pull-up)
  bool reading = !mcp.digitalRead(BTN_MAIN);

  // Debouncing
  if (reading != btnMainLast) {
    btnMainDebounce = currentMillis;
  }

  if ((currentMillis - btnMainDebounce) > DEBOUNCE_DELAY_MS) {
    if (reading != btnMainCurrent) {
      btnMainCurrent = reading;

      // Button PRESSED
      if (btnMainCurrent) {
        btnMainPressStart = currentMillis;
        btnMainLongPressSent = false;
        Serial.println("🔘 Main button pressed");
        setLEDColor(ledRing.Color(255, 255, 0));  // Yellow
      }
      // Button RELEASED
      else {
        unsigned long pressDuration = currentMillis - btnMainPressStart;

        if (isRecording) {
          Serial.println("🎙️ Recording stopped");
          isRecording = false;
          setLEDColor(ledRing.Color(0, 0, 0));
        }
        else if (pressDuration < LONG_PRESS_TIME_MS) {
          Serial.println("📞 SERVICE REQUEST");
          sendButtonPress("main", "single");
          setLEDPulse(ledRing.Color(0, 255, 0), 2);
        }
      }
    }

    // Check for long press while held
    if (btnMainCurrent && !btnMainLongPressSent) {
      unsigned long pressDuration = currentMillis - btnMainPressStart;
      if (pressDuration >= LONG_PRESS_TIME_MS && !isRecording) {
        Serial.println("🎙️ VOICE RECORDING STARTED");
        btnMainLongPressSent = true;
        isRecording = true;

        spinPosition = 0;  // Reset spin position for animation
        setLEDColor(ledRing.Color(128, 0, 255));  // Start with purple

        bool success = recordAndUploadAudio();

        if (success) {
          Serial.println("✅ Voice message sent! Waiting for confirmation...");
          // LED stays solid yellow (set in recordAndUploadAudio)
          // Green confirmation will be triggered by MQTT ack
        } else {
          Serial.println("❌ Voice upload failed");
          setLEDPulse(ledRing.Color(255, 0, 0), 3);
        }
      }
    }
  }

  btnMainLast = reading;
}

// ═══════════════════════════════════════════════════════════════════════════
// AUXILIARY BUTTONS HANDLING
// ═══════════════════════════════════════════════════════════════════════════

void handleAuxButtons() {
  unsigned long currentMillis = millis();

  // ────────────────────────────────────────────────────────────────────────
  // AUX1 - DND Toggle (GPA6)
  // ────────────────────────────────────────────────────────────────────────
  bool readingAux1 = !mcp.digitalRead(BTN_AUX1);
  
  if (readingAux1 != btnAux1Last) {
    btnAux1Debounce = currentMillis;
  }
  
  if ((currentMillis - btnAux1Debounce) > DEBOUNCE_DELAY_MS) {
    if (readingAux1 != btnAux1Current) {
      btnAux1Current = readingAux1;
      
      if (btnAux1Current) {
        Serial.println("🔕 AUX1 pressed - DND Toggle");
        setLEDColor(ledRing.Color(255, 165, 0));  // Orange
        sendButtonPress("aux1", "single");
        delay(200);
        setLEDColor(ledRing.Color(0, 0, 0));
      }
    }
  }
  
  btnAux1Last = readingAux1;

  // ────────────────────────────────────────────────────────────────────────
  // AUX2 - Lights Control (GPA5)
  // ────────────────────────────────────────────────────────────────────────
  bool readingAux2 = !mcp.digitalRead(BTN_AUX2);
  
  if (readingAux2 != btnAux2Last) {
    btnAux2Debounce = currentMillis;
  }
  
  if ((currentMillis - btnAux2Debounce) > DEBOUNCE_DELAY_MS) {
    if (readingAux2 != btnAux2Current) {
      btnAux2Current = readingAux2;
      
      if (btnAux2Current) {
        Serial.println("💡 AUX2 pressed - Lights Control");
        setLEDColor(ledRing.Color(255, 255, 255));  // White
        sendButtonPress("aux2", "single");
        delay(200);
        setLEDColor(ledRing.Color(0, 0, 0));
      }
    }
  }
  
  btnAux2Last = readingAux2;

  // ────────────────────────────────────────────────────────────────────────
  // AUX3 - Prepare Food (GPA4)
  // ────────────────────────────────────────────────────────────────────────
  bool readingAux3 = !mcp.digitalRead(BTN_AUX3);
  
  if (readingAux3 != btnAux3Last) {
    btnAux3Debounce = currentMillis;
  }
  
  if ((currentMillis - btnAux3Debounce) > DEBOUNCE_DELAY_MS) {
    if (readingAux3 != btnAux3Current) {
      btnAux3Current = readingAux3;
      
      if (btnAux3Current) {
        Serial.println("🍽️ AUX3 pressed - Prepare Food");
        setLEDColor(ledRing.Color(0, 255, 100));  // Green-cyan
        sendButtonPress("aux3", "single");
        delay(200);
        setLEDColor(ledRing.Color(0, 0, 0));
      }
    }
  }
  
  btnAux3Last = readingAux3;

  // ────────────────────────────────────────────────────────────────────────
  // AUX4 - Extra Function (GPA3)
  // ────────────────────────────────────────────────────────────────────────
  bool readingAux4 = !mcp.digitalRead(BTN_AUX4);

  if (readingAux4 != btnAux4Last) {
    btnAux4Debounce = currentMillis;
  }

  if ((currentMillis - btnAux4Debounce) > DEBOUNCE_DELAY_MS) {
    if (readingAux4 != btnAux4Current) {
      btnAux4Current = readingAux4;

      if (btnAux4Current) {
        Serial.println("⭐ AUX4 pressed - Extra Function");
        setLEDColor(ledRing.Color(0, 100, 255));  // Light blue
        sendButtonPress("aux4", "single");
        delay(200);
        setLEDColor(ledRing.Color(0, 0, 0));
      }
    }
  }

  btnAux4Last = readingAux4;
}

// ═══════════════════════════════════════════════════════════════════════════
// AUDIO RECORDING & UPLOAD
// ═══════════════════════════════════════════════════════════════════════════

// Helper function to build WAV header
void buildWavHeader(uint8_t* header, size_t audioLen, int sampleRate) {
  int byteRate = sampleRate * 1 * 2;  // sampleRate * channels * bytesPerSample
  int blockAlign = 1 * 2;  // channels * bytesPerSample
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
  header[22] = 1; header[23] = 0;  // Channels (mono)
  header[24] = sampleRate & 0xFF;
  header[25] = (sampleRate >> 8) & 0xFF;
  header[26] = (sampleRate >> 16) & 0xFF;
  header[27] = (sampleRate >> 24) & 0xFF;
  header[28] = byteRate & 0xFF;
  header[29] = (byteRate >> 8) & 0xFF;
  header[30] = (byteRate >> 16) & 0xFF;
  header[31] = (byteRate >> 24) & 0xFF;
  header[32] = blockAlign; header[33] = 0;
  header[34] = 16; header[35] = 0;  // Bits per sample

  // data chunk
  header[36] = 'd'; header[37] = 'a'; header[38] = 't'; header[39] = 'a';
  header[40] = audioLen & 0xFF;
  header[41] = (audioLen >> 8) & 0xFF;
  header[42] = (audioLen >> 16) & 0xFF;
  header[43] = (audioLen >> 24) & 0xFF;
}

bool recordAndUploadAudio() {
  Serial.println("🎙️ Recording audio to PSRAM...");

  // Check audio buffer is allocated
  if (!audioBuffer) {
    Serial.println("❌ Audio buffer not allocated!");
    return false;
  }

  // Initialize I2S on-demand
  if (!i2sMicInitialized) {
    Serial.println("   Initializing I2S on-demand...");
    setupI2S();
    if (!i2sMicInitialized) {
      Serial.println("❌ I2S init failed");
      return false;
    }
    delay(100);
  }

  // Determine max recording time based on buffer size
  size_t maxBufferSize = psramAvailable ? AUDIO_BUFFER_SIZE : (SAMPLE_RATE * 3 * 2);
  int maxSeconds = maxBufferSize / (SAMPLE_RATE * 2);
  Serial.printf("   Max recording time: %d seconds\n", maxSeconds);

  // Clear audio buffer
  memset(audioBuffer, 0, maxBufferSize);
  audioLength = 0;

  // ============================================================
  // RECORD AUDIO TO PSRAM BUFFER (NO STRING CONCATENATION!)
  // ============================================================
  uint8_t i2sBuffer[2048];  // Temporary buffer for I2S reads
  size_t bytesRead = 0;
  unsigned long startTime = millis();
  int32_t minSample = INT32_MAX;
  int32_t maxSample = INT32_MIN;

  Serial.println("🔴 Recording...");

  while (audioLength < maxBufferSize && (millis() - startTime) < (maxSeconds * 1000)) {
    // Read from I2S with 50ms timeout
    esp_err_t err = i2s_read(I2S_MIC_PORT, i2sBuffer, sizeof(i2sBuffer), &bytesRead, 50 / portTICK_PERIOD_MS);
    if (err != ESP_OK || bytesRead == 0) {
      continue;  // Try again
    }

    // Convert 32-bit I2S samples to 16-bit with gain
    size_t samplesRead = bytesRead / 4;
    size_t bytesToWrite = samplesRead * 2;

    if (audioLength + bytesToWrite > maxBufferSize) {
      bytesToWrite = maxBufferSize - audioLength;
      samplesRead = bytesToWrite / 2;
    }

    int32_t* samples32 = (int32_t*)i2sBuffer;
    int16_t* samples16 = (int16_t*)(audioBuffer + audioLength);

    for (size_t i = 0; i < samplesRead; i++) {
      // MSM261 outputs 24-bit left-justified in 32-bit
      int32_t sample32 = samples32[i];
      int16_t sample16 = (int16_t)(sample32 >> 16);

      // Apply software gain with clipping protection
      int32_t amplified = (int32_t)sample16 * AUDIO_GAIN;
      if (amplified > 32767) amplified = 32767;
      if (amplified < -32768) amplified = -32768;
      samples16[i] = (int16_t)amplified;

      // Track range for debugging
      if (amplified < minSample) minSample = amplified;
      if (amplified > maxSample) maxSample = amplified;
    }

    audioLength += bytesToWrite;

    // Spinning purple LED while recording
    spinLEDStep(ledRing.Color(128, 0, 255));  // Purple
  }

  float recordDuration = (millis() - startTime) / 1000.0;
  Serial.printf("📊 Recorded %.1f seconds (%d bytes)\n", recordDuration, audioLength);
  Serial.printf("   Audio range: min=%ld, max=%ld\n", minSample, maxSample);

  if (audioLength == 0) {
    Serial.println("❌ No audio recorded!");
    setLEDColor(ledRing.Color(0, 0, 0));
    return false;
  }

  // ============================================================
  // UPLOAD VIA RAW SOCKET HTTP (NO STRING CONCATENATION!)
  // ============================================================
  Serial.println("📤 Uploading audio...");
  setLEDColor(ledRing.Color(255, 255, 0));  // Yellow = uploading

  // Build multipart form data parts
  const char* boundary = "----ObedioBoundary7MA4YWxk";

  // Part 1: deviceId field (so server can create service request)
  char deviceIdField[256];
  snprintf(deviceIdField, sizeof(deviceIdField),
    "--%s\r\n"
    "Content-Disposition: form-data; name=\"deviceId\"\r\n\r\n"
    "%s\r\n",
    boundary, deviceId.c_str());

  // Part 2: audio file header
  char audioHeader[256];
  snprintf(audioHeader, sizeof(audioHeader),
    "--%s\r\n"
    "Content-Disposition: form-data; name=\"audio\"; filename=\"recording.wav\"\r\n"
    "Content-Type: audio/wav\r\n\r\n",
    boundary);

  // Footer
  char footer[64];
  snprintf(footer, sizeof(footer), "\r\n--%s--\r\n", boundary);

  // WAV header
  uint8_t wavHeader[44];
  buildWavHeader(wavHeader, audioLength, SAMPLE_RATE);

  // Calculate content length
  size_t contentLength = strlen(deviceIdField) + strlen(audioHeader) + 44 + audioLength + strlen(footer);

  // Open TCP connection
  WiFiClient client;
  client.setTimeout(10000);  // 10 second timeout

  Serial.printf("   Connecting to %s:%d...\n", BACKEND_HOST, BACKEND_PORT);
  if (!client.connect(BACKEND_HOST, BACKEND_PORT)) {
    Serial.println("❌ Connection failed!");
    setLEDColor(ledRing.Color(0, 0, 0));
    return false;
  }
  Serial.println("   Connected!");

  // Send HTTP request header
  char httpHeader[512];
  snprintf(httpHeader, sizeof(httpHeader),
    "POST %s HTTP/1.1\r\n"
    "Host: %s:%d\r\n"
    "Content-Type: multipart/form-data; boundary=%s\r\n"
    "Content-Length: %d\r\n"
    "Connection: close\r\n"
    "\r\n",
    UPLOAD_ENDPOINT, BACKEND_HOST, BACKEND_PORT, boundary, contentLength);

  client.print(httpHeader);

  // Send deviceId field
  client.print(deviceIdField);

  // Send audio header
  client.print(audioHeader);

  // Send WAV header
  client.write(wavHeader, 44);

  // Send audio data in chunks (raw binary, no String!)
  Serial.println("   Uploading audio data...");
  const size_t CHUNK_SIZE = 4096;
  size_t sent = 0;

  while (sent < audioLength) {
    size_t toSend = min(CHUNK_SIZE, audioLength - sent);
    size_t written = client.write(audioBuffer + sent, toSend);

    if (written == 0) {
      Serial.println("❌ Write failed!");
      client.stop();
      setLEDColor(ledRing.Color(0, 0, 0));
      return false;
    }

    sent += written;

    // Progress every 25%
    if (sent % (audioLength / 4) < CHUNK_SIZE) {
      Serial.printf("   Progress: %d%%\n", (sent * 100) / audioLength);
    }

    // Pulsing yellow during upload
    int brightness = 128 + 127 * sin(millis() / 200.0);
    setLEDColor(ledRing.Color(brightness, brightness, 0));

    yield();  // Allow WiFi stack to process
  }

  // Send footer
  client.print(footer);
  Serial.printf("   Upload complete: %d bytes sent\n", sent);

  // ============================================================
  // ASYNC RESPONSE HANDLING
  // Server returns 200 immediately, transcribes in background
  // Don't wait for response body!
  // ============================================================
  unsigned long startWait = millis();
  while (!client.available() && millis() - startWait < 5000) {
    delay(10);
  }

  if (!client.available()) {
    Serial.println("❌ No response (timeout)");
    client.stop();
    setLEDColor(ledRing.Color(0, 0, 0));
    return false;
  }

  // Read ONLY status line
  String statusLine = client.readStringUntil('\n');
  statusLine.trim();

  int httpCode = 0;
  int spacePos = statusLine.indexOf(' ');
  if (spacePos > 0) {
    httpCode = statusLine.substring(spacePos + 1, spacePos + 4).toInt();
  }

  // Close connection immediately - don't read response body!
  // Server transcribes in background and creates service request
  client.stop();

  Serial.printf("   HTTP %d - %s\n", httpCode, httpCode == 200 ? "OK" : "Error");

  if (httpCode == 200) {
    Serial.println("✅ Audio uploaded! Server processing in background.");
    // Solid yellow - waiting for server confirmation
    setLEDColor(ledRing.Color(255, 255, 0));
    return true;
  } else {
    Serial.printf("❌ Upload failed: HTTP %d\n", httpCode);
    setLEDPulse(ledRing.Color(255, 0, 0), 3);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SHAKE DETECTION
// ═══════════════════════════════════════════════════════════════════════════

bool i2cDeviceExists(uint8_t address) {
  Wire.beginTransmission(address);
  byte error = Wire.endTransmission();
  return (error == 0);
}

void initAccelerometer() {
  Serial.print("🔄 Scanning I2C for LIS3DH accelerometer... ");

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
    return;
  }

  Serial.print("  Initializing LIS3DH... ");

  // Create LIS3DH object dynamically (after LED init to avoid RMT conflict)
  lis = new Adafruit_LIS3DH();

  if (lis->begin(foundAddress)) {
    Serial.println("✓ SUCCESS!");

    lis->setRange(LIS3DH_RANGE_2_G);
    lis->setDataRate(LIS3DH_DATARATE_100_HZ);

    Serial.println("  Shake Detection: ENABLED");
    Serial.printf("  Threshold: %.1fg\n\n", SHAKE_THRESHOLD);

    shakeEnabled = true;
  } else {
    Serial.println("✗ INIT FAILED");
    Serial.println("  Shake Detection: DISABLED\n");
    delete lis;
    lis = nullptr;
    shakeEnabled = false;
  }
}

void checkShake() {
  if (!shakeEnabled || lis == nullptr) return;

  if (millis() - lastShakeTime < SHAKE_COOLDOWN_MS) return;

  lis->read();
  int16_t x = lis->x;
  int16_t y = lis->y;
  int16_t z = lis->z;

  long magnitude = abs(x) + abs(y) + abs(z);

  if (magnitude > 50000) {
    Serial.println("🚨 SHAKE DETECTED!");
    Serial.printf("  Magnitude: %ld (threshold: 50000)\n", magnitude);

    sendShakeEvent();
    lastShakeTime = millis();

    // Emergency LED - Red rapid flash
    for (int i = 0; i < 5; i++) {
      setLEDColor(ledRing.Color(255, 0, 0));
      delay(100);
      setLEDColor(ledRing.Color(0, 0, 0));
      delay(100);
    }
  }
}

void sendShakeEvent() {
  if (!mqttClient.connected()) {
    Serial.println("⚠ MQTT not connected");
    return;
  }

  StaticJsonDocument<512> doc;
  doc["deviceId"] = deviceId;
  doc["button"] = "main";
  doc["pressType"] = "shake";
  doc["timestamp"] = millis();
  doc["battery"] = 100;
  doc["rssi"] = WiFi.RSSI();
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["sequenceNumber"] = sequenceNumber++;

  String payload;
  serializeJson(doc, payload);

  String topic = "obedio/button/" + deviceId + "/press";

  if (mqttClient.publish(topic.c_str(), payload.c_str(), false)) {
    Serial.println("✓ Published SHAKE event (EMERGENCY)");
  } else {
    Serial.println("✗ Failed to publish shake event");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MQTT PUBLISHING
// ═══════════════════════════════════════════════════════════════════════════

void sendButtonPress(const char* button, const char* pressType, const char* audioUrl, const char* transcript) {
  if (!mqttClient.connected()) {
    Serial.println("⚠ MQTT not connected");
    return;
  }

  StaticJsonDocument<1024> doc;
  doc["deviceId"] = deviceId;
  doc["button"] = button;
  doc["pressType"] = pressType;
  doc["timestamp"] = millis();
  doc["battery"] = 100;
  doc["rssi"] = WiFi.RSSI();
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["sequenceNumber"] = sequenceNumber++;

  if (audioUrl) doc["audioUrl"] = audioUrl;
  if (transcript) doc["voiceTranscript"] = transcript;

  String payload;
  serializeJson(doc, payload);

  String topic = "obedio/button/" + deviceId + "/press";

  if (mqttClient.publish(topic.c_str(), payload.c_str(), false)) {
    Serial.println("✓ Published: " + String(button) + " / " + String(pressType));
    Serial.println("  " + payload);
  } else {
    Serial.println("✗ Publish failed");
  }
}

void sendHeartbeat() {
  if (!mqttClient.connected()) return;

  StaticJsonDocument<256> doc;
  doc["deviceId"] = deviceId;
  doc["timestamp"] = millis();
  doc["rssi"] = WiFi.RSSI();
  doc["battery"] = 100;
  doc["uptime"] = millis() / 1000;
  doc["freeHeap"] = ESP.getFreeHeap();

  String payload;
  serializeJson(doc, payload);

  mqttClient.publish("obedio/device/heartbeat", payload.c_str(), false);
  Serial.println("💓 Heartbeat");
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

String getDeviceId() {
  // Use ESP32's hardware eFuse MAC (unique per chip, always available)
  uint64_t chipId = ESP.getEfuseMac();
  char buf[20];
  snprintf(buf, sizeof(buf), "BTN-%04X%08X",
           (uint16_t)(chipId >> 32),
           (uint32_t)chipId);
  return String(buf);
}

void setLEDColor(uint32_t color) {
  for (int i = 0; i < LED_RING_COUNT; i++) {
    ledRing.setPixelColor(i, color);
  }
  ledRing.show();
}

void setLEDPulse(uint32_t color, int pulses) {
  for (int p = 0; p < pulses; p++) {
    setLEDColor(color);
    delay(200);
    setLEDColor(ledRing.Color(0, 0, 0));
    delay(200);
  }
}

// Spinning LED animation (non-blocking, call repeatedly)
void spinLEDStep(uint32_t color) {
  unsigned long now = millis();
  if (now - lastSpinUpdate < 50) return;
  lastSpinUpdate = now;

  uint8_t r = (color >> 16) & 0xFF;
  uint8_t g = (color >> 8) & 0xFF;
  uint8_t b = color & 0xFF;

  for (int i = 0; i < LED_RING_COUNT; i++) {
    ledRing.setPixelColor(i, 0);
  }

  for (int i = 0; i < 3; i++) {
    int pos = (spinPosition - i + LED_RING_COUNT) % LED_RING_COUNT;
    float brightness = 1.0 - (i * 0.3);
    ledRing.setPixelColor(pos, ledRing.Color(
      (uint8_t)(r * brightness),
      (uint8_t)(g * brightness),
      (uint8_t)(b * brightness)
    ));
  }

  ledRing.show();
  spinPosition = (spinPosition + 1) % LED_RING_COUNT;
}

// Confirmation animation
void showConfirmation() {
  uint32_t green = ledRing.Color(0, 255, 0);

  setLEDColor(ledRing.Color(0, 0, 0));
  delay(100);
  setLEDColor(green);
  delay(200);
  setLEDColor(ledRing.Color(0, 0, 0));
  delay(100);

  setLEDColor(green);
  delay(1000);

  for (int brightness = 255; brightness >= 0; brightness -= 3) {
    setLEDColor(ledRing.Color(0, brightness, 0));
    delay(12);
  }

  setLEDColor(ledRing.Color(0, 0, 0));
}

// ═══════════════════════════════════════════════════════════════════════════
// SPEAKER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

void setupSpeaker() {
  if (i2sSpkInitialized) {
    Serial.println("⚠ Speaker I2S already initialized");
    return;
  }

  Serial.print("🔊 Initializing speaker I2S... ");

  i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
    .sample_rate = SPEAKER_SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 8,
    .dma_buf_len = 512,
    .use_apll = false,
    .tx_desc_auto_clear = true,
    .fixed_mclk = 0
  };

  i2s_pin_config_t pin_config = {
    .bck_io_num = SPK_BCLK,
    .ws_io_num = SPK_WS,
    .data_out_num = SPK_SD,
    .data_in_num = I2S_PIN_NO_CHANGE
  };

  esp_err_t err = i2s_driver_install(I2S_SPK_PORT, &i2s_config, 0, NULL);
  if (err != ESP_OK) {
    Serial.printf("✗ Failed to install driver: %d\n", err);
    return;
  }

  err = i2s_set_pin(I2S_SPK_PORT, &pin_config);
  if (err != ESP_OK) {
    Serial.printf("✗ Failed to set pins: %d\n", err);
    i2s_driver_uninstall(I2S_SPK_PORT);
    return;
  }

  i2sSpkInitialized = true;
  Serial.println("✓");
}

// Play a confirmation beep when request is accepted
void playAcceptedSound() {
  Serial.println("🔊 Playing accepted sound...");

  // Initialize speaker if not already done
  if (!i2sSpkInitialized) {
    setupSpeaker();
    if (!i2sSpkInitialized) {
      Serial.println("✗ Speaker init failed");
      return;
    }
  }

  // Enable speaker amplifier
  digitalWrite(SPK_SD_MODE, HIGH);
  delay(10);  // Let amp stabilize

  // Generate a pleasant two-tone beep (like a "ding-dong")
  const int tone1Freq = 880;   // A5 note
  const int tone2Freq = 1047;  // C6 note
  const int toneDuration = 150; // ms per tone
  const int amplitude = 8000;  // Volume level

  int16_t samples[512];
  size_t bytesWritten;

  // First tone (lower)
  for (int t = 0; t < (SPEAKER_SAMPLE_RATE * toneDuration / 1000); t += 512) {
    for (int i = 0; i < 512; i++) {
      float time = (float)(t + i) / SPEAKER_SAMPLE_RATE;
      samples[i] = (int16_t)(amplitude * sin(2.0 * PI * tone1Freq * time));
    }
    i2s_write(I2S_SPK_PORT, samples, sizeof(samples), &bytesWritten, portMAX_DELAY);
  }

  delay(50);  // Brief pause between tones

  // Second tone (higher)
  for (int t = 0; t < (SPEAKER_SAMPLE_RATE * toneDuration / 1000); t += 512) {
    for (int i = 0; i < 512; i++) {
      float time = (float)(t + i) / SPEAKER_SAMPLE_RATE;
      samples[i] = (int16_t)(amplitude * sin(2.0 * PI * tone2Freq * time));
    }
    i2s_write(I2S_SPK_PORT, samples, sizeof(samples), &bytesWritten, portMAX_DELAY);
  }

  // Fade out
  delay(100);

  // Disable speaker amplifier to save power
  digitalWrite(SPK_SD_MODE, LOW);

  Serial.println("✓ Sound played");
}