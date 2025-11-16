/**
 * OBEDIO Minimal Diagnostic Firmware
 * Purpose: Isolate battery voltage collapse bug in v2.1-stable
 *
 * Test Procedure:
 * 1. Upload this firmware
 * 2. Connect battery and measure voltage (should be ~3.93V)
 * 3. If voltage is good, systematically uncomment features below one by one
 * 4. Identify which feature causes voltage collapse to 0.14V
 *
 * Expected: This minimal firmware should maintain 3.93V on battery
 */

// ==================== MINIMAL CONFIGURATION ====================

// Built-in LED on most ESP32 boards (GPIO 2 or use LED_BUILTIN)
#define BUILTIN_LED 2

// ==================== SETUP ====================

void setup() {
    // Initialize Serial Monitor
    Serial.begin(115200);
    delay(500);

    Serial.println("===========================================");
    Serial.println("OBEDIO Minimal Diagnostic Firmware v1.0");
    Serial.println("===========================================");
    Serial.println("Testing basic ESP32 functionality...");
    Serial.println("Monitor battery voltage with multimeter.");
    Serial.println("");

    // Configure built-in LED
    pinMode(BUILTIN_LED, OUTPUT);

    Serial.println("[OK] Serial initialized at 115200 baud");
    Serial.println("[OK] Built-in LED configured");
    Serial.println("");
    Serial.println("If battery voltage is stable (~3.93V),");
    Serial.println("this confirms the bug is in additional features.");
    Serial.println("===========================================");
    Serial.println("");
}

// ==================== MAIN LOOP ====================

void loop() {
    // Blink LED every second
    digitalWrite(BUILTIN_LED, HIGH);
    delay(500);
    digitalWrite(BUILTIN_LED, LOW);
    delay(500);

    // Print heartbeat
    static unsigned long lastPrint = 0;
    unsigned long currentMillis = millis();

    if (currentMillis - lastPrint >= 1000) {
        lastPrint = currentMillis;

        Serial.print("[");
        Serial.print(currentMillis / 1000);
        Serial.print("s] ");
        Serial.println("Alive - ESP32 running normally");
    }
}

// ==================== SYSTEMATIC FEATURE TESTING ====================
// Uncomment sections below ONE AT A TIME to isolate the bug

/*
// ========== TEST 1: NeoPixel LEDs ==========
// Uncomment this section to test if NeoPixels cause the issue

#include <Adafruit_NeoPixel.h>

#define LED_PIN 17
#define NUM_LEDS 16

Adafruit_NeoPixel strip = Adafruit_NeoPixel(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);

void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println("TEST 1: NeoPixel Initialization");

    strip.begin();
    strip.setBrightness(200);  // Full brightness - test if this causes current spike
    strip.show();

    Serial.println("[OK] NeoPixels initialized");
    Serial.println("Measure battery voltage now...");
}

void loop() {
    // Static green color (no animation to isolate power draw)
    for (int i = 0; i < NUM_LEDS; i++) {
        strip.setPixelColor(i, strip.Color(0, 50, 0));  // Dim green
    }
    strip.show();

    delay(1000);
    Serial.println("NeoPixels active - check voltage");
}
*/

/*
// ========== TEST 2: I2C Bus + MCP23017 ==========
// Uncomment this section to test if I2C/MCP23017 causes the issue

#include <Wire.h>
#include <Adafruit_MCP23X17.h>

const int SDA_PIN = 3;
const int SCL_PIN = 2;
#define MCP23017_ADDRESS 0x20

Adafruit_MCP23X17 mcp;

void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println("TEST 2: I2C + MCP23017 Initialization");

    Wire.begin(SDA_PIN, SCL_PIN);
    Serial.println("[OK] I2C initialized");

    if (!mcp.begin_I2C(MCP23017_ADDRESS, &Wire)) {
        Serial.println("[ERROR] MCP23017 not found - but measure voltage anyway");
    } else {
        Serial.println("[OK] MCP23017 initialized");

        // Configure buttons
        const uint8_t BUTTON_PINS[] = {7, 6, 5, 4, 3, 0};
        for (int i = 0; i < 6; i++) {
            mcp.pinMode(BUTTON_PINS[i], INPUT_PULLUP);
        }
        Serial.println("[OK] Buttons configured");
    }

    Serial.println("Measure battery voltage now...");
}

void loop() {
    delay(1000);
    Serial.println("I2C active - check voltage");
}
*/

/*
// ========== TEST 3: Accelerometer (LIS3DHTR) ==========
// Uncomment this section to test if accelerometer causes the issue

#include <Wire.h>
#include <LIS3DHTR.h>

const int SDA_PIN = 3;
const int SCL_PIN = 2;
#define LIS3DHTR_ADDRESS 0x19

LIS3DHTR<TwoWire> accel;

void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println("TEST 3: Accelerometer Initialization");

    Wire.begin(SDA_PIN, SCL_PIN);
    Serial.println("[OK] I2C initialized");

    accel.begin(Wire, LIS3DHTR_ADDRESS);
    delay(100);
    accel.setOutputDataRate(LIS3DHTR_DATARATE_50HZ);
    accel.setFullScaleRange(LIS3DHTR_RANGE_2G);

    Serial.println("[OK] Accelerometer initialized");
    Serial.println("Measure battery voltage now...");
}

void loop() {
    float x = accel.getAccelerationX();
    float y = accel.getAccelerationY();
    float z = accel.getAccelerationZ();

    Serial.print("Accel: X=");
    Serial.print(x);
    Serial.print(" Y=");
    Serial.print(y);
    Serial.print(" Z=");
    Serial.println(z);

    delay(1000);
}
*/

/*
// ========== TEST 4: WiFi Connection ==========
// Uncomment this section to test if WiFi causes the issue

#include <WiFi.h>

const char* ssid = "Obedio";
const char* password = "BrankomeinBruder:)";

void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println("TEST 4: WiFi Initialization");

    WiFi.begin(ssid, password);

    Serial.print("Connecting to WiFi");
    while (WiFi.status() != WL_CONNECTED) {
        delay(300);
        Serial.print(".");
    }

    Serial.println("\n[OK] WiFi connected");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    Serial.println("Measure battery voltage now...");
}

void loop() {
    delay(1000);
    Serial.print("WiFi status: ");
    Serial.println(WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected");
}
*/

/*
// ========== TEST 5: MQTT Connection ==========
// Uncomment this section to test if MQTT causes the issue

#include <WiFi.h>
#include <PubSubClient.h>

const char* ssid = "Obedio";
const char* password = "BrankomeinBruder:)";
const char* mqtt_server = "10.10.0.207";
const int mqtt_port = 1883;

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println("TEST 5: WiFi + MQTT Initialization");

    // Connect WiFi
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(300);
        Serial.print(".");
    }
    Serial.println("\n[OK] WiFi connected");

    // Connect MQTT
    client.setServer(mqtt_server, mqtt_port);
    client.setBufferSize(2048);

    if (client.connect("TEST-DEVICE")) {
        Serial.println("[OK] MQTT connected");
    } else {
        Serial.println("[ERROR] MQTT connection failed");
    }

    Serial.println("Measure battery voltage now...");
}

void loop() {
    client.loop();

    delay(1000);
    Serial.print("MQTT status: ");
    Serial.println(client.connected() ? "Connected" : "Disconnected");
}
*/

/*
// ========== TEST 6: Touch Sensor (DISABLED IN v2.1) ==========
// Uncomment this section to test if touch sensor causes the issue
// Even though it's disabled in v2.1, test if initialization affects power

#define TOUCH_PIN 1
#define TOUCH_THRESHOLD 40

void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println("TEST 6: Touch Sensor Reading");
    Serial.println("Note: This was DISABLED in v2.1-stable");
    Serial.println("Testing if even reading touch values causes issue");
}

void loop() {
    int touchValue = touchRead(TOUCH_PIN);

    Serial.print("Touch value: ");
    Serial.println(touchValue);

    delay(1000);
}
*/

/*
// ========== TEST 7: ALL FEATURES COMBINED (v2.1-stable replica) ==========
// Only uncomment this AFTER testing features individually
// This recreates the full v2.1-stable setup to confirm which combination fails

#include <Wire.h>
#include <Adafruit_MCP23X17.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Adafruit_NeoPixel.h>
#include <LIS3DHTR.h>

// All configuration from v2.1-stable
const char* ssid = "Obedio";
const char* password = "BrankomeinBruder:)";
const char* mqtt_server = "10.10.0.207";
const int mqtt_port = 1883;
const int SDA_PIN = 3;
const int SCL_PIN = 2;
#define MCP23017_ADDRESS 0x20
#define LIS3DHTR_ADDRESS 0x19
#define LED_PIN 17
#define NUM_LEDS 16

WiFiClient espClient;
PubSubClient client(espClient);
Adafruit_MCP23X17 mcp;
Adafruit_NeoPixel strip = Adafruit_NeoPixel(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);
LIS3DHTR<TwoWire> accel;

void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println("TEST 7: Full v2.1-stable Initialization");

    // NeoPixel
    strip.begin();
    strip.setBrightness(200);
    strip.show();
    Serial.println("[OK] NeoPixels");

    // I2C
    Wire.begin(SDA_PIN, SCL_PIN);
    Serial.println("[OK] I2C");

    // MCP23017
    if (!mcp.begin_I2C(MCP23017_ADDRESS, &Wire)) {
        Serial.println("[ERROR] MCP23017");
    } else {
        Serial.println("[OK] MCP23017");
    }

    // Accelerometer
    accel.begin(Wire, LIS3DHTR_ADDRESS);
    accel.setOutputDataRate(LIS3DHTR_DATARATE_50HZ);
    accel.setFullScaleRange(LIS3DHTR_RANGE_2G);
    Serial.println("[OK] Accelerometer");

    // WiFi
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(300);
    }
    Serial.println("[OK] WiFi");

    // MQTT
    client.setServer(mqtt_server, mqtt_port);
    client.setBufferSize(2048);
    Serial.println("[OK] MQTT configured");

    Serial.println("Full initialization complete - measure voltage");
}

void loop() {
    delay(1000);
    Serial.println("All systems running");
}
*/
