/**
 * @file led_controller.c
 * @brief LED Controller Implementation
 */

#include "led_controller.h"
#include "led_strip.h"
#include "led_effects.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

static const char *TAG = "led_controller";

// LED strip handle
static led_strip_handle_t led_strip = NULL;

// Color definitions matching config.h led_color_t enum
static const struct {
    uint8_t r;
    uint8_t g;
    uint8_t b;
} LED_COLORS[] = {
    {255, 255, 255},  // LED_COLOR_WHITE
    {255, 200, 0},    // LED_COLOR_YELLOW
    {0, 100, 255},    // LED_COLOR_BLUE
    {0, 255, 200},    // LED_COLOR_CYAN
    {200, 0, 255},    // LED_COLOR_PURPLE
    {255, 0, 0},      // LED_COLOR_RED
    {0, 255, 0},      // LED_COLOR_GREEN
};

esp_err_t led_controller_init(void)
{
    ESP_LOGI(TAG, "Initializing LED controller (GPIO%d, %d LEDs)", LED_GPIO, NUM_LEDS);

    // LED strip configuration using RMT driver
    led_strip_config_t strip_config = {
        .strip_gpio_num = LED_GPIO,
        .max_leds = NUM_LEDS,
        .led_pixel_format = LED_PIXEL_FORMAT_GRB,
        .led_model = LED_MODEL_WS2812,
        .flags.invert_out = false,
    };

    // RMT backend configuration
    led_strip_rmt_config_t rmt_config = {
        .clk_src = RMT_CLK_SRC_DEFAULT,
        .resolution_hz = 10 * 1000 * 1000, // 10 MHz
        .flags.with_dma = false,
    };

    // Create LED strip object
    esp_err_t ret = led_strip_new_rmt_device(&strip_config, &rmt_config, &led_strip);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to create LED strip: %s", esp_err_to_name(ret));
        return ret;
    }

    // Clear all LEDs initially
    led_clear();

    ESP_LOGI(TAG, "LED controller initialized successfully");
    return ESP_OK;
}

esp_err_t led_set_all(uint8_t r, uint8_t g, uint8_t b)
{
    if (led_strip == NULL) {
        ESP_LOGE(TAG, "LED strip not initialized");
        return ESP_ERR_INVALID_STATE;
    }

    // Set all LEDs to the same color
    for (int i = 0; i < NUM_LEDS; i++) {
        esp_err_t ret = led_strip_set_pixel(led_strip, i, r, g, b);
        if (ret != ESP_OK) {
            ESP_LOGE(TAG, "Failed to set LED %d: %s", i, esp_err_to_name(ret));
            return ret;
        }
    }

    // Refresh to apply changes
    esp_err_t ret = led_strip_refresh(led_strip);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to refresh LED strip: %s", esp_err_to_name(ret));
    }

    return ret;
}

esp_err_t led_flash(led_color_t color, uint32_t duration_ms)
{
    if (led_strip == NULL) {
        ESP_LOGE(TAG, "LED strip not initialized");
        return ESP_ERR_INVALID_STATE;
    }

    if (color >= sizeof(LED_COLORS) / sizeof(LED_COLORS[0])) {
        ESP_LOGE(TAG, "Invalid color index: %d", color);
        return ESP_ERR_INVALID_ARG;
    }

    ESP_LOGI(TAG, "Flashing color %d for %lu ms", color, duration_ms);

    // Set LEDs to specified color
    esp_err_t ret = led_set_all(LED_COLORS[color].r,
                                 LED_COLORS[color].g,
                                 LED_COLORS[color].b);
    if (ret != ESP_OK) {
        return ret;
    }

    // Wait for duration
    vTaskDelay(pdMS_TO_TICKS(duration_ms));

    // Clear LEDs
    return led_clear();
}

esp_err_t led_clear(void)
{
    if (led_strip == NULL) {
        ESP_LOGE(TAG, "LED strip not initialized");
        return ESP_ERR_INVALID_STATE;
    }

    // Clear all LEDs
    esp_err_t ret = led_strip_clear(led_strip);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to clear LED strip: %s", esp_err_to_name(ret));
    }

    return ret;
}

void led_rainbow_task(void *pvParameters)
{
    ESP_LOGI(TAG, "Starting circle animation task (single white LED at 50%%)");

    uint8_t position = 0;
    const uint8_t white_brightness = 128;  // 50% brightness

    while (1) {
        if (led_strip != NULL) {
            // Clear all LEDs
            for (int i = 0; i < NUM_LEDS; i++) {
                led_strip_set_pixel(led_strip, i, 0, 0, 0);
            }

            // Set single white LED at current position
            led_strip_set_pixel(led_strip, position, white_brightness, white_brightness, white_brightness);

            // Refresh strip
            led_strip_refresh(led_strip);

            // Move to next position
            position = (position + 1) % NUM_LEDS;
        }

        // Update every 100ms for smooth animation
        vTaskDelay(pdMS_TO_TICKS(100));
    }
}

esp_err_t led_start_rainbow_task(uint32_t priority, uint32_t stack_size)
{
    static TaskHandle_t rainbow_task_handle = NULL;

    if (rainbow_task_handle != NULL) {
        ESP_LOGW(TAG, "Rainbow task already running");
        return ESP_OK;
    }

    BaseType_t task_created = xTaskCreate(
        led_rainbow_task,
        "led_rainbow",
        stack_size,
        NULL,
        priority,
        &rainbow_task_handle
    );

    if (task_created != pdPASS) {
        ESP_LOGE(TAG, "Failed to create rainbow task");
        return ESP_FAIL;
    }

    ESP_LOGI(TAG, "Rainbow task started");
    return ESP_OK;
}
