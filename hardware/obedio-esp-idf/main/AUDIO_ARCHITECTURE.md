# Audio Recorder Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ESP32-S3 Application                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐         ┌──────────────┐         ┌────────────┐  │
│  │    Button    │         │    Audio     │         │    MQTT    │  │
│  │   Handler    │────────▶│   Recorder   │────────▶│  Handler   │  │
│  │              │  start  │              │  voice  │            │  │
│  │  Long Press  │  stop   │  Recording   │  data   │  Publish   │  │
│  └──────────────┘         └──────────────┘         └────────────┘  │
│                                  │                                  │
│                                  │                                  │
│                                  ▼                                  │
│                         ┌─────────────────┐                        │
│                         │ Recording Task  │                        │
│                         │  (Background)   │                        │
│                         └─────────────────┘                        │
│                                  │                                  │
└──────────────────────────────────┼──────────────────────────────────┘
                                   │
                                   │ I2S Read
                                   │
                         ┌─────────▼──────────┐
                         │   I2S Peripheral   │
                         │    (I2S_NUM_0)     │
                         └─────────┬──────────┘
                                   │
                         ┌─────────▼──────────┐
                         │  INMP441 Mic       │
                         │  (I2S MEMS)        │
                         │  16kHz, Mono       │
                         └────────────────────┘
```

## Data Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Physical │────▶│   I2S    │────▶│   PCM    │────▶│  ADPCM   │
│  Sound   │     │   DMA    │     │  Buffer  │     │  Buffer  │
│          │     │          │     │ (PSRAM)  │     │ (PSRAM)  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                        │                 │
                                        │                 │
                                        ▼                 ▼
                                   640 KB            160 KB
                                  (20s max)        (compressed)
                                                          │
                                                          │
                                                          ▼
                                                   ┌──────────┐
                                                   │  Output  │
                                                   │  malloc  │
                                                   │  (Heap)  │
                                                   └──────────┘
                                                          │
                                                          ▼
                                                   ┌──────────┐
                                                   │   MQTT   │
                                                   │ Publish  │
                                                   └──────────┘
                                                          │
                                                          ▼
                                                    free(data)
```

## Component Layers

```
┌───────────────────────────────────────────────────────────────┐
│                     Application Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │ Button Press │  │ LED Feedback │  │ MQTT Publishing  │    │
│  └──────────────┘  └──────────────┘  └──────────────────┘    │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│                   Audio Recorder API                          │
│  ┌───────────────────────────────────────────────────────┐   │
│  │  audio_recorder_init()                                 │   │
│  │  audio_start_recording()                               │   │
│  │  audio_stop_recording()                                │   │
│  │  audio_is_recording()                                  │   │
│  │  audio_get_recording_duration()                        │   │
│  └───────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│                    Internal Components                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │  I2S Driver  │  │ ADPCM Codec  │  │  PSRAM Buffers   │    │
│  │   (ESP-IDF)  │  │ (Component)  │  │  (heap_caps)     │    │
│  └──────────────┘  └──────────────┘  └──────────────────┘    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │ FreeRTOS Task│  │ DMA Transfer │  │  Error Handling  │    │
│  │  (Priority 4)│  │   (512 smp)  │  │   (Logging)      │    │
│  └──────────────┘  └──────────────┘  └──────────────────┘    │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│                     Hardware Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │  I2S Pins    │  │    PSRAM     │  │   CPU / DMA      │    │
│  │  33,38,34    │  │   8MB        │  │   ESP32-S3       │    │
│  └──────────────┘  └──────────────┘  └──────────────────┘    │
└───────────────────────────────────────────────────────────────┘
```

## State Machine

```
                    ┌──────────────┐
                    │     IDLE     │
                    │  (Init Done) │
                    └──────┬───────┘
                           │
                  audio_start_recording()
                           │
                           ▼
                    ┌──────────────┐
                    │  RECORDING   │◀────┐
                    │ (Task Active)│     │
                    └──────┬───────┘     │
                           │             │
                           │         I2S Read
                           │         Loop
                           │             │
                  audio_stop_recording() │
                     or MAX_DURATION     │
                           │             │
                           ▼             │
                    ┌──────────────┐    │
                    │  STOPPING    │────┘
                    │ (Wait Task)  │  Exit
                    └──────┬───────┘
                           │
                      Compress PCM
                           │
                           ▼
                    ┌──────────────┐
                    │     IDLE     │
                    │ (Ready Again)│
                    └──────────────┘
```

## Memory Layout

```
PSRAM (8 MB total, ~960 KB used for audio):

┌─────────────────────────────────────────────────────┐
│  PCM Buffer (640 KB)                                │
│  ┌───────────────────────────────────────────────┐  │
│  │  16-bit samples @ 16kHz                       │  │
│  │  320,000 samples = 20 seconds max             │  │
│  │  [sample0][sample1][sample2]...[sample319999]│  │
│  └───────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────┤
│  ADPCM Buffer (160 KB)                              │
│  ┌───────────────────────────────────────────────┐  │
│  │  4-bit samples (2 per byte)                   │  │
│  │  160,000 bytes = 320,000 4-bit samples        │  │
│  │  [nibble0,nibble1][nibble2,nibble3]...        │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘

Heap (Regular RAM):

┌─────────────────────────────────────────────────────┐
│  Output Buffer (malloc)                             │
│  ┌───────────────────────────────────────────────┐  │
│  │  ADPCM data copy (allocated on demand)        │  │
│  │  Variable size: 0-160 KB                      │  │
│  │  *** MUST BE FREED BY CALLER ***              │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Task Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Button Handler Task (Priority 5)                      │
│  ┌────────────────────────────────────────────────┐    │
│  │  - Monitors button state                       │    │
│  │  - Calls audio_start_recording() on long press │    │
│  │  - Calls audio_stop_recording() on release     │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                         │
                         │ Creates
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Audio Recording Task (Priority 4)                      │
│  ┌────────────────────────────────────────────────┐    │
│  │  while (is_recording):                         │    │
│  │    1. Read 1024 samples from I2S               │    │
│  │    2. Write to PCM buffer                      │    │
│  │    3. Check if max duration reached            │    │
│  │    4. Yield to other tasks                     │    │
│  │  exit                                          │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                         │
                         │ Stopped by
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Main Task / Button Task                                │
│  ┌────────────────────────────────────────────────┐    │
│  │  - Sets is_recording = false                   │    │
│  │  - Waits for task to exit                      │    │
│  │  - Compresses PCM to ADPCM                     │    │
│  │  - Returns compressed data                     │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Timing Diagram

```
Button:    ──┐                                  ┌──
             └──────────────────────────────────┘
             Press                            Release
               │                                 │
               ▼                                 ▼

Audio:     IDLE│◀─────── RECORDING ──────────▶│COMPRESS│─▶IDLE
               │                               │        │
               ├───────────────────────────────┤────────┤
               0s                            5.2s    5.3s

I2S:           │◀─ Continuous Read Loop ────▶│ Stop
               │                               │

Task:          │◀────── Task Running ────────▶│ Exit
               Create                          Delete

LEDs:      Normal│◀────── Red Pulse ────────▶│ Normal

MQTT:                                          │ Publish
                                               │  Voice
                                               │ Message
```

## File Dependencies

```
audio_recorder.c
    │
    ├─▶ config.h                    (Hardware pins, constants)
    ├─▶ adpcm.h                     (ADPCM compression)
    ├─▶ driver/i2s_std.h            (I2S driver)
    ├─▶ esp_heap_caps.h             (PSRAM allocation)
    ├─▶ esp_log.h                   (Logging)
    ├─▶ esp_timer.h                 (Timing)
    └─▶ freertos/FreeRTOS.h         (Tasks, delays)

Application
    │
    ├─▶ audio_recorder.h            (Public API)
    ├─▶ button_handler.h            (Button events)
    └─▶ mqtt_handler.h              (Publishing)
```

## Configuration Chain

```
sdkconfig
    │
    ├─▶ CONFIG_OBEDIO_AUDIO_SAMPLE_RATE
    ├─▶ CONFIG_OBEDIO_AUDIO_MAX_DURATION
    ├─▶ CONFIG_OBEDIO_I2S_MIC_BCK_GPIO
    ├─▶ CONFIG_OBEDIO_I2S_MIC_WS_GPIO
    └─▶ CONFIG_OBEDIO_I2S_MIC_DATA_GPIO

    ▼

config.h
    │
    ├─▶ AUDIO_SAMPLE_RATE = 16000
    ├─▶ AUDIO_MAX_DURATION_SEC = 20
    ├─▶ AUDIO_BUFFER_SIZE = 640 KB
    ├─▶ I2S_MIC_BCK_IO = 33
    ├─▶ I2S_MIC_WS_IO = 38
    └─▶ I2S_MIC_DATA_IO = 34

    ▼

audio_recorder.c
    │
    └─▶ Uses configuration constants
```

## Error Propagation

```
I2S Hardware Error
    │
    ▼
i2s_channel_read() returns error
    │
    ▼
Recording task logs error and exits
    │
    ▼
audio_stop_recording() returns partial data
    │
    ▼
Application handles error
    │
    ├─▶ Log error message
    ├─▶ Free partial data (if any)
    ├─▶ Show error LED pattern
    └─▶ Return to idle state
```
