/**
 * I2C Scanner for ESP32-S3 Custom PCB
 * Scans I2C bus and reports all connected devices
 */

#include <Wire.h>

#define I2C_SDA_PIN  3
#define I2C_SCL_PIN  2

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n==================================");
  Serial.println("I2C Scanner for Obedio ESP32-S3");
  Serial.println("==================================\n");

  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  Wire.setClock(100000);  // 100kHz

  Serial.println("Scanning I2C bus...\n");

  int deviceCount = 0;
  for (byte addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    byte error = Wire.endTransmission();

    if (error == 0) {
      Serial.printf("✅ Device found at 0x%02X", addr);

      // Identify common devices
      if (addr == 0x20) Serial.print("  → MCP23017 (GPIO Expander)");
      if (addr == 0x19) Serial.print("  → LIS3DH (Accelerometer)");
      if (addr == 0x18) Serial.print("  → MCP9808 (Temperature)");

      Serial.println();
      deviceCount++;
    }
  }

  Serial.printf("\n📊 Total devices found: %d\n", deviceCount);

  if (deviceCount == 0) {
    Serial.println("\n❌ No I2C devices found!");
    Serial.println("⚠️  Check:");
    Serial.println("   - SDA/SCL connections (GPIO3/GPIO2)");
    Serial.println("   - Pull-up resistors (4.7kΩ)");
    Serial.println("   - Power supply to I2C devices");
  }

  Serial.println("\n==================================\n");
}

void loop() {
  delay(5000);

  // Rescan every 5 seconds
  Serial.println("Rescanning...");
  setup();
}
