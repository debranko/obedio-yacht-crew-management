/**
 * T-Watch S3 Display Test - MINIMAL
 *
 * Tests ONLY display - no WiFi, MQTT, or touch
 */

#include <TFT_eSPI.h>

TFT_eSPI tft = TFT_eSPI();

#define BACKLIGHT_PIN 38

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n===========================================");
  Serial.println("T-Watch Display Test");
  Serial.println("===========================================\n");

  // Turn on backlight
  Serial.println("💡 Turning on backlight...");
  pinMode(BACKLIGHT_PIN, OUTPUT);
  digitalWrite(BACKLIGHT_PIN, HIGH);
  delay(100);
  Serial.println("✅ Backlight ON!");

  // Initialize display
  Serial.println("📺 Initializing display...");
  tft.init();
  Serial.println("✅ TFT init complete!");

  tft.setRotation(0);
  Serial.println("✅ Rotation set!");

  tft.fillScreen(TFT_BLACK);
  Serial.println("✅ Screen cleared to BLACK!");
  delay(1000);

  // Fill screen RED
  Serial.println("🔴 Filling screen RED...");
  tft.fillScreen(TFT_RED);
  delay(1000);

  // Fill screen GREEN
  Serial.println("🟢 Filling screen GREEN...");
  tft.fillScreen(TFT_GREEN);
  delay(1000);

  // Fill screen BLUE
  Serial.println("🔵 Filling screen BLUE...");
  tft.fillScreen(TFT_BLUE);
  delay(1000);

  // Black background
  tft.fillScreen(TFT_BLACK);

  // Write text
  Serial.println("✍️ Writing text...");
  tft.setTextSize(3);
  tft.setTextColor(TFT_WHITE);
  tft.setCursor(40, 80);
  tft.println("OBEDIO");

  tft.setTextSize(2);
  tft.setCursor(50, 130);
  tft.println("T-Watch");

  Serial.println("✅ TEST COMPLETE!");
  Serial.println("\nYou should see:");
  Serial.println("- RED screen (1 sec)");
  Serial.println("- GREEN screen (1 sec)");
  Serial.println("- BLUE screen (1 sec)");
  Serial.println("- BLACK screen with white text:");
  Serial.println("  OBEDIO");
  Serial.println("  T-Watch");
}

void loop() {
  // Do nothing
  delay(1000);
}
