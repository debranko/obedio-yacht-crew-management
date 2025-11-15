/**
 * OBEDIO Custom PCB - Main Entry Point
 * ESP32-S3 Smart Button Firmware
 *
 * PlatformIO Project - Professional Production Build
 */

#include <Arduino.h>
#include <Wire.h>
#include "config.h"
#include "hardware.h"
#include "network.h"
#include "mqtt_handler.h"

// ==================== GLOBAL STATE ====================

String deviceId;
uint32_t sequenceNumber = 0;
unsigned long lastHeartbeat = 0;

// ==================== SETUP ====================

void setup() {
    // Initialize serial for debugging
    #if ENABLE_SERIAL_DEBUG
    Serial.begin(115200);
    delay(1000);

    Serial.println("\n\n========================================");
    Serial.println("OBEDIO - Custom PCB ESP32-S3 Button");
    Serial.println("========================================");
    Serial.printf("Firmware: %s v%s\n", FIRMWARE_NAME, FIRMWARE_VERSION);
    Serial.printf("Hardware: %s\n\n", HARDWARE_VERSION);
    #endif

    // Initialize I2C bus
    Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
    Wire.setClock(I2C_FREQUENCY);
    #if ENABLE_SERIAL_DEBUG
    Serial.println("✅ I2C bus initialized");
    #endif

    // Initialize hardware components
    if (!initHardware()) {
        #if ENABLE_SERIAL_DEBUG
        Serial.println("❌ Hardware initialization failed!");
        #endif
        // Flash LEDs red to indicate error
        while (true) {
            flashLEDs(255, 0, 0, 500);
            delay(500);
        }
    }

    // Generate device ID from MAC address
    deviceId = generateDeviceId();
    #if ENABLE_SERIAL_DEBUG
    Serial.printf("Device ID: %s\n", deviceId.c_str());
    #endif

    // Initialize WiFi
    if (!connectWiFi()) {
        #if ENABLE_SERIAL_DEBUG
        Serial.println("❌ WiFi connection failed!");
        #endif
        // Flash LEDs orange to indicate WiFi error
        while (true) {
            flashLEDs(255, 128, 0, 500);
            delay(500);
        }
    }

    // Initialize MQTT
    if (!connectMQTT(deviceId)) {
        #if ENABLE_SERIAL_DEBUG
        Serial.println("❌ MQTT connection failed!");
        #endif
        // Continue anyway - will retry in loop
    }

    // Register device with backend
    registerDevice(deviceId);

    // Startup LED sequence (green wipe)
    startupLEDSequence();

    #if ENABLE_SERIAL_DEBUG
    Serial.println("\n✅ Setup complete! Device ready.\n");
    #endif
}

// ==================== MAIN LOOP ====================

void loop() {
    // Maintain network connections
    if (WiFi.status() != WL_CONNECTED) {
        #if ENABLE_SERIAL_DEBUG
        Serial.println("⚠️ WiFi disconnected, reconnecting...");
        #endif
        connectWiFi();
    }

    if (!isMQTTConnected()) {
        #if ENABLE_SERIAL_DEBUG
        Serial.println("⚠️ MQTT disconnected, reconnecting...");
        #endif
        connectMQTT(deviceId);
    }

    // Process MQTT messages
    mqttLoop();

    // Check all hardware inputs
    checkButtons(deviceId, &sequenceNumber);

    #if ENABLE_ACCELEROMETER
    checkAccelerometer(deviceId, &sequenceNumber);
    #endif

    // Update LED animation
    #if ENABLE_LED_ANIMATION
    updateLEDAnimation();
    #endif

    // Send heartbeat
    #if ENABLE_HEARTBEAT
    unsigned long now = millis();
    if (now - lastHeartbeat > HEARTBEAT_INTERVAL_MS) {
        sendHeartbeat(deviceId);
        lastHeartbeat = now;
    }
    #endif

    // Small delay to prevent busy-waiting
    delay(10);
}
