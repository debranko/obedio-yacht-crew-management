/**
 * OBEDIO Custom PCB - Audio Recording Addition
 * Add these sections to your obedio-custom-pcb-simple.ino
 *
 * This enables:
 * - 30-second voice recording at 8kHz 16-bit
 * - WAV file encoding
 * - HTTP upload to backend
 * - Play back in web app
 */

// ==================== ADD TO INCLUDES (after line 11) ====================
#include <driver/i2s.h>
#include <HTTPClient.h>

// ==================== ADD TO CONFIGURATION (after line 43) ====================

// I2S Microphone Configuration
#define I2S_WS 38          // Word Select (LRCK)
#define I2S_SD 34          // Serial Data (DOUT)
#define I2S_SCK 33         // Serial Clock (BCLK)
#define I2S_PORT I2S_NUM_0

// Audio Recording Settings
#define SAMPLE_RATE 8000           // 8kHz for voice (best balance)
#define BITS_PER_SAMPLE 16         // 16-bit audio
#define MAX_RECORD_TIME_SEC 30     // 30 seconds max
#define BUFFER_SIZE (SAMPLE_RATE * MAX_RECORD_TIME_SEC)  // 240,000 samples = 480KB

// Backend server for audio upload
const char* backend_server = "http://10.10.0.207:8080";

// ==================== ADD TO GLOBAL VARIABLES (after line 90) ====================

// Audio buffer (480KB for 30s at 8kHz 16-bit)
int16_t* audioBuffer = NULL;
size_t recordedSamples = 0;
bool audioRecording = false;

// ==================== ADD THESE FUNCTIONS BEFORE setup() ====================

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

  Serial.println("[OK] Microphone initialized (8kHz 16-bit)");
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
  String url = String(backend_server) + "/api/upload-audio";
  http.begin(url);

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
  http.begin(url);
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

// ==================== MODIFY checkButtons() FUNCTION ====================
// Replace the T1 (main button) handling section with this:

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
              // Your existing button handling code for aux buttons
              publishButtonPress(BUTTON_MQTT[i], "single");
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

// ==================== ADD TO setup() FUNCTION ====================
// Add this line after mcp initialization (around line 468):

  setupMicrophone();

// ==================== USAGE SUMMARY ====================
/*
 * HARDWARE CONNECTIONS:
 * - I2S Microphone (INMP441 or similar):
 *   - WS (Word Select/LRCK) → GPIO 38
 *   - SD (Serial Data/DOUT) → GPIO 34
 *   - SCK (Serial Clock/BCLK) → GPIO 33
 *   - VDD → 3.3V
 *   - GND → GND
 *   - L/R → GND (for left channel)
 *
 * MEMORY USAGE:
 * - Audio buffer: 480KB (30 seconds at 8kHz 16-bit)
 * - Fits comfortably in ESP32-S3's 512KB RAM
 * - Buffer is freed after upload
 *
 * WORKFLOW:
 * 1. User presses and holds T1 (main button)
 * 2. Blue LEDs pulse = recording in progress
 * 3. User releases button → recording stops
 * 4. Green LEDs = uploading to backend
 * 5. White flash = success, audio URL sent via MQTT
 * 6. Red flash = upload failed
 * 7. Memory cleared, ready for next recording
 */
