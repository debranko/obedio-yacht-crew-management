/**
 * MINIMAL T-Watch Test
 */

#include <TTGO.h>

TTGOClass *watch;

void setup() {
  Serial.begin(115200);
  Serial.println("Starting...");

  watch = TTGOClass::getWatch();
  watch->begin();
  watch->openBL();

  watch->tft->fillScreen(TFT_BLACK);
  watch->tft->setTextSize(3);
  watch->tft->setTextColor(TFT_WHITE);
  watch->tft->setCursor(50, 100);
  watch->tft->println("OBEDIO");

  Serial.println("Done!");
}

void loop() {
  delay(1000);
}
