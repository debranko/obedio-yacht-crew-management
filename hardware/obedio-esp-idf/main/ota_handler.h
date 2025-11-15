/**
 * @file ota_handler.h
 * @brief OTA (Over-The-Air) firmware update handler for OBEDIO Smart Button
 *
 * Handles OTA firmware updates with support for:
 * - HTTP POST file uploads
 * - Automatic rollback on boot failure
 * - SHA256 validation
 * - Partition management
 */

#ifndef OTA_HANDLER_H
#define OTA_HANDLER_H

#include <stdint.h>
#include <stddef.h>
#include "esp_err.h"
#include "esp_partition.h"

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief Initialize OTA subsystem
 *
 * Checks rollback validity and marks current partition as valid
 * after successful boot.
 *
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t ota_handler_init(void);

/**
 * @brief Begin OTA update process
 *
 * Must be called before writing firmware data.
 * Opens the next available OTA partition.
 *
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t ota_begin_update(void);

/**
 * @brief Write firmware data chunk to OTA partition
 *
 * @param data Pointer to firmware data buffer
 * @param len Length of data in bytes
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t ota_update_from_buffer(const uint8_t *data, size_t len);

/**
 * @brief Finalize OTA update and set boot partition
 *
 * Validates the firmware image and sets the new partition
 * as the boot partition. Device will reboot to new firmware.
 *
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t ota_finalize(void);

/**
 * @brief Rollback to previous firmware version
 *
 * Reverts to the previous working firmware partition.
 *
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t ota_rollback(void);

/**
 * @brief Get information about the running partition
 *
 * @return Pointer to the running partition info, or NULL on error
 */
const esp_partition_t* ota_get_running_partition(void);

/**
 * @brief Get OTA update progress percentage
 *
 * @return Progress percentage (0-100), or -1 if no update in progress
 */
int ota_get_progress(void);

/**
 * @brief Cancel ongoing OTA update
 *
 * Aborts the current OTA update process and cleans up resources.
 *
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t ota_cancel_update(void);

#ifdef __cplusplus
}
#endif

#endif // OTA_HANDLER_H
