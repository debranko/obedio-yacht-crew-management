/**
 * @file wifi_manager.h
 * @brief WiFi Manager for OBEDIO Smart Button
 *
 * Manages WiFi connectivity with auto-reconnect, mDNS service,
 * device ID generation, and NVS credential storage.
 */

#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <stdbool.h>
#include <stdint.h>
#include "esp_err.h"

/**
 * @brief Initialize WiFi in station mode
 *
 * Loads WiFi credentials from NVS (falls back to config.h defaults),
 * starts WiFi connection, and sets up mDNS service as obedio-{MAC}.local.
 *
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t wifi_init_sta(void);

/**
 * @brief Get device ID string
 *
 * Returns the device ID in format "BTN-{MAC}" where MAC is the last 6 hex
 * digits of the WiFi MAC address (e.g., "BTN-A1B2C3").
 *
 * @return Pointer to static device ID string (valid until next call)
 */
const char* wifi_get_device_id(void);

/**
 * @brief Get WiFi signal strength (RSSI)
 *
 * Returns the current WiFi signal strength in dBm.
 * Returns 0 if WiFi is not connected.
 *
 * @return RSSI in dBm (typically -30 to -90), or 0 if disconnected
 */
int8_t wifi_get_rssi(void);

/**
 * @brief Check if WiFi is connected
 *
 * @return true if WiFi is connected, false otherwise
 */
bool wifi_is_connected(void);

/**
 * @brief Get WiFi MAC address as string
 *
 * Returns the WiFi MAC address in format "XX:XX:XX:XX:XX:XX".
 *
 * @return Pointer to static MAC address string (valid until next call)
 */
const char* wifi_get_mac_address(void);

/**
 * @brief Get local IP address as string
 *
 * Returns the local IP address if connected, or "0.0.0.0" if disconnected.
 *
 * @return Pointer to static IP address string (valid until next call)
 */
const char* wifi_get_ip_address(void);

/**
 * @brief Start WiFi in AP (Access Point) mode
 *
 * Starts AP mode with SSID "OBEDIO-SETUP-{MAC}" and password "obedio123".
 * IP address is set to 192.168.4.1.
 *
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t wifi_start_ap_mode(void);

/**
 * @brief Scan for available WiFi networks
 *
 * Scans for available WiFi networks and returns results as JSON string.
 * Caller is responsible for freeing the returned string.
 *
 * @param json_out Pointer to receive allocated JSON string
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t wifi_scan_networks(char **json_out);

/**
 * @brief Connect to a new WiFi network
 *
 * Disconnects from current network and connects to the specified network.
 * Saves credentials to NVS on successful connection.
 *
 * @param ssid WiFi network SSID
 * @param password WiFi network password
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t wifi_connect_to_network(const char *ssid, const char *password);

/**
 * @brief Check if WiFi is in AP mode
 *
 * @return true if in AP mode, false otherwise
 */
bool wifi_is_ap_mode(void);

#endif // WIFI_MANAGER_H
