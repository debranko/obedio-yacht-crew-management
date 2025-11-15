/**
 * Hardware Interface Implementation
 * Handles all physical hardware components
 */

#include "hardware.h"
#include "config.h"
#include "network.h"

// ==================== GLOBAL HARDWARE OBJECTS ====================

Adafruit_MCP23X17 mcp;
Adafruit_NeoPixel strip = Adafruit_NeoPixel(LED_COUNT, LED_PIN, LED_TYPE);
LIS3DHTR<TwoWire> accel;

// ==================== PRIVATE VARIABLES ====================

// Button state tracking
static unsigned long lastDebounceTime[BUTTON_COUNT] = {0};
static bool lastButtonState[BUTTON_COUNT] = {HIGH, HIGH, HIGH, HIGH, HIGH, HIGH};
static bool buttonState[BUTTON_COUNT] = {HIGH, HIGH, HIGH, HIGH, HIGH, HIGH};
static const uint8_t buttonPins[BUTTON_COUNT] = {
    BUTTON_T1_PIN, BUTTON_T2_PIN, BUTTON_T3_PIN,
    BUTTON_T4_PIN, BUTTON_T5_PIN, BUTTON_T6_PIN
};
static const char* buttonNames[BUTTON_COUNT] = {
    "T1", "T2", "T3", "T4", "T5", "T6"
};
static const char* buttonMQTT[BUTTON_COUNT] = {
    "main", "aux1", "aux2", "aux3", "aux4", "aux5"
};

// LED animation state
static unsigned long previousLEDMillis = 0;
static uint16_t hue = 0;

// Accelerometer state
static unsigned long lastShakeTime = 0;

// ==================== HARDWARE INITIALIZATION ====================

bool initHardware() {
    // Initialize NeoPixel LED strip
    strip.begin();
    strip.setBrightness(LED_BRIGHTNESS);
    strip.show();
    #if ENABLE_SERIAL_DEBUG
    Serial.println("✅ NeoPixel initialized");
    #endif

    // Initialize MCP23017 IO expander
    if (!mcp.begin_I2C(MCP23017_I2C_ADDRESS, &Wire)) {
        #if ENABLE_SERIAL_DEBUG
        Serial.println("❌ MCP23017 not found!");
        #endif
        return false;
    }
    #if ENABLE_SERIAL_DEBUG
    Serial.println("✅ MCP23017 initialized");
    #endif

    // Configure button pins
    for (int i = 0; i < BUTTON_COUNT; i++) {
        mcp.pinMode(buttonPins[i], INPUT_PULLUP);
        lastButtonState[i] = HIGH;
        buttonState[i] = HIGH;
        lastDebounceTime[i] = 0;
    }
    #if ENABLE_SERIAL_DEBUG
    Serial.printf("✅ %d buttons initialized\n", BUTTON_COUNT);
    #endif

    #if ENABLE_ACCELEROMETER
    // Initialize LIS3DHTR accelerometer
    accel.begin(Wire, LIS3DHTR_I2C_ADDRESS);
    delay(100);
    accel.setOutputDataRate(ACCEL_DATA_RATE);
    accel.setFullScaleRange(ACCEL_RANGE);
    #if ENABLE_SERIAL_DEBUG
    Serial.println("✅ LIS3DHTR accelerometer initialized");
    #endif
    #endif

    return true;
}

String generateDeviceId() {
    uint8_t mac[6];
    WiFi.macAddress(mac);
    char macStr[13];
    sprintf(macStr, "%02X%02X%02X%02X%02X%02X",
            mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
    return String("BTN-") + String(macStr);
}

// ==================== BUTTON FUNCTIONS ====================

void checkButtons(const String& deviceId, uint32_t* sequenceNumber) {
    for (int i = 0; i < BUTTON_COUNT; i++) {
        bool reading = mcp.digitalRead(buttonPins[i]);

        // Invert logic for last button (T6) if needed
        if (i == BUTTON_COUNT - 1) {
            reading = !reading;
        }

        // Debounce logic
        if (reading != lastButtonState[i]) {
            lastDebounceTime[i] = millis();
        }

        if ((millis() - lastDebounceTime[i]) > BUTTON_DEBOUNCE_MS) {
            if (reading != buttonState[i]) {
                buttonState[i] = reading;

                // Button pressed (active LOW)
                if (buttonState[i] == LOW) {
                    // Flash LEDs white
                    for (int j = 0; j < LED_COUNT; j++) {
                        strip.setPixelColor(j, strip.Color(255, 255, 255));
                    }
                    strip.show();
                    delay(100);

                    // Publish button press
                    (*sequenceNumber)++;
                    publishButtonPress(deviceId, buttonMQTT[i], "single", *sequenceNumber);

                    #if ENABLE_SERIAL_DEBUG
                    Serial.printf("🔘 Button %s pressed\n", buttonNames[i]);
                    #endif
                }
            }
        }

        lastButtonState[i] = reading;
    }
}

// ==================== LED FUNCTIONS ====================

void updateLEDAnimation() {
    unsigned long currentMillis = millis();

    if (currentMillis - previousLEDMillis >= LED_ANIMATION_INTERVAL_MS) {
        previousLEDMillis = currentMillis;

        for (int i = 0; i < LED_COUNT; i++) {
            int ledHue = (hue + (i * 65536 / LED_COUNT)) % 65536;
            strip.setPixelColor(i, strip.gamma32(strip.ColorHSV(ledHue)));
        }
        strip.show();

        hue += 256;
        if (hue >= 65536) hue = 0;
    }
}

void flashLEDs(uint8_t r, uint8_t g, uint8_t b, uint16_t duration_ms) {
    for (int i = 0; i < LED_COUNT; i++) {
        strip.setPixelColor(i, strip.Color(r, g, b));
    }
    strip.show();
    delay(duration_ms);
    strip.clear();
    strip.show();
}

void startupLEDSequence() {
    for (int i = 0; i < LED_COUNT; i++) {
        strip.setPixelColor(i, strip.Color(0, 255, 0));
        strip.show();
        delay(LED_STARTUP_DELAY_MS);
    }
    delay(500);
    strip.clear();
    strip.show();
}

// ==================== ACCELEROMETER FUNCTIONS ====================

#if ENABLE_ACCELEROMETER
void checkAccelerometer(const String& deviceId, uint32_t* sequenceNumber) {
    // Read accelerometer
    float x = accel.getAccelerationX();
    float y = accel.getAccelerationY();
    float z = accel.getAccelerationZ();

    // Calculate total acceleration magnitude
    float magnitude = sqrt(x*x + y*y + z*z);

    // Detect shake (sudden acceleration change)
    if (magnitude > ACCEL_SHAKE_THRESHOLD &&
        (millis() - lastShakeTime) > ACCEL_SHAKE_COOLDOWN_MS) {

        lastShakeTime = millis();

        // Flash LEDs red for shake/emergency
        for (int i = 0; i < LED_COUNT; i++) {
            strip.setPixelColor(i, strip.Color(255, 0, 0));
        }
        strip.show();
        delay(200);

        // Publish shake event as emergency
        (*sequenceNumber)++;
        publishButtonPress(deviceId, "main", "shake", *sequenceNumber);

        #if ENABLE_SERIAL_DEBUG
        Serial.println("⚠️ SHAKE DETECTED - Emergency!");
        #endif
    }
}
#endif
