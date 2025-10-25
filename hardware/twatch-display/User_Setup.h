/**
 * TFT_eSPI User Setup for LilyGO T-Watch S3
 *
 * Display: ST7789V 240x240 TFT
 * ESP32-S3 Pins
 */

// Driver
#define ST7789_DRIVER

// Display size
#define TFT_WIDTH  240
#define TFT_HEIGHT 240

// ESP32-S3 Pin Configuration
#define TFT_MOSI 11  // SDA
#define TFT_SCLK 12  // SCL
#define TFT_CS   6   // Chip select
#define TFT_DC   7   // Data/Command
#define TFT_RST  8   // Reset
#define TFT_BL   38  // Backlight

// Fonts
#define LOAD_GLCD   // Font 1. Original Adafruit 8 pixel font needs ~1820 bytes in FLASH
#define LOAD_FONT2  // Font 2. Small 16 pixel high font, needs ~3534 bytes in FLASH
#define LOAD_FONT4  // Font 4. Medium 26 pixel high font, needs ~5848 bytes in FLASH
#define LOAD_FONT6  // Font 6. Large 48 pixel font, needs ~2666 bytes in FLASH
#define LOAD_FONT7  // Font 7. 7 segment 48 pixel font, needs ~2438 bytes in FLASH
#define LOAD_FONT8  // Font 8. Large 75 pixel font needs ~3256 bytes in FLASH

#define LOAD_GFXFF  // FreeFonts. Include access to the 48 Fonts from Adafruit_GFX

#define SMOOTH_FONT

// SPI frequency
#define SPI_FREQUENCY  40000000  // 40 MHz
#define SPI_READ_FREQUENCY  20000000  // 20 MHz
