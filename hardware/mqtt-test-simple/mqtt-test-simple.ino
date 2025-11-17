/**
 * MQTT TEST - ULTRA SIMPLE
 * Just WiFi + MQTT + Serial
 * NO I2C, NO LEDS, NO BUTTONS, NO AUDIO
 */

#include <WiFi.h>
#include <PubSubClient.h>

// WiFi
const char* WIFI_SSID = "Obedio";
const char* WIFI_PASSWORD = "BrankomeinBruder:)";

// MQTT
const char* MQTT_HOST = "10.10.0.207";
const uint16_t MQTT_PORT = 1883;

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

String deviceId = "TEST-SIMPLE-";

void setup() {
  Serial.begin(115200);
  delay(2000);

  Serial.println("\n\n\n========================================");
  Serial.println("MQTT TEST - SIMPLE");
  Serial.println("========================================\n");

  // WiFi
  Serial.printf("Connecting to WiFi: %s\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n✅ WiFi connected! IP: %s\n", WiFi.localIP().toString().c_str());

    // Device ID from MAC
    uint8_t mac[6];
    WiFi.macAddress(mac);
    deviceId = "TEST-SIMPLE-";
    for (int i = 0; i < 6; i++) {
      char hex[3];
      sprintf(hex, "%02X", mac[i]);
      deviceId += hex;
    }
    Serial.printf("Device ID: %s\n\n", deviceId.c_str());
  } else {
    Serial.println("\n❌ WiFi FAILED!");
    while (true) delay(1000);
  }

  // MQTT
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  Serial.printf("Connecting to MQTT: %s:%d\n", MQTT_HOST, MQTT_PORT);

  if (mqttClient.connect(deviceId.c_str())) {
    Serial.println("✅ MQTT connected!");

    // Publish test message
    String topic = "obedio/test/simple";
    String payload = "{\"deviceId\":\"" + deviceId + "\",\"message\":\"Hello from simple test!\"}";

    if (mqttClient.publish(topic.c_str(), payload.c_str())) {
      Serial.println("✅ MQTT message published!");
      Serial.printf("   Topic: %s\n", topic.c_str());
      Serial.printf("   Payload: %s\n\n", payload.c_str());
    } else {
      Serial.println("❌ MQTT publish FAILED!");
    }
  } else {
    Serial.printf("❌ MQTT connection FAILED! State: %d\n", mqttClient.state());
    while (true) delay(1000);
  }

  Serial.println("========================================");
  Serial.println("Setup complete! Check backend logs!");
  Serial.println("========================================\n");
}

void loop() {
  mqttClient.loop();

  static unsigned long lastPublish = 0;
  unsigned long now = millis();

  if (now - lastPublish >= 5000) {  // Every 5 seconds
    lastPublish = now;

    String topic = "obedio/test/simple";
    String payload = "{\"deviceId\":\"" + deviceId + "\",\"uptime\":" + String(now / 1000) + "}";

    Serial.printf("Publishing... uptime: %d seconds\n", now / 1000);

    if (mqttClient.publish(topic.c_str(), payload.c_str())) {
      Serial.println("✅ Published!");
    } else {
      Serial.println("❌ Publish failed!");
    }
  }

  delay(100);
}
