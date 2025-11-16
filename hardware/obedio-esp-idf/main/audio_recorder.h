/**
 * @file audio_recorder.h
 * @brief Audio recorder with I2S microphone and ADPCM compression
 *
 * Records audio from INMP441 I2S MEMS microphone, stores in PSRAM,
 * and compresses using ADPCM codec (4:1 compression ratio).
 *
 * Features:
 * - Record up to 20 seconds at 16kHz (640KB raw, ~160KB compressed)
 * - Triggered by long press on main button
 * - Record while button held (up to 20s max)
 * - ADPCM compression for efficient storage and transmission
 */

#ifndef AUDIO_RECORDER_H
#define AUDIO_RECORDER_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>
#include "esp_err.h"

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief Initialize audio recorder
 *
 * Configures I2S microphone for recording.
 * - Microphone: INMP441 on I2S_NUM_0
 * - Sample rate: 16kHz
 * - Bits per sample: 16
 * - Channels: Mono
 * - DMA buffer: 512 samples
 *
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t audio_recorder_init(void);

/**
 * @brief Start audio recording
 *
 * Begins recording audio from I2S microphone into PSRAM buffer.
 * Previous recording data will be discarded.
 *
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t audio_start_recording(void);

/**
 * @brief Stop audio recording and get compressed data
 *
 * Stops recording, compresses PCM to ADPCM, and returns compressed data.
 * The caller must free the ADPCM data buffer after use using free().
 *
 * @param[out] adpcm_data Pointer to receive ADPCM data buffer (caller must free)
 * @param[out] len Length of ADPCM data in bytes
 * @param[out] duration Recording duration in seconds
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t audio_stop_recording(uint8_t **adpcm_data, size_t *len, float *duration);

/**
 * @brief Check if currently recording
 *
 * @return true if recording is in progress, false otherwise
 */
bool audio_is_recording(void);

/**
 * @brief Get current recording duration
 *
 * @return Current recording duration in seconds, or 0.0 if not recording
 */
float audio_get_recording_duration(void);

/**
 * @brief Deinitialize audio recorder
 *
 * Stops recording (if active) and frees all resources.
 *
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t audio_recorder_deinit(void);

#ifdef __cplusplus
}
#endif

#endif // AUDIO_RECORDER_H
