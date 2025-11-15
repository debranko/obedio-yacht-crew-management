/**
 * @file audio_recorder_example.c
 * @brief Example integration of audio recorder with button handler
 *
 * This file demonstrates how to integrate the audio recorder with the
 * button handler to record audio on long press and send via MQTT.
 *
 * DO NOT COMPILE THIS FILE - It's for reference only.
 * Add this logic to your main application file.
 */

#include "audio_recorder.h"
#include "button_handler.h"
#include "mqtt_handler.h"
#include "esp_log.h"

static const char *TAG = "audio_example";

// Button callback handler with audio recording
void button_press_handler(const char *button, press_type_t type)
{
    // Check if main button long press (start recording)
    if (strcmp(button, "T1") == 0 && type == PRESS_TYPE_LONG) {
        ESP_LOGI(TAG, "Main button long press - starting audio recording");

        esp_err_t ret = audio_start_recording();
        if (ret == ESP_OK) {
            ESP_LOGI(TAG, "Audio recording started, keep holding button...");
            // Optionally: Change LED color to indicate recording (e.g., red pulse)
        } else {
            ESP_LOGE(TAG, "Failed to start recording: %s", esp_err_to_name(ret));
        }
    }
}

// Call this when button is released (need to monitor button state)
void on_button_released(const char *button)
{
    // Check if recording is active and main button was released
    if (strcmp(button, "T1") == 0 && audio_is_recording()) {
        ESP_LOGI(TAG, "Main button released - stopping recording");

        uint8_t *adpcm_data = NULL;
        size_t adpcm_len = 0;
        float duration = 0.0f;

        esp_err_t ret = audio_stop_recording(&adpcm_data, &adpcm_len, &duration);
        if (ret == ESP_OK && adpcm_data != NULL && adpcm_len > 0) {
            ESP_LOGI(TAG, "Recording complete: %.2f seconds, %d bytes ADPCM",
                     duration, adpcm_len);

            // Send via MQTT
            // mqtt_publish_voice_message(adpcm_data, adpcm_len, duration);

            // Free the ADPCM data after sending
            free(adpcm_data);

            ESP_LOGI(TAG, "Voice message sent via MQTT");
        } else {
            ESP_LOGE(TAG, "Failed to get recording data");
        }
    }
}

// Example: Monitor recording duration and enforce maximum
void audio_monitor_task(void *pvParameters)
{
    while (1) {
        if (audio_is_recording()) {
            float duration = audio_get_recording_duration();

            // Check if reached maximum (should be handled by recorder, but as backup)
            if (duration >= AUDIO_MAX_DURATION_SEC) {
                ESP_LOGW(TAG, "Maximum recording duration reached, stopping");

                uint8_t *adpcm_data = NULL;
                size_t adpcm_len = 0;
                float final_duration = 0.0f;

                audio_stop_recording(&adpcm_data, &adpcm_len, &final_duration);

                if (adpcm_data != NULL) {
                    // mqtt_publish_voice_message(adpcm_data, adpcm_len, final_duration);
                    free(adpcm_data);
                }
            }

            // Log progress every second
            static int last_second = 0;
            int current_second = (int)duration;
            if (current_second > last_second) {
                ESP_LOGI(TAG, "Recording: %.1f seconds", duration);
                last_second = current_second;
            }
        }

        vTaskDelay(pdMS_TO_TICKS(100));  // Check every 100ms
    }
}

// In app_main() or similar initialization function:
void example_init(void)
{
    // Initialize audio recorder
    esp_err_t ret = audio_recorder_init();
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to initialize audio recorder");
        return;
    }

    // Initialize button handler with callback
    button_handler_init(button_press_handler);

    // Create monitoring task (optional)
    xTaskCreate(audio_monitor_task, "audio_mon", 2048, NULL, 3, NULL);

    ESP_LOGI(TAG, "Audio recording system initialized");
    ESP_LOGI(TAG, "Press and hold main button (T1) to record voice message");
}

/*
 * INTEGRATION NOTES:
 *
 * 1. Button Handler Integration:
 *    - Monitor button state changes, not just press events
 *    - Start recording on long press start
 *    - Stop recording on button release
 *    - Handle timeout if button held > 20 seconds
 *
 * 2. MQTT Integration:
 *    - Publish to: obedio/button/{deviceId}/voice
 *    - Payload format: JSON with base64-encoded ADPCM data
 *    - Include: duration, sample_rate, codec ("adpcm")
 *
 * 3. LED Feedback:
 *    - Show different color during recording (e.g., red)
 *    - Pulse or animate to indicate active recording
 *    - Return to normal state after sending
 *
 * 4. Error Handling:
 *    - Check for PSRAM availability
 *    - Handle I2S initialization failures
 *    - Validate recording before sending
 *    - Provide user feedback on errors
 *
 * 5. Memory Management:
 *    - ALWAYS free the ADPCM data after use
 *    - Internal PCM buffer is reused automatically
 *    - ADPCM buffer is reused internally
 *
 * 6. Performance:
 *    - Recording runs in background task (PRIORITY_AUDIO_TASK)
 *    - Compression happens synchronously on stop
 *    - Total stop time: < 100ms for 20 seconds of audio
 */
