# Audio Recorder API Quick Reference

## Include

```c
#include "audio_recorder.h"
```

## API Functions

### 1. Initialize (call once at startup)

```c
esp_err_t audio_recorder_init(void);
```

**Returns**: `ESP_OK` on success

**What it does**:
- Allocates 640 KB PCM buffer in PSRAM
- Allocates 160 KB ADPCM buffer in PSRAM
- Configures I2S_NUM_0 for INMP441 microphone @ 16kHz

---

### 2. Start Recording

```c
esp_err_t audio_start_recording(void);
```

**Returns**: `ESP_OK` on success

**What it does**:
- Clears PCM buffer
- Enables I2S RX channel
- Creates background task to read audio
- Records continuously until stopped or 20s max

---

### 3. Stop Recording (returns compressed data)

```c
esp_err_t audio_stop_recording(uint8_t **adpcm_data, size_t *len, float *duration);
```

**Parameters**:
- `adpcm_data` - Output: pointer to ADPCM buffer (**you must free this!**)
- `len` - Output: ADPCM data length in bytes
- `duration` - Output: recording duration in seconds

**Returns**: `ESP_OK` on success

**What it does**:
- Stops background recording task
- Disables I2S
- Compresses PCM → ADPCM (4:1 ratio)
- Allocates output buffer with compressed data

**IMPORTANT**: Always free the returned buffer:
```c
free(adpcm_data);
```

---

### 4. Check if Recording

```c
bool audio_is_recording(void);
```

**Returns**: `true` if recording, `false` otherwise

---

### 5. Get Recording Duration

```c
float audio_get_recording_duration(void);
```

**Returns**: Duration in seconds (0.0 if not recording)

---

### 6. Cleanup (optional, at shutdown)

```c
esp_err_t audio_recorder_deinit(void);
```

**Returns**: `ESP_OK` on success

**What it does**:
- Stops recording if active
- Deletes I2S channel
- Frees all buffers

---

## Complete Example

```c
// 1. Initialize (once at startup)
audio_recorder_init();

// 2. Start recording (e.g., on button press)
audio_start_recording();

// 3. Wait or monitor progress
while (audio_is_recording()) {
    float duration = audio_get_recording_duration();
    printf("Recording: %.1f seconds\n", duration);
    vTaskDelay(pdMS_TO_TICKS(100));
}

// 4. Stop and get data (e.g., on button release)
uint8_t *adpcm_data = NULL;
size_t len = 0;
float duration = 0.0f;

audio_stop_recording(&adpcm_data, &len, &duration);

// 5. Use the data
if (adpcm_data != NULL && len > 0) {
    printf("Got %.2f seconds, %d bytes ADPCM\n", duration, len);
    mqtt_publish_voice(adpcm_data, len);

    // 6. ALWAYS free the buffer!
    free(adpcm_data);
}
```

---

## Memory Usage

| Buffer | Size | Location |
|--------|------|----------|
| PCM | 640 KB | PSRAM |
| ADPCM (internal) | 160 KB | PSRAM |
| ADPCM (output) | ~160 KB | Heap (you free) |
| **Total** | **~960 KB** | |

---

## Compression Ratios

| Duration | PCM Size | ADPCM Size |
|----------|----------|------------|
| 1 second | 32 KB | 8 KB |
| 5 seconds | 160 KB | 40 KB |
| 10 seconds | 320 KB | 80 KB |
| 20 seconds | 640 KB | 160 KB |

Compression ratio: **4:1** (16-bit PCM → 4-bit ADPCM)

---

## Hardware Connections (INMP441)

| INMP441 Pin | ESP32-S3 GPIO | Description |
|-------------|---------------|-------------|
| SCK / BCK | GPIO 33 | Bit clock |
| WS / LRCLK | GPIO 38 | Word select (L/R clock) |
| SD / DATA | GPIO 34 | Serial data |
| L/R | GND | Left channel select |
| VDD | 3.3V | Power |
| GND | GND | Ground |

---

## Configuration (from config.h)

```c
#define AUDIO_SAMPLE_RATE       16000  // 16 kHz
#define AUDIO_MAX_DURATION_SEC  20     // 20 seconds max
#define I2S_MIC_NUM             I2S_NUM_0
#define I2S_MIC_BCK_IO          33
#define I2S_MIC_WS_IO           38
#define I2S_MIC_DATA_IO         34
```

---

## Error Handling

```c
esp_err_t ret = audio_start_recording();
if (ret != ESP_OK) {
    ESP_LOGE(TAG, "Failed to start: %s", esp_err_to_name(ret));
    return;
}
```

Common errors:
- `ESP_ERR_NO_MEM` - PSRAM allocation failed
- `ESP_ERR_INVALID_STATE` - Already recording / not initialized
- `ESP_FAIL` - Task creation failed

---

## Thread Safety

⚠️ **NOT thread-safe** - call from one task only!

Safe:
```c
// Button task
button_callback() {
    audio_start_recording();
}

// Same task later
on_release() {
    audio_stop_recording(...);
}
```

Unsafe:
```c
// Task 1
audio_start_recording();

// Task 2 (concurrent)
audio_start_recording();  // BAD! Race condition
```

---

## Performance

- **CPU usage**: ~2-3% during recording
- **Stop latency**: ~50-80ms for 20 seconds
- **Task priority**: 4 (high)
- **Task stack**: 8192 bytes

---

## See Also

- Full documentation: `AUDIO_RECORDER_README.md`
- Integration example: `audio_recorder_example.c`
- ADPCM codec: `components/adpcm_codec/include/adpcm.h`
