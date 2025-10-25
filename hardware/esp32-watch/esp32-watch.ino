/**
 * OBEDIO ESP32 Watch Firmware
 *
 * Hardware: ESP32 + OLED Display (128x64 SSD1306) + Vibration Motor
 * Purpose: Crew member watch for receiving service request notifications
 *
 * Features:
 * - WiFi connection
 * - MQTT subscribe to service request notifications
 * - OLED display for viewing requests
 * - Vibration motor for alerts
 * - Button interface for acknowledging/completing requests
 * - Battery monitoring
 * - Crew member status (on-duty, off-duty, break)
 * - Real-time clock (NTP sync)
 *
 * MQTT Topics:
 * - Subscribe: obedio/crew/{crewId}/notification
 * - Publish: obedio/crew/{crewId}/status
 *
 * Display: SSD1306 128x64 OLED via I2C
 * Buttons: 3 buttons (Up, Select, Down)
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Preferences.h>
#include <time.h>

// ==================== CONFIGURATION ====================

// WiFi Configuration (CHANGE THESE!)
const char* WIFI_SSID = "YourYachtWiFi";
const char* WIFI_PASSWORD = "YourPassword";

// MQTT Broker Configuration
const char* MQTT_BROKER = "192.168.1.100";      // Obedio server IP
const int MQTT_PORT = 1883;
const char* MQTT_USER = "";
const char* MQTT_PASSWORD = "";

// Crew Member Configuration
const char* CREW_ID = "CREW_UUID_HERE";          // Unique crew member ID
const char* CREW_NAME = "John Doe";              // Crew member name
const char* FIRMWARE_VERSION = "1.0.0";

// Display Configuration (SSD1306 128x64)
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define SCREEN_ADDRESS 0x3C

// Pin Configuration
#define BUTTON_UP_PIN 25         // Up button (scroll up)
#define BUTTON_SELECT_PIN 26     // Select button (acknowledge/action)
#define BUTTON_DOWN_PIN 27       // Down button (scroll down)
#define VIBRATION_PIN 14         // Vibration motor
#define LED_PIN 2                // Status LED
#define BATTERY_PIN 34           // Battery voltage (ADC)

// Timing Configuration
#define DEBOUNCE_DELAY 50
#define VIBRATION_DURATION 500   // ms
#define SCREEN_TIMEOUT 30000     // 30 seconds
#define NTP_SERVER "pool.ntp.org"
#define GMT_OFFSET 0
#define DAYLIGHT_OFFSET 0

// ==================== GLOBAL VARIABLES ====================

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
Preferences preferences;

struct ServiceRequest {
  String id;
  String locationName;
  String requestType;
  String priority;
  String timestamp;
  bool acknowledged;
};

#define MAX_REQUESTS 10
ServiceRequest requests[MAX_REQUESTS];
int requestCount = 0;
int selectedRequest = 0;

enum DisplayMode {
  MODE_HOME,
  MODE_REQUESTS,
  MODE_REQUEST_DETAIL,
  MODE_SETTINGS
};

DisplayMode currentMode = MODE_HOME;
unsigned long lastScreenUpdate = 0;
unsigned long lastActivity = 0;
bool screenOn = true;

String crewStatus = "on-duty"; // on-duty, off-duty, break

// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n========================================");
  Serial.println("OBEDIO ESP32 Watch - Starting...");
  Serial.println("========================================");

  // Initialize pins
  pinMode(LED_PIN, OUTPUT);
  pinMode(VIBRATION_PIN, OUTPUT);
  pinMode(BUTTON_UP_PIN, INPUT_PULLUP);
  pinMode(BUTTON_SELECT_PIN, INPUT_PULLUP);
  pinMode(BUTTON_DOWN_PIN, INPUT_PULLUP);

  digitalWrite(LED_PIN, LOW);
  digitalWrite(VIBRATION_PIN, LOW);

  // Initialize display
  if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println("❌ SSD1306 display not found!");
    while (1); // Stop if display not found
  }

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("OBEDIO");
  display.println("Yacht Crew");
  display.println("");
  display.println("Connecting...");
  display.display();

  // Initialize preferences
  preferences.begin("obedio-watch", false);

  Serial.print("Crew ID: ");
  Serial.println(CREW_ID);
  Serial.print("Crew Name: ");
  Serial.println(CREW_NAME);

  // Connect to WiFi
  connectWiFi();

  // Sync time via NTP
  configTime(GMT_OFFSET, DAYLIGHT_OFFSET, NTP_SERVER);
  Serial.println("⏰ Syncing time with NTP...");

  // Connect to MQTT
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  connectMQTT();

  // Vibrate to indicate ready
  vibrate(200);
  delay(200);
  vibrate(200);

  // Show home screen
  currentMode = MODE_HOME;
  updateDisplay();

  Serial.println("✅ Watch ready!");
}

// ==================== MAIN LOOP ====================

void loop() {
  // Ensure WiFi and MQTT are connected
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi disconnected, reconnecting...");
    connectWiFi();
  }

  if (!mqttClient.connected()) {
    Serial.println("❌ MQTT disconnected, reconnecting...");
    connectMQTT();
  }

  mqttClient.loop();

  // Check buttons
  checkButtons();

  // Update display periodically
  if (millis() - lastScreenUpdate > 1000) {
    lastScreenUpdate = millis();
    updateDisplay();
  }

  // Screen timeout (turn off after inactivity)
  if (screenOn && (millis() - lastActivity > SCREEN_TIMEOUT)) {
    display.ssd1306_command(SSD1306_DISPLAYOFF);
    screenOn = false;
    Serial.println("💤 Screen off (timeout)");
  }

  delay(10);
}

// ==================== WIFI FUNCTIONS ====================

void connectWiFi() {
  Serial.println("\n🔌 Connecting to WiFi...");
  WiFi.mode(WIFI_STA);
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
  } else {
    Serial.println("\n❌ WiFi connection failed!");
  }
}

// ==================== MQTT FUNCTIONS ====================

void connectMQTT() {
  Serial.println("\n🔌 Connecting to MQTT...");

  String clientId = "obedio-watch-" + String(CREW_ID);

  int attempts = 0;
  while (!mqttClient.connected() && attempts < 5) {
    Serial.print("Attempt ");
    Serial.print(attempts + 1);
    Serial.print("...");

    if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASSWORD)) {
      Serial.println(" ✅ Connected!");

      // Subscribe to crew notifications
      String notifTopic = "obedio/crew/" + String(CREW_ID) + "/notification";
      mqttClient.subscribe(notifTopic.c_str());
      Serial.print("📡 Subscribed to: ");
      Serial.println(notifTopic);

      // Publish crew status
      publishCrewStatus();

    } else {
      Serial.print(" ❌ Failed, rc=");
      Serial.println(mqttClient.state());
      delay(2000);
    }
    attempts++;
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.println("\n📥 MQTT message received:");
  Serial.print("Topic: ");
  Serial.println(topic);

  // Parse JSON payload
  StaticJsonDocument<1024> doc;
  DeserializationError error = deserializeJson(doc, payload, length);

  if (error) {
    Serial.print("❌ JSON parse error: ");
    Serial.println(error.c_str());
    return;
  }

  // Extract service request data
  if (requestCount < MAX_REQUESTS) {
    ServiceRequest newRequest;
    newRequest.id = doc["id"].as<String>();
    newRequest.locationName = doc["locationName"].as<String>();
    newRequest.requestType = doc["requestType"].as<String>();
    newRequest.priority = doc["priority"].as<String>();
    newRequest.timestamp = doc["timestamp"].as<String>();
    newRequest.acknowledged = false;

    requests[requestCount++] = newRequest;

    Serial.println("✅ New service request added:");
    Serial.print("  Location: ");
    Serial.println(newRequest.locationName);
    Serial.print("  Type: ");
    Serial.println(newRequest.requestType);
    Serial.print("  Priority: ");
    Serial.println(newRequest.priority);

    // Alert crew member
    alertNewRequest(newRequest.priority);

    // Switch to requests view
    currentMode = MODE_REQUESTS;
    lastActivity = millis();

    // Turn on screen if off
    if (!screenOn) {
      display.ssd1306_command(SSD1306_DISPLAYON);
      screenOn = true;
    }

    updateDisplay();
  } else {
    Serial.println("⚠️ Request buffer full!");
  }
}

// ==================== DISPLAY FUNCTIONS ====================

void updateDisplay() {
  display.clearDisplay();

  switch (currentMode) {
    case MODE_HOME:
      drawHomeScreen();
      break;
    case MODE_REQUESTS:
      drawRequestsScreen();
      break;
    case MODE_REQUEST_DETAIL:
      drawRequestDetailScreen();
      break;
    case MODE_SETTINGS:
      drawSettingsScreen();
      break;
  }

  display.display();
}

void drawHomeScreen() {
  // Header
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print("OBEDIO");

  // Battery
  int battery = readBatteryLevel();
  display.setCursor(100, 0);
  display.print(battery);
  display.print("%");

  // Time
  display.setTextSize(2);
  display.setCursor(10, 15);
  display.print(getTimeString());

  // Crew name
  display.setTextSize(1);
  display.setCursor(0, 35);
  display.print(CREW_NAME);

  // Status
  display.setCursor(0, 45);
  display.print("Status: ");
  display.print(crewStatus);

  // Pending requests
  display.setCursor(0, 55);
  if (requestCount > 0) {
    display.print("Requests: ");
    display.print(requestCount);
  } else {
    display.print("No requests");
  }
}

void drawRequestsScreen() {
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print("Service Requests (");
  display.print(requestCount);
  display.print(")");

  if (requestCount == 0) {
    display.setCursor(20, 30);
    display.print("No requests");
    return;
  }

  // Show up to 5 requests
  int startIdx = max(0, selectedRequest - 2);
  int y = 12;

  for (int i = startIdx; i < min(requestCount, startIdx + 5); i++) {
    if (i == selectedRequest) {
      display.fillRect(0, y - 1, 128, 10, SSD1306_WHITE);
      display.setTextColor(SSD1306_BLACK);
    } else {
      display.setTextColor(SSD1306_WHITE);
    }

    display.setCursor(2, y);
    display.print(requests[i].locationName.substring(0, 10));
    display.print(" ");
    display.print(requests[i].requestType.substring(0, 5));

    if (i == selectedRequest) {
      display.setTextColor(SSD1306_WHITE);
    }

    y += 10;
  }
}

void drawRequestDetailScreen() {
  if (selectedRequest >= requestCount) return;

  ServiceRequest& req = requests[selectedRequest];

  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print("Request Details");

  display.setCursor(0, 12);
  display.print("Loc: ");
  display.print(req.locationName);

  display.setCursor(0, 22);
  display.print("Type: ");
  display.print(req.requestType);

  display.setCursor(0, 32);
  display.print("Priority: ");
  display.print(req.priority);

  display.setCursor(0, 42);
  display.print("Time: ");
  display.print(req.timestamp.substring(11, 16)); // HH:MM

  display.setCursor(0, 54);
  if (req.acknowledged) {
    display.print("[ACK] SELECT=Done");
  } else {
    display.print("SELECT = Acknowledge");
  }
}

void drawSettingsScreen() {
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print("Settings");

  display.setCursor(0, 15);
  display.print("Status: ");
  display.print(crewStatus);

  display.setCursor(0, 30);
  display.print("SELECT = Toggle");

  display.setCursor(0, 45);
  display.print("WiFi: ");
  display.print(WiFi.RSSI());
  display.print(" dBm");
}

// ==================== BUTTON FUNCTIONS ====================

void checkButtons() {
  static unsigned long lastButtonPress = 0;
  static bool upPressed = false;
  static bool selectPressed = false;
  static bool downPressed = false;

  unsigned long now = millis();
  if (now - lastButtonPress < DEBOUNCE_DELAY) return;

  // Button UP
  if (digitalRead(BUTTON_UP_PIN) == LOW && !upPressed) {
    upPressed = true;
    lastButtonPress = now;
    lastActivity = now;
    wakeScreen();
    handleButtonUp();
  } else if (digitalRead(BUTTON_UP_PIN) == HIGH) {
    upPressed = false;
  }

  // Button SELECT
  if (digitalRead(BUTTON_SELECT_PIN) == LOW && !selectPressed) {
    selectPressed = true;
    lastButtonPress = now;
    lastActivity = now;
    wakeScreen();
    handleButtonSelect();
  } else if (digitalRead(BUTTON_SELECT_PIN) == HIGH) {
    selectPressed = false;
  }

  // Button DOWN
  if (digitalRead(BUTTON_DOWN_PIN) == LOW && !downPressed) {
    downPressed = true;
    lastButtonPress = now;
    lastActivity = now;
    wakeScreen();
    handleButtonDown();
  } else if (digitalRead(BUTTON_DOWN_PIN) == HIGH) {
    downPressed = false;
  }
}

void handleButtonUp() {
  if (currentMode == MODE_REQUESTS) {
    if (selectedRequest > 0) {
      selectedRequest--;
      updateDisplay();
    }
  }
}

void handleButtonSelect() {
  switch (currentMode) {
    case MODE_HOME:
      if (requestCount > 0) {
        currentMode = MODE_REQUESTS;
        selectedRequest = 0;
      } else {
        currentMode = MODE_SETTINGS;
      }
      break;

    case MODE_REQUESTS:
      currentMode = MODE_REQUEST_DETAIL;
      break;

    case MODE_REQUEST_DETAIL:
      // Acknowledge request
      acknowledgeRequest(selectedRequest);
      // Remove from list
      removeRequest(selectedRequest);
      currentMode = MODE_REQUESTS;
      if (selectedRequest >= requestCount && selectedRequest > 0) {
        selectedRequest--;
      }
      break;

    case MODE_SETTINGS:
      toggleCrewStatus();
      break;
  }

  updateDisplay();
}

void handleButtonDown() {
  if (currentMode == MODE_REQUESTS) {
    if (selectedRequest < requestCount - 1) {
      selectedRequest++;
      updateDisplay();
    }
  } else if (currentMode == MODE_REQUEST_DETAIL || currentMode == MODE_SETTINGS) {
    currentMode = MODE_HOME;
    updateDisplay();
  }
}

// ==================== CREW FUNCTIONS ====================

void acknowledgeRequest(int index) {
  if (index >= requestCount) return;

  ServiceRequest& req = requests[index];
  req.acknowledged = true;

  // Publish acknowledgment to backend
  String topic = "obedio/crew/" + String(CREW_ID) + "/acknowledge";

  StaticJsonDocument<256> doc;
  doc["requestId"] = req.id;
  doc["crewId"] = CREW_ID;
  doc["crewName"] = CREW_NAME;
  doc["timestamp"] = getTimestamp();

  String payload;
  serializeJson(doc, payload);

  mqttClient.publish(topic.c_str(), payload.c_str());

  Serial.println("✅ Request acknowledged: " + req.id);
  vibrate(100);
}

void removeRequest(int index) {
  if (index >= requestCount) return;

  for (int i = index; i < requestCount - 1; i++) {
    requests[i] = requests[i + 1];
  }
  requestCount--;
}

void toggleCrewStatus() {
  if (crewStatus == "on-duty") {
    crewStatus = "break";
  } else if (crewStatus == "break") {
    crewStatus = "off-duty";
  } else {
    crewStatus = "on-duty";
  }

  publishCrewStatus();
  vibrate(100);
}

void publishCrewStatus() {
  String topic = "obedio/crew/" + String(CREW_ID) + "/status";

  StaticJsonDocument<256> doc;
  doc["crewId"] = CREW_ID;
  doc["crewName"] = CREW_NAME;
  doc["status"] = crewStatus;
  doc["timestamp"] = getTimestamp();
  doc["battery"] = readBatteryLevel();

  String payload;
  serializeJson(doc, payload);

  mqttClient.publish(topic.c_str(), payload.c_str());

  Serial.print("📤 Crew status published: ");
  Serial.println(crewStatus);
}

// ==================== ALERT FUNCTIONS ====================

void alertNewRequest(String priority) {
  digitalWrite(LED_PIN, HIGH);

  if (priority == "urgent") {
    // Urgent: 3 long vibrations
    vibrate(500);
    delay(200);
    vibrate(500);
    delay(200);
    vibrate(500);
  } else if (priority == "emergency") {
    // Emergency: Continuous vibration pattern
    for (int i = 0; i < 5; i++) {
      vibrate(300);
      delay(100);
    }
  } else {
    // Normal: Single vibration
    vibrate(VIBRATION_DURATION);
  }

  digitalWrite(LED_PIN, LOW);
}

void vibrate(int duration) {
  digitalWrite(VIBRATION_PIN, HIGH);
  delay(duration);
  digitalWrite(VIBRATION_PIN, LOW);
}

// ==================== UTILITY FUNCTIONS ====================

void wakeScreen() {
  if (!screenOn) {
    display.ssd1306_command(SSD1306_DISPLAYON);
    screenOn = true;
    Serial.println("👁️ Screen on");
  }
}

String getTimeString() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    return "00:00";
  }

  char buffer[6];
  strftime(buffer, sizeof(buffer), "%H:%M", &timeinfo);
  return String(buffer);
}

String getTimestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    return "2025-10-24T00:00:00Z";
  }

  char buffer[25];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(buffer);
}

int readBatteryLevel() {
  int rawValue = analogRead(BATTERY_PIN);
  float voltage = (rawValue / 4095.0) * 3.3 * 2;
  int percent = map(voltage * 100, 300, 420, 0, 100);
  return constrain(percent, 0, 100);
}
