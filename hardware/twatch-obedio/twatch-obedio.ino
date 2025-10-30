/**
 * OBEDIO - T-Watch S3 Firmware (No Display Version)
 *
 * Features:
 * - WiFi + MQTT connection
 * - Vibration alerts
 * - MQTT notifications
 * - Serial output (instead of display)
 * - Acknowledge via MQTT
 *
 * Hardware: LilyGO T-Watch S3
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* WIFI_SSID = "NOVA_1300";
const char* WIFI_PASSWORD = "need9963";

// MQTT Broker
const char* MQTT_BROKER = "192.168.5.152";
const int MQTT_PORT = 1883;

// Device Info
const char* DEVICE_TYPE = "watch";
const char* DEVICE_NAME = "T-Watch OBEDIO";
const char* FIRMWARE_VERSION = "v1.0-no-display";
const char* HARDWARE_VERSION = "LilyGO T-Watch S3";

// Hardware pins
#define VIBRATION_PIN 33  // Try GPIO 33 instead of 4
#define BUTTON_PIN 14     // Physical button for acknowledge (trying GPIO 14)

// MQTT Topics
const char* TOPIC_REGISTER = "obedio/device/register";
const char* TOPIC_HEARTBEAT = "obedio/device/heartbeat";
String TOPIC_NOTIFICATION; // Will be set to "obedio/watch/{deviceId}/notification"
String TOPIC_ACKNOWLEDGE;  // Will be set to "obedio/watch/{deviceId}/acknowledge"

// MQTT Client
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

// Device state
String deviceId = "";
String macAddress = "";
bool isRegistered = false;
unsigned long lastHeartbeat = 0;
const unsigned long HEARTBEAT_INTERVAL = 30000; // 30 seconds

// Notification state
bool hasActiveRequest = false;
String currentRequestId = "";
String currentRequest = "";
String currentLocation = "";
String currentPriority = "normal";

// Button state
bool lastButtonState = HIGH;
unsigned long lastDebounceTime = 0;
const unsigned long DEBOUNCE_DELAY = 200;

// ============================================================================
// SETUP
// ============================================================================

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n===========================================");
  Serial.println("OBEDIO T-Watch (No Display)");
  Serial.println("===========================================\n");

  // Initialize vibration (DISABLED - no motor on this model)
  // pinMode(VIBRATION_PIN, OUTPUT);
  // digitalWrite(VIBRATION_PIN, LOW);

  // Initialize button
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  Serial.println("🔘 Button ready on GPIO " + String(BUTTON_PIN));

  // Connect to WiFi
  connectWiFi();

  // Generate Device ID from MAC address
  generateDeviceId();

  // Connect to MQTT
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setBufferSize(1024);
  mqttClient.setCallback(mqttCallback);
  connectMQTT();

  // Register device
  registerDevice();

  Serial.println("\n✅ OBEDIO T-Watch Ready!");
  Serial.println("Waiting for notifications...\n");
}

// ============================================================================
// MAIN LOOP
// ============================================================================

void loop() {
  // Maintain MQTT connection
  if (!mqttClient.connected()) {
    connectMQTT();
  }
  mqttClient.loop();

  // Send heartbeat
  if (millis() - lastHeartbeat > HEARTBEAT_INTERVAL) {
    sendHeartbeat();
    lastHeartbeat = millis();
  }

  // Check button press (for acknowledge)
  if (hasActiveRequest) {
    int buttonState = digitalRead(BUTTON_PIN);

    // Debug: show button state continuously (fast polling)
    static unsigned long lastDebugPrint = 0;
    if (millis() - lastDebugPrint > 100) {  // Every 100ms for faster debug
      Serial.print(".");  // Show we're polling
      lastDebugPrint = millis();
    }

    // Simple button press detection - if LOW, acknowledge immediately
    if (buttonState == LOW) {
      // Debounce: make sure it's really pressed (not noise)
      delay(50);  // Wait 50ms
      buttonState = digitalRead(BUTTON_PIN);

      if (buttonState == LOW) {  // Still pressed after 50ms
        Serial.println("\n\n🔘 BUTTON DETECTED LOW - Acknowledging request!");
        acknowledgeNotification();
        hasActiveRequest = false;

        // No need to wait for release - GPIO 14 is always LOW (not a real button)
        // Just delay to prevent immediate re-trigger
        delay(1000); // 1 second delay before accepting next request
        Serial.println("✅ Ready for next request!");
      }
    }
  }

  delay(1);  // Very short delay for fast button detection
}

// ============================================================================
// WIFI CONNECTION
// ============================================================================

void connectWiFi() {
  Serial.println("📶 Connecting to WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\n❌ WiFi failed!");
    ESP.restart();
  }
}

// ============================================================================
// DEVICE ID GENERATION
// ============================================================================

void generateDeviceId() {
  String mac = WiFi.macAddress();
  macAddress = mac;
  mac.replace(":", "");
  deviceId = "TWATCH-" + mac;

  // Set MQTT topics
  TOPIC_NOTIFICATION = "obedio/watch/" + deviceId + "/notification";
  TOPIC_ACKNOWLEDGE = "obedio/watch/" + deviceId + "/acknowledge";

  Serial.println("\n📱 Device Info:");
  Serial.println("ID: " + deviceId);
  Serial.println("MAC: " + macAddress);
}

// ============================================================================
// MQTT CONNECTION
// ============================================================================

void connectMQTT() {
  Serial.println("\n📡 Connecting to MQTT...");

  String clientId = "twatch-" + deviceId;

  int attempts = 0;
  while (!mqttClient.connected() && attempts < 5) {
    if (mqttClient.connect(clientId.c_str())) {
      Serial.println("✅ MQTT connected!");

      // Subscribe to notification topic
      mqttClient.subscribe(TOPIC_NOTIFICATION.c_str());
      Serial.println("📥 Subscribed to: " + TOPIC_NOTIFICATION);

    } else {
      Serial.print("❌ MQTT failed, rc=");
      Serial.println(mqttClient.state());
      delay(2000);
      attempts++;
    }
  }

  if (!mqttClient.connected()) {
    Serial.println("❌ MQTT connection failed!");
    ESP.restart();
  }
}

// ============================================================================
// MQTT CALLBACK
// ============================================================================

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.println("\n🔔 MQTT message received!");
  Serial.print("Topic: ");
  Serial.println(topic);

  // Parse JSON payload
  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, payload, length);

  if (error) {
    Serial.print("❌ JSON error: ");
    Serial.println(error.c_str());
    return;
  }

  // Handle notification
  if (String(topic) == TOPIC_NOTIFICATION) {
    handleNotification(doc);
  }
}

// ============================================================================
// NOTIFICATION HANDLER
// ============================================================================

void handleNotification(JsonDocument& doc) {
  Serial.println("\n╔════════════════════════════════════╗");
  Serial.println("║   🔔 SERVICE REQUEST RECEIVED!    ║");
  Serial.println("╚════════════════════════════════════╝");

  // Extract notification data
  const char* requestId = doc["requestId"] | "";
  const char* title = doc["title"] | "Service Request";
  const char* message = doc["message"] | "";
  const char* location = doc["location"] | "Unknown";
  const char* priority = doc["priority"] | "normal";

  // Store notification
  currentRequestId = String(requestId);
  currentRequest = String(message);
  currentLocation = String(location);
  currentPriority = String(priority);
  hasActiveRequest = true;

  // Display notification details
  Serial.println("\n📍 Location: " + String(location));
  Serial.println("📝 Request: " + String(message));
  Serial.println("⚡ Priority: " + String(priority));
  Serial.println("🆔 Request ID: " + String(requestId));

  // Vibrate (DISABLED - no vibration motor on this T-Watch model)
  // if (String(priority) == "urgent") {
  //   Serial.println("\n📳 URGENT - Vibrating 3x!");
  //   vibratePattern(3);
  // } else {
  //   Serial.println("\n📳 Vibrating 1x");
  //   vibratePattern(1);
  // }

  // Wait for button press to acknowledge
  Serial.println("\n⏳ Waiting for BUTTON PRESS to acknowledge...");
  Serial.println("👉 Press the button on T-Watch to accept!");
}

// ============================================================================
// DEVICE REGISTRATION
// ============================================================================

void registerDevice() {
  Serial.println("\n📤 Registering device...");

  StaticJsonDocument<512> doc;
  doc["deviceId"] = deviceId;
  doc["type"] = DEVICE_TYPE;
  doc["name"] = DEVICE_NAME;
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["hardwareVersion"] = HARDWARE_VERSION;
  doc["macAddress"] = macAddress;
  doc["ipAddress"] = WiFi.localIP().toString();
  doc["rssi"] = WiFi.RSSI();
  doc["batteryLevel"] = 100;

  String payload;
  serializeJson(doc, payload);

  bool success = mqttClient.publish(TOPIC_REGISTER, payload.c_str(), false);

  if (success) {
    Serial.println("✅ Registration sent!");
    isRegistered = true;
  } else {
    Serial.println("❌ Registration failed!");
  }
}

// ============================================================================
// HEARTBEAT
// ============================================================================

void sendHeartbeat() {
  if (!isRegistered) return;

  StaticJsonDocument<256> doc;
  doc["deviceId"] = deviceId;
  doc["type"] = DEVICE_TYPE;
  doc["status"] = "online";
  doc["rssi"] = WiFi.RSSI();
  doc["uptime"] = millis() / 1000;
  doc["freeHeap"] = ESP.getFreeHeap();
  doc["batteryLevel"] = 100;

  String payload;
  serializeJson(doc, payload);

  mqttClient.publish(TOPIC_HEARTBEAT, payload.c_str(), false);

  Serial.println("💓 Heartbeat (uptime: " + String(millis() / 1000) + "s)");
}

// ============================================================================
// ACKNOWLEDGE NOTIFICATION
// ============================================================================

void acknowledgeNotification() {
  Serial.println("\n✅ Crew member accepting request...");

  StaticJsonDocument<256> doc;
  doc["deviceId"] = deviceId;
  doc["requestId"] = currentRequestId;
  doc["timestamp"] = millis();
  doc["action"] = "accepted";
  doc["status"] = "in_progress";  // Backend will update to "serving now"

  String payload;
  serializeJson(doc, payload);

  bool success = mqttClient.publish(TOPIC_ACKNOWLEDGE.c_str(), payload.c_str(), false);

  if (success) {
    Serial.println("✅ Request ACCEPTED - Status: SERVING NOW!");
    Serial.println("\n════════════════════════════════════");
    Serial.println("Crew member is now serving the guest!");
    Serial.println("════════════════════════════════════\n");
  } else {
    Serial.println("❌ Acknowledge failed!");
  }
}

// ============================================================================
// VIBRATION
// ============================================================================

void vibratePattern(int pulses) {
  for (int i = 0; i < pulses; i++) {
    digitalWrite(VIBRATION_PIN, HIGH);
    delay(200);
    digitalWrite(VIBRATION_PIN, LOW);
    delay(200);
  }
}
