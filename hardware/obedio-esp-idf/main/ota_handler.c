/**
 * @file ota_handler.c
 * @brief OTA (Over-The-Air) firmware update handler implementation
 */

#include "ota_handler.h"
#include "config.h"
#include "esp_log.h"
#include "esp_ota_ops.h"
#include "esp_https_ota.h"
#include "esp_system.h"
#include <string.h>

static const char *TAG = "OTA";

// OTA state
static esp_ota_handle_t ota_handle = 0;
static const esp_partition_t *update_partition = NULL;
static const esp_partition_t *running_partition = NULL;
static size_t bytes_written = 0;
static size_t total_size = 0;
static bool ota_in_progress = false;

esp_err_t ota_handler_init(void)
{
    ESP_LOGI(TAG, "Initializing OTA handler");

    // Get running partition
    running_partition = esp_ota_get_running_partition();
    if (running_partition == NULL) {
        ESP_LOGE(TAG, "Failed to get running partition");
        return ESP_FAIL;
    }

    ESP_LOGI(TAG, "Running partition: %s at offset 0x%lx",
             running_partition->label, running_partition->address);

    // Check if we need to validate the current partition
    esp_ota_img_states_t ota_state;
    esp_err_t err = esp_ota_get_state_partition(running_partition, &ota_state);
    if (err == ESP_OK) {
        if (ota_state == ESP_OTA_IMG_PENDING_VERIFY) {
            ESP_LOGW(TAG, "New firmware detected, validating...");

            // Mark current firmware as valid
            err = esp_ota_mark_app_valid_cancel_rollback();
            if (err == ESP_OK) {
                ESP_LOGI(TAG, "Firmware validated successfully");
            } else {
                ESP_LOGE(TAG, "Failed to validate firmware: %s", esp_err_to_name(err));
                return err;
            }
        } else if (ota_state == ESP_OTA_IMG_VALID) {
            ESP_LOGI(TAG, "Firmware already validated");
        } else if (ota_state == ESP_OTA_IMG_INVALID || ota_state == ESP_OTA_IMG_ABORTED) {
            ESP_LOGW(TAG, "Invalid firmware state detected");
        }
    }

    // Check for rollback capability
    const esp_partition_t *last_invalid_partition = esp_ota_get_last_invalid_partition();
    if (last_invalid_partition != NULL) {
        ESP_LOGW(TAG, "Last invalid partition: %s", last_invalid_partition->label);
    }

    ESP_LOGI(TAG, "OTA handler initialized successfully");
    return ESP_OK;
}

esp_err_t ota_begin_update(void)
{
    if (ota_in_progress) {
        ESP_LOGW(TAG, "OTA update already in progress");
        return ESP_ERR_INVALID_STATE;
    }

    ESP_LOGI(TAG, "Starting OTA update");

    // Get next update partition
    update_partition = esp_ota_get_next_update_partition(NULL);
    if (update_partition == NULL) {
        ESP_LOGE(TAG, "Failed to find update partition");
        return ESP_FAIL;
    }

    ESP_LOGI(TAG, "Update partition: %s at offset 0x%lx, size 0x%lx",
             update_partition->label, update_partition->address, update_partition->size);

    // Begin OTA update
    esp_err_t err = esp_ota_begin(update_partition, OTA_SIZE_UNKNOWN, &ota_handle);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "esp_ota_begin failed: %s", esp_err_to_name(err));
        return err;
    }

    bytes_written = 0;
    total_size = update_partition->size;
    ota_in_progress = true;

    ESP_LOGI(TAG, "OTA update started successfully");
    return ESP_OK;
}

esp_err_t ota_update_from_buffer(const uint8_t *data, size_t len)
{
    if (!ota_in_progress) {
        ESP_LOGE(TAG, "OTA update not in progress");
        return ESP_ERR_INVALID_STATE;
    }

    if (data == NULL || len == 0) {
        ESP_LOGE(TAG, "Invalid data or length");
        return ESP_ERR_INVALID_ARG;
    }

    // Write data to OTA partition
    esp_err_t err = esp_ota_write(ota_handle, data, len);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "esp_ota_write failed: %s", esp_err_to_name(err));
        ota_in_progress = false;
        return err;
    }

    bytes_written += len;

    // Log progress every 64KB
    if (bytes_written % (64 * 1024) == 0 || bytes_written < len) {
        ESP_LOGI(TAG, "OTA progress: %zu bytes written", bytes_written);
    }

    return ESP_OK;
}

esp_err_t ota_finalize(void)
{
    if (!ota_in_progress) {
        ESP_LOGE(TAG, "No OTA update in progress");
        return ESP_ERR_INVALID_STATE;
    }

    ESP_LOGI(TAG, "Finalizing OTA update (%zu bytes written)", bytes_written);

    // End OTA update and validate firmware
    esp_err_t err = esp_ota_end(ota_handle);
    if (err != ESP_OK) {
        if (err == ESP_ERR_OTA_VALIDATE_FAILED) {
            ESP_LOGE(TAG, "Firmware validation failed");
        } else {
            ESP_LOGE(TAG, "esp_ota_end failed: %s", esp_err_to_name(err));
        }
        ota_in_progress = false;
        return err;
    }

    ESP_LOGI(TAG, "Firmware validated successfully");

    // Set new boot partition
    err = esp_ota_set_boot_partition(update_partition);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "esp_ota_set_boot_partition failed: %s", esp_err_to_name(err));
        ota_in_progress = false;
        return err;
    }

    ota_in_progress = false;
    ESP_LOGI(TAG, "OTA update completed successfully");
    ESP_LOGI(TAG, "New boot partition: %s", update_partition->label);
    ESP_LOGI(TAG, "Reboot required to apply update");

    return ESP_OK;
}

esp_err_t ota_rollback(void)
{
    ESP_LOGI(TAG, "Performing OTA rollback");

    const esp_partition_t *last_invalid = esp_ota_get_last_invalid_partition();
    if (last_invalid == NULL) {
        ESP_LOGW(TAG, "No invalid partition found for rollback");
    } else {
        ESP_LOGI(TAG, "Last invalid partition: %s", last_invalid->label);
    }

    // Trigger rollback
    esp_err_t err = esp_ota_mark_app_invalid_rollback_and_reboot();

    // This function should not return if successful
    ESP_LOGE(TAG, "Rollback failed: %s", esp_err_to_name(err));
    return err;
}

const esp_partition_t* ota_get_running_partition(void)
{
    if (running_partition == NULL) {
        running_partition = esp_ota_get_running_partition();
    }
    return running_partition;
}

int ota_get_progress(void)
{
    if (!ota_in_progress || total_size == 0) {
        return -1;
    }

    // Calculate percentage (0-100)
    int progress = (bytes_written * 100) / total_size;
    return (progress > 100) ? 100 : progress;
}

esp_err_t ota_cancel_update(void)
{
    if (!ota_in_progress) {
        ESP_LOGW(TAG, "No OTA update in progress to cancel");
        return ESP_ERR_INVALID_STATE;
    }

    ESP_LOGW(TAG, "Cancelling OTA update");

    // Abort OTA update
    esp_err_t err = esp_ota_abort(ota_handle);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "esp_ota_abort failed: %s", esp_err_to_name(err));
    }

    ota_in_progress = false;
    bytes_written = 0;
    total_size = 0;
    ota_handle = 0;

    ESP_LOGI(TAG, "OTA update cancelled");
    return ESP_OK;
}
