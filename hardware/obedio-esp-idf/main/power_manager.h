/**
 * @file power_manager.h
 * @brief Power Management for OBEDIO Smart Button
 *
 * Implements automatic light sleep after configured inactivity timeout.
 * Wakes on button press (GPIO interrupt) and periodically for heartbeat.
 */

#ifndef POWER_MANAGER_H
#define POWER_MANAGER_H

#include "esp_err.h"
#include <stdint.h>
#include <stdbool.h>

/**
 * @brief Initialize power manager
 *
 * Sets up activity tracking and sleep timer.
 * Must be called after all peripherals are initialized.
 *
 * @param sleep_timeout_sec Inactivity timeout in seconds before sleep (10-300s)
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t power_manager_init(uint32_t sleep_timeout_sec);

/**
 * @brief Start power manager task
 *
 * Creates background task that monitors activity and triggers sleep.
 *
 * @param priority Task priority
 * @param stack_size Task stack size
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t power_manager_start_task(uint32_t priority, uint32_t stack_size);

/**
 * @brief Record user activity
 *
 * Call this whenever user interacts with device (button, touch, etc.)
 * to reset sleep timer.
 */
void power_manager_activity(void);

/**
 * @brief Update sleep timeout configuration
 *
 * @param sleep_timeout_sec New timeout in seconds (10-300s)
 */
void power_manager_set_timeout(uint32_t sleep_timeout_sec);

/**
 * @brief Get current sleep timeout
 *
 * @return Sleep timeout in seconds
 */
uint32_t power_manager_get_timeout(void);

/**
 * @brief Check if device is currently in sleep mode
 *
 * @return true if sleeping, false if awake
 */
bool power_manager_is_sleeping(void);

/**
 * @brief Manually trigger sleep
 *
 * Forces device into sleep mode immediately (for testing)
 */
void power_manager_sleep_now(void);

/**
 * @brief Prevent sleep (lock)
 *
 * Use this to prevent sleep during critical operations (OTA, recording, etc.)
 */
void power_manager_prevent_sleep(void);

/**
 * @brief Allow sleep (unlock)
 *
 * Release sleep prevention lock
 */
void power_manager_allow_sleep(void);

#endif // POWER_MANAGER_H
