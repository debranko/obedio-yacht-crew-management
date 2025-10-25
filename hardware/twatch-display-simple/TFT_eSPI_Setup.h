/**
 * TFT_eSPI User Setup for LilyGO T-Watch S3
 *
 * INSTALLATION INSTRUCTIONS:
 *
 * 1. Find your TFT_eSPI library folder:
 *    c:\Users\debra\OneDrive\Documents\Arduino\libraries\TFT_eSPI\
 *
 * 2. Open the file: User_Setup_Select.h
 *
 * 3. Comment out the default setup line (add // at beginning):
 *    // #include <User_Setup.h>
 *
 * 4. Add this line:
 *    #include <User_Setups/Setup206_LilyGo_T_Watch_S3.h>
 *
 * OR create Setup206_LilyGo_T_Watch_S3.h in User_Setups folder with content below:
 */

// ==========================================
// COPY THIS TO: TFT_eSPI/User_Setups/Setup206_LilyGo_T_Watch_S3.h
// ==========================================

#define USER_SETUP_ID 206

// Driver
#define ST7789_DRIVER      // T-Watch S3 uses ST7789V display

// Display size
#define TFT_WIDTH  240
#define TFT_HEIGHT 240

// Pin definitions for T-Watch S3
#define TFT_MOSI 13
#define TFT_SCLK 14
#define TFT_CS   15
#define TFT_DC   27
#define TFT_RST  26
#define TFT_BL   45   // Backlight

// SPI frequency
#define SPI_FREQUENCY  40000000
#define SPI_READ_FREQUENCY  20000000
#define SPI_TOUCH_FREQUENCY  2500000

// Color inversion
#define TFT_INVERSION_ON

// Fonts to load
#define LOAD_GLCD   // Font 1. Original Adafruit 8 pixel font needs ~1820 bytes in FLASH
#define LOAD_FONT2  // Font 2. Small 16 pixel high font, needs ~3534 bytes in FLASH, 96 characters
#define LOAD_FONT4  // Font 4. Medium 26 pixel high font, needs ~5848 bytes in FLASH, 96 characters
#define LOAD_FONT6  // Font 6. Large 48 pixel font, needs ~2666 bytes in FLASH, only characters 1234567890:-.apm
#define LOAD_FONT7  // Font 7. 7 segment 48 pixel font, needs ~2438 bytes in FLASH, only characters 1234567890:-.
#define LOAD_FONT8  // Font 8. Large 75 pixel font needs ~3256 bytes in FLASH, only characters 1234567890:-.
#define LOAD_GFXFF  // FreeFonts. Include access to the 48 Adafruit_GFX free fonts FF1 to FF48 and custom fonts

// Smooth fonts
#define SMOOTH_FONT
