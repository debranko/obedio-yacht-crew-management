/**
 * @file web_server.c
 * @brief Web server implementation for OBEDIO Smart Button
 */

#include "web_server.h"
#include "config.h"
#include "wifi_manager.h"

#include <string.h>
#include <sys/param.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_system.h"
#include "esp_log.h"
#include "esp_timer.h"
#include "esp_http_server.h"
#include "esp_ota_ops.h"
#include "esp_app_format.h"
#include "nvs_flash.h"
#include "nvs.h"
#include "cJSON.h"
#include "lwip/sockets.h"
#include "lwip/netdb.h"

static const char *TAG = "web_server";

// DNS server configuration
#define DNS_PORT 53
#define DNS_MAX_LEN 256

static int dns_socket = -1;
static TaskHandle_t dns_task_handle = NULL;

// Embedded HTML files
extern const uint8_t index_html_start[] asm("_binary_index_html_start");
extern const uint8_t index_html_end[] asm("_binary_index_html_end");
extern const uint8_t debug_html_start[] asm("_binary_debug_html_start");
extern const uint8_t debug_html_end[] asm("_binary_debug_html_end");
extern const uint8_t status_html_start[] asm("_binary_status_html_start");
extern const uint8_t status_html_end[] asm("_binary_status_html_end");
extern const uint8_t ota_html_start[] asm("_binary_ota_html_start");
extern const uint8_t ota_html_end[] asm("_binary_ota_html_end");

// Server handle
static httpd_handle_t server = NULL;

// Sensor data for WebSocket streaming
static struct {
    float accel_x;
    float accel_y;
    float accel_z;
    float accel_mag;
    uint32_t touch_value;
    uint8_t button_states[6];
    uint8_t led_brightness;
} sensor_data = {0};

// Log buffer (circular buffer)
#define LOG_BUFFER_SIZE 20
#define LOG_MESSAGE_SIZE 128
static char log_buffer[LOG_BUFFER_SIZE][LOG_MESSAGE_SIZE];
static int log_index = 0;

// WebSocket client tracking
static int ws_fd = -1;

// Device config (shared)
extern device_config_t g_device_config;

// ==================== HELPER FUNCTIONS ====================

/**
 * @brief Load device configuration from NVS
 */
static esp_err_t load_config_from_nvs(device_config_t *config)
{
    nvs_handle_t nvs_handle;
    esp_err_t err = nvs_open(NVS_NAMESPACE, NVS_READONLY, &nvs_handle);
    if (err != ESP_OK) {
        ESP_LOGW(TAG, "NVS not found, using defaults");
        return err;
    }

    size_t len;

    // WiFi SSID
    len = sizeof(config->wifi_ssid);
    nvs_get_str(nvs_handle, NVS_KEY_WIFI_SSID, config->wifi_ssid, &len);

    // WiFi Password
    len = sizeof(config->wifi_password);
    nvs_get_str(nvs_handle, NVS_KEY_WIFI_PASS, config->wifi_password, &len);

    // MQTT URI
    len = sizeof(config->mqtt_uri);
    nvs_get_str(nvs_handle, NVS_KEY_MQTT_URI, config->mqtt_uri, &len);

    // Device Name
    len = sizeof(config->device_name);
    nvs_get_str(nvs_handle, NVS_KEY_DEVICE_NAME, config->device_name, &len);

    // Location ID
    len = sizeof(config->location_id);
    nvs_get_str(nvs_handle, NVS_KEY_LOCATION_ID, config->location_id, &len);

    // LED Brightness
    uint8_t brightness;
    if (nvs_get_u8(nvs_handle, NVS_KEY_LED_BRIGHTNESS, &brightness) == ESP_OK) {
        config->led_brightness = brightness;
    }

    // Shake Threshold
    uint32_t shake_thresh_int;
    if (nvs_get_u32(nvs_handle, NVS_KEY_SHAKE_THRESH, &shake_thresh_int) == ESP_OK) {
        memcpy(&config->shake_threshold, &shake_thresh_int, sizeof(float));
    }

    // Touch Threshold
    uint8_t touch_thresh;
    if (nvs_get_u8(nvs_handle, NVS_KEY_TOUCH_THRESH, &touch_thresh) == ESP_OK) {
        config->touch_threshold = touch_thresh;
    }

    nvs_close(nvs_handle);
    return ESP_OK;
}

/**
 * @brief Save device configuration to NVS
 */
static esp_err_t save_config_to_nvs(const device_config_t *config)
{
    nvs_handle_t nvs_handle;
    esp_err_t err = nvs_open(NVS_NAMESPACE, NVS_READWRITE, &nvs_handle);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to open NVS: %s", esp_err_to_name(err));
        return err;
    }

    // Save all config values
    nvs_set_str(nvs_handle, NVS_KEY_WIFI_SSID, config->wifi_ssid);
    nvs_set_str(nvs_handle, NVS_KEY_WIFI_PASS, config->wifi_password);
    nvs_set_str(nvs_handle, NVS_KEY_MQTT_URI, config->mqtt_uri);
    nvs_set_str(nvs_handle, NVS_KEY_DEVICE_NAME, config->device_name);
    nvs_set_str(nvs_handle, NVS_KEY_LOCATION_ID, config->location_id);
    nvs_set_u8(nvs_handle, NVS_KEY_LED_BRIGHTNESS, config->led_brightness);

    // Save float as u32
    uint32_t shake_thresh_int;
    memcpy(&shake_thresh_int, &config->shake_threshold, sizeof(float));
    nvs_set_u32(nvs_handle, NVS_KEY_SHAKE_THRESH, shake_thresh_int);

    nvs_set_u8(nvs_handle, NVS_KEY_TOUCH_THRESH, config->touch_threshold);

    err = nvs_commit(nvs_handle);
    nvs_close(nvs_handle);

    if (err == ESP_OK) {
        ESP_LOGI(TAG, "Configuration saved to NVS");
    } else {
        ESP_LOGE(TAG, "Failed to commit NVS: %s", esp_err_to_name(err));
    }

    return err;
}

// ==================== HTTP HANDLERS ====================

/**
 * @brief GET / - Serve configuration page
 */
static esp_err_t index_handler(httpd_req_t *req)
{
    const size_t html_len = index_html_end - index_html_start;
    httpd_resp_set_type(req, "text/html");
    httpd_resp_send(req, (const char *)index_html_start, html_len);
    return ESP_OK;
}

/**
 * @brief GET /debug - Serve debug page
 */
static esp_err_t debug_handler(httpd_req_t *req)
{
    const size_t html_len = debug_html_end - debug_html_start;
    httpd_resp_set_type(req, "text/html");
    httpd_resp_send(req, (const char *)debug_html_start, html_len);
    return ESP_OK;
}

/**
 * @brief GET /status - Serve status page
 */
static esp_err_t status_handler(httpd_req_t *req)
{
    const size_t html_len = status_html_end - status_html_start;
    httpd_resp_set_type(req, "text/html");
    httpd_resp_send(req, (const char *)status_html_start, html_len);
    return ESP_OK;
}

/**
 * @brief GET /ota - Serve OTA upload page
 */
static esp_err_t ota_handler(httpd_req_t *req)
{
    const size_t html_len = ota_html_end - ota_html_start;
    httpd_resp_set_type(req, "text/html");
    httpd_resp_send(req, (const char *)ota_html_start, html_len);
    return ESP_OK;
}

/**
 * @brief GET /api/config - Get current configuration as JSON
 */
static esp_err_t api_config_get_handler(httpd_req_t *req)
{
    cJSON *root = cJSON_CreateObject();

    cJSON_AddStringToObject(root, "wifi_ssid", g_device_config.wifi_ssid);
    cJSON_AddStringToObject(root, "mqtt_uri", g_device_config.mqtt_uri);
    cJSON_AddStringToObject(root, "device_name", g_device_config.device_name);
    cJSON_AddStringToObject(root, "location_id", g_device_config.location_id);
    cJSON_AddNumberToObject(root, "led_brightness", g_device_config.led_brightness);
    cJSON_AddNumberToObject(root, "shake_threshold", g_device_config.shake_threshold);
    cJSON_AddNumberToObject(root, "touch_threshold", g_device_config.touch_threshold);

    const char *json_str = cJSON_Print(root);
    httpd_resp_set_type(req, "application/json");
    httpd_resp_sendstr(req, json_str);

    cJSON_free((void *)json_str);
    cJSON_Delete(root);
    return ESP_OK;
}

/**
 * @brief POST /api/config - Update configuration
 */
static esp_err_t api_config_post_handler(httpd_req_t *req)
{
    char buf[1024];
    int ret, remaining = req->content_len;

    if (remaining >= sizeof(buf)) {
        httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Content too long");
        return ESP_FAIL;
    }

    ret = httpd_req_recv(req, buf, MIN(remaining, sizeof(buf)));
    if (ret <= 0) {
        if (ret == HTTPD_SOCK_ERR_TIMEOUT) {
            httpd_resp_send_408(req);
        }
        return ESP_FAIL;
    }
    buf[ret] = '\0';

    // Parse JSON
    cJSON *root = cJSON_Parse(buf);
    if (root == NULL) {
        httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Invalid JSON");
        return ESP_FAIL;
    }

    // Update config
    cJSON *item;
    if ((item = cJSON_GetObjectItem(root, "wifi_ssid")) != NULL && cJSON_IsString(item)) {
        strncpy(g_device_config.wifi_ssid, item->valuestring, sizeof(g_device_config.wifi_ssid) - 1);
    }
    if ((item = cJSON_GetObjectItem(root, "wifi_password")) != NULL && cJSON_IsString(item)) {
        strncpy(g_device_config.wifi_password, item->valuestring, sizeof(g_device_config.wifi_password) - 1);
    }
    if ((item = cJSON_GetObjectItem(root, "mqtt_uri")) != NULL && cJSON_IsString(item)) {
        strncpy(g_device_config.mqtt_uri, item->valuestring, sizeof(g_device_config.mqtt_uri) - 1);
    }
    if ((item = cJSON_GetObjectItem(root, "device_name")) != NULL && cJSON_IsString(item)) {
        strncpy(g_device_config.device_name, item->valuestring, sizeof(g_device_config.device_name) - 1);
    }
    if ((item = cJSON_GetObjectItem(root, "location_id")) != NULL && cJSON_IsString(item)) {
        strncpy(g_device_config.location_id, item->valuestring, sizeof(g_device_config.location_id) - 1);
    }
    if ((item = cJSON_GetObjectItem(root, "led_brightness")) != NULL && cJSON_IsNumber(item)) {
        g_device_config.led_brightness = (uint8_t)item->valueint;
    }
    if ((item = cJSON_GetObjectItem(root, "shake_threshold")) != NULL && cJSON_IsNumber(item)) {
        g_device_config.shake_threshold = (float)item->valuedouble;
    }
    if ((item = cJSON_GetObjectItem(root, "touch_threshold")) != NULL && cJSON_IsNumber(item)) {
        g_device_config.touch_threshold = (uint8_t)item->valueint;
    }

    cJSON_Delete(root);

    // Save to NVS
    if (save_config_to_nvs(&g_device_config) != ESP_OK) {
        httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Failed to save config");
        return ESP_FAIL;
    }

    httpd_resp_set_type(req, "application/json");
    httpd_resp_sendstr(req, "{\"status\":\"ok\",\"message\":\"Configuration saved. Restart required for WiFi/MQTT changes.\"}");
    return ESP_OK;
}

/**
 * @brief GET /api/status - Get device status as JSON
 */
static esp_err_t api_status_handler(httpd_req_t *req)
{
    cJSON *root = cJSON_CreateObject();

    // Firmware info
    cJSON_AddStringToObject(root, "firmware_version", FIRMWARE_VERSION);
    cJSON_AddStringToObject(root, "hardware_version", HARDWARE_VERSION);

    // Device info
    cJSON_AddStringToObject(root, "device_id", g_device_config.device_id);

    // Uptime
    int64_t uptime_sec = esp_timer_get_time() / 1000000;
    cJSON_AddNumberToObject(root, "uptime", uptime_sec);

    // Network info
    cJSON_AddStringToObject(root, "ip_address", wifi_get_ip_address());
    cJSON_AddStringToObject(root, "mac_address", wifi_get_mac_address());
    cJSON_AddNumberToObject(root, "rssi", wifi_get_rssi());

    // Heap info
    cJSON_AddNumberToObject(root, "heap_free", esp_get_free_heap_size());
    cJSON_AddNumberToObject(root, "heap_total", esp_get_minimum_free_heap_size());

    const char *json_str = cJSON_Print(root);
    httpd_resp_set_type(req, "application/json");
    httpd_resp_sendstr(req, json_str);

    cJSON_free((void *)json_str);
    cJSON_Delete(root);
    return ESP_OK;
}

/**
 * @brief GET /api/sensors - Get live sensor readings as JSON
 */
static esp_err_t api_sensors_handler(httpd_req_t *req)
{
    cJSON *root = cJSON_CreateObject();

    // Accelerometer
    cJSON_AddNumberToObject(root, "accel_x", sensor_data.accel_x);
    cJSON_AddNumberToObject(root, "accel_y", sensor_data.accel_y);
    cJSON_AddNumberToObject(root, "accel_z", sensor_data.accel_z);
    cJSON_AddNumberToObject(root, "accel_magnitude", sensor_data.accel_mag);

    // Touch sensor
    cJSON_AddNumberToObject(root, "touch_value", sensor_data.touch_value);

    // Buttons
    cJSON *buttons = cJSON_CreateArray();
    for (int i = 0; i < 6; i++) {
        cJSON_AddItemToArray(buttons, cJSON_CreateNumber(sensor_data.button_states[i]));
    }
    cJSON_AddItemToObject(root, "button_states", buttons);

    // LED brightness
    cJSON_AddNumberToObject(root, "led_brightness", sensor_data.led_brightness);

    // Logs
    cJSON *logs = cJSON_CreateArray();
    for (int i = 0; i < LOG_BUFFER_SIZE; i++) {
        int idx = (log_index + i) % LOG_BUFFER_SIZE;
        if (log_buffer[idx][0] != '\0') {
            cJSON_AddItemToArray(logs, cJSON_CreateString(log_buffer[idx]));
        }
    }
    cJSON_AddItemToObject(root, "logs", logs);

    const char *json_str = cJSON_Print(root);
    httpd_resp_set_type(req, "application/json");
    httpd_resp_sendstr(req, json_str);

    cJSON_free((void *)json_str);
    cJSON_Delete(root);
    return ESP_OK;
}

/**
 * @brief POST /api/factory-reset - Trigger factory reset
 */
static esp_err_t api_factory_reset_handler(httpd_req_t *req)
{
    ESP_LOGW(TAG, "Factory reset requested via web interface");

    // Erase NVS
    nvs_flash_erase();

    httpd_resp_set_type(req, "application/json");
    httpd_resp_sendstr(req, "{\"status\":\"ok\",\"message\":\"Factory reset complete. Device will restart.\"}");

    // Restart after a delay
    vTaskDelay(pdMS_TO_TICKS(2000));
    esp_restart();

    return ESP_OK;
}

/**
 * @brief POST /api/ota - Handle OTA firmware upload
 */
static esp_err_t api_ota_handler(httpd_req_t *req)
{
    esp_ota_handle_t ota_handle;
    const esp_partition_t *update_partition = NULL;
    esp_err_t err;

    ESP_LOGI(TAG, "Starting OTA update...");

    // Get update partition
    update_partition = esp_ota_get_next_update_partition(NULL);
    if (update_partition == NULL) {
        httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "No OTA partition found");
        return ESP_FAIL;
    }

    ESP_LOGI(TAG, "Writing to partition subtype %d at offset 0x%lx",
             update_partition->subtype, update_partition->address);

    // Begin OTA
    err = esp_ota_begin(update_partition, OTA_SIZE_UNKNOWN, &ota_handle);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "OTA begin failed: %s", esp_err_to_name(err));
        httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "OTA begin failed");
        return ESP_FAIL;
    }

    // Receive and write firmware data
    char buf[1024];
    int remaining = req->content_len;
    int received;

    while (remaining > 0) {
        received = httpd_req_recv(req, buf, MIN(remaining, sizeof(buf)));
        if (received <= 0) {
            if (received == HTTPD_SOCK_ERR_TIMEOUT) {
                continue;
            }
            esp_ota_abort(ota_handle);
            httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Upload failed");
            return ESP_FAIL;
        }

        err = esp_ota_write(ota_handle, buf, received);
        if (err != ESP_OK) {
            esp_ota_abort(ota_handle);
            httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "OTA write failed");
            return ESP_FAIL;
        }

        remaining -= received;
    }

    // End OTA
    err = esp_ota_end(ota_handle);
    if (err != ESP_OK) {
        httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "OTA end failed");
        return ESP_FAIL;
    }

    // Set boot partition
    err = esp_ota_set_boot_partition(update_partition);
    if (err != ESP_OK) {
        httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Failed to set boot partition");
        return ESP_FAIL;
    }

    ESP_LOGI(TAG, "OTA update successful!");
    httpd_resp_set_type(req, "application/json");
    httpd_resp_sendstr(req, "{\"status\":\"ok\",\"message\":\"Firmware updated. Rebooting...\"}");

    // Restart after a delay
    vTaskDelay(pdMS_TO_TICKS(2000));
    esp_restart();

    return ESP_OK;
}

/**
 * @brief GET /api/wifi/scan - Scan for available WiFi networks
 */
static esp_err_t api_wifi_scan_handler(httpd_req_t *req)
{
    char *json_out = NULL;
    esp_err_t err = wifi_scan_networks(&json_out);

    if (err != ESP_OK) {
        httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "WiFi scan failed");
        return ESP_FAIL;
    }

    httpd_resp_set_type(req, "application/json");
    httpd_resp_sendstr(req, json_out);

    free(json_out);
    return ESP_OK;
}

/**
 * @brief POST /api/wifi/connect - Connect to a WiFi network
 */
static esp_err_t api_wifi_connect_handler(httpd_req_t *req)
{
    char buf[256];
    int ret, remaining = req->content_len;

    if (remaining >= sizeof(buf)) {
        httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Content too long");
        return ESP_FAIL;
    }

    ret = httpd_req_recv(req, buf, MIN(remaining, sizeof(buf)));
    if (ret <= 0) {
        if (ret == HTTPD_SOCK_ERR_TIMEOUT) {
            httpd_resp_send_408(req);
        }
        return ESP_FAIL;
    }
    buf[ret] = '\0';

    // Parse JSON
    cJSON *root = cJSON_Parse(buf);
    if (root == NULL) {
        httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Invalid JSON");
        return ESP_FAIL;
    }

    cJSON *ssid_item = cJSON_GetObjectItem(root, "ssid");
    cJSON *password_item = cJSON_GetObjectItem(root, "password");

    if (ssid_item == NULL || !cJSON_IsString(ssid_item) ||
        password_item == NULL || !cJSON_IsString(password_item)) {
        cJSON_Delete(root);
        httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Missing ssid or password");
        return ESP_FAIL;
    }

    const char *ssid = ssid_item->valuestring;
    const char *password = password_item->valuestring;

    ESP_LOGI(TAG, "WiFi connect request: SSID=%s", ssid);

    // Attempt connection
    esp_err_t err = wifi_connect_to_network(ssid, password);

    cJSON_Delete(root);

    if (err == ESP_OK) {
        httpd_resp_set_type(req, "application/json");
        httpd_resp_sendstr(req, "{\"status\":\"ok\",\"message\":\"Connected successfully\"}");
        return ESP_OK;
    } else {
        httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Connection failed");
        return ESP_FAIL;
    }
}

/**
 * @brief WebSocket handler for /ws/debug
 */
static esp_err_t ws_debug_handler(httpd_req_t *req)
{
    if (req->method == HTTP_GET) {
        ESP_LOGI(TAG, "WebSocket handshake for /ws/debug");
        ws_fd = httpd_req_to_sockfd(req);
        return ESP_OK;
    }

    // WebSocket frame received
    httpd_ws_frame_t ws_pkt;
    memset(&ws_pkt, 0, sizeof(httpd_ws_frame_t));
    ws_pkt.type = HTTPD_WS_TYPE_TEXT;

    esp_err_t ret = httpd_ws_recv_frame(req, &ws_pkt, 0);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "httpd_ws_recv_frame failed: %s", esp_err_to_name(ret));
        ws_fd = -1;
        return ret;
    }

    // Client disconnected
    if (ws_pkt.type == HTTPD_WS_TYPE_CLOSE) {
        ESP_LOGI(TAG, "WebSocket closed");
        ws_fd = -1;
    }

    return ESP_OK;
}

// ==================== URI HANDLERS ====================

static const httpd_uri_t uri_index = {
    .uri = "/",
    .method = HTTP_GET,
    .handler = index_handler,
    .user_ctx = NULL
};

static const httpd_uri_t uri_debug = {
    .uri = "/debug",
    .method = HTTP_GET,
    .handler = debug_handler,
    .user_ctx = NULL
};

static const httpd_uri_t uri_status = {
    .uri = "/status",
    .method = HTTP_GET,
    .handler = status_handler,
    .user_ctx = NULL
};

static const httpd_uri_t uri_ota = {
    .uri = "/ota",
    .method = HTTP_GET,
    .handler = ota_handler,
    .user_ctx = NULL
};

static const httpd_uri_t uri_api_config_get = {
    .uri = "/api/config",
    .method = HTTP_GET,
    .handler = api_config_get_handler,
    .user_ctx = NULL
};

static const httpd_uri_t uri_api_config_post = {
    .uri = "/api/config",
    .method = HTTP_POST,
    .handler = api_config_post_handler,
    .user_ctx = NULL
};

static const httpd_uri_t uri_api_status = {
    .uri = "/api/status",
    .method = HTTP_GET,
    .handler = api_status_handler,
    .user_ctx = NULL
};

static const httpd_uri_t uri_api_sensors = {
    .uri = "/api/sensors",
    .method = HTTP_GET,
    .handler = api_sensors_handler,
    .user_ctx = NULL
};

static const httpd_uri_t uri_api_factory_reset = {
    .uri = "/api/factory-reset",
    .method = HTTP_POST,
    .handler = api_factory_reset_handler,
    .user_ctx = NULL
};

static const httpd_uri_t uri_api_ota = {
    .uri = "/api/ota",
    .method = HTTP_POST,
    .handler = api_ota_handler,
    .user_ctx = NULL
};

static const httpd_uri_t uri_ws_debug = {
    .uri = "/ws/debug",
    .method = HTTP_GET,
    .handler = ws_debug_handler,
    .user_ctx = NULL,
    .is_websocket = true
};

static const httpd_uri_t uri_api_wifi_scan = {
    .uri = "/api/wifi/scan",
    .method = HTTP_GET,
    .handler = api_wifi_scan_handler,
    .user_ctx = NULL
};

static const httpd_uri_t uri_api_wifi_connect = {
    .uri = "/api/wifi/connect",
    .method = HTTP_POST,
    .handler = api_wifi_connect_handler,
    .user_ctx = NULL
};

// ==================== DNS SERVER FOR CAPTIVE PORTAL ====================

/**
 * @brief Simple DNS server task for captive portal
 *
 * Responds to all DNS queries with 192.168.4.1 to redirect clients to the setup page
 */
static void dns_server_task(void *pvParameters)
{
    char rx_buffer[DNS_MAX_LEN];
    char addr_str[128];

    struct sockaddr_in dest_addr;
    dest_addr.sin_addr.s_addr = htonl(INADDR_ANY);
    dest_addr.sin_family = AF_INET;
    dest_addr.sin_port = htons(DNS_PORT);

    dns_socket = socket(AF_INET, SOCK_DGRAM, IPPROTO_IP);
    if (dns_socket < 0) {
        ESP_LOGE(TAG, "Unable to create DNS socket: errno %d", errno);
        vTaskDelete(NULL);
        return;
    }

    int err = bind(dns_socket, (struct sockaddr *)&dest_addr, sizeof(dest_addr));
    if (err < 0) {
        ESP_LOGE(TAG, "DNS socket unable to bind: errno %d", errno);
        close(dns_socket);
        dns_socket = -1;
        vTaskDelete(NULL);
        return;
    }

    ESP_LOGI(TAG, "DNS server started on port %d", DNS_PORT);

    while (1) {
        struct sockaddr_in source_addr;
        socklen_t socklen = sizeof(source_addr);

        int len = recvfrom(dns_socket, rx_buffer, sizeof(rx_buffer) - 1, 0,
                          (struct sockaddr *)&source_addr, &socklen);

        if (len < 0) {
            ESP_LOGE(TAG, "DNS recvfrom failed: errno %d", errno);
            break;
        }

        // Only process if we have a valid DNS query (at least 12 bytes for header)
        if (len < 12) {
            continue;
        }

        // Build DNS response - redirect everything to 192.168.4.1
        char tx_buffer[DNS_MAX_LEN];
        memset(tx_buffer, 0, sizeof(tx_buffer));

        // Copy transaction ID and flags from query
        memcpy(tx_buffer, rx_buffer, 2);  // Transaction ID
        tx_buffer[2] = 0x81;  // Flags: response, recursion available
        tx_buffer[3] = 0x80;

        // Questions count (same as query)
        memcpy(tx_buffer + 4, rx_buffer + 4, 2);

        // Answer count = 1
        tx_buffer[6] = 0x00;
        tx_buffer[7] = 0x01;

        // Authority and additional = 0
        tx_buffer[8] = 0x00;
        tx_buffer[9] = 0x00;
        tx_buffer[10] = 0x00;
        tx_buffer[11] = 0x00;

        // Copy the question section
        int question_len = len - 12;
        memcpy(tx_buffer + 12, rx_buffer + 12, question_len);

        int response_len = 12 + question_len;

        // Add answer section
        // Name pointer to question
        tx_buffer[response_len++] = 0xC0;
        tx_buffer[response_len++] = 0x0C;

        // Type A (IPv4 address)
        tx_buffer[response_len++] = 0x00;
        tx_buffer[response_len++] = 0x01;

        // Class IN
        tx_buffer[response_len++] = 0x00;
        tx_buffer[response_len++] = 0x01;

        // TTL (60 seconds)
        tx_buffer[response_len++] = 0x00;
        tx_buffer[response_len++] = 0x00;
        tx_buffer[response_len++] = 0x00;
        tx_buffer[response_len++] = 0x3C;

        // Data length (4 bytes for IPv4)
        tx_buffer[response_len++] = 0x00;
        tx_buffer[response_len++] = 0x04;

        // IP address: 192.168.4.1
        tx_buffer[response_len++] = 192;
        tx_buffer[response_len++] = 168;
        tx_buffer[response_len++] = 4;
        tx_buffer[response_len++] = 1;

        // Send response
        int err = sendto(dns_socket, tx_buffer, response_len, 0,
                        (struct sockaddr *)&source_addr, sizeof(source_addr));
        if (err < 0) {
            ESP_LOGE(TAG, "DNS sendto failed: errno %d", errno);
        }
    }

    if (dns_socket != -1) {
        close(dns_socket);
        dns_socket = -1;
    }

    ESP_LOGI(TAG, "DNS server stopped");
    vTaskDelete(NULL);
}

/**
 * @brief Start DNS server for captive portal
 */
static esp_err_t dns_server_start(void)
{
    if (dns_task_handle != NULL) {
        ESP_LOGW(TAG, "DNS server already running");
        return ESP_OK;
    }

    BaseType_t ret = xTaskCreate(dns_server_task, "dns_server", 4096, NULL, 5, &dns_task_handle);
    if (ret != pdPASS) {
        ESP_LOGE(TAG, "Failed to create DNS server task");
        return ESP_FAIL;
    }

    return ESP_OK;
}

/**
 * @brief Stop DNS server
 */
static void dns_server_stop(void)
{
    if (dns_socket != -1) {
        close(dns_socket);
        dns_socket = -1;
    }

    if (dns_task_handle != NULL) {
        vTaskDelete(dns_task_handle);
        dns_task_handle = NULL;
    }

    ESP_LOGI(TAG, "DNS server stopped");
}

// ==================== PUBLIC FUNCTIONS ====================

esp_err_t web_server_start(void)
{
    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    config.server_port = WEB_SERVER_PORT;
    config.max_open_sockets = WEB_MAX_CONNECTIONS;
    config.max_uri_handlers = 16;  // Increase from default 8 to support all our endpoints
    config.lru_purge_enable = true;
    config.stack_size = 8192;  // Increase stack size for stability
    config.core_id = 0;  // Pin to core 0
    // Disable SPIRAM for HTTP server to avoid heap corruption
    config.recv_wait_timeout = 10;
    config.send_wait_timeout = 10;

    ESP_LOGI(TAG, "Starting web server on port %d", config.server_port);

    if (httpd_start(&server, &config) == ESP_OK) {
        // Register URI handlers (13 total)
        httpd_register_uri_handler(server, &uri_index);
        httpd_register_uri_handler(server, &uri_debug);
        httpd_register_uri_handler(server, &uri_status);
        httpd_register_uri_handler(server, &uri_ota);               // HTML page /ota
        httpd_register_uri_handler(server, &uri_api_config_get);
        httpd_register_uri_handler(server, &uri_api_config_post);
        httpd_register_uri_handler(server, &uri_api_status);
        httpd_register_uri_handler(server, &uri_api_sensors);
        httpd_register_uri_handler(server, &uri_api_factory_reset);
        httpd_register_uri_handler(server, &uri_api_ota);           // API endpoint /api/ota
        httpd_register_uri_handler(server, &uri_api_wifi_scan);
        httpd_register_uri_handler(server, &uri_api_wifi_connect);
        httpd_register_uri_handler(server, &uri_ws_debug);

        ESP_LOGI(TAG, "Web server started successfully");

        // Start DNS server if in AP mode (for captive portal)
        if (wifi_is_ap_mode()) {
            ESP_LOGI(TAG, "Starting DNS server for captive portal");
            dns_server_start();
        }

        return ESP_OK;
    }

    ESP_LOGE(TAG, "Failed to start web server");
    return ESP_FAIL;
}

esp_err_t web_server_stop(void)
{
    // Stop DNS server if running
    dns_server_stop();

    if (server) {
        httpd_stop(server);
        server = NULL;
        ws_fd = -1;
        ESP_LOGI(TAG, "Web server stopped");
    }
    return ESP_OK;
}

httpd_handle_t web_server_get_handle(void)
{
    return server;
}

void web_server_update_sensor_data(
    float accel_x, float accel_y, float accel_z, float accel_mag,
    uint32_t touch_value, const uint8_t button_states[6], uint8_t led_brightness)
{
    sensor_data.accel_x = accel_x;
    sensor_data.accel_y = accel_y;
    sensor_data.accel_z = accel_z;
    sensor_data.accel_mag = accel_mag;
    sensor_data.touch_value = touch_value;
    memcpy(sensor_data.button_states, button_states, 6);
    sensor_data.led_brightness = led_brightness;

    // Send to WebSocket client if connected
    if (server != NULL && ws_fd > 0) {
        cJSON *root = cJSON_CreateObject();
        cJSON_AddNumberToObject(root, "accel_x", accel_x);
        cJSON_AddNumberToObject(root, "accel_y", accel_y);
        cJSON_AddNumberToObject(root, "accel_z", accel_z);
        cJSON_AddNumberToObject(root, "accel_magnitude", accel_mag);
        cJSON_AddNumberToObject(root, "touch_value", touch_value);

        cJSON *buttons = cJSON_CreateArray();
        for (int i = 0; i < 6; i++) {
            cJSON_AddItemToArray(buttons, cJSON_CreateNumber(button_states[i]));
        }
        cJSON_AddItemToObject(root, "button_states", buttons);
        cJSON_AddNumberToObject(root, "led_brightness", led_brightness);

        char *json_str = cJSON_PrintUnformatted(root);

        httpd_ws_frame_t ws_pkt;
        memset(&ws_pkt, 0, sizeof(httpd_ws_frame_t));
        ws_pkt.payload = (uint8_t*)json_str;
        ws_pkt.len = strlen(json_str);
        ws_pkt.type = HTTPD_WS_TYPE_TEXT;

        httpd_ws_send_frame_async(server, ws_fd, &ws_pkt);

        cJSON_free(json_str);
        cJSON_Delete(root);
    }
}

void web_server_add_log(const char* message)
{
    strncpy(log_buffer[log_index], message, LOG_MESSAGE_SIZE - 1);
    log_buffer[log_index][LOG_MESSAGE_SIZE - 1] = '\0';
    log_index = (log_index + 1) % LOG_BUFFER_SIZE;
}
