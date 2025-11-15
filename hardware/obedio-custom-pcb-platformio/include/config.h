/**
 * Configuration Header for Obedio Custom PCB
 * Centralized configuration for all settings
 */

#ifndef CONFIG_H
#define CONFIG_H

// ==================== FIRMWARE INFO ====================
#define FIRMWARE_VERSION "1.0.0"
#define FIRMWARE_NAME "Obedio Custom PCB"
#define HARDWARE_VERSION "ESP32-S3 v1.0"

// ==================== NETWORK CONFIGURATION ====================
#define WIFI_SSID "Obedio"
#define WIFI_PASSWORD "BrankomeinBruder:)"
#define WIFI_TIMEOUT_MS 20000
#define WIFI_RETRY_DELAY_MS 500

// ==================== MQTT CONFIGURATION ====================
#define MQTT_BROKER "10.10.0.207"
#define MQTT_PORT 1883
#define MQTT_USER ""
#define MQTT_PASSWORD ""
#define MQTT_TIMEOUT_MS 10000
#define MQTT_KEEPALIVE_SEC 60
#define MQTT_BUFFER_SIZE 2048

// MQTT Topics
#define MQTT_TOPIC_REGISTER "obedio/device/register"
#define MQTT_TOPIC_HEARTBEAT "obedio/device/heartbeat"
#define MQTT_TOPIC_BUTTON_PRESS_FORMAT "obedio/button/%s/press"

// ==================== HARDWARE PIN DEFINITIONS ====================

// I2C Bus
#define I2C_SDA_PIN 3
#define I2C_SCL_PIN 2
#define I2C_FREQUENCY 400000  // 400kHz

// I2C Device Addresses
#define MCP23017_I2C_ADDRESS 0x20
#define LIS3DHTR_I2C_ADDRESS 0x19

// NeoPixel LED Ring
#define LED_PIN 17
#define LED_COUNT 16
#define LED_BRIGHTNESS 200
#define LED_TYPE NEO_GRB + NEO_KHZ800

// ==================== BUTTON CONFIGURATION ====================

// Button Pins (on MCP23017 GPA bank)
#define BUTTON_COUNT 6
#define BUTTON_T1_PIN 7  // GPA7 - Main button
#define BUTTON_T2_PIN 6  // GPA6
#define BUTTON_T3_PIN 5  // GPA5
#define BUTTON_T4_PIN 4  // GPA4
#define BUTTON_T5_PIN 3  // GPA3
#define BUTTON_T6_PIN 0  // GPA0

// Button Debounce
#define BUTTON_DEBOUNCE_MS 50

// ==================== ACCELEROMETER CONFIGURATION ====================

// LIS3DHTR Settings
#define ACCEL_DATA_RATE LIS3DHTR_DATARATE_50HZ
#define ACCEL_RANGE LIS3DHTR_RANGE_2G
#define ACCEL_SHAKE_THRESHOLD 2.5  // G-force threshold
#define ACCEL_SHAKE_COOLDOWN_MS 2000

// ==================== LED ANIMATION SETTINGS ====================

#define LED_ANIMATION_INTERVAL_MS 150
#define LED_STARTUP_DELAY_MS 30

// ==================== TELEMETRY SETTINGS ====================

#define HEARTBEAT_INTERVAL_MS 30000  // 30 seconds
#define BATTERY_LEVEL 100  // No battery on this PCB, always report 100%

// ==================== LOCATION ASSIGNMENT ====================

// Optional: Set these to assign device to specific location/guest
// Leave empty for auto-assignment via backend
#define LOCATION_ID ""
#define GUEST_ID ""

// ==================== FEATURE FLAGS ====================

// Enable/disable features
#define ENABLE_ACCELEROMETER 1
#define ENABLE_LED_ANIMATION 1
#define ENABLE_SERIAL_DEBUG 1
#define ENABLE_HEARTBEAT 1

// Serial Debug Level (0=None, 1=Error, 2=Warning, 3=Info, 4=Debug)
#define DEBUG_LEVEL 3

#endif // CONFIG_H
