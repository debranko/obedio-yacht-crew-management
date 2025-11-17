#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <Adafruit_MCP23X17.h>
#include <Adafruit_NeoPixel.h>
#include "driver/i2s.h"

// ================== CONFIG =====================

// WiFi
const char* WIFI_SSID     = "Obedio";
const char* WIFI_PASSWORD = "BrankomeinBruder:)";

// MQTT
const char* MQTT_HOST = "10.10.0.207";
const uint16_t MQTT_PORT = 1883;

// HTTP upload (raw TCP, ne koristimo HTTPClient da ne komplikujemo)
const char* HTTP_HOST = "10.10.0.207";
const uint16_t HTTP_PORT = 8080;
const char* HTTP_PATH = "/api/upload/upload-audio";

// I2C (MCP + LIS3DH)
#define I2C_SDA_PIN  3
#define I2C_SCL_PIN  2
#define MCP_ADDR     0x20

// MCP buttons on port A
const uint8_t BUTTON_PINS[] = {7, 6, 5, 4, 3}; // 0:main, 1..4: aux
const int BUTTON_COUNT = 5;

// Touch button (pretpostavka: GPIO1, proveri šemu)
#define TOUCH_BUTTON_PIN  1   // TODO: potvrdi pin

// NeoPixel ring
#define LED_PIN   17
#define NUM_LEDS  16

// I2S MIC (RX)
#define I2S_MIC_PORT  I2S_NUM_0
#define MIC_BCLK_PIN  33
#define MIC_WS_PIN    38
#define MIC_SD_PIN    34

// I2S SPK (TX)
#define I2S_SPK_PORT     I2S_NUM_1
#define SPK_BCLK_PIN     10
#define SPK_WS_PIN       18
#define SPK_SD_PIN       11
#define SPK_SD_MODE_PIN  14

// Audio params
const int SAMPLE_RATE        = 16000;
const int MAX_RECORD_SECONDS = 5;           // možeš da digneš na 10/15 kad vidiš da staje u RAM
const int BLOCK_SAMPLES      = 256;
const size_t MAX_SAMPLES     = (size_t)SAMPLE_RATE * MAX_RECORD_SECONDS;

// Button timings
const unsigned long DEBOUNCE_DELAY       = 50;
const unsigned long MAIN_LONG_THRESHOLD  = 700;       // ms
const unsigned long MAIN_DOUBLE_WINDOW   = 400;       // TODO: dupla detekcija ako želiš

// Heartbeat
const unsigned long HEARTBEAT_INTERVAL_MS = 60000;

// ================== GLOBALS ====================

Adafruit_MCP23X17 mcp;
Adafruit_NeoPixel strip(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);

WiFiClient espClient;
PubSubClient mqttClient(espClient);

String deviceId = "BTN-";

// debouncing za MCP dugmad
unsigned long lastDebounceTime[BUTTON_COUNT];
bool lastButtonState[BUTTON_COUNT];
bool buttonState[BUTTON_COUNT];

// glavno dugme stanje
bool mainPressed     = false;
bool mainRecording   = false;
unsigned long mainPressStart = 0;

// audio buffer
static int16_t audioBuffer[MAX_SAMPLES];
size_t recordedSamples = 0;

// LED state
enum LedMode {
  LED_IDLE,
  LED_MAIN_RECORDING,
  LED_MAIN_SENDING,
  LED_MAIN_ACCEPTED,
  LED_ERROR,
  LED_AUX1,
  LED_AUX2,
  LED_AUX3,
  LED_AUX4,
  LED_TOUCH,
  LED_MAIN_SHORT
};

LedMode ledMode = LED_IDLE;
unsigned long lastLedUpdate = 0;

// Heartbeat
unsigned long lastHeartbeat = 0;

// ================== FORWARD DECLS ==============

void setupWiFi();
void setupMQTT();
void ensureMQTT();
void publishButtonPress(const String& button, const String& pressType,
                        const String& transcript = "",
                        const String& translation = "",
                        const String& audioUrl = "",
                        bool voiceError = false);

void initI2C_MCP();
void initLED();
void initI2S_Mic();
void initI2S_Spk();

void updateButtons();
void handleMainButtonPressed();
void handleMainButtonReleased();
void updateMainButtonHold();

void handleAuxButtonPress(int idx);
void handleTouchButton();

void setLedMode(LedMode mode);
void updateLed();

void ledFill(uint8_t r, uint8_t g, uint8_t b);
void ledRainbowOnce();
void ledSpinBlue();

size_t recordAudio();
bool uploadAudioAndParse(String& audioUrl, String& transcript, String& translation);
void playPing();
void mqttCallback(char* topic, byte* payload, unsigned int length);

// ================== SETUP ======================

void setup() {
  Serial.begin(115200);
  delay(200);

  initI2C_MCP();
  initLED();
  initI2S_Spk();
  initI2S_Mic();

  pinMode(TOUCH_BUTTON_PIN, INPUT_PULLUP); // ako je drugačije, prilagodi

  setupWiFi();
  setupMQTT();

  setLedMode(LED_IDLE);
  Serial.println("Obedio Smart Button firmware start.");
}

// ================== LOOP =======================

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    setupWiFi();
  }
  ensureMQTT();

  mqttClient.loop();

  updateButtons();
  updateMainButtonHold();
  handleTouchButton();
  updateLed();

  // heartbeat
  unsigned long now = millis();
  if (now - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeat = now;
    String topic = "obedio/device/" + deviceId + "/heartbeat";
    String payload = "{\"deviceId\":\"" + deviceId + "\",\"status\":\"online\"}";
    mqttClient.publish(topic.c_str(), payload.c_str());
  }
}

// ============= WIFI & MQTT =====================

void setupWiFi() {
  Serial.print("WiFi connect to ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected.");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  // Device ID from MAC
  deviceId = "BTN-";
  uint8_t mac[6];
  WiFi.macAddress(mac);
  for (int i = 0; i < 6; i++) {
    char hex[3];
    sprintf(hex, "%02X", mac[i]);
    deviceId += hex;
  }
  Serial.print("Device ID: ");
  Serial.println(deviceId);
}

void setupMQTT() {
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  ensureMQTT();

  // register
  String topic = "obedio/device/register";
  String payload = "{\"deviceId\":\"" + deviceId + "\",\"deviceType\":\"button\",\"capabilities\":[\"audio\",\"ledRing\",\"buttons5\",\"touch\",\"accelerometer\"]}";
  mqttClient.publish(topic.c_str(), payload.c_str());
}

void ensureMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Connecting MQTT...");
    String clientId = deviceId;
    if (mqttClient.connect(clientId.c_str())) {
      Serial.println("connected");
      // subscribe for commands
      String cmdTopic = "obedio/device/" + deviceId + "/command";
      String otaTopic = "obedio/button/" + deviceId + "/ota";
      mqttClient.subscribe(cmdTopic.c_str());
      mqttClient.subscribe(otaTopic.c_str());
    } else {
      Serial.print("failed, rc=");
      Serial.println(mqttClient.state());
      delay(2000);
    }
  }
}

// ============= MQTT CALLBACK ===================

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String t = String(topic);
  String body;
  body.reserve(length + 1);
  for (unsigned int i = 0; i < length; i++) {
    body += (char)payload[i];
  }
  Serial.print("MQTT msg [");
  Serial.print(t);
  Serial.print("]: ");
  Serial.println(body);

  // obedio/device/{deviceId}/command
  String cmdTopic = "obedio/device/" + deviceId + "/command";
  if (t == cmdTopic) {
    // vrlo primitivno parsiranje da uhvatimo "command":"accepted"
    if (body.indexOf("\"command\"") != -1 && body.indexOf("accepted") != -1) {
      setLedMode(LED_MAIN_ACCEPTED);
      playPing();
    }
  }

  // OTA topic ignorišemo za sada
}

// ============= I2C, MCP, LED, I2S ==============

void initI2C_MCP() {
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  if (!mcp.begin_I2C(MCP_ADDR, &Wire)) {
    Serial.println("MCP23017 not found!");
    while (true) delay(10);
  }
  for (int i = 0; i < BUTTON_COUNT; i++) {
    mcp.pinMode(BUTTON_PINS[i], INPUT_PULLUP);
    lastButtonState[i] = HIGH;
    buttonState[i] = HIGH;
    lastDebounceTime[i] = 0;
  }
  Serial.println("MCP23017 OK.");
}

void initLED() {
  strip.begin();
  strip.setBrightness(200);
  strip.show();
  Serial.println("NeoPixel OK.");
}

void initI2S_Mic() {
  i2s_config_t mic_config = {
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

  i2s_pin_config_t mic_pins = {
    .bck_io_num = MIC_BCLK_PIN,
    .ws_io_num = MIC_WS_PIN,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num = MIC_SD_PIN
  };

  esp_err_t err = i2s_driver_install(I2S_MIC_PORT, &mic_config, 0, NULL);
  if (err != ESP_OK) {
    Serial.print("I2S MIC install err=");
    Serial.println(err);
  }
  err = i2s_set_pin(I2S_MIC_PORT, &mic_pins);
  if (err != ESP_OK) {
    Serial.print("I2S MIC set_pin err=");
    Serial.println(err);
  }
  i2s_zero_dma_buffer(I2S_MIC_PORT);
  Serial.println("I2S MIC OK.");
}

void initI2S_Spk() {
  pinMode(SPK_SD_MODE_PIN, OUTPUT);
  digitalWrite(SPK_SD_MODE_PIN, HIGH);

  i2s_config_t spk_config = {
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

  i2s_pin_config_t spk_pins = {
    .bck_io_num = SPK_BCLK_PIN,
    .ws_io_num = SPK_WS_PIN,
    .data_out_num = SPK_SD_PIN,
    .data_in_num = I2S_PIN_NO_CHANGE
  };

  esp_err_t err = i2s_driver_install(I2S_SPK_PORT, &spk_config, 0, NULL);
  if (err != ESP_OK) {
    Serial.print("I2S SPK install err=");
    Serial.println(err);
  }
  err = i2s_set_pin(I2S_SPK_PORT, &spk_pins);
  if (err != ESP_OK) {
    Serial.print("I2S SPK set_pin err=");
    Serial.println(err);
  }
  i2s_zero_dma_buffer(I2S_SPK_PORT);
  Serial.println("I2S SPK OK.");
}

// ============= BUTTONS =========================

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

        if (i == 0) {
          // main button
          if (buttonState[i] == LOW) {
            handleMainButtonPressed();
          } else {
            handleMainButtonReleased();
          }
        } else {
          if (buttonState[i] == LOW) {
            handleAuxButtonPress(i);
          }
        }
      }
    }
    lastButtonState[i] = reading;
  }
}

void handleMainButtonPressed() {
  mainPressed = true;
  mainPressStart = millis();
  // ne krećemo odmah sa snimanjem zbog long threshold
}

void handleMainButtonReleased() {
  if (!mainPressed) return;
  mainPressed = false;

  if (mainRecording) {
    // završetak snimanja i slanje
    mainRecording = false;
    Serial.println("Main long press released -> stop record");
    // LED: sending
    setLedMode(LED_MAIN_SENDING);

    // send HTTP upload
    String audioUrl, transcript, translation;
    bool ok = uploadAudioAndParse(audioUrl, transcript, translation);

    if (ok) {
      Serial.println("Upload + parse OK");
      publishButtonPress("main", "long", transcript, translation, audioUrl, false);
      // LED success dok backend ne pošalje accepted
      // ovde možemo samo vratiti na idle:
      setLedMode(LED_IDLE);
    } else {
      Serial.println("Upload or parse FAILED");
      publishButtonPress("main", "long", "", "", "", true);
      setLedMode(LED_ERROR);
    }
  } else {
    // kratko puštanje -> tretiramo kao short press
    Serial.println("Main short press");
    setLedMode(LED_MAIN_SHORT);
    publishButtonPress("main", "short");
    // TODO: double-click logika ako stvarno bude trebala
  }
}

void updateMainButtonHold() {
  if (mainPressed && !mainRecording) {
    unsigned long now = millis();
    if (now - mainPressStart >= MAIN_LONG_THRESHOLD) {
      // start recording
      mainRecording = true;
      Serial.println("Main long press detected -> start recording");
      setLedMode(LED_MAIN_RECORDING);
      recordedSamples = recordAudio();
      Serial.print("Recorded samples: ");
      Serial.println(recordedSamples);
      // actual HTTP upload ide kad se dugme pusti (handleMainButtonReleased)
    }
  }
}

void handleAuxButtonPress(int idx) {
  int auxIndex = idx - 1; // 0..3
  switch (auxIndex) {
    case 0:
      setLedMode(LED_AUX1);
      publishButtonPress("aux1", "short");
      break;
    case 1:
      setLedMode(LED_AUX2);
      publishButtonPress("aux2", "short");
      break;
    case 2:
      setLedMode(LED_AUX3);
      publishButtonPress("aux3", "short");
      break;
    case 3:
      setLedMode(LED_AUX4);
      publishButtonPress("aux4", "short");
      break;
    default:
      break;
  }
}

void handleTouchButton() {
  // vrlo prosta logika
  static bool lastTouch = HIGH;
  bool reading = digitalRead(TOUCH_BUTTON_PIN);

  if (reading != lastTouch) {
    delay(5); // sitan debounce
    reading = digitalRead(TOUCH_BUTTON_PIN);
    if (reading != lastTouch) {
      lastTouch = reading;
      if (reading == LOW) {
        Serial.println("Touch button pressed");
        setLedMode(LED_TOUCH);
        publishButtonPress("touch", "touch");
      }
    }
  }
}

// ============= LED HANDLING ====================

void setLedMode(LedMode mode) {
  ledMode = mode;
  lastLedUpdate = 0; // force odmah
}

void updateLed() {
  unsigned long now = millis();
  if (now - lastLedUpdate < 30) return; // ~30ms
  lastLedUpdate = now;

  switch (ledMode) {
    case LED_IDLE:
      ledFill(0, 0, 0);
      break;

    case LED_MAIN_RECORDING:
      ledSpinBlue();
      break;

    case LED_MAIN_SENDING:
      // žuto pulsiranje
      {
        uint8_t b = 100 + (uint8_t)(80.0 * (0.5 + 0.5 * sin(now / 200.0)));
        ledFill(b, b, 0);
      }
      break;

    case LED_MAIN_ACCEPTED:
      ledFill(0, 150, 0);
      break;

    case LED_ERROR:
      {
        // crveno treptanje
        if ((now / 200) % 2 == 0) ledFill(150, 0, 0);
        else ledFill(0, 0, 0);
      }
      break;

    case LED_AUX1:
      ledFill(0, 0, 150);
      break;
    case LED_AUX2:
      ledFill(0, 150, 0);
      break;
    case LED_AUX3:
      ledFill(150, 150, 0);
      break;
    case LED_AUX4:
      ledRainbowOnce();
      // vrati na idle posle efekta
      ledMode = LED_IDLE;
      break;
    case LED_TOUCH:
      ledFill(60, 60, 60);
      // možeš kasnije da napraviš da se ugasi posle nekog vremena
      break;
    case LED_MAIN_SHORT:
      ledFill(120, 120, 120);
      // možeš da dodaš timeout da se vrati na idle
      break;
  }
}

void ledFill(uint8_t r, uint8_t g, uint8_t b) {
  for (int i = 0; i < NUM_LEDS; i++) {
    strip.setPixelColor(i, strip.Color(r, g, b));
  }
  strip.show();
}

void ledSpinBlue() {
  static uint8_t pos = 0;
  pos = (pos + 1) % NUM_LEDS;
  for (int i = 0; i < NUM_LEDS; i++) {
    uint8_t val = (i == pos) ? 150 : 10;
    strip.setPixelColor(i, strip.Color(0, 0, val));
  }
  strip.show();
}

void ledRainbowOnce() {
  static uint8_t offset = 0;
  offset += 5;
  for (int i = 0; i < NUM_LEDS; i++) {
    int hue = ((i * 65536L / NUM_LEDS) + offset * 256) & 0xFFFF;
    strip.setPixelColor(i, strip.gamma32(strip.ColorHSV(hue)));
  }
  strip.show();
}

// ============= AUDIO RECORD ====================

size_t recordAudio() {
  size_t index = 0;
  memset(audioBuffer, 0, sizeof(audioBuffer));

  i2s_zero_dma_buffer(I2S_MIC_PORT);

  unsigned long start = millis();
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
      Serial.println("I2S read err");
      break;
    }
    int samples = bytesRead / sizeof(int32_t);
    for (int i = 0; i < samples && index < MAX_SAMPLES; i++) {
      int32_t v = micBlock[i] >> 8;
      v >>= 1;
      if (v > 32767)  v = 32767;
      if (v < -32768) v = -32768;
      audioBuffer[index++] = (int16_t)v;
    }
    if (millis() - start > MAX_RECORD_SECONDS * 1000UL) break;
  }
  return index;
}

// ============= HTTP UPLOAD + PARSE =============

// ultra-primitivno izvlačenje "audioUrl", "transcript", "translation" iz JSON-a
String extractJsonField(const String& json, const char* key) {
  String k = "\"" + String(key) + "\"";
  int idx = json.indexOf(k);
  if (idx == -1) return "";
  idx = json.indexOf(":", idx);
  if (idx == -1) return "";
  idx++;
  while (idx < (int)json.length() && (json[idx] == ' ' || json[idx] == '\"')) idx++;
  String value;
  while (idx < (int)json.length() && json[idx] != '\"' && json[idx] != ',' && json[idx] != '}') {
    value += json[idx++];
  }
  // ako je bilo sa navodnicima, već smo ih preskočili gore
  return value;
}

bool uploadAudioAndParse(String& audioUrl, String& transcript, String& translation) {
  size_t bytesAudio = recordedSamples * sizeof(int16_t);
  if (bytesAudio == 0) {
    Serial.println("No audio to upload.");
    return false;
  }

  WiFiClient client;
  if (!client.connect(HTTP_HOST, HTTP_PORT)) {
    Serial.println("HTTP connect failed");
    return false;
  }

  String boundary = "----ObedioBoundary12345";

  String head = "--" + boundary + "\r\n";
  head += "Content-Disposition: form-data; name=\"audio\"; filename=\"audio.wav\"\r\n";
  head += "Content-Type: audio/wav\r\n\r\n";

  String tail = "\r\n--" + boundary + "--\r\n";

  size_t contentLength = head.length() + bytesAudio + tail.length();

  // HTTP request
  String request = "";
  request += "POST ";
  request += HTTP_PATH;
  request += " HTTP/1.1\r\n";
  request += "Host: ";
  request += HTTP_HOST;
  request += ":";
  request += HTTP_PORT;
  request += "\r\n";
  request += "Content-Type: multipart/form-data; boundary=" + boundary + "\r\n";
  request += "Content-Length: ";
  request += String(contentLength);
  request += "\r\n";
  request += "Connection: close\r\n\r\n";

  client.print(request);
  client.print(head);

  // audio body
  const uint8_t* raw = (const uint8_t*)audioBuffer;
  size_t sent = 0;
  while (sent < bytesAudio) {
    size_t chunk = (bytesAudio - sent);
    if (chunk > 1024) chunk = 1024;
    client.write(raw + sent, chunk);
    sent += chunk;
  }

  client.print(tail);

  // Read response
  unsigned long timeout = millis();
  while (client.connected() && !client.available()) {
    if (millis() - timeout > 8000) {
      Serial.println("HTTP timeout");
      client.stop();
      return false;
    }
    delay(10);
  }

  String response;
  while (client.available()) {
    String line = client.readStringUntil('\n');
    response += line + "\n";
  }
  client.stop();

  // odvoji body (posle prve prazne linije)
  int idx = response.indexOf("\r\n\r\n");
  String body = (idx != -1) ? response.substring(idx + 4) : response;

  Serial.println("HTTP response body:");
  Serial.println(body);

  audioUrl    = extractJsonField(body, "audioUrl");
  transcript  = extractJsonField(body, "transcript");
  translation = extractJsonField(body, "translation");

  return audioUrl.length() > 0;
}

// ============= MQTT PUBLISH HELPER ============

void publishButtonPress(const String& button, const String& pressType,
                        const String& transcript,
                        const String& translation,
                        const String& audioUrl,
                        bool voiceError) {
  String topic = "obedio/button/" + deviceId + "/press";

  String payload = "{";
  payload += "\"deviceId\":\"" + deviceId + "\"";
  payload += ",\"button\":\"" + button + "\"";
  payload += ",\"pressType\":\"" + pressType + "\"";

  if (transcript.length() > 0) {
    payload += ",\"voiceTranscript\":\"" + transcript + "\"";
  }
  if (translation.length() > 0) {
    payload += ",\"voiceTranslation\":\"" + translation + "\"";
  }
  if (audioUrl.length() > 0) {
    payload += ",\"audioUrl\":\"" + audioUrl + "\"";
  }
  if (voiceError) {
    payload += ",\"voiceError\":true";
  }
  payload += "}";

  Serial.print("MQTT publish: ");
  Serial.println(payload);

  mqttClient.publish(topic.c_str(), payload.c_str());
}

// ============= SPEAKER PING ===================

void playPing() {
  // jednostavan square beep ~1 kHz, 200ms
  const int durationMs = 200;
  const int freq = 1000;
  const int samples = SAMPLE_RATE * durationMs / 1000;
  for (int i = 0; i < samples; i++) {
    float phase = (2.0f * 3.1415926f * freq * i) / SAMPLE_RATE;
    int16_t sample = (sin(phase) > 0) ? 15000 : -15000;
    size_t written;
    i2s_write(I2S_SPK_PORT, &sample, sizeof(sample), &written, 10 / portTICK_PERIOD_MS);
  }
}
