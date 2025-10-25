/**
 * T-Watch WiFi Test ONLY
 */

#include <WiFi.h>

const char* WIFI_SSID = "NOVA_1300";
const char* WIFI_PASSWORD = "need9963";

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n=== T-Watch WiFi Test ===\n");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting");

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n\n✅ WiFi Connected!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("MAC: ");
    Serial.println(WiFi.macAddress());
    Serial.print("Signal: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\n\n❌ WiFi Failed!");
  }
}

void loop() {
  delay(1000);
}
