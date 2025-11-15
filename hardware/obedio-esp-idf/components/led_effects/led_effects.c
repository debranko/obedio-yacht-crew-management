#include "led_effects.h"
#include <math.h>

// Gamma correction lookup table (gamma = 2.8)
static const uint8_t gamma_table[256] = {
    0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
    0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   1,   1,   1,   1,
    1,   1,   1,   1,   1,   1,   1,   1,   1,   2,   2,   2,   2,   2,   2,   2,
    2,   3,   3,   3,   3,   3,   3,   3,   4,   4,   4,   4,   4,   5,   5,   5,
    5,   6,   6,   6,   6,   7,   7,   7,   7,   8,   8,   8,   9,   9,   9,   10,
    10,  10,  11,  11,  11,  12,  12,  13,  13,  13,  14,  14,  15,  15,  16,  16,
    17,  17,  18,  18,  19,  19,  20,  20,  21,  21,  22,  22,  23,  24,  24,  25,
    25,  26,  27,  27,  28,  29,  29,  30,  31,  32,  32,  33,  34,  35,  35,  36,
    37,  38,  39,  39,  40,  41,  42,  43,  44,  45,  46,  47,  48,  49,  50,  50,
    51,  52,  54,  55,  56,  57,  58,  59,  60,  61,  62,  63,  64,  66,  67,  68,
    69,  70,  72,  73,  74,  75,  77,  78,  79,  81,  82,  83,  85,  86,  87,  89,
    90,  92,  93,  95,  96,  98,  99,  101, 102, 104, 105, 107, 109, 110, 112, 114,
    115, 117, 119, 120, 122, 124, 126, 127, 129, 131, 133, 135, 137, 138, 140, 142,
    144, 146, 148, 150, 152, 154, 156, 158, 160, 162, 164, 167, 169, 171, 173, 175,
    177, 180, 182, 184, 186, 189, 191, 193, 196, 198, 200, 203, 205, 208, 210, 213,
    215, 218, 220, 223, 225, 228, 231, 233, 236, 239, 241, 244, 247, 249, 252, 255
};

void hsv_to_rgb(uint16_t h, uint8_t s, uint8_t v, uint8_t *r, uint8_t *g, uint8_t *b)
{
    // Ensure hue is within range
    h = h % 360;

    if (s == 0) {
        // Achromatic (gray)
        *r = *g = *b = v;
        return;
    }

    uint8_t region = h / 60;
    uint8_t remainder = (h % 60) * 255 / 60;

    uint8_t p = (v * (255 - s)) / 255;
    uint8_t q = (v * (255 - ((s * remainder) / 255))) / 255;
    uint8_t t = (v * (255 - ((s * (255 - remainder)) / 255))) / 255;

    switch (region) {
        case 0:
            *r = v; *g = t; *b = p;
            break;
        case 1:
            *r = q; *g = v; *b = p;
            break;
        case 2:
            *r = p; *g = v; *b = t;
            break;
        case 3:
            *r = p; *g = q; *b = v;
            break;
        case 4:
            *r = t; *g = p; *b = v;
            break;
        default: // case 5:
            *r = v; *g = p; *b = q;
            break;
    }
}

uint32_t rgb_to_grb(uint8_t r, uint8_t g, uint8_t b)
{
    // WS2812B expects GRB format: [G7:G0][R7:R0][B7:B0]
    return ((uint32_t)g << 16) | ((uint32_t)r << 8) | b;
}

uint32_t rainbow_color(uint8_t position)
{
    uint8_t r, g, b;

    // Map position (0-255) to hue (0-359)
    uint16_t hue = (position * 360) / 256;

    // Full saturation and brightness
    hsv_to_rgb(hue, 255, 255, &r, &g, &b);

    return rgb_to_grb(r, g, b);
}

uint32_t blend_colors(uint8_t r1, uint8_t g1, uint8_t b1,
                     uint8_t r2, uint8_t g2, uint8_t b2,
                     uint8_t ratio)
{
    // Blend each component
    uint8_t r = ((uint16_t)r1 * (255 - ratio) + (uint16_t)r2 * ratio) / 255;
    uint8_t g = ((uint16_t)g1 * (255 - ratio) + (uint16_t)g2 * ratio) / 255;
    uint8_t b = ((uint16_t)b1 * (255 - ratio) + (uint16_t)b2 * ratio) / 255;

    return rgb_to_grb(r, g, b);
}

uint8_t gamma_correct(uint8_t value)
{
    return gamma_table[value];
}

void grb_to_rgb(uint32_t grb, uint8_t *r, uint8_t *g, uint8_t *b)
{
    *g = (grb >> 16) & 0xFF;
    *r = (grb >> 8) & 0xFF;
    *b = grb & 0xFF;
}
