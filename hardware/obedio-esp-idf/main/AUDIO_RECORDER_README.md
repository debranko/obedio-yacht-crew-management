# Audio Recorder for ESP-IDF with I2S Microphone and ADPCM Compression

## Overview

Audio recorder implementation for ESP32-S3 with INMP441 I2S MEMS microphone and ADPCM compression. Records audio to PSRAM and compresses with 4:1 ratio for efficient storage and transmission.

## Files

- **`audio_recorder.h`** - Public API header
- **`audio_recorder.c`** - Implementation with background recording task
- **`audio_recorder_example.c`** - Integration example (reference only, do not compile)

## Hardware Configuration

### I2S Microphone (INMP441)
- **I2S Port**: I2S_NUM_0
- **BCK (Clock)**: GPIO 33
- **WS (Word Select/LRCLK)**: GPIO 38
- **DATA (Serial Data)**: GPIO 34
- **Sample Rate**: 16 kHz
- **Bits per Sample**: 16-bit signed
- **Channels**: Mono
- **DMA Buffer**: 512 samples

### Memory Requirements
- **PCM Buffer**: 640 KB in PSRAM (20 seconds @ 16kHz, 16-bit)
- **ADPCM Buffer**: 160 KB in PSRAM (4:1 compression)
- **Output Buffer**: Allocated dynamically from heap

## API Reference

### Initialization

```c
esp_err_t audio_recorder_init(void);
```

Initializes the audio recorder:
- Allocates PCM and ADPCM buffers in PSRAM
- Configures I2S peripheral for INMP441 microphone
- Sets up standard I2S mode with Philips format

**Returns**: `ESP_OK` on success, error code otherwise

### Start Recording

```c
esp_err_t audio_start_recording(void);
```

Starts audio recording:
- Resets recording state and clears PCM buffer
- Enables I2S RX channel
- Creates background task to continuously read from I2S
- Records while task is running (up to 20 seconds max)

**Returns**: `ESP_OK` on success, error code otherwise

### Stop Recording

```c
esp_err_t audio_stop_recording(uint8_t **adpcm_data, size_t *len, float *duration);
```

Stops recording and returns compressed data:
- Signals background task to stop
- Waits for task to finish reading
- Disables I2S RX channel
- Compresses PCM to ADPCM (4:1 ratio)
- Allocates output buffer and copies ADPCM data
- Returns pointer to ADPCM data, length, and duration

**Parameters**:
- `adpcm_data` - Output pointer to ADPCM data buffer (**caller must free with `free()`**)
- `len` - Output length of ADPCM data in bytes
- `duration` - Output recording duration in seconds

**Returns**: `ESP_OK` on success, error code otherwise

**Important**: Caller MUST free the ADPCM data buffer after use:
```c
uint8_t *adpcm_data = NULL;
size_t len = 0;
float duration = 0.0f;

audio_stop_recording(&adpcm_data, &len, &duration);

// Use the data...
mqtt_publish(adpcm_data, len);

// Then free it
free(adpcm_data);
```

### Status Functions

```c
bool audio_is_recording(void);
```

Returns `true` if currently recording, `false` otherwise.

```c
float audio_get_recording_duration(void);
```

Returns current recording duration in seconds, or `0.0` if not recording.

### Cleanup

```c
esp_err_t audio_recorder_deinit(void);
```

Deinitializes audio recorder:
- Stops recording if active
- Deletes background task
- Disables and deletes I2S channel
- Frees all buffers

**Returns**: `ESP_OK` on success

## Usage Example

### Basic Usage

```c
#include "audio_recorder.h"

// Initialize
esp_err_t ret = audio_recorder_init();
if (ret != ESP_OK) {
    ESP_LOGE(TAG, "Failed to initialize audio recorder");
    return;
}

// Start recording
ret = audio_start_recording();
if (ret != ESP_OK) {
    ESP_LOGE(TAG, "Failed to start recording");
    return;
}

// Record for some time (e.g., while button held)
vTaskDelay(pdMS_TO_TICKS(5000));  // 5 seconds

// Stop and get compressed data
uint8_t *adpcm_data = NULL;
size_t adpcm_len = 0;
float duration = 0.0f;

ret = audio_stop_recording(&adpcm_data, &adpcm_len, &duration);
if (ret == ESP_OK && adpcm_data != NULL) {
    ESP_LOGI(TAG, "Recorded %.2f seconds, %d bytes ADPCM", duration, adpcm_len);

    // Send via MQTT or save to file
    mqtt_publish_voice(adpcm_data, adpcm_len);

    // IMPORTANT: Free the data
    free(adpcm_data);
}
```

### Integration with Button Handler

```c
// Start recording on long press
void button_callback(const char *button, press_type_t type) {
    if (strcmp(button, "T1") == 0 && type == PRESS_TYPE_LONG) {
        audio_start_recording();
        // Change LED to red to indicate recording
    }
}

// Stop recording on button release
void on_button_released(const char *button) {
    if (strcmp(button, "T1") == 0 && audio_is_recording()) {
        uint8_t *data = NULL;
        size_t len = 0;
        float duration = 0.0f;

        audio_stop_recording(&data, &len, &duration);

        if (data != NULL && len > 0) {
            mqtt_publish_voice(data, len);
            free(data);
        }

        // Return LED to normal state
    }
}
```

### Monitor Recording Progress

```c
while (audio_is_recording()) {
    float duration = audio_get_recording_duration();
    ESP_LOGI(TAG, "Recording: %.1f seconds", duration);

    // Check for maximum duration (backup check)
    if (duration >= AUDIO_MAX_DURATION_SEC) {
        ESP_LOGW(TAG, "Maximum duration reached");
        break;
    }

    vTaskDelay(pdMS_TO_TICKS(100));
}
```

## ADPCM Compression

The audio recorder uses IMA ADPCM codec for compression:

- **Compression Ratio**: 4:1
- **Input**: 16-bit PCM samples
- **Output**: 4-bit ADPCM samples (2 samples per byte)
- **Quality**: Good for speech, moderate for music
- **Encoding Time**: ~50-80ms for 20 seconds of audio

Example sizes:
- 1 second @ 16kHz: 32 KB PCM → 8 KB ADPCM
- 5 seconds @ 16kHz: 160 KB PCM → 40 KB ADPCM
- 20 seconds @ 16kHz: 640 KB PCM → 160 KB ADPCM

## Background Recording Task

The audio recorder creates a background task (`audio_rec`) that:

1. Continuously reads from I2S DMA buffer (1024 samples at a time)
2. Writes samples to PSRAM buffer
3. Stops when:
   - `audio_stop_recording()` is called
   - Maximum duration (20 seconds) is reached
   - I2S read error occurs

**Task Configuration**:
- **Stack Size**: 8192 bytes (`STACK_SIZE_AUDIO`)
- **Priority**: 4 (`PRIORITY_AUDIO_TASK`)
- **Core**: Any (not pinned)

## Performance

- **I2S Read Latency**: < 10ms per 1024-sample chunk
- **Recording Task Overhead**: ~2-3% CPU @ 16kHz
- **Stop/Compression Time**: ~50-80ms for 20 seconds
- **Memory Footprint**: ~800 KB PSRAM + ~8 KB heap

## Error Handling

The recorder handles several error conditions:

1. **PSRAM Allocation Failure**: Returns `ESP_ERR_NO_MEM` during init
2. **I2S Init Failure**: Returns error code, cleans up allocated resources
3. **Already Recording**: Returns `ESP_ERR_INVALID_STATE`
4. **No Data Recorded**: Returns empty result with 0 length
5. **Task Creation Failure**: Disables I2S, returns `ESP_FAIL`

## Thread Safety

The audio recorder is **NOT thread-safe**. Only call functions from one task at a time. The background recording task uses shared state variables that are not protected by mutexes.

**Safe Usage**:
- Call `audio_start_recording()` from button handler task
- Call `audio_stop_recording()` from same task
- Call `audio_is_recording()` from monitoring task (read-only, safe)

**Unsafe Usage**:
- Calling `audio_start_recording()` from multiple tasks
- Calling `audio_stop_recording()` while another task is starting

## Configuration

Audio settings are defined in `config.h`:

```c
#define AUDIO_SAMPLE_RATE       16000  // 16 kHz
#define AUDIO_MAX_DURATION_SEC  20     // 20 seconds
#define AUDIO_SAMPLE_SIZE       2      // 16-bit = 2 bytes
#define AUDIO_MAX_SAMPLES       (AUDIO_SAMPLE_RATE * AUDIO_MAX_DURATION_SEC)
#define AUDIO_BUFFER_SIZE       (AUDIO_MAX_SAMPLES * AUDIO_SAMPLE_SIZE)

#define I2S_MIC_NUM             I2S_NUM_0
#define I2S_MIC_BCK_IO          33
#define I2S_MIC_WS_IO           38
#define I2S_MIC_DATA_IO         34
```

## MQTT Integration

To send voice messages via MQTT:

```c
// Example MQTT payload format (JSON)
{
  "duration": 5.2,
  "sample_rate": 16000,
  "codec": "adpcm",
  "data": "<base64-encoded ADPCM data>"
}
```

See `mqtt_handler.h` for MQTT publishing functions.

## Troubleshooting

### No audio data recorded

**Symptoms**: `audio_stop_recording()` returns 0 samples
**Causes**:
- I2S microphone not connected properly
- Wrong GPIO pins configured
- Microphone VDD not powered (3.3V required)
- L/R pin not connected (should be GND for left channel)

**Solution**: Check hardware connections and I2S pin configuration

### Noisy or distorted audio

**Symptoms**: Audio has high noise floor or distortion
**Causes**:
- Poor power supply filtering
- Ground loop issues
- Wrong sample rate configuration
- Microphone too close to noisy components

**Solution**:
- Add 10µF capacitor near microphone VDD
- Use proper grounding
- Verify 16kHz sample rate
- Place microphone away from switching regulators

### Recording stops early

**Symptoms**: Recording stops before expected
**Causes**:
- I2S read errors
- PSRAM access issues
- Task watchdog timeout

**Solution**: Check logs for I2S errors, verify PSRAM is enabled in sdkconfig

### Compression takes too long

**Symptoms**: `audio_stop_recording()` takes > 200ms
**Causes**:
- Large recording duration
- CPU frequency too low
- Cache misses with PSRAM

**Solution**: Increase CPU frequency, enable PSRAM cache in menuconfig

## References

- [ESP-IDF I2S Driver](https://docs.espressif.com/projects/esp-idf/en/latest/esp32s3/api-reference/peripherals/i2s.html)
- [INMP441 Datasheet](https://invensense.tdk.com/products/digital/inmp441/)
- [IMA ADPCM Specification](https://wiki.multimedia.cx/index.php/IMA_ADPCM)
- Component: `components/adpcm_codec/` - ADPCM encoder/decoder

## License

Part of OBEDIO Smart Button firmware.
