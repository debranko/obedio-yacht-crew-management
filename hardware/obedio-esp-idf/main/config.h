/**
 * @file config.h
 * @brief Central configuration for OBEDIO Smart Button
 *
 * ESP32-S3 Custom PCB Configuration
 * - 6 buttons via MCP23017 I2C expander
 * - LIS3DHTR accelerometer
 * - 16x WS2812B NeoPixel LEDs
 * - Capacitive touch sensor
 * - I2S microphone and speaker
 */

#ifndef CONFIG_H
#define CONFIG_H

#include "sdkconfig.h"
#include <stdint.h>
#include <stdbool.h>

// ==================== FIRMWARE VERSION ====================
#define FIRMWARE_VERSION        "v3.0-esp-idf"
#define HARDWARE_VERSION        "ESP32-S3 Custom PCB v1.0"

// ==================== NETWORK CONFIGURATION ====================
// WiFi defaults (can be overridden via NVS or menuconfig)
#ifndef CONFIG_OBEDIO_WIFI_SSID
#define WIFI_SSID               "Obedio"
#else
#define WIFI_SSID               CONFIG_OBEDIO_WIFI_SSID
#endif

#ifndef CONFIG_OBEDIO_WIFI_PASSWORD
#define WIFI_PASSWORD           "BrankomeinBruder:)"
#else
#define WIFI_PASSWORD           CONFIG_OBEDIO_WIFI_PASSWORD
#endif

#ifndef CONFIG_OBEDIO_WIFI_MAXIMUM_RETRY
#define WIFI_MAXIMUM_RETRY      10
#else
#define WIFI_MAXIMUM_RETRY      CONFIG_OBEDIO_WIFI_MAXIMUM_RETRY
#endif

// MQTT defaults (can be overridden via NVS or menuconfig)
#ifndef CONFIG_OBEDIO_MQTT_BROKER_URI
#define MQTT_BROKER_URI         "mqtt://10.10.0.10:1883"
#else
#define MQTT_BROKER_URI         CONFIG_OBEDIO_MQTT_BROKER_URI
#endif

#ifndef CONFIG_OBEDIO_MQTT_BUFFER_SIZE
#define MQTT_BUFFER_SIZE        4096
#else
#define MQTT_BUFFER_SIZE        CONFIG_OBEDIO_MQTT_BUFFER_SIZE
#endif

// mDNS hostname (will be obedio-{MAC}.local)
#define MDNS_HOSTNAME_PREFIX    "obedio"

// ==================== I2C CONFIGURATION ====================
#define I2C_MASTER_NUM          I2C_NUM_0
#define I2C_MASTER_FREQ_HZ      100000  // 100 kHz

#ifndef CONFIG_OBEDIO_I2C_SDA_GPIO
#define I2C_MASTER_SDA_IO       3
#else
#define I2C_MASTER_SDA_IO       CONFIG_OBEDIO_I2C_SDA_GPIO
#endif

#ifndef CONFIG_OBEDIO_I2C_SCL_GPIO
#define I2C_MASTER_SCL_IO       2
#else
#define I2C_MASTER_SCL_IO       CONFIG_OBEDIO_I2C_SCL_GPIO
#endif

// I2C Device Addresses
#define MCP23017_I2C_ADDR       0x20
#define LIS3DHTR_I2C_ADDR       0x19

// ==================== BUTTON CONFIGURATION ====================
#define BUTTON_COUNT            6

// Button pins on MCP23017 GPA bank
static const uint8_t BUTTON_PINS[BUTTON_COUNT] = {7, 6, 5, 4, 3, 0};  // T1-T6

// Button names for logging
static const char* BUTTON_NAMES[BUTTON_COUNT] = {
    "T1", "T2", "T3", "T4", "T5", "T6"
};

// Button MQTT identifiers
static const char* BUTTON_MQTT[BUTTON_COUNT] = {
    "main",   // T1 - Main button
    "aux1",   // T2 - Call service
    "aux2",   // T3 - Lights control
    "aux3",   // T4 - Prepare food
    "aux4",   // T5 - Bring drinks
    "aux5"    // T6 - DND toggle
};

// Button press timing
#ifndef CONFIG_OBEDIO_DEBOUNCE_DELAY_MS
#define DEBOUNCE_DELAY_MS       50
#else
#define DEBOUNCE_DELAY_MS       CONFIG_OBEDIO_DEBOUNCE_DELAY_MS
#endif

#ifndef CONFIG_OBEDIO_LONG_PRESS_TIME_MS
#define LONG_PRESS_TIME_MS      700
#else
#define LONG_PRESS_TIME_MS      CONFIG_OBEDIO_LONG_PRESS_TIME_MS
#endif

#ifndef CONFIG_OBEDIO_DOUBLE_CLICK_WINDOW_MS
#define DOUBLE_CLICK_WINDOW_MS  500
#else
#define DOUBLE_CLICK_WINDOW_MS  CONFIG_OBEDIO_DOUBLE_CLICK_WINDOW_MS
#endif

// ==================== LED CONFIGURATION ====================
#ifndef CONFIG_OBEDIO_LED_GPIO
#define LED_GPIO                17
#else
#define LED_GPIO                CONFIG_OBEDIO_LED_GPIO
#endif

#ifndef CONFIG_OBEDIO_LED_COUNT
#define NUM_LEDS                16
#else
#define NUM_LEDS                CONFIG_OBEDIO_LED_COUNT
#endif

#ifndef CONFIG_OBEDIO_LED_BRIGHTNESS
#define LED_BRIGHTNESS          200
#else
#define LED_BRIGHTNESS          CONFIG_OBEDIO_LED_BRIGHTNESS
#endif

#define LED_INTERVAL_MS         150  // Rainbow animation speed

// ==================== TOUCH SENSOR CONFIGURATION ====================
#ifndef CONFIG_OBEDIO_TOUCH_GPIO
#define TOUCH_PAD_GPIO          1
#else
#define TOUCH_PAD_GPIO          CONFIG_OBEDIO_TOUCH_GPIO
#endif

// ESP32-S3 touch pad number for GPIO1
#define TOUCH_PAD_NO            TOUCH_PAD_NUM1

#ifndef CONFIG_OBEDIO_TOUCH_THRESHOLD_PERCENT
#define TOUCH_THRESHOLD_PERCENT 80  // % of baseline
#else
#define TOUCH_THRESHOLD_PERCENT CONFIG_OBEDIO_TOUCH_THRESHOLD_PERCENT
#endif

#define TOUCH_DEBOUNCE_MS       50
#define DOUBLE_TOUCH_WINDOW_MS  500

// ==================== ACCELEROMETER CONFIGURATION ====================
#ifndef CONFIG_OBEDIO_SHAKE_THRESHOLD
#define SHAKE_THRESHOLD         8.0f  // G-force (increased from 3.5 to reduce false triggers)
#else
#define SHAKE_THRESHOLD         (CONFIG_OBEDIO_SHAKE_THRESHOLD / 100.0f)
#endif

#define SHAKE_DEBOUNCE_MS       2000  // 2 seconds between shake events
#define ACCEL_SAMPLE_RATE_HZ    50    // 50 Hz sampling
#define ACCEL_RANGE_G           2     // ±2G range

// ==================== AUDIO CONFIGURATION ====================
// Sample rate
#ifndef CONFIG_OBEDIO_AUDIO_SAMPLE_RATE
#define AUDIO_SAMPLE_RATE       16000  // 16 kHz
#else
#define AUDIO_SAMPLE_RATE       CONFIG_OBEDIO_AUDIO_SAMPLE_RATE
#endif

// Maximum recording duration
#ifndef CONFIG_OBEDIO_AUDIO_MAX_DURATION
#define AUDIO_MAX_DURATION_SEC  20  // 20 seconds
#else
#define AUDIO_MAX_DURATION_SEC  CONFIG_OBEDIO_AUDIO_MAX_DURATION
#endif

// Audio buffer size (in samples)
#define AUDIO_SAMPLE_SIZE       2  // 16-bit samples = 2 bytes
#define AUDIO_MAX_SAMPLES       (AUDIO_SAMPLE_RATE * AUDIO_MAX_DURATION_SEC)
#define AUDIO_BUFFER_SIZE       (AUDIO_MAX_SAMPLES * AUDIO_SAMPLE_SIZE)  // 640 KB @ 16kHz, 20s

// I2S Configuration - Microphone (INMP441)
#define I2S_MIC_NUM             I2S_NUM_0

#ifndef CONFIG_OBEDIO_I2S_MIC_BCK_GPIO
#define I2S_MIC_BCK_IO          33
#else
#define I2S_MIC_BCK_IO          CONFIG_OBEDIO_I2S_MIC_BCK_GPIO
#endif

#ifndef CONFIG_OBEDIO_I2S_MIC_WS_GPIO
#define I2S_MIC_WS_IO           38
#else
#define I2S_MIC_WS_IO           CONFIG_OBEDIO_I2S_MIC_WS_GPIO
#endif

#ifndef CONFIG_OBEDIO_I2S_MIC_DATA_GPIO
#define I2S_MIC_DATA_IO         34
#else
#define I2S_MIC_DATA_IO         CONFIG_OBEDIO_I2S_MIC_DATA_GPIO
#endif

// I2S Configuration - Speaker (MAX98357A)
#define I2S_SPK_NUM             I2S_NUM_1

#ifndef CONFIG_OBEDIO_I2S_SPK_BCK_GPIO
#define I2S_SPK_BCK_IO          10
#else
#define I2S_SPK_BCK_IO          CONFIG_OBEDIO_I2S_SPK_BCK_GPIO
#endif

#ifndef CONFIG_OBEDIO_I2S_SPK_WS_GPIO
#define I2S_SPK_WS_IO           18
#else
#define I2S_SPK_WS_IO           CONFIG_OBEDIO_I2S_SPK_WS_GPIO
#endif

#ifndef CONFIG_OBEDIO_I2S_SPK_DATA_GPIO
#define I2S_SPK_DATA_IO         11
#else
#define I2S_SPK_DATA_IO         CONFIG_OBEDIO_I2S_SPK_DATA_GPIO
#endif

#ifndef CONFIG_OBEDIO_I2S_SPK_ENABLE_GPIO
#define I2S_SPK_ENABLE_IO       14
#else
#define I2S_SPK_ENABLE_IO       CONFIG_OBEDIO_I2S_SPK_ENABLE_GPIO
#endif

// Audio codec
#define AUDIO_CODEC_ADPCM       1  // IMA ADPCM compression
#define AUDIO_BITS_PER_SAMPLE   16

// ==================== WEB SERVER CONFIGURATION ====================
#define WEB_SERVER_PORT         80
#define WEB_MAX_CONNECTIONS     4
#define WEB_SOCKET_BUFFER_SIZE  1024

// ==================== NVS CONFIGURATION ====================
#define NVS_NAMESPACE           "obedio"
#define NVS_KEY_WIFI_SSID       "wifi_ssid"
#define NVS_KEY_WIFI_PASS       "wifi_pass"
#define NVS_KEY_MQTT_URI        "mqtt_uri"
#define NVS_KEY_DEVICE_NAME     "dev_name"
#define NVS_KEY_LOCATION_ID     "location_id"
#define NVS_KEY_LED_BRIGHTNESS  "led_bright"
#define NVS_KEY_SHAKE_THRESH    "shake_thresh"
#define NVS_KEY_TOUCH_THRESH    "touch_thresh"

// ==================== FACTORY RESET ====================
// Hold T6 (DND button) for 10 seconds on boot to factory reset
#define FACTORY_RESET_BUTTON    5  // Index of T6 in BUTTON_PINS array
#define FACTORY_RESET_TIME_MS   10000  // 10 seconds

// ==================== MQTT TOPICS ====================
#define MQTT_TOPIC_REGISTER     "obedio/device/register"
#define MQTT_TOPIC_HEARTBEAT    "obedio/device/heartbeat"
#define MQTT_TOPIC_BUTTON_FMT   "obedio/button/%s/press"   // Format: obedio/button/{deviceId}/press
#define MQTT_TOPIC_VOICE_FMT    "obedio/button/%s/voice"   // Format: obedio/button/{deviceId}/voice

// Heartbeat interval
#define HEARTBEAT_INTERVAL_MS   30000  // 30 seconds

// ==================== TASK PRIORITIES ====================
#define PRIORITY_BUTTON_TASK    5  // Highest - user input
#define PRIORITY_TOUCH_TASK     5  // Highest - user input
#define PRIORITY_MQTT_TASK      4  // Important - networking
#define PRIORITY_ACCEL_TASK     4  // Important - safety
#define PRIORITY_LED_TASK       3  // Normal - visual feedback
#define PRIORITY_WEB_TASK       3  // Normal - web interface
#define PRIORITY_AUDIO_TASK     4  // Important - voice recording

// ==================== TASK STACK SIZES ====================
#define STACK_SIZE_BUTTON       4096
#define STACK_SIZE_TOUCH        3072
#define STACK_SIZE_ACCEL        3072
#define STACK_SIZE_LED          3072
#define STACK_SIZE_AUDIO        8192  // Larger for audio processing
#define STACK_SIZE_WEB          8192  // Larger for HTTP server
#define STACK_SIZE_MQTT         6144

// ==================== HELPER MACROS ====================
#define MILLIS()                (esp_timer_get_time() / 1000ULL)
#define MICROS()                (esp_timer_get_time())

// RGB color helper
#define RGB(r, g, b)            ((uint32_t)(((uint32_t)(r) << 16) | ((uint32_t)(g) << 8) | (b)))

// ==================== DATA STRUCTURES ====================

// Press types
typedef enum {
    PRESS_TYPE_PRESS,         // Button pressed down (immediate event)
    PRESS_TYPE_SINGLE,        // Button released (short press < 500ms)
    PRESS_TYPE_DOUBLE,        // Double press
    PRESS_TYPE_LONG,          // Long press (>= 500ms, sent while holding)
    PRESS_TYPE_TOUCH,         // Touch sensor
    PRESS_TYPE_DOUBLE_TOUCH,  // Double touch
    PRESS_TYPE_SHAKE          // Shake detected
} press_type_t;

// LED colors
typedef enum {
    LED_COLOR_WHITE,
    LED_COLOR_YELLOW,
    LED_COLOR_BLUE,
    LED_COLOR_CYAN,
    LED_COLOR_PURPLE,
    LED_COLOR_RED,
    LED_COLOR_GREEN,
    LED_COLOR_RAINBOW
} led_color_t;

// Device state
typedef struct {
    char device_id[32];
    char wifi_ssid[64];
    char wifi_password[128];
    char mqtt_uri[128];
    char device_name[64];
    char location_id[64];
    uint8_t led_brightness;
    float shake_threshold;
    uint8_t touch_threshold;
    bool factory_reset_pending;
} device_config_t;

#endif // CONFIG_H
