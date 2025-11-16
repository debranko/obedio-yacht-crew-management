/**
 * OBEDIO Custom PCB - Voice Recording Firmware
 * ESP32-S3 with MCP23017, LIS3DHTR, NeoPixel, I2S Microphone
 * 
 * Features:
 * - 6 physical buttons (T1-T6) with debouncing
 * - T1 (main button) - Voice recording (hold to record, release to upload)
 * - T2-T6 (aux buttons) - Regular button presses
 * - 16 NeoPixel LED ring with rainbow animation
 * - LIS3DHTR accelerometer for shake detection
 * - I2S microphone for 15-second voice recording at 8kHz 16-bit
 * - WAV file encoding and HTTP upload to backend
 * - MQTT communication for button events
 */

#include <Wire.h>
#include <Adafruit_MCP23X17.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Adafruit_NeoPixel.h>
#include <LIS3DHTR.h>
#include <driver/i2s.h>
#include <HTTPClient.h>

// ==================== CONFIGURATION ====================

// WiFi and MQTT
const char* ssid = "Obedio";
const char* password = "BrankomeinBruder:)";
const char* mqtt_server = "10.10.0.207";
const int mqtt_port = 1883;

// Backend server for audio upload
const char* backend_server = "http://10.10.0.207:8080/api/upload/upload-audio";

// I2C Pins
const int SDA_PIN = 3;
const int SCL_PIN = 2;

// I2C Addresses
#define MCP23017_ADDRESS 0x20
#define LIS3DHTR_ADDRESS 0x19

// Buttons on MCP23017 GPA bank
const uint8_t BUTTON_PINS[] = {7, 6, 5, 4, 3, 0};  // T1-T6
const int BUTTON_COUNT = 6;
const char* BUTTON_NAMES[] = {"T1", "T2", "T3", "T4", "T5", "T6"};
const char* BUTTON_MQTT[] = {"main", "aux1", "aux2", "aux3", "aux4", "aux5"};

// NeoPixel LED
#define LED_PIN 17
#define NUM_LEDS 16

// Shake detection threshold (increased to reduce sensitivity)
#define SHAKE_THRESHOLD 3.5  // G-force threshold for shake

// Touch sensor pin for main button (ESP32-S3 capacitive touch)
#define TOUCH_PIN 1  // GPIO1 - capacitive touch for main button
#define TOUCH_THRESHOLD 40  // Touch detection threshold

// I2S Microphone Configuration
#define I2S_WS 38          // Word Select (LRCK)
#define I2S_SD 34          // Serial Data (DOUT)
#define I2S_SCK 33         // Serial Clock (BCLK)
#define I2S_PORT I2S_NUM_0

// Audio Recording Settings
#define SAMPLE_RATE 8000           // 8kHz for voice (best balance)
#define BITS_PER_SAMPLE 16         // 16-bit audio
#define MAX_RECORD_TIME_SEC 15     // 15 seconds max (reduced from 30s for battery safety)
#define BUFFER_SIZE (SAMPLE_RATE * MAX_RECORD_TIME_SEC)  // 120,000 samples = 240KB

// ==================== GLOBAL OBJECTS ====================

WiFiClient espClient;
PubSubClient client(espClient);
Adafruit_MCP23X17 mcp;
Adafruit_NeoPixel strip = Adafruit_NeoPixel(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);
LIS3DHTR<TwoWire> accel;

// ==================== GLOBAL VARIABLES ====================

String deviceId = "BTN-";

// Button debounce and press detection
unsigned long lastDebounceTime[BUTTON_COUNT];
bool lastButtonState[BUTTON_COUNT] = {HIGH, HIGH, HIGH, HIGH, HIGH, HIGH};
bool buttonState[BUTTON_COUNT] = {HIGH, HIGH, HIGH, HIGH, HIGH, HIGH};
const unsigned long debounceDelay = 50;

// Button press timing for double-click and long press
unsigned long buttonPressTime[BUTTON_COUNT] = {0, 0, 0, 0, 0, 0};
unsigned long buttonReleaseTime[BUTTON_COUNT] = {0, 0, 0, 0, 0, 0};
bool buttonPressed[BUTTON_COUNT] = {false, false, false, false, false, false};
const unsigned long doubleClickWindow = 500;  // 500ms window for double-click
const unsigned long longPressTime = 700;      // 700ms for long press

// Touch sensor detection
unsigned long lastTouchTime = 0;
unsigned long touchPressTime = 0;
bool touchActive = false;
bool lastTouchState = false;
const unsigned long touchDebounce = 50;
const unsigned long doubleTouchWindow = 500;  // 500ms window for double-touch

// LED animation
unsigned long previousLEDMillis = 0;
const long LEDInterval = 150;
uint16_t hue = 64;

// Shake detection
unsigned long lastShakeTime = 0;
const unsigned long shakeDebounce = 2000;  // 2 seconds between shakes

// Sequence number
uint32_t sequenceNumber = 0;

// Audio buffer (240KB for 15s at 8kHz 16-bit)
int16_t* audioBuffer = NULL;
size_t recordedSamples = 0;
bool audioRecording = false;

// ==================== AUDIO FUNCTIONS ====================

/**
 * Initialize I2S microphone
 */
void setupMicrophone() {
  i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT,  // ESP32-S3 uses 32-bit internally
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 4,
    .dma_buf_len = 1024,
    .use_apll = false,
    .tx_desc_auto_clear = false,
    .fixed_mclk = 0
  };

  i2s_pin_config_t pin_config = {
    .bck_io_num = I2S_SCK,
    .ws_io_num = I2S_WS,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num = I2S_SD
  };

  i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL);
  i2s_set_pin(I2S_PORT, &pin_config);
  i2s_zero_dma_buffer(I2S_PORT);

  Serial.println("[OK] Microphone initialized (8kHz 16-bit, 15s max)");
}

/**
 * Record audio while button is held down
 * Returns number of samples recorded
 */
size_t recordAudio(uint8_t buttonPin) {
  if (audioBuffer == NULL) {
    audioBuffer = (int16_t*)malloc(BUFFER_SIZE * sizeof(int16_t));
    if (audioBuffer == NULL) {
      Serial.println("❌ Failed to allocate audio buffer");
      return 0;
    }
  }

  size_t samplesRecorded = 0;
  const size_t blockSize = 512;
  int32_t i2sBuffer[blockSize];

  Serial.println("🎤 Recording... (release button to stop)");

  // Record while button is held (LOW = pressed)
  while (mcp.digitalRead(buttonPin) == LOW && samplesRecorded < BUFFER_SIZE) {
    size_t bytesRead = 0;

    i2s_read(I2S_PORT, i2sBuffer, blockSize * sizeof(int32_t), &bytesRead, portMAX_DELAY);
    size_t samplesRead = bytesRead / sizeof(int32_t);

    // Convert 32-bit I2S data to 16-bit PCM
    for (size_t i = 0; i < samplesRead && samplesRecorded < BUFFER_SIZE; i++) {
      // Shift and scale: ESP32-S3 I2S gives 32-bit, we want 16-bit
      audioBuffer[samplesRecorded++] = (int16_t)(i2sBuffer[i] >> 14);
    }

    // Visual feedback - pulsing blue LED while recording
    if (samplesRecorded % (SAMPLE_RATE / 4) == 0) {  // Every 0.25 seconds
      uint8_t brightness = (samplesRecorded % (SAMPLE_RATE / 2) < (SAMPLE_RATE / 4)) ? 100 : 30;
      for (int i = 0; i < NUM_LEDS; i++) {
        strip.setPixelColor(i, strip.Color(0, 0, brightness));
      }
      strip.show();
    }
  }

  Serial.printf("✅ Recorded %d samples (%.1f seconds)\n",
                samplesRecorded, (float)samplesRecorded / SAMPLE_RATE);

  return samplesRecorded;
}

/**
 * Create WAV header
 */
void createWAVHeader(uint8_t* header, uint32_t dataSize) {
  uint32_t fileSize = dataSize + 36;  // Total file size minus 8 bytes
  uint16_t numChannels = 1;           // Mono
  uint32_t byteRate = SAMPLE_RATE * numChannels * (BITS_PER_SAMPLE / 8);
  uint16_t blockAlign = numChannels * (BITS_PER_SAMPLE / 8);

  // RIFF header
  memcpy(header, "RIFF", 4);
  *((uint32_t*)(header + 4)) = fileSize;
  memcpy(header + 8, "WAVE", 4);

  // fmt sub-chunk
  memcpy(header + 12, "fmt ", 4);
  *((uint32_t*)(header + 16)) = 16;  // Sub-chunk size
  *((uint16_t*)(header + 20)) = 1;   // Audio format (PCM)
  *((uint16_t*)(header + 22)) = numChannels;
  *((uint32_t*)(header + 24)) = SAMPLE_RATE;
  *((uint32_t*)(header + 28)) = byteRate;
  *((uint16_t*)(header + 32)) = blockAlign;
  *((uint16_t*)(header + 34)) = BITS_PER_SAMPLE;

  // data sub-chunk
  memcpy(header + 36, "data", 4);
  *((uint32_t*)(header + 40)) = dataSize;
}

/**
 * Upload WAV audio to backend
 * Returns the audio URL from backend, or empty string on failure
 */
String uploadAudioToBackend(int16_t* samples, size_t numSamples) {
  if (samples == NULL || numSamples == 0) {
    return "";
  }

  Serial.println("📤 Uploading audio to backend...");

  HTTPClient http;
  http.begin(backend_server);

  // Prepare WAV file
  uint32_t dataSize = numSamples * sizeof(int16_t);
  uint32_t totalSize = dataSize + 44;  // 44-byte WAV header + data

  // Create multipart form data
  String boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
  String contentType = "multipart/form-data; boundary=" + boundary;
  http.addHeader("Content-Type", contentType);

  // Build multipart body
  String header = "--" + boundary + "\r\n";
  header += "Content-Disposition: form-data; name=\"audio\"; filename=\"recording.wav\"\r\n";
  header += "Content-Type: audio/wav\r\n\r\n";

  String footer = "\r\n--" + boundary + "--\r\n";

  // Calculate total POST size
  size_t totalPostSize = header.length() + totalSize + footer.length();

  // Send POST request with streaming
  http.addHeader("Content-Length", String(totalPostSize));

  WiFiClient* stream = http.getStreamPtr();

  // Start POST
  http.begin(backend_server);
  http.addHeader("Content-Type", contentType);

  // Send header
  stream->print(header);

  // Send WAV header
  uint8_t wavHeader[44];
  createWAVHeader(wavHeader, dataSize);
  stream->write(wavHeader, 44);

  // Send audio data in chunks
  const size_t chunkSize = 1024;
  for (size_t i = 0; i < numSamples; i += chunkSize) {
    size_t remaining = numSamples - i;
    size_t toSend = (remaining < chunkSize) ? remaining : chunkSize;
    stream->write((uint8_t*)(samples + i), toSend * sizeof(int16_t));
  }

  // Send footer
  stream->print(footer);

  // Get response
  int httpCode = http.GET();  // This actually sends the POST we prepared

  String audioUrl = "";
  if (httpCode == 200 || httpCode == 201) {
    String response = http.getString();
    Serial.println("✅ Upload successful!");
    Serial.println("Response: " + response);

    // Parse JSON response to get audioUrl
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, response);

    if (!error && doc.containsKey("data") && doc["data"].containsKey("audioUrl")) {
      audioUrl = doc["data"]["audioUrl"].as<String>();
      Serial.println("🎵 Audio URL: " + audioUrl);
    }
  } else {
    Serial.printf("❌ Upload failed: HTTP %d\n", httpCode);
    Serial.println(http.getString());
  }

  http.end();
  return audioUrl;
}

// ==================== WIFI SETUP ====================

void setup_wifi() {
    Serial.println("Connecting to WiFi...");
    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED) {
        delay(300);
        Serial.print(".");
    }

    Serial.println("\nWiFi connected");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());

    // Generate device ID from MAC
    uint8_t mac[6];
    WiFi.macAddress(mac);
    for(int i = 0; i < 6; i++) {
        char hex[3];
        sprintf(hex, "%02X", mac[i]);
        deviceId += hex;
    }

    Serial.print("Device ID: ");
    Serial.println(deviceId);
}

// ==================== MQTT ====================

void reconnect_mqtt() {
    while (!client.connected()) {
        Serial.print("Connecting to MQTT... ");

        if (client.connect(deviceId.c_str())) {
            Serial.println("connected");

            // Send registration
            registerDevice();
        } else {
            Serial.print("failed (rc=");
            Serial.print(client.state());
            Serial.println("), retry in 5s");
            delay(5000);
        }
    }
}

void registerDevice() {
    StaticJsonDocument<512> doc;
    doc["deviceId"] = deviceId;
    doc["type"] = "smart_button";
    doc["name"] = "Custom PCB Button";
    doc["firmwareVersion"] = "v2.2-voice";
    doc["hardwareVersion"] = "ESP32-S3 Custom PCB";
    doc["macAddress"] = WiFi.macAddress();
    doc["ipAddress"] = WiFi.localIP().toString();
    doc["rssi"] = WiFi.RSSI();

    JsonObject cap = doc.createNestedObject("capabilities");
    cap["button"] = true;
    cap["led"] = true;
    cap["accelerometer"] = true;
    cap["microphone"] = true;

    String payload;
    serializeJson(doc, payload);

    client.publish("obedio/device/register", payload.c_str());
    Serial.println("Device registered");
}

void publishButtonPress(const char* button, const char* pressType) {
    sequenceNumber++;

    StaticJsonDocument<512> doc;
    doc["deviceId"] = deviceId;
    doc["button"] = button;
    doc["pressType"] = pressType;
    doc["battery"] = 100;
    doc["rssi"] = WiFi.RSSI();
    doc["firmwareVersion"] = "v2.2-voice";
    doc["timestamp"] = millis();
    doc["sequenceNumber"] = sequenceNumber;

    String payload;
    serializeJson(doc, payload);

    String topic = "obedio/button/" + deviceId + "/press";

    if (client.publish(topic.c_str(), payload.c_str())) {
        Serial.print("Published: ");
        Serial.print(button);
        Serial.print(" (");
        Serial.print(pressType);
        Serial.println(")");
    }
}

// ==================== LED ANIMATION ====================

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

// ==================== BUTTON HANDLING ====================

void checkButtons() {
  for (int i = 0; i < BUTTON_COUNT; i++) {
    bool reading = mcp.digitalRead(BUTTON_PINS[i]);

    // Invert logic for last button if needed
    if (i == BUTTON_COUNT - 1) {
      reading = !reading;
    }

    if (reading != lastButtonState[i]) {
      lastDebounceTime[i] = millis();
    }

    if ((millis() - lastDebounceTime[i]) > debounceDelay) {
      if (reading != buttonState[i]) {
        buttonState[i] = reading;

        // Button pressed (transition to LOW)
        if (buttonState[i] == LOW) {
          buttonPressTime[i] = millis();
          buttonPressed[i] = true;

          Serial.print("Button ");
          Serial.print(BUTTON_NAMES[i]);
          Serial.println(" pressed down");

          // SPECIAL: T1 (main button) starts voice recording
          if (i == 0) {  // T1 = index 0
            // Show recording indicator (blue LEDs)
            for (int j = 0; j < NUM_LEDS; j++) {
              strip.setPixelColor(j, strip.Color(0, 0, 255));
            }
            strip.show();

            // Start recording
            recordedSamples = recordAudio(BUTTON_PINS[0]);
          }
        }
        // Button released (transition to HIGH)
        else {
          if (buttonPressed[i]) {
            unsigned long pressDuration = millis() - buttonPressTime[i];

            Serial.print("Button ");
            Serial.print(BUTTON_NAMES[i]);
            Serial.print(" released after ");
            Serial.print(pressDuration);
            Serial.println("ms");

            // SPECIAL: T1 (main button) - upload voice recording
            if (i == 0 && recordedSamples > 0) {
              // Show uploading indicator (green LEDs)
              for (int j = 0; j < NUM_LEDS; j++) {
                strip.setPixelColor(j, strip.Color(0, 255, 0));
              }
              strip.show();

              // Upload audio and get URL
              String audioUrl = uploadAudioToBackend(audioBuffer, recordedSamples);

              if (audioUrl.length() > 0) {
                // Publish voice message with audio URL
                StaticJsonDocument<1024> doc;
                doc["deviceId"] = deviceId;
                doc["button"] = "main";
                doc["pressType"] = "voice";
                doc["voiceAudioUrl"] = audioUrl;
                doc["battery"] = 100;
                doc["rssi"] = WiFi.RSSI();
                doc["firmwareVersion"] = "v2.2-voice";
                doc["timestamp"] = millis();
                doc["sequenceNumber"] = ++sequenceNumber;

                String payload;
                serializeJson(doc, payload);

                String topic = "obedio/button/" + deviceId + "/press";
                client.publish(topic.c_str(), payload.c_str());

                Serial.println("✅ Voice message published with audio URL");

                // Success flash (white)
                for (int j = 0; j < NUM_LEDS; j++) {
                  strip.setPixelColor(j, strip.Color(255, 255, 255));
                }
                strip.show();
                delay(200);
              } else {
                // Error flash (red)
                for (int j = 0; j < NUM_LEDS; j++) {
                  strip.setPixelColor(j, strip.Color(255, 0, 0));
                }
                strip.show();
                delay(500);
              }

              // Clear recording buffer
              recordedSamples = 0;
            }
            // Other buttons (T2-T6) - regular button press handling
            else if (i > 0) {
              unsigned long timeSinceLastRelease = millis() - buttonReleaseTime[i];
              String pressType = "single";

              // Long press detection (held for > 700ms)
              if (pressDuration >= longPressTime) {
                pressType = "long";

                // Flash LEDs blue for long press
                for (int j = 0; j < NUM_LEDS; j++) {
                  strip.setPixelColor(j, strip.Color(0, 100, 255));
                }
                strip.show();
                delay(150);

                publishButtonPress(BUTTON_MQTT[i], pressType.c_str());
              }
              // Check for double-click (quick press within 500ms window)
              else if (timeSinceLastRelease < doubleClickWindow && timeSinceLastRelease > 50) {
                pressType = "double";

                // Flash LEDs yellow for double-click
                for (int j = 0; j < NUM_LEDS; j++) {
                  strip.setPixelColor(j, strip.Color(255, 200, 0));
                }
                strip.show();
                delay(150);

                publishButtonPress(BUTTON_MQTT[i], pressType.c_str());
                buttonReleaseTime[i] = 0;  // Reset to prevent triple-click
              }
              // Single press
              else {
                // Flash LEDs white for single press
                for (int j = 0; j < NUM_LEDS; j++) {
                  strip.setPixelColor(j, strip.Color(255, 255, 255));
                }
                strip.show();
                delay(100);

                // Special handling for DND button (aux5 = button index 5)
                if (i == 5) {  // T6 / aux5
                  Serial.println("DND button pressed - toggling DND");
                  publishButtonPress("aux5", "single");
                } else {
                  publishButtonPress(BUTTON_MQTT[i], "single");
                }
              }
            }

            buttonReleaseTime[i] = millis();
            buttonPressed[i] = false;
          }
        }
      }
    }

    lastButtonState[i] = reading;
  }
}

// ==================== TOUCH SENSOR HANDLING ====================

void checkTouch() {
    // Read capacitive touch value (ESP32-S3 touch sensor)
    int touchValue = touchRead(TOUCH_PIN);
    bool touched = (touchValue < TOUCH_THRESHOLD);

    // Debounce touch detection
    if (touched != lastTouchState) {
        unsigned long currentTime = millis();

        if ((currentTime - lastTouchTime) > touchDebounce) {
            lastTouchState = touched;
            lastTouchTime = currentTime;

            // Touch started
            if (touched) {
                touchPressTime = currentTime;
                touchActive = true;

                Serial.print("Touch detected - value: ");
                Serial.println(touchValue);
            }
            // Touch released
            else if (touchActive) {
                unsigned long touchDuration = currentTime - touchPressTime;
                unsigned long timeSinceLastTouch = currentTime - lastTouchTime;

                Serial.print("Touch released after ");
                Serial.print(touchDuration);
                Serial.println("ms");

                // Check for double-touch (within 500ms window)
                if (timeSinceLastTouch < doubleTouchWindow && timeSinceLastTouch > touchDebounce) {
                    // Flash LEDs purple for double-touch
                    for (int j = 0; j < NUM_LEDS; j++) {
                        strip.setPixelColor(j, strip.Color(200, 0, 255));
                    }
                    strip.show();
                    delay(150);

                    publishButtonPress("main", "double-touch");
                    Serial.println("Double-touch detected!");

                    lastTouchTime = 0;  // Reset to prevent triple-touch
                }
                // Single touch
                else {
                    // Flash LEDs cyan for touch
                    for (int j = 0; j < NUM_LEDS; j++) {
                        strip.setPixelColor(j, strip.Color(0, 255, 200));
                    }
                    strip.show();
                    delay(100);

                    publishButtonPress("main", "touch");
                    Serial.println("Single touch detected!");
                }

                touchActive = false;
            }
        }
    }
}

// ==================== ACCELEROMETER ====================

void checkShake() {
    // Read accelerometer
    float x = accel.getAccelerationX();
    float y = accel.getAccelerationY();
    float z = accel.getAccelerationZ();

    // Calculate total acceleration magnitude
    float magnitude = sqrt(x*x + y*y + z*z);

    // Detect shake (sudden acceleration change)
    if (magnitude > SHAKE_THRESHOLD && (millis() - lastShakeTime) > shakeDebounce) {
        lastShakeTime = millis();

        // Flash LEDs red for shake/emergency
        for (int i = 0; i < NUM_LEDS; i++) {
            strip.setPixelColor(i, strip.Color(255, 0, 0));
        }
        strip.show();
        delay(200);

        // Publish shake event as emergency
        publishButtonPress("main", "shake");

        Serial.println("SHAKE DETECTED - Emergency!");
    }
}

// ==================== SETUP ====================

void setup() {
    Serial.begin(115200);
    delay(200);

    // Initialize NeoPixel
    strip.begin();
    strip.setBrightness(200);
    strip.show();
    Serial.println("NeoPixel initialized");

    // Initialize I2C
    Wire.begin(SDA_PIN, SCL_PIN);
    Serial.println("I2C initialized");

    // Initialize MCP23017
    if (!mcp.begin_I2C(MCP23017_ADDRESS, &Wire)) {
        Serial.println("ERROR: MCP23017 not found!");
        while (true) {
            // Flash red to indicate error
            for (int i = 0; i < NUM_LEDS; i++) {
                strip.setPixelColor(i, strip.Color(255, 0, 0));
            }
            strip.show();
            delay(500);
            strip.clear();
            strip.show();
            delay(500);
        }
    }
    Serial.println("MCP23017 initialized");

    // Initialize buttons
    for (int i = 0; i < BUTTON_COUNT; i++) {
        mcp.pinMode(BUTTON_PINS[i], INPUT_PULLUP);
        lastButtonState[i] = HIGH;
        buttonState[i] = HIGH;
        lastDebounceTime[i] = 0;
    }
    Serial.println("Buttons initialized");

    // Initialize LIS3DHTR accelerometer
    accel.begin(Wire, LIS3DHTR_ADDRESS);
    delay(100);
    accel.setOutputDataRate(LIS3DHTR_DATARATE_50HZ);
    accel.setFullScaleRange(LIS3DHTR_RANGE_2G);
    Serial.println("LIS3DHTR accelerometer initialized");

    // Initialize I2S microphone
    setupMicrophone();

    // Connect WiFi
    setup_wifi();

    // Setup MQTT
    client.setServer(mqtt_server, mqtt_port);
    client.setBufferSize(2048);

    // Startup LED sequence (green wipe)
    for (int i = 0; i < NUM_LEDS; i++) {
        strip.setPixelColor(i, strip.Color(0, 255, 0));
        strip.show();
        delay(30);
    }
    delay(500);

    Serial.println("Setup complete!");
    Serial.println("Voice recording enabled: Hold T1 to record, release to upload");
}

// ==================== MAIN LOOP ====================

void loop() {
    // Maintain MQTT connection
    if (!client.connected()) {
        reconnect_mqtt();
    }
    client.loop();

    // Check WiFi
    if (WiFi.status() != WL_CONNECTED) {
        setup_wifi();
    }

    // Check buttons (physical presses)
    checkButtons();

    // Check touch sensor (capacitive touch on main button)
    // DISABLED: Touch sensor causing timeout errors - needs proper initialization
    // checkTouch();

    // Check for shake (accelerometer)
    checkShake();

    // Update LED animation
    rainbow();
}