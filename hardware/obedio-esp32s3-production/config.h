/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OBEDIO ESP32-S3 - Configuration Header
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Customize your device settings here
 */

#ifndef CONFIG_H
#define CONFIG_H

// ═══════════════════════════════════════════════════════════════════════════
// NETWORK CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

#define WIFI_SSID           "Obedio"
#define WIFI_PASSWORD       "BrankomeinBruder:)"
#define WIFI_TIMEOUT_MS     20000
#define WIFI_RETRY_DELAY_MS 500
#define WIFI_MAX_RETRIES    10

// ═══════════════════════════════════════════════════════════════════════════
// MQTT BROKER CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

#define MQTT_BROKER         "10.10.0.207"
#define MQTT_PORT           1883
#define MQTT_USER           ""
#define MQTT_PASS           ""
#define MQTT_BUFFER_SIZE    4096
#define MQTT_KEEPALIVE      60
#define MQTT_QOS            1

// ═══════════════════════════════════════════════════════════════════════════
// BACKEND SERVER CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

#define BACKEND_HOST        "10.10.0.207"
#define BACKEND_PORT        8080
#define UPLOAD_ENDPOINT     "/api/upload/upload-audio"

// ═══════════════════════════════════════════════════════════════════════════
// HARDWARE PIN CONFIGURATION - ESP32-S3 Custom PCB
// ═══════════════════════════════════════════════════════════════════════════

// I2C Bus
#define I2C_SDA             3
#define I2C_SCL             2
#define I2C_FREQ_HZ         100000  // 100kHz

// I2C Device Addresses
#define MCP23017_ADDR       0x20  // GPIO Expander
#define LIS3DH_ADDR         0x19  // Accelerometer
#define MCP9808_ADDR        0x18  // Temperature Sensor

// LED Ring (WS2812B)
#define LED_RING_PIN        17
#define LED_RING_COUNT      16
#define LED_BRIGHTNESS      50    // 0-255

// I2S Microphone (MSM261S4030H0R)
#define MIC_BCLK            33
#define MIC_WS              38
#define MIC_SD              34
#define MIC_SAMPLE_RATE     16000
#define MIC_BITS_PER_SAMPLE 16

// I2S Speaker (MAX98357A)
#define SPK_BCLK            10
#define SPK_WS              18
#define SPK_SD              11
#define SPK_SD_MODE         14

// ═══════════════════════════════════════════════════════════════════════════
// BUTTON CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

#define DEBOUNCE_DELAY_MS       50
#define LONG_PRESS_TIME_MS      700
#define DOUBLE_CLICK_WINDOW_MS  500

// MCP23017 Port A Button Mapping
#define BTN_PIN_AUX5        0   // GPA0 - T6
#define BTN_PIN_AUX4        1   // GPA1 - T5
#define BTN_PIN_AUX3        2   // GPA2 - T4
#define BTN_PIN_AUX2        3   // GPA3 - T3
#define BTN_PIN_AUX1        4   // GPA4 - T2
#define BTN_PIN_MAIN        7   // GPA7 - T1

// ═══════════════════════════════════════════════════════════════════════════
// TIMING CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

#define HEARTBEAT_INTERVAL_MS       30000   // 30 seconds
#define TELEMETRY_INTERVAL_MS       60000   // 60 seconds
#define MQTT_RECONNECT_INTERVAL_MS  5000    // 5 seconds

// ═══════════════════════════════════════════════════════════════════════════
// DEVICE INFORMATION
// ═══════════════════════════════════════════════════════════════════════════

#define FIRMWARE_VERSION    "v1.0-custom-pcb"
#define HARDWARE_VERSION    "ESP32-S3 Custom PCB v3.0"
#define DEVICE_TYPE         "smart_button"
#define DEVICE_NAME         "Obedio Smart Button"

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE TOGGLES
// ═══════════════════════════════════════════════════════════════════════════

#define ENABLE_VOICE_RECORDING      true
#define ENABLE_ACCELEROMETER        true
#define ENABLE_TEMPERATURE_SENSOR   true
#define ENABLE_LED_RING             true
#define ENABLE_SPEAKER              true
#define ENABLE_OTA_UPDATES          false  // Over-the-air updates

// ═══════════════════════════════════════════════════════════════════════════
// DEBUG CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

#define SERIAL_BAUD_RATE    115200
#define DEBUG_MODE          true   // Enable verbose logging
#define DEBUG_MQTT          true   // Log MQTT messages
#define DEBUG_BUTTONS       true   // Log button events
#define DEBUG_I2C           true   // Log I2C communication

#endif // CONFIG_H
