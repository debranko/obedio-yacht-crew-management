#ifndef LED_EFFECTS_H
#define LED_EFFECTS_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief Convert HSV color to RGB
 *
 * @param h Hue (0-359)
 * @param s Saturation (0-255)
 * @param v Value/Brightness (0-255)
 * @param r Pointer to red component output (0-255)
 * @param g Pointer to green component output (0-255)
 * @param b Pointer to blue component output (0-255)
 */
void hsv_to_rgb(uint16_t h, uint8_t s, uint8_t v, uint8_t *r, uint8_t *g, uint8_t *b);

/**
 * @brief Convert RGB to GRB format for WS2812B LEDs
 *
 * WS2812B LEDs expect color data in GRB order, not RGB
 *
 * @param r Red component (0-255)
 * @param g Green component (0-255)
 * @param b Blue component (0-255)
 * @return uint32_t 32-bit color value in GRB format (0x00GGRRBB)
 */
uint32_t rgb_to_grb(uint8_t r, uint8_t g, uint8_t b);

/**
 * @brief Generate a rainbow color based on position
 *
 * @param position Position in the rainbow (0-255)
 * @return uint32_t 32-bit color value in GRB format
 */
uint32_t rainbow_color(uint8_t position);

/**
 * @brief Blend two RGB colors
 *
 * @param r1 Red component of color 1
 * @param g1 Green component of color 1
 * @param b1 Blue component of color 1
 * @param r2 Red component of color 2
 * @param g2 Green component of color 2
 * @param b2 Blue component of color 2
 * @param ratio Blend ratio (0-255, 0=color1, 255=color2)
 * @return uint32_t Blended color in GRB format
 */
uint32_t blend_colors(uint8_t r1, uint8_t g1, uint8_t b1,
                     uint8_t r2, uint8_t g2, uint8_t b2,
                     uint8_t ratio);

/**
 * @brief Apply gamma correction to a color component
 *
 * @param value Input color component (0-255)
 * @return uint8_t Gamma-corrected value (0-255)
 */
uint8_t gamma_correct(uint8_t value);

/**
 * @brief Convert GRB value back to RGB components
 *
 * @param grb GRB format color value
 * @param r Pointer to red component output
 * @param g Pointer to green component output
 * @param b Pointer to blue component output
 */
void grb_to_rgb(uint32_t grb, uint8_t *r, uint8_t *g, uint8_t *b);

#ifdef __cplusplus
}
#endif

#endif // LED_EFFECTS_H
