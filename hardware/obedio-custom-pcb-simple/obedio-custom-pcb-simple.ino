#include <Wire.h>
#include <Adafruit_MCP23X17.h>
#include <Adafruit_NeoPixel.h>
#include "driver/i2s.h"

// ================= Hardware map =================

// I2C bus (MCP23017 + LIS3DH)
#define I2C_SDA_PIN  3
#define I2C_SCL_PIN  2

// MCP23017 address
#define MCP_ADDR     0x20

// Buttons on MCP23017 port A
// Index 0 = T1 (main button), 1..4 = T2..T5 (aux buttons)
const uint8_t BUTTON_PINS[] = {7, 6, 5, 4, 3};
const int BUTTON_COUNT = 5;

// NeoPixel ring
#define LED_PIN    17
#define NUM_LEDS   16

// I2S mic (RX)
#define I2S_MIC_PORT   I2S_NUM_0
#define MIC_BCLK_PIN   33
#define MIC_WS_PIN     38
#define MIC_SD_PIN     34

// I2S speaker (TX, MAX98357A)
#define I2S_SPK_PORT   I2S_NUM_1
#define SPK_BCLK_PIN   10
#define SPK_WS_PIN     18
#define SPK_SD_PIN     11
#define SPK_SD_MODE_PIN 14

// Audio parameters
const int SAMPLE_RATE        = 16000;  // 16 kHz
const int MAX_RECORD_SECONDS = 3;
const int BLOCK_SAMPLES      = 256;
const size_t MAX_SAMPLES     = (size_t)SAMPLE_RATE * MAX_RECORD_SECONDS;

// Debounce for aux buttons (T2..T5)
unsigned long lastDebounceTime[BUTTON_COUNT];
bool lastButtonState[BUTTON_COUNT];
bool buttonState[BUTTON_COUNT];
const unsigned long debounceDelay = 50;

// Globals
Adafruit_MCP23X17 mcp;
Adafruit_NeoPixel strip(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);

int16_t audioBuffer[MAX_SAMPLES];
bool mainRecording = false;

// ============ Forward declarations ============
void setupI2CAndMCP();
void setupNeoPixel();
void setupMicI2S();
void setupSpeakerI2S();
void handleMainButton();
void handleAuxButtons();
void showPatternForButton(int index);
size_t recordWhileMainHeld();
void playAudio(size_t samples);
void fillColor(uint8_t r, uint8_t g, uint8_t b);

// ================== Setup =====================
void setup() {
  Serial.begin(115200);
  delay(200);

  setupI2CAndMCP();
  setupNeoPixel();
  setupSpeakerI2S();
  setupMicI2S();

  Serial.println("Test firmware ready.");
  Serial.println("T1 (main) - hold to record, release to play.");
  Serial.println("T2..T5 - different LED colors/patterns on press.");
}

// ================== Loop ======================
void loop() {
  handleMainButton();   // glavno dugme za audio
  handleAuxButtons();   // pomocna dugmad za LED pattern
}

// ============ Init functions ==================
void setupI2CAndMCP() {
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  if (!mcp.begin_I2C(MCP_ADDR, &Wire)) {
    Serial.println("MCP23017 not found");
    while (1) delay(10);
  }

  for (int i = 0; i < BUTTON_COUNT; i++) {
    mcp.pinMode(BUTTON_PINS[i], INPUT_PULLUP);
    lastButtonState[i] = HIGH;
    buttonState[i] = HIGH;
    lastDebounceTime[i] = 0;
  }

  Serial.println("MCP23017 ok");
}

void setupNeoPixel() {
  strip.begin();
  strip.setBrightness(200);
  strip.show();
  Serial.println("NeoPixel ok");
}

void setupMicI2S() {
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
    Serial.print("i2s_driver_install (MIC) err = ");
    Serial.println(err);
  }

  err = i2s_set_pin(I2S_MIC_PORT, &mic_pins);
  if (err != ESP_OK) {
    Serial.print("i2s_set_pin (MIC) err = ");
    Serial.println(err);
  }

  i2s_zero_dma_buffer(I2S_MIC_PORT);
  Serial.println("I2S MIC ok");
}

void setupSpeakerI2S() {
  pinMode(SPK_SD_MODE_PIN, OUTPUT);
  digitalWrite(SPK_SD_MODE_PIN, HIGH); // enable amp

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
    Serial.print("i2s_driver_install (SPK) err = ");
    Serial.println(err);
  }

  err = i2s_set_pin(I2S_SPK_PORT, &spk_pins);
  if (err != ESP_OK) {
    Serial.print("i2s_set_pin (SPK) err = ");
    Serial.println(err);
  }

  i2s_zero_dma_buffer(I2S_SPK_PORT);
  Serial.println("I2S SPK ok");
}

// ============ Main button (T1) ================
void handleMainButton() {
  // T1 = BUTTON_PINS[0]
  if (!mainRecording) {
    if (mcp.digitalRead(BUTTON_PINS[0]) == LOW) {
      mainRecording = true;
      Serial.println("Main button pressed - recording...");
      size_t samples = recordWhileMainHeld();
      Serial.print("Recorded samples: ");
      Serial.println(samples);
      if (samples > 0) {
        Serial.println("Playback...");
        playAudio(samples);
      }
      mainRecording = false;
      Serial.println("Done.");
    }
  }
}

// ============ Aux buttons (T2..T5) ============
void handleAuxButtons() {
  // indexes 1..4 = T2..T5
  for (int i = 1; i < BUTTON_COUNT; i++) {
    bool reading = mcp.digitalRead(BUTTON_PINS[i]);

    if (reading != lastButtonState[i]) {
      lastDebounceTime[i] = millis();
    }

    if ((millis() - lastDebounceTime[i]) > debounceDelay) {
      if (reading != buttonState[i]) {
        buttonState[i] = reading;

        if (buttonState[i] == LOW) {
          // pressed
          Serial.print("Aux button ");
          Serial.print(i + 1);
          Serial.println(" pressed");
          showPatternForButton(i);
        }
      }
    }

    lastButtonState[i] = reading;
  }
}

// ============ LED patterns ====================
void fillColor(uint8_t r, uint8_t g, uint8_t b) {
  for (int i = 0; i < NUM_LEDS; i++) {
    strip.setPixelColor(i, strip.Color(r, g, b));
  }
  strip.show();
}

void showRainbowOnce() {
  for (int j = 0; j < 256; j += 8) {
    for (int i = 0; i < NUM_LEDS; i++) {
      int hue = (j * 256 + i * (65536 / NUM_LEDS)) & 0xFFFF;
      uint32_t c = strip.gamma32(strip.ColorHSV(hue));
      strip.setPixelColor(i, c);
    }
    strip.show();
    delay(20);
  }
}

void showPatternForButton(int index) {
  switch (index) {
    case 1: // T2
      fillColor(0, 0, 255);   // plava
      break;
    case 2: // T3
      fillColor(0, 255, 0);   // zelena
      break;
    case 3: // T4
      fillColor(255, 255, 0); // zuta
      break;
    case 4: // T5
      showRainbowOnce();      // jednostavan rainbow pattern
      break;
    default:
      break;
  }
}

// ============ Recording and playback ==========
size_t recordWhileMainHeld() {
  size_t index = 0;
  memset(audioBuffer, 0, sizeof(audioBuffer));

  // vizuelno: crveno dok snima
  fillColor(255, 0, 0);

  delay(30); // mali delay da prodje bounce

  while (mcp.digitalRead(BUTTON_PINS[0]) == LOW && index < MAX_SAMPLES) {
    int32_t micBlock[BLOCK_SAMPLES];
    size_t bytesRead = 0;

    esp_err_t err = i2s_read(
      I2S_MIC_PORT,
      (void*)micBlock,
      sizeof(micBlock),
      &bytesRead,
      portMAX_DELAY
    );

    if (err != ESP_OK || bytesRead == 0) {
      Serial.println("I2S read error");
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
  }

  // posle snimanja - neka bude slabo belo kao idle
  fillColor(50, 50, 50);

  return index;
}

void playAudio(size_t samples) {
  // vizuelno: tirkizno dok pusta
  fillColor(0, 255, 255);

  size_t samplesPlayed = 0;
  while (samplesPlayed < samples) {
    size_t samplesLeft = samples - samplesPlayed;
    size_t thisBlockSamples = samplesLeft;
    if (thisBlockSamples > BLOCK_SAMPLES) {
      thisBlockSamples = BLOCK_SAMPLES;
    }

    size_t bytesToWrite = thisBlockSamples * sizeof(int16_t);
    size_t bytesWritten = 0;

    esp_err_t err = i2s_write(
      I2S_SPK_PORT,
      (const void*)(audioBuffer + samplesPlayed),
      bytesToWrite,
      &bytesWritten,
      portMAX_DELAY
    );

    if (err != ESP_OK || bytesWritten == 0) {
      Serial.println("I2S write error");
      break;
    }

    samplesPlayed += bytesWritten / sizeof(int16_t);
  }

  // posle pustanja iskljuci LED
  fillColor(0, 0, 0);
}
