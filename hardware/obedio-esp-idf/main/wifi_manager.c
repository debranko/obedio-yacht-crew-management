/**
 * @file wifi_manager.c
 * @brief WiFi Manager implementation for OBEDIO Smart Button
 */

#include "wifi_manager.h"
#include "config.h"

#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/event_groups.h"
#include "esp_system.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_log.h"
#include "esp_netif.h"
#include "nvs_flash.h"
#include "nvs.h"
#include "lwip/err.h"
#include "lwip/sys.h"
#include "lwip/ip4_addr.h"
#include "mdns.h"

static const char *TAG = "wifi_manager";

// Event group bits for WiFi status
#define WIFI_CONNECTED_BIT      BIT0
#define WIFI_FAIL_BIT           BIT1

// AP mode configuration
#define AP_SSID_PREFIX          "OBEDIO-SETUP-"
#define AP_PASSWORD             "obedio123"
#define AP_CHANNEL              1
#define AP_MAX_CONNECTIONS      4

// Static variables
static EventGroupHandle_t s_wifi_event_group;
static int s_retry_num = 0;
static bool s_is_connected = false;
static bool s_is_ap_mode = false;
static int8_t s_rssi = 0;
static char s_device_id[32] = {0};
static char s_mac_address[18] = {0};
static char s_ip_address[16] = {0};
static esp_netif_t *s_sta_netif = NULL;
static esp_netif_t *s_ap_netif = NULL;
static TimerHandle_t s_reconnect_timer = NULL;

/**
 * @brief WiFi event handler
 */
static void wifi_event_handler(void* arg, esp_event_base_t event_base,
                                int32_t event_id, void* event_data)
{
    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START) {
        ESP_LOGI(TAG, "WiFi station started, connecting...");
        esp_wifi_connect();
    } else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED) {
        s_is_connected = false;
        s_rssi = 0;
        strcpy(s_ip_address, "0.0.0.0");

        if (s_retry_num < WIFI_MAXIMUM_RETRY) {
            esp_wifi_connect();
            s_retry_num++;
            ESP_LOGW(TAG, "Retrying WiFi connection... (%d/%d)", s_retry_num, WIFI_MAXIMUM_RETRY);
        } else {
            xEventGroupSetBits(s_wifi_event_group, WIFI_FAIL_BIT);
            ESP_LOGE(TAG, "WiFi connection failed after %d retries", WIFI_MAXIMUM_RETRY);
        }
    } else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP) {
        ip_event_got_ip_t* event = (ip_event_got_ip_t*) event_data;
        snprintf(s_ip_address, sizeof(s_ip_address), IPSTR, IP2STR(&event->ip_info.ip));
        ESP_LOGI(TAG, "Got IP address: %s", s_ip_address);

        s_retry_num = 0;
        s_is_connected = true;
        xEventGroupSetBits(s_wifi_event_group, WIFI_CONNECTED_BIT);

        // Get RSSI
        wifi_ap_record_t ap_info;
        if (esp_wifi_sta_get_ap_info(&ap_info) == ESP_OK) {
            s_rssi = ap_info.rssi;
            ESP_LOGI(TAG, "WiFi signal strength: %d dBm", s_rssi);
        }
    }
}

/**
 * @brief Initialize mDNS service
 */
static esp_err_t mdns_init_service(void)
{
    // Get MAC address for hostname
    uint8_t mac[6];
    esp_wifi_get_mac(WIFI_IF_STA, mac);

    char hostname[32];
    snprintf(hostname, sizeof(hostname), "%s-%02x%02x%02x",
             MDNS_HOSTNAME_PREFIX, mac[3], mac[4], mac[5]);

    // Initialize mDNS
    esp_err_t err = mdns_init();
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "mDNS init failed: %s", esp_err_to_name(err));
        return err;
    }

    // Set hostname
    err = mdns_hostname_set(hostname);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "mDNS hostname set failed: %s", esp_err_to_name(err));
        return err;
    }

    // Set instance name
    err = mdns_instance_name_set("OBEDIO Smart Button");
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "mDNS instance name set failed: %s", esp_err_to_name(err));
        return err;
    }

    // Add HTTP service
    err = mdns_service_add(NULL, "_http", "_tcp", WEB_SERVER_PORT, NULL, 0);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "mDNS service add failed: %s", esp_err_to_name(err));
        return err;
    }

    ESP_LOGI(TAG, "mDNS started as %s.local", hostname);
    return ESP_OK;
}

/**
 * @brief Generate device ID from MAC address
 */
static void generate_device_id(void)
{
    uint8_t mac[6];
    esp_wifi_get_mac(WIFI_IF_STA, mac);

    // Generate device ID: BTN-{last 3 bytes of MAC in hex}
    snprintf(s_device_id, sizeof(s_device_id), "BTN-%02X%02X%02X",
             mac[3], mac[4], mac[5]);

    // Store full MAC address
    snprintf(s_mac_address, sizeof(s_mac_address), "%02X:%02X:%02X:%02X:%02X:%02X",
             mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);

    ESP_LOGI(TAG, "Device ID: %s", s_device_id);
    ESP_LOGI(TAG, "MAC Address: %s", s_mac_address);
}

/**
 * @brief Load WiFi credentials from NVS
 */
static esp_err_t load_wifi_credentials(char *ssid, size_t ssid_len,
                                        char *password, size_t password_len)
{
    nvs_handle_t nvs_handle;
    esp_err_t err = nvs_open(NVS_NAMESPACE, NVS_READONLY, &nvs_handle);

    if (err == ESP_OK) {
        // Try to read SSID
        size_t required_size = ssid_len;
        err = nvs_get_str(nvs_handle, NVS_KEY_WIFI_SSID, ssid, &required_size);

        if (err == ESP_OK) {
            // Try to read password
            required_size = password_len;
            err = nvs_get_str(nvs_handle, NVS_KEY_WIFI_PASS, password, &required_size);
        }

        nvs_close(nvs_handle);
    }

    if (err != ESP_OK) {
        // Fall back to config.h defaults
        ESP_LOGW(TAG, "Using default WiFi credentials from config.h");
        strncpy(ssid, WIFI_SSID, ssid_len - 1);
        strncpy(password, WIFI_PASSWORD, password_len - 1);
        ssid[ssid_len - 1] = '\0';
        password[password_len - 1] = '\0';
        return ESP_OK;  // Not an error, just using defaults
    }

    ESP_LOGI(TAG, "Loaded WiFi credentials from NVS");
    return ESP_OK;
}

esp_err_t wifi_init_sta(void)
{
    // Create event group
    s_wifi_event_group = xEventGroupCreate();
    if (s_wifi_event_group == NULL) {
        ESP_LOGE(TAG, "Failed to create event group");
        return ESP_FAIL;
    }

    // Initialize TCP/IP stack
    ESP_ERROR_CHECK(esp_netif_init());

    // Create default event loop
    ESP_ERROR_CHECK(esp_event_loop_create_default());

    // Create both STA and AP network interfaces upfront to avoid race conditions
    s_sta_netif = esp_netif_create_default_wifi_sta();
    if (s_sta_netif == NULL) {
        ESP_LOGE(TAG, "Failed to create STA netif");
        return ESP_FAIL;
    }

    s_ap_netif = esp_netif_create_default_wifi_ap();
    if (s_ap_netif == NULL) {
        ESP_LOGE(TAG, "Failed to create AP netif");
        return ESP_FAIL;
    }

    // Initialize WiFi with default config
    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    // Register event handlers
    ESP_ERROR_CHECK(esp_event_handler_register(WIFI_EVENT, ESP_EVENT_ANY_ID, &wifi_event_handler, NULL));
    ESP_ERROR_CHECK(esp_event_handler_register(IP_EVENT, IP_EVENT_STA_GOT_IP, &wifi_event_handler, NULL));

    // Load WiFi credentials
    char ssid[64] = {0};
    char password[128] = {0};
    load_wifi_credentials(ssid, sizeof(ssid), password, sizeof(password));

    // Configure WiFi
    wifi_config_t wifi_config = {
        .sta = {
            .threshold.authmode = WIFI_AUTH_WPA2_PSK,
            .pmf_cfg = {
                .capable = true,
                .required = false
            },
        },
    };

    strncpy((char *)wifi_config.sta.ssid, ssid, sizeof(wifi_config.sta.ssid) - 1);
    strncpy((char *)wifi_config.sta.password, password, sizeof(wifi_config.sta.password) - 1);

    // Start WiFi in STA mode
    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wifi_config));
    ESP_ERROR_CHECK(esp_wifi_start());

    ESP_LOGI(TAG, "WiFi initialization complete");
    ESP_LOGI(TAG, "Attempting to connect to SSID: %s", ssid);

    // Generate device ID
    generate_device_id();

    // Wait for connection or failure
    EventBits_t bits = xEventGroupWaitBits(s_wifi_event_group,
                                           WIFI_CONNECTED_BIT | WIFI_FAIL_BIT,
                                           pdFALSE,
                                           pdFALSE,
                                           portMAX_DELAY);

    if (bits & WIFI_CONNECTED_BIT) {
        ESP_LOGI(TAG, "Connected to WiFi successfully");

        // Initialize mDNS
        mdns_init_service();

        return ESP_OK;
    } else if (bits & WIFI_FAIL_BIT) {
        ESP_LOGW(TAG, "Failed to connect to WiFi, starting AP mode as fallback");

        // Start AP mode as fallback
        esp_err_t ap_err = wifi_start_ap_mode();
        if (ap_err == ESP_OK) {
            ESP_LOGI(TAG, "AP mode started successfully");
            return ESP_OK;  // Return OK since AP mode is working
        } else {
            ESP_LOGE(TAG, "Failed to start AP mode");
            return ESP_FAIL;
        }
    } else {
        ESP_LOGE(TAG, "Unexpected WiFi event");
        return ESP_FAIL;
    }
}

const char* wifi_get_device_id(void)
{
    return s_device_id;
}

int8_t wifi_get_rssi(void)
{
    if (!s_is_connected) {
        return 0;
    }

    // Update RSSI value
    wifi_ap_record_t ap_info;
    if (esp_wifi_sta_get_ap_info(&ap_info) == ESP_OK) {
        s_rssi = ap_info.rssi;
    }

    return s_rssi;
}

bool wifi_is_connected(void)
{
    return s_is_connected;
}

const char* wifi_get_mac_address(void)
{
    return s_mac_address;
}

const char* wifi_get_ip_address(void)
{
    return s_ip_address;
}

/**
 * @brief Reconnect timer callback - attempts STA connection every 30 seconds
 */
static void reconnect_timer_callback(TimerHandle_t xTimer)
{
    if (s_is_ap_mode && !s_is_connected) {
        ESP_LOGI(TAG, "Attempting background STA reconnection...");
        esp_wifi_connect();
    }
}

/**
 * @brief Save WiFi credentials to NVS
 */
static esp_err_t save_wifi_credentials(const char *ssid, const char *password)
{
    nvs_handle_t nvs_handle;
    esp_err_t err = nvs_open(NVS_NAMESPACE, NVS_READWRITE, &nvs_handle);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to open NVS: %s", esp_err_to_name(err));
        return err;
    }

    err = nvs_set_str(nvs_handle, NVS_KEY_WIFI_SSID, ssid);
    if (err != ESP_OK) {
        nvs_close(nvs_handle);
        return err;
    }

    err = nvs_set_str(nvs_handle, NVS_KEY_WIFI_PASS, password);
    if (err != ESP_OK) {
        nvs_close(nvs_handle);
        return err;
    }

    err = nvs_commit(nvs_handle);
    nvs_close(nvs_handle);

    if (err == ESP_OK) {
        ESP_LOGI(TAG, "WiFi credentials saved to NVS");
    }

    return err;
}

esp_err_t wifi_start_ap_mode(void)
{
    if (s_is_ap_mode) {
        ESP_LOGW(TAG, "Already in AP mode");
        return ESP_OK;
    }

    ESP_LOGI(TAG, "Starting AP mode...");

    // Get MAC address for AP SSID
    uint8_t mac[6];
    esp_wifi_get_mac(WIFI_IF_STA, mac);

    char ap_ssid[32];
    snprintf(ap_ssid, sizeof(ap_ssid), "%s%02X%02X",
             AP_SSID_PREFIX, mac[4], mac[5]);

    // Configure AP settings
    wifi_config_t ap_config = {0};
    strncpy((char *)ap_config.ap.ssid, ap_ssid, sizeof(ap_config.ap.ssid) - 1);
    ap_config.ap.ssid_len = strlen(ap_ssid);
    strncpy((char *)ap_config.ap.password, AP_PASSWORD, sizeof(ap_config.ap.password) - 1);
    ap_config.ap.channel = AP_CHANNEL;
    ap_config.ap.max_connection = AP_MAX_CONNECTIONS;
    ap_config.ap.authmode = WIFI_AUTH_WPA2_PSK;
    ap_config.ap.pmf_cfg.required = false;

    // Stop WiFi
    esp_err_t ret = esp_wifi_stop();
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to stop WiFi: %s", esp_err_to_name(ret));
        return ret;
    }
    vTaskDelay(pdMS_TO_TICKS(100)); // Allow WiFi to fully stop

    // Set WiFi mode to APSTA
    ret = esp_wifi_set_mode(WIFI_MODE_APSTA);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to set APSTA mode: %s", esp_err_to_name(ret));
        return ret;
    }

    // Configure AP
    ret = esp_wifi_set_config(WIFI_IF_AP, &ap_config);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to set AP config: %s", esp_err_to_name(ret));
        return ret;
    }

    // AP netif should already be created in wifi_init_sta()
    if (s_ap_netif == NULL) {
        ESP_LOGE(TAG, "AP netif was not initialized - this should not happen");
        return ESP_FAIL;
    }

    // Start WiFi
    ret = esp_wifi_start();
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to start WiFi: %s", esp_err_to_name(ret));
        return ret;
    }

    // Set static IP for AP (after WiFi is started)
    esp_netif_ip_info_t ip_info;
    memset(&ip_info, 0, sizeof(ip_info));
    IP4_ADDR(&ip_info.ip, 192, 168, 4, 1);
    IP4_ADDR(&ip_info.gw, 192, 168, 4, 1);
    IP4_ADDR(&ip_info.netmask, 255, 255, 255, 0);

    ret = esp_netif_dhcps_stop(s_ap_netif);
    if (ret != ESP_OK && ret != ESP_ERR_ESP_NETIF_DHCP_ALREADY_STOPPED) {
        ESP_LOGW(TAG, "Failed to stop DHCP server: %s", esp_err_to_name(ret));
    }

    ret = esp_netif_set_ip_info(s_ap_netif, &ip_info);
    if (ret != ESP_OK) {
        ESP_LOGW(TAG, "Failed to set IP info: %s", esp_err_to_name(ret));
    }

    ret = esp_netif_dhcps_start(s_ap_netif);
    if (ret != ESP_OK && ret != ESP_ERR_ESP_NETIF_DHCP_ALREADY_STARTED) {
        ESP_LOGW(TAG, "Failed to start DHCP server: %s", esp_err_to_name(ret));
    }

    s_is_ap_mode = true;
    strcpy(s_ip_address, "192.168.4.1");

    ESP_LOGI(TAG, "AP mode started");
    ESP_LOGI(TAG, "AP SSID: %s", ap_ssid);
    ESP_LOGI(TAG, "AP Password: %s", AP_PASSWORD);
    ESP_LOGI(TAG, "AP IP: %s", s_ip_address);

    // Create reconnect timer (30 seconds)
    if (s_reconnect_timer == NULL) {
        s_reconnect_timer = xTimerCreate("wifi_reconnect",
                                         pdMS_TO_TICKS(30000),
                                         pdTRUE,
                                         NULL,
                                         reconnect_timer_callback);
        if (s_reconnect_timer != NULL) {
            xTimerStart(s_reconnect_timer, 0);
            ESP_LOGI(TAG, "Background STA reconnection enabled (30s interval)");
        }
    }

    return ESP_OK;
}

esp_err_t wifi_scan_networks(char **json_out)
{
    if (json_out == NULL) {
        return ESP_ERR_INVALID_ARG;
    }

    // Start WiFi scan
    wifi_scan_config_t scan_config = {
        .ssid = NULL,
        .bssid = NULL,
        .channel = 0,
        .show_hidden = false,
        .scan_type = WIFI_SCAN_TYPE_ACTIVE,
    };

    ESP_LOGI(TAG, "Starting WiFi scan...");
    esp_err_t err = esp_wifi_scan_start(&scan_config, true);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "WiFi scan failed: %s", esp_err_to_name(err));
        return err;
    }

    // Get scan results
    uint16_t ap_count = 0;
    esp_wifi_scan_get_ap_num(&ap_count);

    if (ap_count == 0) {
        ESP_LOGW(TAG, "No APs found");
        *json_out = strdup("[]");
        return ESP_OK;
    }

    wifi_ap_record_t *ap_records = malloc(sizeof(wifi_ap_record_t) * ap_count);
    if (ap_records == NULL) {
        ESP_LOGE(TAG, "Failed to allocate memory for scan results");
        return ESP_ERR_NO_MEM;
    }

    esp_wifi_scan_get_ap_records(&ap_count, ap_records);

    // Build JSON array
    char *json = malloc(ap_count * 128 + 100);  // Rough estimate
    if (json == NULL) {
        free(ap_records);
        return ESP_ERR_NO_MEM;
    }

    strcpy(json, "[");
    for (int i = 0; i < ap_count; i++) {
        if (i > 0) strcat(json, ",");

        char entry[128];
        const char *auth_mode;
        switch (ap_records[i].authmode) {
            case WIFI_AUTH_OPEN: auth_mode = "open"; break;
            case WIFI_AUTH_WEP: auth_mode = "WEP"; break;
            case WIFI_AUTH_WPA_PSK: auth_mode = "WPA"; break;
            case WIFI_AUTH_WPA2_PSK: auth_mode = "WPA2"; break;
            case WIFI_AUTH_WPA_WPA2_PSK: auth_mode = "WPA/WPA2"; break;
            case WIFI_AUTH_WPA3_PSK: auth_mode = "WPA3"; break;
            default: auth_mode = "unknown"; break;
        }

        snprintf(entry, sizeof(entry),
                 "{\"ssid\":\"%s\",\"rssi\":%d,\"auth\":\"%s\"}",
                 ap_records[i].ssid, ap_records[i].rssi, auth_mode);
        strcat(json, entry);
    }
    strcat(json, "]");

    free(ap_records);
    *json_out = json;

    ESP_LOGI(TAG, "WiFi scan completed, found %d networks", ap_count);
    return ESP_OK;
}

esp_err_t wifi_connect_to_network(const char *ssid, const char *password)
{
    if (ssid == NULL || password == NULL) {
        return ESP_ERR_INVALID_ARG;
    }

    ESP_LOGI(TAG, "Connecting to network: %s", ssid);

    // Configure new WiFi credentials
    wifi_config_t wifi_config = {
        .sta = {
            .threshold.authmode = WIFI_AUTH_WPA2_PSK,
            .pmf_cfg = {
                .capable = true,
                .required = false
            },
        },
    };

    strncpy((char *)wifi_config.sta.ssid, ssid, sizeof(wifi_config.sta.ssid) - 1);
    strncpy((char *)wifi_config.sta.password, password, sizeof(wifi_config.sta.password) - 1);

    // Disconnect first
    esp_wifi_disconnect();
    vTaskDelay(pdMS_TO_TICKS(100));

    // Set new config and connect
    esp_err_t err = esp_wifi_set_config(WIFI_IF_STA, &wifi_config);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to set WiFi config: %s", esp_err_to_name(err));
        return err;
    }

    // Reset retry counter
    s_retry_num = 0;
    xEventGroupClearBits(s_wifi_event_group, WIFI_CONNECTED_BIT | WIFI_FAIL_BIT);

    // Attempt connection
    err = esp_wifi_connect();
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to start connection: %s", esp_err_to_name(err));
        return err;
    }

    // Wait for connection result (10 seconds timeout)
    EventBits_t bits = xEventGroupWaitBits(s_wifi_event_group,
                                           WIFI_CONNECTED_BIT | WIFI_FAIL_BIT,
                                           pdFALSE,
                                           pdFALSE,
                                           pdMS_TO_TICKS(10000));

    if (bits & WIFI_CONNECTED_BIT) {
        ESP_LOGI(TAG, "Successfully connected to %s", ssid);

        // Save credentials to NVS
        save_wifi_credentials(ssid, password);

        // If we were in AP mode, stop it
        if (s_is_ap_mode) {
            ESP_LOGI(TAG, "Stopping AP mode...");

            // Stop reconnect timer
            if (s_reconnect_timer != NULL) {
                xTimerStop(s_reconnect_timer, 0);
            }

            // Switch back to STA-only mode
            esp_wifi_set_mode(WIFI_MODE_STA);
            s_is_ap_mode = false;

            // Initialize mDNS if not already done
            mdns_init_service();
        }

        return ESP_OK;
    } else {
        ESP_LOGW(TAG, "Failed to connect to %s", ssid);
        return ESP_FAIL;
    }
}

bool wifi_is_ap_mode(void)
{
    return s_is_ap_mode;
}
