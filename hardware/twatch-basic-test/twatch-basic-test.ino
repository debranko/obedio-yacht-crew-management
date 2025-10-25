/**
 * BASIC TEST - No libraries!
 */

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("===================");
  Serial.println("T-Watch Basic Test");
  Serial.println("===================");
  Serial.println("Arduino + ESP32 works!");
}

void loop() {
  Serial.println("Running...");
  delay(2000);
}
