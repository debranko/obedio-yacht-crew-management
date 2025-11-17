/**
 * @file audio_http_upload.h
 * @brief HTTP-based audio recording and upload module
 *
 * Records audio from I2S microphone and uploads via HTTP POST.
 * Solves watchdog timeout issue by avoiding large MQTT payloads.
 *
 * Features:
 * - I2S recording with watchdog feeding
 * - WAV file format
 * - HTTP multipart/form-data upload
 * - Returns audio URL from backend
 * - Non-blocking with proper task yielding
 */

#ifndef AUDIO_HTTP_UPLOAD_H
#define AUDIO_HTTP_UPLOAD_H

#include <stdint.h>
#include <stddef.h>
#include "esp_err.h"

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief Initialize audio HTTP upload module
 *
 * Configures I2S microphone for recording.
 * - Microphone: MSM261S4030H0R on I2S_NUM_0
 * - Sample rate: 16kHz
 * - Bits per sample: 16
 * - Channels: Mono
 *
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t audio_http_upload_init(void);

/**
 * @brief Record audio and upload via HTTP POST
 *
 * Records audio from I2S microphone, creates WAV file, uploads to backend,
 * and returns the audio URL.
 *
 * This function:
 * - Feeds watchdog every 500ms to prevent timeout
 * - Records up to max_duration_ms (recommended: 10 seconds max)
 * - Uploads via HTTP POST multipart/form-data
 * - Parses JSON response: { "success": true, "url": "http://..." }
 * - Returns audio URL in out_url buffer
 *
 * @param[in] server_url Backend URL (e.g., "http://10.10.0.10:3001/api/voice/upload")
 * @param[out] out_url Output buffer for audio URL (must be pre-allocated)
 * @param[in] url_len Size of out_url buffer (recommended: 256 bytes)
 * @param[in] max_duration_ms Maximum recording duration in milliseconds (max: 10000ms)
 *
 * @return ESP_OK on success, error code otherwise
 *
 * @note This function blocks for up to max_duration_ms + upload time
 * @note Caller should call this from a task, not ISR
 */
esp_err_t audio_record_and_upload(
    const char* server_url,
    char* out_url,
    size_t url_len,
    uint32_t max_duration_ms
);

/**
 * @brief Deinitialize audio HTTP upload module
 *
 * Stops recording (if active) and frees all resources.
 *
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t audio_http_upload_deinit(void);

#ifdef __cplusplus
}
#endif

#endif // AUDIO_HTTP_UPLOAD_H
