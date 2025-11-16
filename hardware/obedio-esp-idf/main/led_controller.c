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
    ESP_LOGI(TAG, "Starting single RED LED animation - CLOCKWISE rotation (OTA verification)");

    uint8_t position = 0;

    // Single RED LED at 75% brightness
    const uint8_t red_r = 192;
    const uint8_t red_g = 0;
    const uint8_t red_b = 0;

    while (1) {
        if (led_strip != NULL) {
            // Clear all LEDs
            for (int i = 0; i < NUM_LEDS; i++) {
                led_strip_set_pixel(led_strip, i, 0, 0, 0);
            }

            // Set single RED LED at current position
            led_strip_set_pixel(led_strip, position, red_r, red_g, red_b);

            // Refresh strip
            led_strip_refresh(led_strip);

            // Move to next position CLOCKWISE (for OTA verification)
            position = (position == 0) ? (NUM_LEDS - 1) : (position - 1);
        }

        // Update every 80ms
        vTaskDelay(pdMS_TO_TICKS(80));
    }
}

// Static task handle accessible by both start and stop functions
static TaskHandle_t rainbow_task_handle = NULL;

esp_err_t led_start_rainbow_task(uint32_t priority, uint32_t stack_size)
{
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

esp_err_t led_stop_rainbow_task(void)
{
    if (rainbow_task_handle == NULL) {
        ESP_LOGW(TAG, "Rainbow task not running");
        return ESP_OK;
    }

    ESP_LOGI(TAG, "Stopping rainbow task for OTA");
    vTaskDelete(rainbow_task_handle);
    rainbow_task_handle = NULL;

    // Clear all LEDs before stopping
    led_clear();

    ESP_LOGI(TAG, "Rainbow task stopped");
    return ESP_OK;
}

esp_err_t led_update_static(uint8_t r, uint8_t g, uint8_t b, uint8_t brightness)
{
    if (led_strip == NULL) {
        ESP_LOGE(TAG, "LED strip not initialized");
        return ESP_ERR_INVALID_STATE;
    }

    // Apply brightness scaling: actual_value = (color_value * brightness) / 255
    uint8_t scaled_r = (r * brightness) / 255;
    uint8_t scaled_g = (g * brightness) / 255;
    uint8_t scaled_b = (b * brightness) / 255;

    ESP_LOGI(TAG, "Updating static LEDs: RGB(%d,%d,%d) brightness=%d -> scaled RGB(%d,%d,%d)",
             r, g, b, brightness, scaled_r, scaled_g, scaled_b);

    // Set all LEDs to the scaled color
    return led_set_all(scaled_r, scaled_g, scaled_b);
}
