idf_component_register(
    SRCS
        "main.c"
        "wifi_manager.c"
        "mqtt_handler.c"
        "button_handler.c"
        # "touch_handler.c"  # Disabled - ESP-IDF v5.3 API changes
        "accel_handler.c"
        "led_controller.c"
        # "audio_recorder.c"      # DISABLED: Dead code causing I2S conflict - audio_http_upload.c is used instead
        "audio_http_upload.c"
        "web_server.c"
        "ota_handler.c"
        "device_manager.c"
        # "power_manager.c"  # Disabled - ESP-IDF v5.3 API changes
    INCLUDE_DIRS
        "."
    REQUIRES
        driver
        esp_driver_i2c
        esp_driver_i2s
        esp_driver_gpio
        # esp_driver_touch_sens  # Disabled - not using touch handler
        esp_wifi
        esp_netif
        esp_http_server
        esp_http_client
        mqtt
        nvs_flash
        esp_timer
        esp_adc
        mdns
        esp_https_ota
        app_update
        spiffs
        cjson
        mcp23017
        lis3dhtr
        led_effects
        adpcm_codec
    EMBED_FILES
        "../web/index.html"
        "../web/debug.html"
        "../web/status.html"
        "../web/ota.html"
)

# Allow deprecated API warnings (don't treat them as errors)
target_compile_options(${COMPONENT_LIB} PRIVATE -Wno-error=cpp)
