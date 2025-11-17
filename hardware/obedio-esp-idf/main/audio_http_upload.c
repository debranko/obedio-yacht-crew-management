/**
 * @file audio_http_upload.c
 * @brief HTTP-based audio recording and upload implementation
 */

#include "audio_http_upload.h"
#include "config.h"
#include "driver/i2s_std.h"
#include "esp_heap_caps.h"
#include "esp_log.h"
#include "esp_timer.h"
#include "esp_http_client.h"
#include "esp_task_wdt.h"
#include "cJSON.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include <string.h>
#include <stdio.h>

static const char *TAG = "audio_http_upload";

// WAV file header structure (44 bytes)
typedef struct {
    // RIFF Header
    char riff_header[4];      // "RIFF"
    uint32_t wav_size;        // File size - 8
    char wave_header[4];      // "WAVE"

    // Format Header
    char fmt_header[4];       // "fmt "
    uint32_t fmt_chunk_size;  // 16 for PCM
    uint16_t audio_format;    // 1 for PCM
    uint16_t num_channels;    // 1 for mono, 2 for stereo
    uint32_t sample_rate;     // Sample rate
    uint32_t byte_rate;       // SampleRate * NumChannels * BitsPerSample/8
    uint16_t block_align;     // NumChannels * BitsPerSample/8
    uint16_t bits_per_sample; // 16 bits

    // Data Header
    char data_header[4];      // "data"
    uint32_t data_bytes;      // NumSamples * NumChannels * BitsPerSample/8
} __attribute__((packed)) wav_header_t;

// Audio state
typedef struct {
    i2s_chan_handle_t rx_handle;
    int16_t *pcm_buffer;      // PCM buffer in PSRAM
    size_t buffer_size;
    bool initialized;
} audio_http_state_t;

static audio_http_state_t audio_state = {0};

// HTTP response buffer
static char http_response_buffer[512];
static size_t http_response_len = 0;

/**
 * Create WAV header
 */
static void create_wav_header(wav_header_t *header, uint32_t sample_rate, uint16_t num_channels, uint32_t data_size)
{
    // RIFF Header
    memcpy(header->riff_header, "RIFF", 4);
    header->wav_size = 36 + data_size;
    memcpy(header->wave_header, "WAVE", 4);

    // Format Header
    memcpy(header->fmt_header, "fmt ", 4);
    header->fmt_chunk_size = 16;
    header->audio_format = 1;  // PCM
    header->num_channels = num_channels;
    header->sample_rate = sample_rate;
    header->bits_per_sample = 16;
    header->byte_rate = sample_rate * num_channels * 2;
    header->block_align = num_channels * 2;

    // Data Header
    memcpy(header->data_header, "data", 4);
    header->data_bytes = data_size;
}

/**
 * HTTP event handler
 */
static esp_err_t http_event_handler(esp_http_client_event_t *evt)
{
    switch (evt->event_id) {
        case HTTP_EVENT_ON_DATA:
            if (http_response_len + evt->data_len < sizeof(http_response_buffer)) {
                memcpy(http_response_buffer + http_response_len, evt->data, evt->data_len);
                http_response_len += evt->data_len;
            }
            break;
        default:
            break;
    }
    return ESP_OK;
}

esp_err_t audio_http_upload_init(void)
{
    if (audio_state.initialized) {
        ESP_LOGW(TAG, "Already initialized");
        return ESP_OK;
    }

    ESP_LOGI(TAG, "Initializing HTTP audio upload");
    ESP_LOGI(TAG, "Microphone: MSM261S4030H0R on I2S_NUM_0");
    ESP_LOGI(TAG, "Sample rate: %d Hz", AUDIO_SAMPLE_RATE);

    // Calculate buffer size for 10 seconds max
    audio_state.buffer_size = AUDIO_SAMPLE_RATE * 10 * sizeof(int16_t);  // 10 seconds

    // Allocate PCM buffer in PSRAM
    audio_state.pcm_buffer = (int16_t *)heap_caps_malloc(
        audio_state.buffer_size,
        MALLOC_CAP_SPIRAM
    );

    if (audio_state.pcm_buffer == NULL) {
        ESP_LOGE(TAG, "Failed to allocate PCM buffer in PSRAM");
        return ESP_ERR_NO_MEM;
    }

    ESP_LOGI(TAG, "Allocated PCM buffer: %d bytes in PSRAM", audio_state.buffer_size);

    // Configure I2S channel for microphone (RX)
    i2s_chan_config_t chan_cfg = I2S_CHANNEL_DEFAULT_CONFIG(I2S_MIC_NUM, I2S_ROLE_MASTER);
    chan_cfg.dma_desc_num = 4;
    chan_cfg.dma_frame_num = 512;  // 512 samples per DMA buffer

    esp_err_t ret = i2s_new_channel(&chan_cfg, NULL, &audio_state.rx_handle);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to create I2S RX channel: %s", esp_err_to_name(ret));
        heap_caps_free(audio_state.pcm_buffer);
        audio_state.pcm_buffer = NULL;
        return ret;
    }

    // Configure I2S standard mode for MSM261S4030H0R
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
        heap_caps_free(audio_state.pcm_buffer);
        audio_state.rx_handle = NULL;
        audio_state.pcm_buffer = NULL;
        return ret;
    }

    audio_state.initialized = true;

    ESP_LOGI(TAG, "Audio HTTP upload initialized successfully");
    ESP_LOGI(TAG, "I2S pins - BCK: %d, WS: %d, DATA: %d",
             I2S_MIC_BCK_IO, I2S_MIC_WS_IO, I2S_MIC_DATA_IO);

    return ESP_OK;
}

esp_err_t audio_record_and_upload(
    const char* server_url,
    char* out_url,
    size_t url_len,
    uint32_t max_duration_ms
)
{
    if (!audio_state.initialized || audio_state.pcm_buffer == NULL || audio_state.rx_handle == NULL) {
        ESP_LOGE(TAG, "Audio HTTP upload not initialized");
        return ESP_ERR_INVALID_STATE;
    }

    if (server_url == NULL || out_url == NULL || url_len == 0) {
        ESP_LOGE(TAG, "Invalid parameters");
        return ESP_ERR_INVALID_ARG;
    }

    // Limit max duration to 10 seconds
    if (max_duration_ms > 10000) {
        ESP_LOGW(TAG, "Max duration limited to 10 seconds");
        max_duration_ms = 10000;
    }

    ESP_LOGI(TAG, "Starting audio recording (max: %lu ms)", max_duration_ms);

    // Clear buffer
    memset(audio_state.pcm_buffer, 0, audio_state.buffer_size);

    // Enable I2S RX channel
    esp_err_t ret = i2s_channel_enable(audio_state.rx_handle);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to enable I2S RX channel: %s", esp_err_to_name(ret));
        return ret;
    }

    // Record audio with watchdog feeding
    size_t total_bytes_read = 0;
    size_t max_samples = (AUDIO_SAMPLE_RATE * max_duration_ms) / 1000;
    size_t max_bytes = max_samples * sizeof(int16_t);

    uint32_t start_time = esp_timer_get_time() / 1000;  // Convert to ms
    uint32_t last_wdt_feed = start_time;

    ESP_LOGI(TAG, "Recording started...");

    while (total_bytes_read < max_bytes) {
        uint32_t current_time = esp_timer_get_time() / 1000;

        // Check if max duration reached
        if ((current_time - start_time) >= max_duration_ms) {
            ESP_LOGI(TAG, "Max duration reached: %lu ms", current_time - start_time);
            break;
        }

        // Feed watchdog every 500ms
        if ((current_time - last_wdt_feed) >= 500) {
            esp_task_wdt_reset();
            last_wdt_feed = current_time;
            ESP_LOGD(TAG, "Watchdog fed at %lu ms, recorded %d bytes",
                     current_time - start_time, total_bytes_read);
        }

        // Calculate how much to read
        size_t remaining_bytes = max_bytes - total_bytes_read;
        size_t chunk_size = (remaining_bytes < 4096) ? remaining_bytes : 4096;

        // Read from I2S (non-blocking with timeout)
        size_t bytes_read = 0;
        ret = i2s_channel_read(
            audio_state.rx_handle,
            audio_state.pcm_buffer + (total_bytes_read / sizeof(int16_t)),
            chunk_size,
            &bytes_read,
            pdMS_TO_TICKS(100)  // 100ms timeout
        );

        if (ret == ESP_OK && bytes_read > 0) {
            total_bytes_read += bytes_read;
        } else if (ret != ESP_OK && ret != ESP_ERR_TIMEOUT) {
            ESP_LOGE(TAG, "I2S read error: %s", esp_err_to_name(ret));
            i2s_channel_disable(audio_state.rx_handle);
            return ret;
        }

        // Yield to other tasks
        vTaskDelay(pdMS_TO_TICKS(10));
    }

    // Disable I2S
    i2s_channel_disable(audio_state.rx_handle);

    uint32_t end_time = esp_timer_get_time() / 1000;
    float duration_sec = (float)total_bytes_read / (float)(AUDIO_SAMPLE_RATE * sizeof(int16_t));

    ESP_LOGI(TAG, "Recording complete: %d bytes (%.2f seconds, actual time: %lu ms)",
             total_bytes_read, duration_sec, end_time - start_time);

    if (total_bytes_read == 0) {
        ESP_LOGW(TAG, "No audio data recorded");
        return ESP_ERR_INVALID_STATE;
    }

    // Create WAV file in memory
    wav_header_t wav_header;
    create_wav_header(&wav_header, AUDIO_SAMPLE_RATE, 1, total_bytes_read);

    size_t wav_size = sizeof(wav_header_t) + total_bytes_read;
    uint8_t *wav_file = (uint8_t *)malloc(wav_size);
    if (wav_file == NULL) {
        ESP_LOGE(TAG, "Failed to allocate WAV file buffer");
        return ESP_ERR_NO_MEM;
    }

    // Copy header and data
    memcpy(wav_file, &wav_header, sizeof(wav_header_t));
    memcpy(wav_file + sizeof(wav_header_t), audio_state.pcm_buffer, total_bytes_read);

    ESP_LOGI(TAG, "WAV file created: %d bytes", wav_size);

    // HTTP POST upload
    ESP_LOGI(TAG, "Uploading to: %s", server_url);

    // Reset response buffer
    http_response_len = 0;
    memset(http_response_buffer, 0, sizeof(http_response_buffer));

    // Create multipart boundary
    const char *boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";

    // Build multipart body
    char *multipart_header = NULL;
    char *multipart_footer = NULL;

    asprintf(&multipart_header,
        "--%s\r\n"
        "Content-Disposition: form-data; name=\"audio\"; filename=\"voice.wav\"\r\n"
        "Content-Type: audio/wav\r\n"
        "\r\n",
        boundary);

    asprintf(&multipart_footer, "\r\n--%s--\r\n", boundary);

    size_t multipart_header_len = strlen(multipart_header);
    size_t multipart_footer_len = strlen(multipart_footer);
    size_t total_post_len = multipart_header_len + wav_size + multipart_footer_len;

    // Allocate multipart body
    uint8_t *post_body = (uint8_t *)malloc(total_post_len);
    if (post_body == NULL) {
        ESP_LOGE(TAG, "Failed to allocate POST body");
        free(wav_file);
        free(multipart_header);
        free(multipart_footer);
        return ESP_ERR_NO_MEM;
    }

    // Assemble POST body
    memcpy(post_body, multipart_header, multipart_header_len);
    memcpy(post_body + multipart_header_len, wav_file, wav_size);
    memcpy(post_body + multipart_header_len + wav_size, multipart_footer, multipart_footer_len);

    // Configure HTTP client
    char content_type[128];
    snprintf(content_type, sizeof(content_type), "multipart/form-data; boundary=%s", boundary);

    esp_http_client_config_t config = {
        .url = server_url,
        .method = HTTP_METHOD_POST,
        .timeout_ms = 30000,
        .event_handler = http_event_handler,
    };

    esp_http_client_handle_t client = esp_http_client_init(&config);
    esp_http_client_set_header(client, "Content-Type", content_type);
    esp_http_client_set_post_field(client, (const char *)post_body, total_post_len);

    ESP_LOGI(TAG, "Sending HTTP POST (%d bytes)...", total_post_len);

    // Feed watchdog before upload
    esp_task_wdt_reset();

    ret = esp_http_client_perform(client);

    // Feed watchdog after upload
    esp_task_wdt_reset();

    int status_code = esp_http_client_get_status_code(client);

    ESP_LOGI(TAG, "HTTP POST complete: status=%d, ret=%s", status_code, esp_err_to_name(ret));

    // Cleanup HTTP client
    esp_http_client_cleanup(client);

    // Free buffers
    free(post_body);
    free(multipart_header);
    free(multipart_footer);
    free(wav_file);

    if (ret != ESP_OK || status_code != 200) {
        ESP_LOGE(TAG, "HTTP upload failed: ret=%s, status=%d", esp_err_to_name(ret), status_code);
        return ESP_FAIL;
    }

    // Null-terminate response
    if (http_response_len < sizeof(http_response_buffer)) {
        http_response_buffer[http_response_len] = '\0';
    }

    ESP_LOGI(TAG, "HTTP response: %s", http_response_buffer);

    // Parse JSON response
    cJSON *json = cJSON_Parse(http_response_buffer);
    if (json == NULL) {
        ESP_LOGE(TAG, "Failed to parse JSON response");
        return ESP_FAIL;
    }

    cJSON *success = cJSON_GetObjectItem(json, "success");
    cJSON *url = cJSON_GetObjectItem(json, "url");

    if (success == NULL || !cJSON_IsTrue(success) || url == NULL || !cJSON_IsString(url)) {
        ESP_LOGE(TAG, "Invalid JSON response");
        cJSON_Delete(json);
        return ESP_FAIL;
    }

    // Copy URL to output buffer
    strncpy(out_url, url->valuestring, url_len - 1);
    out_url[url_len - 1] = '\0';

    ESP_LOGI(TAG, "Audio uploaded successfully: %s", out_url);

    cJSON_Delete(json);

    return ESP_OK;
}

esp_err_t audio_http_upload_deinit(void)
{
    if (!audio_state.initialized) {
        return ESP_OK;
    }

    ESP_LOGI(TAG, "Deinitializing audio HTTP upload");

    // Delete I2S channel
    if (audio_state.rx_handle != NULL) {
        esp_err_t ret = i2s_del_channel(audio_state.rx_handle);
        if (ret != ESP_OK) {
            ESP_LOGW(TAG, "Failed to delete I2S channel: %s", esp_err_to_name(ret));
        }
        audio_state.rx_handle = NULL;
    }

    // Free buffer
    if (audio_state.pcm_buffer != NULL) {
        heap_caps_free(audio_state.pcm_buffer);
        audio_state.pcm_buffer = NULL;
    }

    audio_state.initialized = false;

    ESP_LOGI(TAG, "Audio HTTP upload deinitialized");

    return ESP_OK;
}
