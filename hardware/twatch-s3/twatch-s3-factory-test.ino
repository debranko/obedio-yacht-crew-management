/**
 * T-Watch S3 Factory Test - TFT Display Test
 *
 * Tests:
 * - TFT display with backlight
 * - Color bars
 * - Text rendering
 * - Animated circle
 *
 * Hardware: LilyGO T-Watch S3
 * Display: ST7789 240x240 TFT
 */

#include <Arduino.h>
#include <Arduino_GFX_Library.h>

// T-Watch S3 TFT pins
#define TFT_CS   16
#define TFT_DC   21
#define TFT_RST  22
#define TFT_BL   23   // Backlight
#define TFT_SCK  18
#define TFT_MOSI 17

// Initialize display
Arduino_DataBus *bus = new Arduino_ESP32SPI(TFT_DC, TFT_CS, TFT_SCK, TFT_MOSI, -1);
Arduino_GFX *gfx = new Arduino_ST7789(bus, TFT_RST, 0 /* rotation */, true /* IPS */, 240, 240, 0, 0);

void setup() {
  Serial.begin(115200);
  Serial.println("\n\n=== T-Watch S3 Factory Test ===");

  // Turn on backlight
  pinMode(TFT_BL, OUTPUT);
  digitalWrite(TFT_BL, HIGH);
  delay(100);

  // Initialize display
  Serial.println("Initializing TFT display...");
  if (!gfx->begin()) {
    Serial.println("ERROR: TFT initialization failed!");
    while (1) {
      delay(1000);
    }
  }

  Serial.println("✓ TFT initialized successfully");

  // Clear screen to black
  gfx->fillScreen(BLACK);
  delay(500);

  // Display title
  gfx->setTextColor(WHITE);
  gfx->setTextSize(2);
  gfx->setCursor(20, 20);
  gfx->println("T-Watch S3");

  gfx->setTextSize(1);
  gfx->setCursor(20, 50);
  gfx->setTextColor(GREEN);
  gfx->println("Factory Test OK");

  delay(1000);

  // Draw color bars
  Serial.println("Drawing color test pattern...");
  uint16_t colors[] = {
    gfx->color565(255, 0, 0),    // Red
    gfx->color565(0, 255, 0),    // Green
    gfx->color565(0, 0, 255),    // Blue
    gfx->color565(255, 255, 0),  // Yellow
    gfx->color565(0, 255, 255),  // Cyan
    gfx->color565(255, 0, 255)   // Magenta
  };

  for (int i = 0; i < 6; i++) {
    gfx->fillRect(0, 80 + i * 25, 240, 25, colors[i]);
  }

  delay(2000);

  // Clear for animation
  gfx->fillScreen(BLACK);
  gfx->setCursor(40, 10);
  gfx->setTextColor(WHITE);
  gfx->setTextSize(1);
  gfx->println("Display Working!");

  Serial.println("✓ All tests passed");
  Serial.println("Starting animation loop...");
}

void loop() {
  static uint16_t t = 0;

  // Animated color-changing circle
  uint16_t color = gfx->color565(
    (sin(t * 0.05) + 1) * 127,      // Red
    (sin((t + 120) * 0.05) + 1) * 127,  // Green
    (sin((t + 240) * 0.05) + 1) * 127   // Blue
  );

  gfx->fillCircle(120, 140, 50, color);

  // Show frame counter
  gfx->fillRect(80, 200, 80, 20, BLACK);
  gfx->setCursor(85, 205);
  gfx->setTextColor(WHITE);
  gfx->setTextSize(1);
  gfx->print("Frame: ");
  gfx->print(t);

  t++;
  delay(20);

  // Serial heartbeat every 100 frames
  if (t % 100 == 0) {
    Serial.print(".");
    if (t % 1000 == 0) {
      Serial.println(" OK");
    }
  }
}
