/**
 * Hardware Interface Header
 * Handles all physical hardware components
 */

#ifndef HARDWARE_H
#define HARDWARE_H

#include <Arduino.h>
#include <Adafruit_MCP23X17.h>
#include <Adafruit_NeoPixel.h>
#include <LIS3DHTR.h>
#include <Wire.h>

// ==================== HARDWARE INITIALIZATION ====================

/**
 * Initialize all hardware components
 * @return true if successful, false otherwise
 */
bool initHardware();

/**
 * Generate unique device ID from MAC address
 * @return Device ID string (e.g., "BTN-A1B2C3D4E5F6")
 */
String generateDeviceId();

// ==================== BUTTON FUNCTIONS ====================

/**
 * Check all buttons for press events
 * @param deviceId Device identifier
 * @param sequenceNumber Pointer to sequence number counter
 */
void checkButtons(const String& deviceId, uint32_t* sequenceNumber);

// ==================== LED FUNCTIONS ====================

/**
 * Update LED rainbow animation
 */
void updateLEDAnimation();

/**
 * Flash all LEDs with specific color
 * @param r Red value (0-255)
 * @param g Green value (0-255)
 * @param b Blue value (0-255)
 * @param duration_ms Flash duration in milliseconds
 */
void flashLEDs(uint8_t r, uint8_t g, uint8_t b, uint16_t duration_ms);

/**
 * Show startup LED sequence
 */
void startupLEDSequence();

// ==================== ACCELEROMETER FUNCTIONS ====================

/**
 * Check accelerometer for shake events
 * @param deviceId Device identifier
 * @param sequenceNumber Pointer to sequence number counter
 */
void checkAccelerometer(const String& deviceId, uint32_t* sequenceNumber);

// ==================== GLOBAL HARDWARE OBJECTS ====================

extern Adafruit_MCP23X17 mcp;
extern Adafruit_NeoPixel strip;
extern LIS3DHTR<TwoWire> accel;

#endif // HARDWARE_H
