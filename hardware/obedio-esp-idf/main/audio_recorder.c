/**
 * @file audio_recorder.c
 * @brief Audio recorder implementation with I2S microphone and ADPCM compression
 */

#include "audio_recorder.h"
#include "config.h"
#include "adpcm.h"
#include "driver/i2s_std.h"
#include "esp_heap_caps.h"
#include "esp_log.h"
#include "esp_timer.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include <string.h>

static const char *TAG = "audio_recorder";

// Audio recorder state
typedef struct {
    bool is_recording;           // Currently recording flag
    int16_t *pcm_buffer;         // PCM sample buffer in PSRAM
    uint8_t *adpcm_buffer;       // ADPCM compressed buffer in PSRAM
    size_t samples_recorded;     // Number of samples recorded
    int64_t start_time;          // Recording start time in microseconds
    i2s_chan_handle_t rx_handle; // I2S receive channel handle
    TaskHandle_t task_handle;    // Recording task handle
} audio_state_t;

static audio_state_t audio_state = {0};

// Forward declaration
static void audio_recording_task(void *pvParameters);

esp_err_t audio_recorder_init(void)
{
    esp_err_t ret;

    ESP_LOGI(TAG, "Initializing audio recorder");
    ESP_LOGI(TAG, "Microphone: INMP441 on I2S_NUM_0");
    ESP_LOGI(TAG, "Sample rate: %d Hz, Max duration: %d seconds",
             AUDIO_SAMPLE_RATE, AUDIO_MAX_DURATION_SEC);
    ESP_LOGI(TAG, "Buffer size: %d bytes (%d samples)",
             AUDIO_BUFFER_SIZE, AUDIO_MAX_SAMPLES);

    // Allocate PCM buffer in PSRAM
    audio_state.pcm_buffer = (int16_t *)heap_caps_malloc(
        AUDIO_BUFFER_SIZE,
        MALLOC_CAP_SPIRAM
    );
    if (audio_state.pcm_buffer == NULL) {
        ESP_LOGE(TAG, "Failed to allocate PCM buffer in PSRAM");
        return ESP_ERR_NO_MEM;
    }
    ESP_LOGI(TAG, "Allocated PCM buffer: %d bytes in PSRAM", AUDIO_BUFFER_SIZE);

    // Allocate ADPCM buffer in PSRAM (4:1 compression)
    size_t adpcm_buffer_size = AUDIO_BUFFER_SIZE / 4;
    audio_state.adpcm_buffer = (uint8_t *)heap_caps_malloc(
        adpcm_buffer_size,
        MALLOC_CAP_SPIRAM
    );
    if (audio_state.adpcm_buffer == NULL) {
        ESP_LOGE(TAG, "Failed to allocate ADPCM buffer in PSRAM");
        heap_caps_free(audio_state.pcm_buffer);
        audio_state.pcm_buffer = NULL;
        return ESP_ERR_NO_MEM;
    }
    ESP_LOGI(TAG, "Allocated ADPCM buffer: %d bytes in PSRAM", adpcm_buffer_size);

    // Configure I2S channel for microphone (RX)
    i2s_chan_config_t chan_cfg = I2S_CHANNEL_DEFAULT_CONFIG(I2S_MIC_NUM, I2S_ROLE_MASTER);
    chan_cfg.dma_desc_num = 4;
    chan_cfg.dma_frame_num = 512;  // 512 samples per DMA buffer

    ret = i2s_new_channel(&chan_cfg, NULL, &audio_state.rx_handle);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to create I2S RX channel: %s", esp_err_to_name(ret));
        heap_caps_free(audio_state.adpcm_buffer);
        heap_caps_free(audio_state.pcm_buffer);
        audio_state.adpcm_buffer = NULL;
        audio_state.pcm_buffer = NULL;
        return ret;
    }

    // Configure I2S standard mode for INMP441
    i2s_std_config_t std_cfg = {
        .clk_cfg = I2S_STD_CLK_DEFAULT_CONFIG(AUDIO_SAMPLE_RATE),
        .slot_cfg = I2S_STD_PHILIPS_SLOT_DEFAULT_CONFIG(I2S_DATA_BIT_WIDTH_16BIT, I2S_SLOT_MODE_MONO),
        .gpio_cfg = {
            .mclk = I2S_GPIO_UNUSED,
            .bclk = I2S_MIC_BCK_IO,
            .ws   = I2S_MIC_WS_IO,
            .dout = I2S_GPIO_UNUSED,
            .din  = I2S_MIC_DATA_IO,
            .invert_flags = {
                .mclk_inv = false,
                .bclk_inv = false,
                .ws_inv   = false,
            },
        },
    };

    ret = i2s_channel_init_std_mode(audio_state.rx_handle, &std_cfg);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to initialize I2S standard mode: %s", esp_err_to_name(ret));
        i2s_del_channel(audio_state.rx_handle);
        heap_caps_free(audio_state.adpcm_buffer);
        heap_caps_free(audio_state.pcm_buffer);
        audio_state.rx_handle = NULL;
        audio_state.adpcm_buffer = NULL;
        audio_state.pcm_buffer = NULL;
        return ret;
    }

    audio_state.is_recording = false;
    audio_state.samples_recorded = 0;
    audio_state.start_time = 0;
    audio_state.task_handle = NULL;

    ESP_LOGI(TAG, "Audio recorder initialized successfully");
    ESP_LOGI(TAG, "I2S pins - BCK: %d, WS: %d, DATA: %d",
             I2S_MIC_BCK_IO, I2S_MIC_WS_IO, I2S_MIC_DATA_IO);

    return ESP_OK;
}

static void audio_recording_task(void *pvParameters)
{
    ESP_LOGI(TAG, "Recording task started");

    const size_t read_size = 1024 * sizeof(int16_t);  // Read 1024 samples at a time
    size_t bytes_read = 0;

    while (audio_state.is_recording) {
        // Check if we've reached maximum duration
        if (audio_state.samples_recorded >= AUDIO_MAX_SAMPLES) {
            ESP_LOGW(TAG, "Maximum recording duration reached (%d seconds)", AUDIO_MAX_DURATION_SEC);
            break;
        }

        // Calculate remaining space in buffer
        size_t remaining_samples = AUDIO_MAX_SAMPLES - audio_state.samples_recorded;
        size_t samples_to_read = (remaining_samples < 1024) ? remaining_samples : 1024;
        size_t bytes_to_read = samples_to_read * sizeof(int16_t);

        // Read from I2S into buffer
        int16_t *write_ptr = audio_state.pcm_buffer + audio_state.samples_recorded;
        esp_err_t ret = i2s_channel_read(
            audio_state.rx_handle,
            write_ptr,
            bytes_to_read,
            &bytes_read,
            portMAX_DELAY
        );

        if (ret == ESP_OK && bytes_read > 0) {
            audio_state.samples_recorded += bytes_read / sizeof(int16_t);
            ESP_LOGD(TAG, "Read %d bytes (%d samples), total: %d samples",
                     bytes_read, bytes_read / sizeof(int16_t), audio_state.samples_recorded);
        } else if (ret != ESP_OK) {
            ESP_LOGE(TAG, "I2S read error: %s", esp_err_to_name(ret));
            break;
        }

        // Small yield to prevent watchdog issues
        vTaskDelay(1);
    }

    ESP_LOGI(TAG, "Recording task finished, total samples: %d", audio_state.samples_recorded);
    audio_state.task_handle = NULL;
    vTaskDelete(NULL);
}

esp_err_t audio_start_recording(void)
{
    if (audio_state.pcm_buffer == NULL || audio_state.rx_handle == NULL) {
        ESP_LOGE(TAG, "Audio recorder not initialized");
        return ESP_ERR_INVALID_STATE;
    }

    if (audio_state.is_recording) {
        ESP_LOGW(TAG, "Already recording");
        return ESP_ERR_INVALID_STATE;
    }

    ESP_LOGI(TAG, "Starting audio recording");

    // Reset recording state
    audio_state.samples_recorded = 0;
    audio_state.start_time = esp_timer_get_time();
    memset(audio_state.pcm_buffer, 0, AUDIO_BUFFER_SIZE);

    // Enable I2S RX channel
    esp_err_t ret = i2s_channel_enable(audio_state.rx_handle);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to enable I2S RX channel: %s", esp_err_to_name(ret));
        return ret;
    }

    // Set recording flag before creating task
    audio_state.is_recording = true;

    // Create recording task
    BaseType_t task_ret = xTaskCreate(
        audio_recording_task,
        "audio_rec",
        STACK_SIZE_AUDIO,
        NULL,
        PRIORITY_AUDIO_TASK,
        &audio_state.task_handle
    );

    if (task_ret != pdPASS) {
        ESP_LOGE(TAG, "Failed to create recording task");
        i2s_channel_disable(audio_state.rx_handle);
        audio_state.is_recording = false;
        return ESP_FAIL;
    }

    ESP_LOGI(TAG, "Recording started with background task");

    return ESP_OK;
}

esp_err_t audio_stop_recording(uint8_t **adpcm_data, size_t *len, float *duration)
{
    if (adpcm_data == NULL || len == NULL || duration == NULL) {
        ESP_LOGE(TAG, "Invalid parameters");
        return ESP_ERR_INVALID_ARG;
    }

    if (!audio_state.is_recording) {
        ESP_LOGW(TAG, "Not currently recording");
        *adpcm_data = NULL;
        *len = 0;
        *duration = 0.0f;
        return ESP_ERR_INVALID_STATE;
    }

    if (audio_state.pcm_buffer == NULL || audio_state.rx_handle == NULL) {
        ESP_LOGE(TAG, "Audio recorder not initialized");
        audio_state.is_recording = false;
        return ESP_ERR_INVALID_STATE;
    }

    ESP_LOGI(TAG, "Stopping audio recording");

    // Signal recording task to stop
    audio_state.is_recording = false;

    // Wait for recording task to finish (max 1 second)
    if (audio_state.task_handle != NULL) {
        ESP_LOGI(TAG, "Waiting for recording task to finish...");
        int wait_count = 0;
        while (audio_state.task_handle != NULL && wait_count < 100) {
            vTaskDelay(pdMS_TO_TICKS(10));
            wait_count++;
        }
        if (audio_state.task_handle != NULL) {
            ESP_LOGW(TAG, "Recording task did not finish in time");
        }
    }

    // Disable I2S RX channel
    esp_err_t ret = i2s_channel_disable(audio_state.rx_handle);
    if (ret != ESP_OK) {
        ESP_LOGW(TAG, "Failed to disable I2S RX channel: %s", esp_err_to_name(ret));
    }

    // Calculate duration
    int64_t end_time = esp_timer_get_time();
    *duration = (float)audio_state.samples_recorded / (float)AUDIO_SAMPLE_RATE;
    float actual_time = (float)(end_time - audio_state.start_time) / 1000000.0f;

    ESP_LOGI(TAG, "Recorded %d samples (%.2f seconds, actual time: %.2f seconds)",
             audio_state.samples_recorded, *duration, actual_time);

    // Check if we have data to compress
    if (audio_state.samples_recorded == 0) {
        ESP_LOGW(TAG, "No audio data recorded");
        audio_state.is_recording = false;
        *adpcm_data = NULL;
        *len = 0;
        *duration = 0.0f;
        return ESP_OK;
    }

    // Compress PCM to ADPCM
    ESP_LOGI(TAG, "Compressing PCM to ADPCM (4:1 ratio)");

    adpcm_state_t adpcm_state;
    adpcm_encode_init(&adpcm_state);

    size_t adpcm_bytes = adpcm_encode(
        audio_state.pcm_buffer,
        audio_state.adpcm_buffer,
        audio_state.samples_recorded,
        &adpcm_state
    );

    ESP_LOGI(TAG, "ADPCM compression complete: %d samples -> %d bytes (%.1f%% of original)",
             audio_state.samples_recorded, adpcm_bytes,
             (float)adpcm_bytes * 100.0f / (float)(audio_state.samples_recorded * sizeof(int16_t)));

    // Allocate output buffer and copy ADPCM data
    // Using regular malloc for the output buffer (caller will free it)
    *adpcm_data = (uint8_t *)malloc(adpcm_bytes);
    if (*adpcm_data == NULL) {
        ESP_LOGE(TAG, "Failed to allocate output buffer for ADPCM data");
        audio_state.is_recording = false;
        return ESP_ERR_NO_MEM;
    }

    memcpy(*adpcm_data, audio_state.adpcm_buffer, adpcm_bytes);
    *len = adpcm_bytes;

    audio_state.is_recording = false;

    ESP_LOGI(TAG, "Recording stopped. Duration: %.2f seconds, ADPCM size: %d bytes",
             *duration, *len);

    return ESP_OK;
}

bool audio_is_recording(void)
{
    return audio_state.is_recording;
}

float audio_get_recording_duration(void)
{
    if (!audio_state.is_recording) {
        return 0.0f;
    }

    int64_t current_time = esp_timer_get_time();
    return (float)(current_time - audio_state.start_time) / 1000000.0f;
}

esp_err_t audio_recorder_deinit(void)
{
    ESP_LOGI(TAG, "Deinitializing audio recorder");

    // Stop recording if active
    if (audio_state.is_recording) {
        ESP_LOGW(TAG, "Recording still active, stopping");
        audio_state.is_recording = false;

        // Wait for task to finish
        if (audio_state.task_handle != NULL) {
            int wait_count = 0;
            while (audio_state.task_handle != NULL && wait_count < 100) {
                vTaskDelay(pdMS_TO_TICKS(10));
                wait_count++;
            }
            if (audio_state.task_handle != NULL) {
                ESP_LOGW(TAG, "Force deleting recording task");
                vTaskDelete(audio_state.task_handle);
                audio_state.task_handle = NULL;
            }
        }

        i2s_channel_disable(audio_state.rx_handle);
    }

    // Delete I2S channel
    if (audio_state.rx_handle != NULL) {
        esp_err_t ret = i2s_del_channel(audio_state.rx_handle);
        if (ret != ESP_OK) {
            ESP_LOGW(TAG, "Failed to delete I2S channel: %s", esp_err_to_name(ret));
        }
        audio_state.rx_handle = NULL;
    }

    // Free buffers
    if (audio_state.pcm_buffer != NULL) {
        heap_caps_free(audio_state.pcm_buffer);
        audio_state.pcm_buffer = NULL;
    }

    if (audio_state.adpcm_buffer != NULL) {
        heap_caps_free(audio_state.adpcm_buffer);
        audio_state.adpcm_buffer = NULL;
    }

    audio_state.samples_recorded = 0;
    audio_state.start_time = 0;

    ESP_LOGI(TAG, "Audio recorder deinitialized");

    return ESP_OK;
}
