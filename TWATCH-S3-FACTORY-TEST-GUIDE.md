# 🏭 T-Watch S3 Factory Test Firmware
## Jednostavan Test za Proveru Hardware-a

**Cilj**: Potvrditi da T-Watch S3 hardware radi (display, touch, vibration)
**Vreme**: 15-20 minuta setup + 5 minuta test

---

## 🎯 STEP-BY-STEP UPUTSTVO

### KORAK 1: Instalacija Arduino IDE i Board Support

#### 1.1 Instaliraj Arduino IDE 2.x
Download: https://www.arduino.cc/en/software

#### 1.2 Dodaj ESP32 Board Support
**File → Preferences → Additional Boards Manager URLs**:
```
https://espressif.github.io/arduino-esp32/package_esp32_dev_index.json
```

**Tools → Board → Boards Manager**:
- Traži: `esp32`
- Instaliraj: **ESP32 by Espressif Systems** verzija **2.0.14** ili **2.0.9**
  - ⚠️ **NE instalirati 3.x verziju** - ima breaking changes!

#### 1.3 Instaliraj Potrebne Biblioteke

**Sketch → Include Library → Manage Libraries**

Instaliraj sledeće:

1. **TFT_eSPI** by Bodmer (verzija 2.5.43 ili novija)
2. **LVGL** by kisvegabor (verzija **8.3.11**)
   - ⚠️ **Pažnja**: LVGL 9.x nije kompatibilan!
3. **XPowersLib** by lewisxhe (za power management)

---

### KORAK 2: Konfiguracija TFT_eSPI za T-Watch S3

**OVO JE NAJKRITIČNIJI KORAK!**

#### 2.1 Lokacija TFT_eSPI biblioteke
Windows lokacija:
```
C:\Users\{tvoj_user}\Documents\Arduino\libraries\TFT_eSPI\
```

#### 2.2 Backup postojećeg fajla
Napravi backup:
```
C:\Users\{tvoj_user}\Documents\Arduino\libraries\TFT_eSPI\User_Setup_Select.h
```
(kopiraj ga u `User_Setup_Select.h.backup`)

#### 2.3 Izmeni User_Setup_Select.h

Otvori fajl:
```
C:\Users\{tvoj_user}\Documents\Arduino\libraries\TFT_eSPI\User_Setup_Select.h
```

**Pronađi liniju** (oko linije 28-30):
```cpp
#include <User_Setup.h>           // Default setup is root library folder
```

**KOMENTIRAJ tu liniju** i dodaj novu:
```cpp
// #include <User_Setup.h>        // Default setup - DISABLED
#include <User_Setups/Setup212_LilyGo_T_Watch_S3.h>  // T-Watch S3
```

#### 2.4 Kreiraj Setup212_LilyGo_T_Watch_S3.h

Kreiraj novi fajl:
```
C:\Users\{tvoj_user}\Documents\Arduino\libraries\TFT_eSPI\User_Setups\Setup212_LilyGo_T_Watch_S3.h
```

**Sadržaj fajla** (copy-paste ovo):

```cpp
// Setup for LilyGO T-Watch S3
// ESP32-S3 with ST7789 240x240 display

#define USER_SETUP_ID 212

#define ST7789_DRIVER

#define TFT_WIDTH  240
#define TFT_HEIGHT 240

// Pin Configuration for T-Watch S3
#define TFT_MOSI 13  // SDA
#define TFT_SCLK 18  // SCL
#define TFT_CS   12  // Chip select
#define TFT_DC   38  // Data/Command
#define TFT_RST  -1  // No reset pin (connected to EN)
#define TFT_BL   45  // Backlight

#define TFT_BACKLIGHT_ON HIGH
#define LOAD_GLCD   // Font 1. Original Adafruit 8 pixel font needs ~1820 bytes in FLASH
#define LOAD_FONT2  // Font 2. Small 16 pixel high font, needs ~3534 bytes in FLASH, 96 characters
#define LOAD_FONT4  // Font 4. Medium 26 pixel high font, needs ~5848 bytes in FLASH, 96 characters
#define LOAD_FONT6  // Font 6. Large 48 pixel font, needs ~2666 bytes in FLASH, only characters 1234567890:-.apm
#define LOAD_FONT7  // Font 7. 7 segment 48 pixel font, needs ~2438 bytes in FLASH, only characters 1234567890:-.
#define LOAD_FONT8  // Font 8. Large 75 pixel font needs ~3256 bytes in FLASH, only characters 1234567890:-.
#define LOAD_GFXFF  // FreeFonts. Include access to the 48 Adafruit_GFX free fonts FF1 to FF48 and custom fonts

#define SMOOTH_FONT

#define SPI_FREQUENCY  40000000
#define SPI_READ_FREQUENCY  16000000
#define SPI_TOUCH_FREQUENCY  2500000
```

**SAČUVAJ FAJL!**

---

### KORAK 3: Board Configuration u Arduino IDE

**Tools → Board → ESP32 S3 Dev Module**

**KRITIČNE SETTINGS**:

| Setting | Value |
|---------|-------|
| **USB CDC On Boot** | ⚠️ **Enabled** (KRITIČNO!) |
| **USB DFU On Boot** | Disabled |
| **Upload Mode** | UART0 / Hardware CDC |
| **USB Mode** | Hardware CDC and JTAG |
| **CPU Frequency** | 240MHz (WiFi) |
| **Flash Mode** | QIO 80MHz |
| **Flash Size** | 16MB (128Mb) |
| **Partition Scheme** | 16M Flash (3MB APP/9.9MB FATFS) |
| **Core Debug Level** | None |
| **PSRAM** | OPI PSRAM |
| **Arduino Runs On** | Core 1 |
| **Events Run On** | Core 1 |

**Port**: Izaberi COM port gde je T-Watch povezan (npr. COM3, COM4...)

---

### KORAK 4: Ultra-Jednostavan Test Firmware

Kreiraj novi sketch: **File → New Sketch**

Copy-paste ovaj kod:

```cpp
/**
 * T-Watch S3 Factory Test - Ultra Simple
 *
 * Testiram:
 * - Display inicijalizacija
 * - Backlight
 * - Text rendering
 * - Colors
 * - Touch (opciono)
 */

#include <TFT_eSPI.h>

// Backlight pin
#define TFT_BL 45

TFT_eSPI tft = TFT_eSPI();

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n\n");
  Serial.println("========================================");
  Serial.println("T-WATCH S3 FACTORY TEST");
  Serial.println("========================================");

  // Initialize backlight pin
  pinMode(TFT_BL, OUTPUT);
  digitalWrite(TFT_BL, HIGH);  // Turn backlight ON
  Serial.println("✅ Backlight ON");

  // Initialize display
  Serial.println("Initializing display...");
  tft.init();
  tft.setRotation(0);  // Portrait mode
  Serial.println("✅ Display initialized");

  // Fill screen with test colors
  Serial.println("Drawing test pattern...");

  // RED background
  tft.fillScreen(TFT_RED);
  delay(1000);

  // GREEN background
  tft.fillScreen(TFT_GREEN);
  delay(1000);

  // BLUE background
  tft.fillScreen(TFT_BLUE);
  delay(1000);

  // BLACK background
  tft.fillScreen(TFT_BLACK);
  delay(500);

  // Draw text
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.setTextSize(2);

  tft.setCursor(20, 20);
  tft.println("T-WATCH S3");

  tft.setCursor(20, 60);
  tft.println("FACTORY TEST");

  tft.setCursor(20, 100);
  tft.setTextColor(TFT_GREEN, TFT_BLACK);
  tft.println("SCREEN: OK");

  tft.setCursor(20, 140);
  tft.setTextColor(TFT_YELLOW, TFT_BLACK);
  tft.println("BACKLIGHT: OK");

  // Draw rectangle border
  tft.drawRect(10, 10, 220, 220, TFT_WHITE);

  Serial.println("✅ Test pattern complete!");
  Serial.println("\n========================================");
  Serial.println("SUCCESS! Display is working!");
  Serial.println("========================================\n");
}

void loop() {
  // Nothing - display stays static

  // Optional: Print serial every 5 seconds
  static unsigned long lastPrint = 0;
  if (millis() - lastPrint > 5000) {
    Serial.println("Display test running... (screen should show text)");
    lastPrint = millis();
  }

  delay(100);
}
```

**SAČUVAJ** kao: `TWatch_S3_Factory_Test.ino`

---

### KORAK 5: Upload Firmware

#### 5.1 Povežii T-Watch S3 sa USB kablom

**KRITIČNO**: Koristi **KVALITETAN USB-C kabl** (mora podržavati podatke, ne samo punjenje!)

#### 5.2 Proveri da li se vidi COM port

**Tools → Port → izaberi COM port** (npr. COM3)

Ako **ne vidiš port**:
1. Drži **BOOT dugme** (na strani sat-a)
2. Istovremeno pritisni i pusti **RESET dugme**
3. Pusti **BOOT dugme**
4. Sada bi trebalo da vidiš COM port

#### 5.3 Upload firmware

1. **Klikni Upload (→)** dugme u Arduino IDE
2. Prati progress u konzoli
3. Čekaj da kaže **"Hard resetting via RTS pin..."**

**Ako ne uspeva upload**:
- Drži **BOOT dugme** dok klikneš Upload
- Pusti BOOT kada vidiš "Connecting........"

---

### KORAK 6: Provera Rezultata

#### 6.1 Šta bi trebalo da vidiš na ekranu:

1. **Prvo**: Crveni ekran (1 sekunda)
2. **Zatim**: Zeleni ekran (1 sekunda)
3. **Zatim**: Plavi ekran (1 sekunda)
4. **Na kraju**: Crni ekran sa belim tekstom:
   ```
   T-WATCH S3
   FACTORY TEST
   SCREEN: OK      (zeleno)
   BACKLIGHT: OK   (žuto)
   ```
   + beli okvir oko ekrana

#### 6.2 Serial Monitor Output

**Tools → Serial Monitor** (115200 baud)

Trebalo bi da vidiš:
```
========================================
T-WATCH S3 FACTORY TEST
========================================
✅ Backlight ON
Initializing display...
✅ Display initialized
Drawing test pattern...
✅ Test pattern complete!

========================================
SUCCESS! Display is working!
========================================

Display test running... (screen should show text)
Display test running... (screen should show text)
...
```

---

## 🐛 TROUBLESHOOTING

### Problem 1: Crni Ekran (Backlight Upaljen)
**Simptom**: Vidiš svetlo ali nema slike

**Rešenje**:
1. Proveri da li si kreirao `Setup212_LilyGo_T_Watch_S3.h` fajl
2. Proveri da li si izmenio `User_Setup_Select.h`
3. Restartuj Arduino IDE
4. Re-upload firmware

---

### Problem 2: Crni Ekran (Backlight Ugašen)
**Simptom**: Ništa se ne vidi, ekran potpuno crn

**Rešenje**:
1. Proveri da li je sat napunjen (povežii USB-C)
2. Drži power dugme 5 sekundi (hard reset)
3. Proveri **USB CDC On Boot** = Enabled u Arduino IDE settings
4. Re-upload firmware

---

### Problem 3: Upload Fails
**Simptom**: Ne može da upload-uje, piše "Failed to connect"

**Rešenje**:
1. Drži **BOOT dugme** dok klikćeš Upload
2. Probaj drugi USB-C kabl
3. Probaj drugi USB port na računaru
4. Instaliraj CP210x USB driver (https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers)

---

### Problem 4: Strani Karakteri na Ekranu
**Simptom**: Ekran prikazuje noise ili random piksele

**Rešenje**:
1. Proveri pin konfiguraciju u `Setup212_LilyGo_T_Watch_S3.h`
2. Proveri da je **SPI_FREQUENCY** 40MHz (ne više!)
3. Smanji na 20MHz ako i dalje ne radi:
   ```cpp
   #define SPI_FREQUENCY  20000000
   ```

---

### Problem 5: Arduino IDE Ne Vidi Libraries

**Rešenje**:
1. **Sketch → Include Library → Manage Libraries**
2. Reinstaliraj TFT_eSPI, LVGL, XPowersLib
3. Restartuj Arduino IDE
4. Proveri da su biblioteke u:
   ```
   C:\Users\{tvoj_user}\Documents\Arduino\libraries\
   ```

---

## ✅ SUCCESS CRITERIA

**Firmware radi ispravno kada**:
- ✅ Vidiš color test pattern (red → green → blue)
- ✅ Vidiš tekst "T-WATCH S3" i "FACTORY TEST"
- ✅ Serial monitor prikazuje "SUCCESS! Display is working!"
- ✅ Backlight je upaljen i jasan

**Ako vidiš OVO** ✅ → **Hardware radi! Možemo praviti custom firmware!**

---

## 🚀 SLEDEĆI KORAK: Custom OBEDIO Firmware

Kada factory test radi, onda ćemo:

1. **Dodati WiFi** - Povezivanje na mrežu
2. **Dodati MQTT** - Komunikacija sa backend-om
3. **Dodati Touch** - Touch event handling
4. **Dodati Vibration** - Motor control
5. **Dodati OBEDIO UI** - Service request display

Ali **PRVO moramo da vidimo nešto na ekranu!** 🎯

---

## 📞 POMOĆ

**Ako ne uspeš da prikaže ništa na ekranu nakon ovih koraka**:

1. 📸 Slikaj Arduino IDE **Tools** meni (board settings)
2. 📋 Kopiraj **Serial Monitor** output
3. 📸 Slikaj **Libraries** folder (da vidim koje biblioteke imaš)
4. 💬 Javi mi tačno šta vidiš i šta ne vidiš

---

**Datum**: October 27, 2025
**Verzija**: 1.0 - Ultra Simple Factory Test
**Status**: ✅ Ready to Upload!
