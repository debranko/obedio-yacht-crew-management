/**
 * OBEDIO - LilyGO T3-S3 Button Firmware with OLED
 *
 * Hardware: LilyGO T3-S3 (ESP32-S3 with SSD1306 OLED 128x64)
 * Purpose: Guest call button with visual feedback
 *
 * Features:
 * - WiFi + MQTT connection to OBEDIO backend
 * - SSD1306 OLED display (128x64)
 * - Button press detection
 * - Visual feedback on OLED
 * - Battery monitoring
 * - Auto device registration
 *
 * MQTT Topics:
 * - Publish: obedio/button/{deviceId}/press
 * - Subscribe: obedio/device/{deviceId}/command
 */

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ==================== WIFI & MQTT CONFIG ====================
const char* WIFI_SSID = "Blagojevic";
const char* WIFI_PASSWORD = "Lozinka12!";
const char* MQTT_BROKER = "192.168.5.152";
const int MQTT_PORT = 1883;

// ==================== DEVICE INFO ====================
String DEVICE_ID = "";  // Auto-generated from MAC
const char* FIRMWARE_VERSION = "v1.0-t3s3-oled";
const char* HARDWARE_VERSION = "LilyGO T3-S3";

// ==================== OLED CONFIG ====================
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define SCREEN_ADDRESS 0x3C

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// ==================== PINS ====================
#define BUTTON_PIN 0    // Boot button on T3-S3
#define LED_PIN 2       // Built-in LED

// ==================== MQTT ====================
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

// ==================== STATE ====================
unsigned long lastPress = 0;
int pressCount = 0;
bool buttonPressed = false;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\n=== OBEDIO T3-S3 Button Starting ===");

  // Initialize pins
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // Initialize OLED
  Wire.begin();
  if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println("ERROR: OLED initialization failed!");
    while (1) delay(1000);
  }

  Serial.println("✓ OLED initialized");

  // Show startup screen
  display.clearDisplay();
  display.setTextSize(2);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("OBEDIO");
  display.setTextSize(1);
  display.setCursor(0, 25);
  display.println("T3-S3 Button");
  display.setCursor(0, 40);
  display.print("FW: ");
  display.println(FIRMWARE_VERSION);
  display.display();
  delay(2000);

  // Generate Device ID from MAC
  uint8_t mac[6];
  esp_read_mac(mac, ESP_MAC_WIFI_STA);
  DEVICE_ID = "T3S3-";
  for (int i = 0; i < 6; i++) {
    char buf[3];
    sprintf(buf, "%02X", mac[i]);
    DEVICE_ID += buf;
  }

  Serial.print("Device ID: ");
  Serial.println(DEVICE_ID);

  // Connect WiFi
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("Connecting WiFi...");
  display.display();

  connectWiFi();

  // Connect MQTT
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  connectMQTT();

  // Send device registration
  registerDevice();

  // Show ready screen
  display.clearDisplay();
  display.setTextSize(2);
  display.setCursor(10, 20);
  display.println("READY");
  display.setTextSize(1);
  display.setCursor(0, 50);
  display.println("Press to call");
  display.display();

  Serial.println("✓ System ready");
}

void loop() {
  // Maintain MQTT connection
  if (!mqttClient.connected()) {
    connectMQTT();
  }
  mqttClient.loop();

  // Check button
  if (digitalRead(BUTTON_PIN) == LOW && !buttonPressed) {
    buttonPressed = true;
    handleButtonPress();
  } else if (digitalRead(BUTTON_PIN) == HIGH) {
    buttonPressed = false;
  }

  delay(50);
}

void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    display.print(".");
    display.display();
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi connected");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());

    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("WiFi OK");
    display.print("IP: ");
    display.println(WiFi.localIP());
    display.display();
    delay(1000);
  } else {
    Serial.println("\n✗ WiFi connection failed!");
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("WiFi FAILED");
    display.display();
  }
}

void connectMQTT() {
  Serial.print("Connecting to MQTT...");

  int attempts = 0;
  while (!mqttClient.connected() && attempts < 5) {
    String clientId = "obedio-button-" + DEVICE_ID;

    if (mqttClient.connect(clientId.c_str())) {
      Serial.println(" connected!");

      // Subscribe to command topic
      String cmdTopic = "obedio/device/" + DEVICE_ID + "/command";
      mqttClient.subscribe(cmdTopic.c_str());
      Serial.print("Subscribed to: ");
      Serial.println(cmdTopic);

      return;
    }

    Serial.print(".");
    delay(1000);
    attempts++;
  }

  Serial.println(" failed!");
}

void registerDevice() {
  Serial.println("Registering device...");

  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["type"] = "smart_button";
  doc["name"] = "T3-S3 Button " + DEVICE_ID.substring(DEVICE_ID.length() - 4);
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["hardwareVersion"] = HARDWARE_VERSION;
  doc["rssi"] = WiFi.RSSI();

  char payload[256];
  serializeJson(doc, payload);

  mqttClient.publish("obedio/device/register", payload);
  Serial.println("✓ Registration sent");
}

void handleButtonPress() {
  Serial.println("BUTTON PRESSED!");

  // Visual feedback
  digitalWrite(LED_PIN, HIGH);
  display.clearDisplay();
  display.setTextSize(3);
  display.setCursor(10, 20);
  display.println("SENT!");
  display.display();

  pressCount++;

  // Publish button press
  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["button"] = "main";
  doc["pressType"] = "single";
  doc["battery"] = 100;  // TODO: Add real battery monitoring
  doc["rssi"] = WiFi.RSSI();
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["timestamp"] = millis();
  doc["sequenceNumber"] = pressCount;

  char payload[256];
  serializeJson(doc, payload);

  String topic = "obedio/button/" + DEVICE_ID + "/press";
  mqttClient.publish(topic.c_str(), payload);

  Serial.print("Published to: ");
  Serial.println(topic);
  Serial.print("Payload: ");
  Serial.println(payload);

  // Keep feedback for 2 seconds
  delay(2000);

  digitalWrite(LED_PIN, LOW);

  // Back to ready screen
  display.clearDisplay();
  display.setTextSize(2);
  display.setCursor(10, 20);
  display.println("READY");
  display.setTextSize(1);
  display.setCursor(0, 50);
  display.println("Press to call");
  display.display();
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("MQTT message on topic: ");
  Serial.println(topic);

  // Parse JSON command
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, payload, length);

  if (error) {
    Serial.print("JSON parse error: ");
    Serial.println(error.c_str());
    return;
  }

  const char* command = doc["command"];

  if (strcmp(command, "ack") == 0) {
    // Acknowledgment received
    display.clearDisplay();
    display.setTextSize(2);
    display.setCursor(20, 20);
    display.println("ACK!");
    display.display();
    delay(1000);
  }
}
