/**
 * OBEDIO Custom PCB - Simplified Firmware
 * ESP32-S3 with MCP23017, LIS3DHTR, NeoPixel
 */

#include <Wire.h>
#include <Adafruit_MCP23X17.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Adafruit_NeoPixel.h>
#include <LIS3DHTR.h>

// ==================== CONFIGURATION ====================

// WiFi and MQTT
const char* ssid = "Obedio";
const char* password = "BrankomeinBruder:)";
const char* mqtt_server = "10.10.0.207";
const int mqtt_port = 1883;

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

// Shake detection threshold
#define SHAKE_THRESHOLD 2.5  // G-force threshold for shake

// ==================== GLOBAL OBJECTS ====================

WiFiClient espClient;
PubSubClient client(espClient);
Adafruit_MCP23X17 mcp;
Adafruit_NeoPixel strip = Adafruit_NeoPixel(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);
LIS3DHTR<TwoWire> accel;

// ==================== GLOBAL VARIABLES ====================

String deviceId = "BTN-";

// Button debounce
unsigned long lastDebounceTime[BUTTON_COUNT];
bool lastButtonState[BUTTON_COUNT] = {HIGH, HIGH, HIGH, HIGH, HIGH, HIGH};
bool buttonState[BUTTON_COUNT] = {HIGH, HIGH, HIGH, HIGH, HIGH, HIGH};
const unsigned long debounceDelay = 50;

// LED animation
unsigned long previousLEDMillis = 0;
const long LEDInterval = 150;
uint16_t hue = 64;

// Shake detection
unsigned long lastShakeTime = 0;
const unsigned long shakeDebounce = 2000;  // 2 seconds between shakes

// Sequence number
uint32_t sequenceNumber = 0;

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
    doc["firmwareVersion"] = "v1.0-simple";
    doc["hardwareVersion"] = "ESP32-S3 Custom PCB";
    doc["macAddress"] = WiFi.macAddress();
    doc["ipAddress"] = WiFi.localIP().toString();
    doc["rssi"] = WiFi.RSSI();

    JsonObject cap = doc.createNestedObject("capabilities");
    cap["button"] = true;
    cap["led"] = true;
    cap["accelerometer"] = true;

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
    doc["firmwareVersion"] = "v1.0-simple";
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

                if (buttonState[i] == LOW) {  // Button pressed
                    // Flash LEDs white
                    for (int j = 0; j < NUM_LEDS; j++) {
                        strip.setPixelColor(j, strip.Color(255, 255, 255));
                    }
                    strip.show();
                    delay(100);

                    // Publish to backend
                    publishButtonPress(BUTTON_MQTT[i], "single");

                    Serial.print("Button ");
                    Serial.print(BUTTON_NAMES[i]);
                    Serial.println(" pressed");
                }
            }
        }

        lastButtonState[i] = reading;
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

    // Check buttons
    checkButtons();

    // Check for shake
    checkShake();

    // Update LED animation
    rainbow();
}
