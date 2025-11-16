/**
 * @file web_server.h
 * @brief Web server for device configuration and monitoring
 *
 * Provides HTTP server with:
 * - Configuration page (index.html)
 * - Debug page with live sensor data (debug.html)
 * - Status page (status.html)
 * - OTA firmware upload page (ota.html)
 * - REST API for config, status, and sensor data
 * - WebSocket for real-time sensor streaming
 */

#ifndef WEB_SERVER_H
#define WEB_SERVER_H

#include "esp_http_server.h"
#include "config.h"

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief Start the web server on port 80
 *
 * @return esp_err_t ESP_OK on success
 */
esp_err_t web_server_start(void);

/**
 * @brief Stop the web server
 *
 * @return esp_err_t ESP_OK on success
 */
esp_err_t web_server_stop(void);

/**
 * @brief Get the web server handle
 *
 * @return httpd_handle_t Server handle or NULL if not started
 */
httpd_handle_t web_server_get_handle(void);

/**
 * @brief Update sensor data for WebSocket clients
 *
 * Call this periodically to push sensor data to connected WebSocket clients
 *
 * @param accel_x X-axis acceleration (G)
 * @param accel_y Y-axis acceleration (G)
 * @param accel_z Z-axis acceleration (G)
 * @param accel_mag Acceleration magnitude (G)
 * @param touch_value Touch sensor value
 * @param button_states Array of 6 button states (0=released, 1=pressed)
 * @param led_brightness Current LED brightness (0-255)
 */
void web_server_update_sensor_data(
    float accel_x, float accel_y, float accel_z, float accel_mag,
    uint32_t touch_value, const uint8_t button_states[6], uint8_t led_brightness
);

/**
 * @brief Add a log message to the debug log buffer
 *
 * @param message Log message string
 */
void web_server_add_log(const char* message);

#ifdef __cplusplus
}
#endif

#endif // WEB_SERVER_H
