# Feature Documentation

Feature specifications and implementation plans.

## Service Requests

- **[SERVICE-REQUESTS-MASTER-PLAN-V2.md](SERVICE-REQUESTS-MASTER-PLAN-V2.md)** - Latest service request feature specification
- **[SERVICE-REQUESTS-MASTER-PLAN.md](SERVICE-REQUESTS-MASTER-PLAN.md)** - Original plan (archived reference)

## Service Request System

The service request system is the core feature of OBEDIO:

### Flow
1. Guest presses ESP32 button (or shake for emergency)
2. MQTT message → Backend creates ServiceRequest
3. Notification sent to crew Wear OS watches via MQTT
4. Crew accepts → Status changes to "serving"
5. Crew completes → Request logged to history

### Request Types
- **call** - Normal service call
- **voice** - Voice message with transcription
- **emergency** - Urgent assistance (shake detection)
- **dnd** - Do Not Disturb toggle
- **lights** - Lights control
- **prepare_food** - Meal preparation
- **bring_drinks** - Beverage service

### Priority Levels
- **normal** - Single button press
- **urgent** - Double button press
- **emergency** - Shake detection

## Related Documentation

- [API Reference](../api-reference/) - Service request endpoints
- [Backend Architecture](../BACKEND-ARCHITECTURE.md) - Implementation details
- [Hardware Specifications](../hardware/) - ESP32 button configuration
