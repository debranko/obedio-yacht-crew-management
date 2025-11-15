/**
 * MQTT Handler Header
 * Additional MQTT utility functions
 */

#ifndef MQTT_HANDLER_H
#define MQTT_HANDLER_H

#include <Arduino.h>

/**
 * MQTT callback for incoming messages
 * Currently not implemented - add subscription handling here if needed
 */
void mqttCallback(char* topic, byte* payload, unsigned int length);

#endif // MQTT_HANDLER_H
