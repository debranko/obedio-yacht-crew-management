
# FIRMWARE_OVERVIEW.md

## MCU / CONTEXT

- MCU: ESP32-S3 (custom Obedio Smart Button PCB)
- Framework: Arduino core for ESP32 (current prototype)
- Firmware role: test firmware for buttons, MQTT, NeoPixel LED ring, and local audio record/play

Features in this test firmware:
- 5 buttons via MCP23017 (T1 - T5)
- NeoPixel LED ring (16 LEDs)
- Wi-Fi client
- MQTT publisher
- I2S MEMS microphone + MAX98357A speaker
- Special behavior for T1: record while held, play back on release, then send MQTT event

---

## GPIO MAP (ESP32-S3 SIDE)

### I2C - MCP23017 IO EXPANDER

- SDA: GPIO 3
- SCL: GPIO 2
- Device: MCP23017 at I2C address 0x20

```cpp
const int SDA_PIN = 3;
const int SCL_PIN = 2;
// mcp.begin_I2C(0x20, &Wire);
```

Used to read 5 buttons on GPA pins.

---

### BUTTONS (ON MCP23017, NOT DIRECT ESP32 GPIO)

Buttons are on MCP23017 GPA bank. On the ESP32 side they are accessed only over I2C.

```cpp
const uint8_t BUTTON_PINS[] = {7, 6, 5, 4, 3};
const int BUTTON_COUNT = 5;
```

Mapping:

- BUTTON_PINS[0] = GPA7 = T1 (main button, special audio behavior)
- BUTTON_PINS[1] = GPA6 = T2
- BUTTON_PINS[2] = GPA5 = T3
- BUTTON_PINS[3] = GPA4 = T4
- BUTTON_PINS[4] = GPA3 = T5

Electrical and software behavior:

- Each MCP pin is configured as INPUT_PULLUP:
  - mcp.pinMode(BUTTON_PINS[i], INPUT_PULLUP);
- Logic: active LOW
  - Pressed = 0
  - Released = 1
- Debounce:
  - Arrays:
    - unsigned long lastDebounceTime[BUTTON_COUNT];
    - bool lastButtonState[BUTTON_COUNT];
    - bool buttonState[BUTTON_COUNT];
  - Constant:
    - const unsigned long debounceDelay = 50; // ms
  - Debounce logic in checkButtons():
    - Detect transitions only when state is stable longer than debounceDelay.
    - On stable transition to LOW, treat as "button pressed".

Special behavior for T1 (index 0) in extended firmware:
- On press:
  - Record audio while button is held.
  - On release, stop recording and play back the recorded audio.
  - Send MQTT event "T1_VOICE".

Behavior for T2 - T5 (indexes 1 - 4):
- Still publish plain text events "T2", "T3", "T4", "T5".

---

### NEOPIXEL LED RING

- Data pin: GPIO 17
- Number of LEDs: 16
- Type: WS2812B (NeoPixel), GRB, 800 kHz

```cpp
#define LED_PIN 17
#define NUM_LEDS 16
Adafruit_NeoPixel strip = Adafruit_NeoPixel(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);
```

Behavior:

- On setup:
  - strip.begin();
  - strip.setBrightness(200);
  - strip.show(); (init, all off)
- In loop():
  - rainbow() is called every iteration.
  - rainbow() uses millis() and LEDInterval = 150 ms to update hues.
  - Each LED gets a different hue offset, using ColorHSV and gamma32.
  - Visual result: rotating rainbow ring effect, independent of buttons and audio.

Variables used for animation:

```cpp
unsigned long previousLEDMillis = 0;
const long LEDInterval = 150;
uint16_t hue = 64;
```

---

### AUDIO - MEMS MICROPHONE (I2S RX)

Mic I2S pin mapping (ESP32 side):

```cpp
#define MIC_BCLK_PIN   33   // bit clock (SCK)
#define MIC_WS_PIN     38   // word select (LRCLK)
#define MIC_SD_PIN     34   // data out from mic (SD)
```

I2S RX configuration:

- Port: I2S_NUM_0
- Mode: I2S_MODE_MASTER | I2S_MODE_RX
- Sample rate: 16000 Hz
- Bits per sample: I2S_BITS_PER_SAMPLE_32BIT (mic outputs 24-bit data left-justified in 32-bit frames)
- Channel format: I2S_CHANNEL_FMT_ONLY_LEFT
- Communication format: I2S_COMM_FORMAT_I2S
- DMA:
  - dma_buf_count = 4
  - dma_buf_len = BLOCK_SAMPLES (256)
- Pin config:
  - bck_io_num = MIC_BCLK_PIN
  - ws_io_num = MIC_WS_PIN
  - data_in_num = MIC_SD_PIN
  - data_out_num = I2S_PIN_NO_CHANGE

---

### AUDIO - MAX98357A SPEAKER AMP (I2S TX)

Amp lines from ESP32-S3:

```cpp
#define SPK_BCLK_PIN    10
#define SPK_WS_PIN      18
#define SPK_SD_PIN      11
#define SPK_SD_MODE_PIN 14
```

- BCLK: GPIO 10
- LRCLK (WS): GPIO 18
- DIN (SD): GPIO 11
- SD_MODE: GPIO 14 (shutdown/mode; HIGH = enabled)

I2S TX configuration:

- Port: I2S_NUM_1
- Mode: I2S_MODE_MASTER | I2S_MODE_TX
- Sample rate: 16000 Hz
- Bits per sample: I2S_BITS_PER_SAMPLE_16BIT
- Channel format: I2S_CHANNEL_FMT_ONLY_LEFT
- Communication format: I2S_COMM_FORMAT_I2S
- DMA:
  - dma_buf_count = 4
  - dma_buf_len = BLOCK_SAMPLES (256)
- Pin config:
  - bck_io_num = SPK_BCLK_PIN
  - ws_io_num = SPK_WS_PIN
  - data_out_num = SPK_SD_PIN
  - data_in_num = I2S_PIN_NO_CHANGE
- SD_MODE usage:
  - pinMode(SPK_SD_MODE_PIN, OUTPUT);
  - digitalWrite(SPK_SD_MODE_PIN, HIGH); // wake MAX98357A

---

## FUNCTIONALITY SUMMARY

### WIFI + DEVICE ID

Wi-Fi configuration:

```cpp
const char* ssid = "Obedio";
const char* password = "BrankomeinBruder:)";
```

- setup_wifi():
  - WiFi.begin(ssid, password);
  - Wait until WiFi.status() == WL_CONNECTED.
  - Print local IP to Serial.

Device ID generation:

```cpp
String deviceId = "BTN-";
uint8_t mac[6];
WiFi.macAddress(mac);
for (int i = 0; i < 6; i++) {
  char hex[3];
  sprintf(hex, "%02X", mac[i]);
  deviceId += hex;
}
```

- Result example: "BTN-24A160FF1234".
- Used as MQTT client ID and part of the MQTT topic name.

---

### MQTT PUBLISHING

MQTT configuration:

```cpp
const char* mqtt_server = "10.10.0.207";
const int mqtt_port = 1883;
WiFiClient espClient;
PubSubClient client(espClient);
const char* mqtt_base_topic = "buttons/";
```

- Broker: 10.10.0.207:1883 (no TLS)
- MQTT client:
  - client.setServer(mqtt_server, mqtt_port);

Reconnect logic (reconnect_mqtt):
- While not client.connected():
  - Try client.connect(deviceId.c_str());
  - On success: "connected".
  - On failure: print client.state() and wait 5s.

MQTT topic:

- For all buttons and events:
  - topic = String(mqtt_base_topic) + deviceId;
  - Effective topic: "buttons/" + deviceId (e.g. "buttons/BTN-24A160FF1234").

Payloads:

- For T1 (index 0):
  - Extended firmware payload after audio event:
    - "T1_VOICE".

- For T2 - T5 (index 1-4):
  - Payload is "T" + String(i + 1), giving "T2", "T3", "T4", "T5".

No subscribe or incoming commands are implemented in this test firmware.

---

### BUTTON HANDLING (MCP23017)

Initialization:

```cpp
Wire.begin(SDA_PIN, SCL_PIN);
mcp.begin_I2C(0x20, &Wire);
for (int i = 0; i < BUTTON_COUNT; i++) {
  mcp.pinMode(BUTTON_PINS[i], INPUT_PULLUP);
  lastButtonState[i] = HIGH;
  buttonState[i] = HIGH;
  lastDebounceTime[i] = 0;
}
```

Debounce flow in checkButtons():

- For each button index i:
  - Read pin: bool reading = mcp.digitalRead(BUTTON_PINS[i]);
  - If reading != lastButtonState[i], set lastDebounceTime[i] = millis();
  - If (millis() - lastDebounceTime[i]) > debounceDelay:
    - If reading != buttonState[i]:
      - buttonState[i] = reading;
      - If buttonState[i] == LOW (pressed):

        - If i == 0 (T1 main button):
          - Perform audio recording while button is held:
            - size_t recSamples = recordWhileButtonHeld_MCP(BUTTON_PINS[0]);
          - Play back recorded audio:
            - playAudio(recSamples);
          - Publish MQTT with payload "T1_VOICE".

        - Else (i >= 1, T2-T5):
          - Build message = "T" + String(i + 1);
          - Publish MQTT with that message.

- After processing, lastButtonState[i] = reading.

---

### AUDIO RECORD / PLAYBACK LOGIC

Constants:

```cpp
const int SAMPLE_RATE        = 16000;  // 16 kHz
const int MAX_RECORD_SECONDS = 3;
const int BLOCK_SAMPLES      = 256;
const size_t MAX_SAMPLES     = (size_t)SAMPLE_RATE * MAX_RECORD_SECONDS;
// roughly 48000 samples at 16kHz -> ~96kB at 16-bit mono
int16_t audioBuffer[MAX_SAMPLES];
```

Recording function: recordWhileButtonHeld_MCP(uint8_t mcpPin)

- Clears audioBuffer with memset().
- Optional small delay to avoid immediate bounce.
- While:
  - mcp.digitalRead(mcpPin) == LOW (button still pressed), and
  - index < MAX_SAMPLES:
    - Read from mic I2S:

```cpp
int32_t micBlock[BLOCK_SAMPLES];
size_t bytesRead = 0;
esp_err_t err = i2s_read(I2S_MIC_PORT, micBlock, sizeof(micBlock), &bytesRead, portMAX_DELAY);
```

    - Convert 32-bit micBlock samples to 16-bit audioBuffer:

```cpp
int samples = bytesRead / sizeof(int32_t);
for (int i = 0; i < samples && index < MAX_SAMPLES; i++) {
  int32_t v = micBlock[i] >> 8;  // drop lower 8 bits
  v >>= 1;                       // lower gain
  if (v > 32767)  v = 32767;
  if (v < -32768) v = -32768;
  audioBuffer[index++] = (int16_t)v;
}
```

- Return value: number of 16-bit samples recorded.

Playback function: playAudio(size_t samples)

- Playback from audioBuffer via I2S TX:

```cpp
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
    audioBuffer + samplesPlayed,
    bytesToWrite,
    &bytesWritten,
    portMAX_DELAY
  );
  if (err != ESP_OK || bytesWritten == 0) {
    // handle error (e.g. print to Serial)
    break;
  }
  samplesPlayed += bytesWritten / sizeof(int16_t);
}
```

- Blocking playback, one shot per recording.

---

### NEOPIXEL RAINBOW ANIMATION

- Standalone animation; not tied to audio or MQTT logic.

rainbow() function behavior:

- Use millis() to check if LEDInterval (150 ms) elapsed.
- If elapsed:
  - Update hue for each LED:

```cpp
for (int i = 0; i < NUM_LEDS; i++) {
  int ledHue = (hue + (i * 65536 / NUM_LEDS)) % 65536;
  strip.setPixelColor(i, strip.gamma32(strip.ColorHSV(ledHue)));
}
strip.show();
hue += 256;
if (hue >= 65536) hue = 0;
```

- Produces a rotating rainbow effect.

---

## LIBRARIES USED (ARDUINO ECOSYSTEM)

- WiFi.h
  - ESP32 Wi-Fi (STA mode).
  - Used for basic connection to SSID/Password.

- PubSubClient.h
  - MQTT client over TCP.
  - Used APIs:
    - setServer(host, port)
    - connect(clientId)
    - connected()
    - publish(topic, payload)
    - loop()
    - state()

- Wire.h
  - I2C master.
  - Used to communicate with MCP23017 on address 0x20.

- Adafruit_MCP23X17.h
  - Abstraction for MCP23017.
  - Used APIs:
    - begin_I2C(addr, &Wire)
    - pinMode(pin, INPUT_PULLUP)
    - digitalRead(pin)

- Adafruit_NeoPixel.h
  - Control NeoPixel / WS2812B LED ring.
  - Used APIs:
    - constructor with length and pin
    - begin()
    - setBrightness()
    - setPixelColor()
    - show()
    - ColorHSV()
    - gamma32()

- driver/i2s.h
  - ESP-IDF I2S driver accessed from Arduino environment.
  - Used types:
    - i2s_config_t
    - i2s_pin_config_t
  - Used APIs:
    - i2s_driver_install()
    - i2s_set_pin()
    - i2s_zero_dma_buffer()
    - i2s_read()
    - i2s_write()

---

## PROTOCOL SUMMARY

Physical:

- I2C:
  - ESP32-S3 (GPIO 3,2) to MCP23017 at 0x20.
  - Carries button states.

- I2S:
  - Between ESP32-S3 and MEMS mic (RX).
  - Between ESP32-S3 and MAX98357A amp (TX).

- NeoPixel (one-wire):
  - GPIO 17 to WS2812B ring, managed by Adafruit_NeoPixel timings.

Network:

- Wi-Fi:
  - 2.4 GHz, WPA2, SSID "Obedio".
  - DHCP IP, printed to Serial.

- MQTT:
  - Broker: 10.10.0.207, port 1883, no TLS, no auth.
  - Topic: "buttons/" + deviceId
  - Payloads:
    - "T1_VOICE" (T1 pressed and audio recorded/played)
    - "T2", "T3", "T4", "T5" (other buttons)

Audio:

- Mic I2S data:
  - 24-bit in 32-bit frames, converted to 16-bit signed samples.
  - Sample rate: 16 kHz, mono.

- Internal representation:
  - int16_t buffer (audioBuffer[MAX_SAMPLES]).

- Speaker I2S data:
  - 16-bit PCM mono at 16 kHz from audioBuffer.

---

END OF FILE
