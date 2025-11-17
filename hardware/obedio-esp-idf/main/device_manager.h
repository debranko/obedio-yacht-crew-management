/**
 * @file device_manager.h
 * @brief Device configuration manager for OBEDIO Smart Button
 *
 * Manages device configuration with:
 * - NVS storage and retrieval
 * - Factory reset functionality
 * - Device initialization
 * - Configuration validation
 */

#ifndef DEVICE_MANAGER_H
#define DEVICE_MANAGER_H

#include <stdint.h>
#include <stdbool.h>
#include "esp_err.h"
#include "config.h"

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief Initialize device manager and NVS
 *
 * Initializes NVS flash and loads device configuration.
 * Checks for factory reset button press on boot.
 *
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t device_manager_init(void);

/**
 * @brief Load device configuration from NVS
 *
 * Loads all configuration parameters from NVS storage.
 * Uses default values if parameters are not found.
 *
 * @param config Pointer to device_config_t structure to populate
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t device_manager_load_config(device_config_t *config);

/**
 * @brief Save device configuration to NVS
 *
 * Saves all configuration parameters to NVS storage.
 *
 * @param config Pointer to device_config_t structure to save
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t device_manager_save_config(const device_config_t *config);

/**
 * @brief Perform factory reset
 *
 * Erases all data in the NVS namespace "obedio" and
 * restarts the device with default settings.
 *
 * @return ESP_OK on success, error code otherwise (won't return if successful)
 */
esp_err_t device_manager_factory_reset(void);

/**
 * @brief Check if factory reset button is held on boot
 *
 * Checks if T6 button is held for 10 seconds on boot.
 * Displays rainbow LED animation while held.
 * Triggers factory reset if held for full duration.
 *
 * @return ESP_OK if button not held, ESP_ERR_INVALID_STATE if factory reset triggered
 */
esp_err_t device_manager_check_factory_reset_button(void);

/**
 * @brief Generate device ID from MAC address
 *
 * Creates a unique device ID in the format "obedio-XXXXXX"
 * where XXXXXX is the last 6 hex digits of the MAC address.
 *
 * @param device_id Buffer to store device ID (must be at least 32 bytes)
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t device_manager_get_device_id(char *device_id);

/**
 * @brief Validate device configuration
 *
 * Checks if required configuration fields are set.
 *
 * @param config Pointer to device_config_t structure to validate
 * @return true if configuration is valid, false otherwise
 */
bool device_manager_validate_config(const device_config_t *config);

/**
 * @brief Get default device configuration
 *
 * Populates a device_config_t structure with default values
 * from config.h defines.
 *
 * @param config Pointer to device_config_t structure to populate
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t device_manager_get_default_config(device_config_t *config);

#ifdef __cplusplus
}
#endif

#endif // DEVICE_MANAGER_H
