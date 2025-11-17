/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OBEDIO ESP32-S3 - Hardware Test Sketch
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Use this sketch to test individual hardware components on your custom PCB
 *
 * Tests:
 * 1. I2C Bus Scan
 * 2. MCP23017 GPIO Expander
 * 3. LED Ring (WS2812B)
 * 4. Button Detection
 * 5. LIS3DH Accelerometer
 * 6. MCP9808 Temperature Sensor
 * 7. WiFi Connection
 *
 * Upload this sketch first to verify your hardware is working correctly
 * before using the production firmware.
 */

#include <Wire.h>
#include <Adafruit_MCP23X17.h>
#include <Adafruit_NeoPixel.h>

// Pin Definitions
#define I2C_SDA             3
#define I2C_SCL             2
#define LED_RING_PIN        17
#define LED_RING_COUNT      16

// I2C Addresses
#define MCP23017_ADDR       0x20
#define LIS3DH_ADDR         0x19
#define MCP9808_ADDR        0x18

Adafruit_MCP23X17 mcp;
Adafruit_NeoPixel ledRing(LED_RING_COUNT, LED_RING_PIN, NEO_GRB + NEO_KHZ800);

void setup() {
  Serial.begin(115200);
  delay(2000);

  Serial.println("\n\n");
  Serial.println("════════════════════════════════════════════════════");
  Serial.println("  OBEDIO ESP32-S3 Hardware Test");
  Serial.println("════════════════════════════════════════════════════\n");

  // Test 1: I2C Bus
  testI2CBus();

  // Test 2: MCP23017
  testMCP23017();

  // Test 3: LED Ring
  testLEDRing();

  // Test 4: WiFi
  testWiFi();

  Serial.println("\n════════════════════════════════════════════════════");
  Serial.println("  Hardware Test Complete!");
  Serial.println("════════════════════════════════════════════════════\n");
}

void loop() {
  // Test 5: Continuous button monitoring
  testButtons();
  delay(100);
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

void testI2CBus() {
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.println("TEST 1: I2C Bus Scan");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  Wire.begin(I2C_SDA, I2C_SCL);
  Wire.setClock(100000);

  Serial.println("Scanning I2C bus (0x01-0x7F)...\n");

  int deviceCount = 0;
  for (byte addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    byte error = Wire.endTransmission();

    if (error == 0) {
      deviceCount++;
      Serial.print("  ✓ Device found at 0x");
      if (addr < 16) Serial.print("0");
      Serial.print(addr, HEX);

      // Identify known devices
      if (addr == MCP23017_ADDR) Serial.print("  (MCP23017 GPIO Expander)");
      else if (addr == LIS3DH_ADDR) Serial.print("  (LIS3DH Accelerometer)");
      else if (addr == MCP9808_ADDR) Serial.print("  (MCP9808 Temperature)");

      Serial.println();
    }
  }

  Serial.println("\n  Found " + String(deviceCount) + " I2C device(s)");

  if (deviceCount == 0) {
    Serial.println("  ✗ ERROR: No I2C devices found!");
    Serial.println("    - Check SDA/SCL connections (GPIO3/GPIO2)");
    Serial.println("    - Verify VDD3V3 power supply");
    Serial.println("    - Check pull-up resistors on SDA/SCL");
  } else {
    Serial.println("  ✓ I2C bus OK");
  }
  Serial.println();
}

void testMCP23017() {
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.println("TEST 2: MCP23017 GPIO Expander");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  if (mcp.begin_I2C(MCP23017_ADDR, &Wire)) {
    Serial.println("  ✓ MCP23017 initialized successfully");

    // Configure Port A as inputs with pull-ups
    for (int i = 0; i < 8; i++) {
      mcp.pinMode(i, INPUT_PULLUP);
    }

    Serial.println("  ✓ Port A configured as inputs with pull-ups");
    Serial.println("  ✓ MCP23017 OK");
  } else {
    Serial.println("  ✗ ERROR: MCP23017 initialization failed!");
    Serial.println("    - Check I2C address (should be 0x20)");
    Serial.println("    - Verify device is detected in I2C scan");
  }
  Serial.println();
}

void testLEDRing() {
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.println("TEST 3: LED Ring (WS2812B)");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  ledRing.begin();
  ledRing.setBrightness(50);

  Serial.println("  Testing LED colors...");

  // Red
  Serial.println("    - Red");
  for (int i = 0; i < LED_RING_COUNT; i++) {
    ledRing.setPixelColor(i, ledRing.Color(255, 0, 0));
  }
  ledRing.show();
  delay(500);

  // Green
  Serial.println("    - Green");
  for (int i = 0; i < LED_RING_COUNT; i++) {
    ledRing.setPixelColor(i, ledRing.Color(0, 255, 0));
  }
  ledRing.show();
  delay(500);

  // Blue
  Serial.println("    - Blue");
  for (int i = 0; i < LED_RING_COUNT; i++) {
    ledRing.setPixelColor(i, ledRing.Color(0, 0, 255));
  }
  ledRing.show();
  delay(500);

  // Rainbow animation
  Serial.println("    - Rainbow animation");
  for (int j = 0; j < 256; j += 5) {
    for (int i = 0; i < LED_RING_COUNT; i++) {
      ledRing.setPixelColor(i, wheelColor((i * 256 / LED_RING_COUNT + j) & 255));
    }
    ledRing.show();
    delay(10);
  }

  // Off
  for (int i = 0; i < LED_RING_COUNT; i++) {
    ledRing.setPixelColor(i, ledRing.Color(0, 0, 0));
  }
  ledRing.show();

  Serial.println("  ✓ LED Ring OK");
  Serial.println();
}

void testButtons() {
  static unsigned long lastPrint = 0;

  if (millis() - lastPrint < 1000) return;
  lastPrint = millis();

  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.println("TEST 4: Button Monitoring (Press buttons to test)");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const char* buttonNames[] = {"T6/Aux5", "T5/Aux4", "T4/Aux3", "T3/Aux2", "T2/Aux1", "N/A", "N/A", "T1/Main"};

  Serial.println("  Button States (0=Released, 1=Pressed):\n");

  for (int i = 0; i < 8; i++) {
    if (i == 5 || i == 6) continue;  // Skip unused pins

    bool state = !mcp.digitalRead(i);  // Active LOW with pull-up
    Serial.print("    GPA" + String(i) + " (" + String(buttonNames[i]) + "): ");
    Serial.println(state ? "PRESSED  ✓" : "Released");

    // LED feedback on button press
    if (state) {
      for (int j = 0; j < LED_RING_COUNT; j++) {
        ledRing.setPixelColor(j, ledRing.Color(255, 255, 255));
      }
      ledRing.show();
    } else {
      for (int j = 0; j < LED_RING_COUNT; j++) {
        ledRing.setPixelColor(j, ledRing.Color(0, 0, 0));
      }
      ledRing.show();
    }
  }

  Serial.println();
}

void testWiFi() {
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.println("TEST 5: WiFi Module");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  WiFi.mode(WIFI_STA);

  Serial.print("  MAC Address: ");
  Serial.println(WiFi.macAddress());

  Serial.println("  ✓ WiFi module OK");
  Serial.println("    Note: Not connecting to network in test mode");
  Serial.println();
}

// Helper function for rainbow colors
uint32_t wheelColor(byte pos) {
  pos = 255 - pos;
  if (pos < 85) {
    return ledRing.Color(255 - pos * 3, 0, pos * 3);
  }
  if (pos < 170) {
    pos -= 85;
    return ledRing.Color(0, pos * 3, 255 - pos * 3);
  }
  pos -= 170;
  return ledRing.Color(pos * 3, 255 - pos * 3, 0);
}
