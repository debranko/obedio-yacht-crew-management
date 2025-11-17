# Battery Monitoring Hardware Documentation

## Status: ⚠️ HARDWARE EXISTS - FIRMWARE NOT IMPLEMENTED

The OBEDIO ESP32-S3 Smart Button PCB v3.0 **includes full battery monitoring hardware**, but the firmware implementation is currently incomplete.

---

## Hardware Present on PCB ✅

### 1. Battery Voltage Measurement Circuit

**Location:** Bottom-right section of schematic (labeled "U16 BATT")

**Components:**
- **Voltage Divider:**
  - R35: 66Ω
  - R33: 10kΩ
  - Divider ratio: ~0.9934 (essentially 1:1, measures nearly full battery voltage)

- **Filtering Capacitors:**
  - C70: 47nF
  - C71: 22nF
  - C68: 100nF

- **Power Switch (MOSFET):**
  - Q7: IRLML2402TRPBF P-channel MOSFET
  - Purpose: Enable/disable voltage divider to save power when not measuring

**Signal:** **BAT_M** (Battery Measurement output)
- This signal carries the divided battery voltage for ADC reading
- Voltage range: ~3.7V to 4.2V (LiPo battery range)
- Must be read by an ADC-capable GPIO pin on ESP32-S3

**Control Signal:** **EN** (Enable)
- Controls Q7 MOSFET gate
- HIGH = Voltage divider enabled, BAT_M active
- LOW = Voltage divider disabled, saves power

---

### 2. Charging Detection Circuit

**Location:** Bottom-center section of schematic (labeled "U14 TP4056_C725790")

**Charging IC:** TP4056 LiPo Battery Charger
- **Pin 5:** BAT (Battery connection)
- **Pin 6:** ~{STDBY} (Standby indicator - LOW when fully charged)
- **Pin 7:** ~{CHRG} (Charge indicator - **connected to CHARG_DET signal**)
- **Pin 2:** PROG (Charge current programming - 580mA via R24=4.7kΩ)

**Signal:** **CHARG_DET** (Charge Detection)
- Connected to TP4056 ~{CHRG} pin (active LOW)
- Logic:
  - **LOW (0)** = Battery is currently charging
  - **HIGH (1)** = Battery is not charging (either full or no charger connected)

**Components:**
- C56: 100nF (decoupling)
- C55: 22µF (output capacitor)
- R24: 4.7kΩ (sets charging current to 580mA)
- R27: 2kΩ (NTC thermistor connection)
- TH1: 10kΩ NTC thermistor (temperature monitoring)

---

### 3. Wireless Charging Circuit (Optional)

**Location:** Bottom-left section (labeled "U15 BQ51013BRHLR")

**Charging IC:** BQ51013B Wireless Power Receiver (Qi-compatible)
- Provides wireless charging capability
- Can charge the battery via inductive coupling
- Connected to same battery charging path as USB

---

## Schematic Reference

**File:** `ESP32S3_Smart_Button_v3.0.pdf`
- Page 1: Main schematic showing all battery circuits
- Section: POWER (bottom half of schematic)

---

## ⚠️ MISSING INFORMATION - REQUIRED FOR FIRMWARE IMPLEMENTATION

### GPIO Pin Assignments UNKNOWN

The following ESP32-S3 GPIO pin assignments are **NOT DOCUMENTED** in the current firmware:

1. **BAT_M** → **GPIO ???** (ADC-capable pin required)
   - Must be an ADC1 channel: GPIO 4, 5, 6, 7, 8, 9, or 10
   - Used to read battery voltage via ADC

2. **CHARG_DET** → **GPIO ???** (Digital input)
   - Any available GPIO pin
   - Used to detect if battery is charging

3. **EN** → **GPIO ???** (Digital output)
   - Any available GPIO pin
   - Used to enable/disable voltage divider circuit

**Action Required:**
- Trace these nets in the PCB layout or schematic to determine actual GPIO connections
- OR contact PCB designer to confirm GPIO assignments
- OR test the physical board with a multimeter to identify which GPIOs these signals connect to

---

## Currently Assigned GPIO Pins (Reference)

From `main/config.h`, these GPIOs are already in use:

- **GPIO 1** - Touch sensor (TOUCH_PAD_NUM1)
- **GPIO 2** - I2C SCL (MCP23017 button expander)
- **GPIO 3** - I2C SDA (MCP23017 button expander)
- **GPIO 10** - I2S Speaker BCLK
- **GPIO 11** - I2S Speaker Data
- **GPIO 14** - I2S Speaker Enable (SD_MODE)
- **GPIO 17** - NeoPixel LED data
- **GPIO 18** - I2S Speaker WS
- **GPIO 33** - I2S Mic BCLK
- **GPIO 34** - I2S Mic Data
- **GPIO 38** - I2S Mic WS

**Available ADC1-capable GPIOs (for BAT_M):**
- GPIO 4, 5, 6, 7, 8, 9 (all currently unused)

---

## Firmware Implementation Status

### Current Code (Placeholder)

**File:** `main/mqtt_handler.c` (lines 109-117)

```c
/**
 * @brief Get battery percentage (placeholder)
 *
 * TODO: Implement actual battery monitoring
 */
static uint8_t get_battery_percentage(void)
{
    // Placeholder - return 100% for now
    return 100;
}
```

All MQTT messages currently send hardcoded battery value:
```json
{
  "battery": 100,  // <-- Always 100%, not real measurement
  ...
}
```

---

## Required Firmware Implementation

Once GPIO pins are identified, the following firmware changes are needed:

### 1. Update `main/config.h`

Add battery monitoring pin definitions:

```c
// ==================== BATTERY MONITORING CONFIGURATION ====================
#define BAT_ADC_GPIO            ???  // ADC1_CH? - Battery voltage ADC input
#define BAT_ADC_CHANNEL         ???  // ADC channel corresponding to GPIO
#define BAT_ADC_UNIT            ADC_UNIT_1
#define BAT_ADC_ATTEN           ADC_ATTEN_DB_12  // 0-3.3V range (or DB_11 for 0-2.5V)

#define CHARG_DET_GPIO          ???  // Charging detection input (active LOW)
#define BAT_EN_GPIO             ???  // Battery voltage divider enable output
```

### 2. Create Battery Monitoring Module

**New files needed:**
- `main/battery_monitor.h` - Battery monitoring API
- `main/battery_monitor.c` - Battery monitoring implementation

**Functions to implement:**

```c
// Initialize battery monitoring (configure GPIOs and ADC)
esp_err_t battery_monitor_init(void);

// Enable voltage divider and read battery voltage
float battery_get_voltage(void);

// Calculate battery percentage from voltage (LiPo curve: 4.2V=100%, 3.0V=0%)
uint8_t battery_get_percentage(void);

// Check if battery is currently charging
bool battery_is_charging(void);

// Get battery status structure
typedef struct {
    float voltage;           // Battery voltage in volts (3.0 - 4.2V)
    uint8_t percentage;      // Battery level 0-100%
    bool is_charging;        // True if currently charging
    bool charge_complete;    // True if fully charged (from STDBY pin if implemented)
} battery_status_t;

battery_status_t battery_get_status(void);
```

### 3. Update `main/mqtt_handler.c`

Replace placeholder function:

```c
#include "battery_monitor.h"

static uint8_t get_battery_percentage(void)
{
    return battery_get_percentage();  // Return actual battery level
}
```

### 4. Update `main/CMakeLists.txt`

Add new battery monitoring source files:

```cmake
idf_component_register(
    SRCS
        "main.c"
        "wifi_manager.c"
        "mqtt_handler.c"
        "battery_monitor.c"  # <-- Add this
        ...
```

### 5. Configure ADC in `sdkconfig.defaults` (if needed)

```
# ==================== ADC Configuration ====================
CONFIG_ADC_ONESHOT_CTRL_FUNC_IN_IRAM=y
CONFIG_ADC_DISABLE_DAC=y
```

---

## Battery Voltage to Percentage Conversion

LiPo battery discharge curve (typical):

| Voltage | Percentage |
|---------|------------|
| 4.20V   | 100%       |
| 4.10V   | 90%        |
| 4.00V   | 80%        |
| 3.90V   | 70%        |
| 3.80V   | 60%        |
| 3.70V   | 40%        |
| 3.60V   | 20%        |
| 3.50V   | 10%        |
| 3.40V   | 5%         |
| 3.30V   | 2%         |
| 3.00V   | 0%         |

**Note:** The actual curve is non-linear and depends on battery chemistry, temperature, and load.

---

## Testing Procedure (Once Implemented)

1. **Verify voltage reading:**
   - Measure battery voltage with multimeter
   - Compare with ADC reading from firmware
   - Should match within ±50mV

2. **Verify charge detection:**
   - Connect USB charger
   - Check CHARG_DET signal reads LOW (charging)
   - Wait for full charge
   - Check CHARG_DET signal reads HIGH (not charging)

3. **Verify percentage calculation:**
   - Check percentage at various voltage levels
   - Ensure reasonable mapping (4.2V=100%, 3.0V=0%)

4. **Verify MQTT reporting:**
   - Check MQTT messages contain actual battery percentage
   - Verify percentage updates as battery drains/charges

---

## Power Consumption Optimization

The voltage divider enable (EN signal) allows power savings:

**Strategy:**
- Keep voltage divider disabled (EN = LOW) most of the time
- Only enable (EN = HIGH) when measuring battery voltage
- Wait ~10ms for voltage to stabilize after enabling
- Read ADC value
- Disable divider (EN = LOW) immediately after reading

**Power Savings:**
- Voltage divider idle current: ~370µA (when enabled)
- By enabling only during measurement (~100ms every 10 seconds), average current reduced to ~3.7µA

---

## Additional Notes

- The TP4056 also has a **~{STDBY}** pin that indicates full charge, but this is not currently routed to ESP32-S3 in the schematic
- Maximum charging current is 580mA (set by R24 = 4.7kΩ)
- NTC thermistor (TH1) provides temperature monitoring during charging for safety
- The voltage divider ratio of ~1:1 means the ESP32-S3 ADC must handle the full battery voltage range (3.0-4.2V)
  - Use ADC_ATTEN_DB_12 for 0-3.3V range (readings above 3.3V will saturate)
  - OR use ADC_ATTEN_DB_11 for 0-2.5V range (readings above 3.3V need extrapolation)
  - Consider adding a proper 2:1 voltage divider in future hardware revision

---

## References

- **Schematic:** ESP32S3_Smart_Button_v3.0.pdf
- **TP4056 Datasheet:** Battery charger IC specifications
- **BQ51013B Datasheet:** Wireless charging receiver specifications
- **ESP32-S3 Technical Reference Manual:** ADC configuration and usage
- **ESP-IDF ADC API Documentation:** https://docs.espressif.com/projects/esp-idf/en/latest/esp32s3/api-reference/peripherals/adc_oneshot.html

---

## Version History

- **2025-11-17:** Initial documentation - Hardware identified, GPIO assignments unknown
