# 🎯 WEAR OS DEVELOPMENT SETUP - TicWatch Pro 5
## MVP: Incoming Request Notification Only

**Datum**: October 27, 2025
**Device**: TicWatch Pro 5
**OS**: Windows
**Goal**: Prikazati full-screen incoming service request sa Accept/Delegate buttons

---

## 📦 KORAK 1: Instalacija Softvera (Windows)

### **1.1 Android Studio**

1. **Preuzmi Android Studio**:
   - Idi na: https://developer.android.com/studio
   - Klikni "Download Android Studio"
   - Preuzmi Windows installer (.exe file)
   - Veličina: ~1GB download

2. **Instaliraj**:
   ```
   ✓ Run installer
   ✓ Accept license
   ✓ Choose "Standard" installation
   ✓ Accept all SDK components
   ✓ Wait 10-15 minutes (downloads SDK, emulator, etc.)
   ```

3. **Prvi start**:
   - Otvori Android Studio
   - Biće "Welcome" screen
   - Idi na: **More Actions → SDK Manager**

4. **Instaliraj dodatne SDK komponente**:

   **SDK Platforms tab**:
   ```
   ☑ Android 14.0 (API 34) - Latest
   ☑ Android 13.0 (API 33) - TicWatch Pro 5 uses this
   ☑ Android 11.0 (API 30) - Wear OS minimum
   ```

   **SDK Tools tab** (scroll down i check-uj ove):
   ```
   ☑ Android SDK Build-Tools (latest)
   ☑ Android SDK Platform-Tools
   ☑ Android SDK Tools
   ☑ Android Emulator
   ☑ Google Play services
   ☑ Google USB Driver (IMPORTANT za Windows!)
   ```

   **Wear OS Tools** (KRITIČNO!):
   ```
   ☑ Wear OS Emulator system image (API 30, 33)
   ```

5. **Apply i čekaj** (5-10 minuta download)

---

### **1.2 Java Development Kit (JDK)**

Android Studio uključuje JDK, ali proveri:

1. Otvori Command Prompt:
   ```cmd
   java -version
   ```

2. Ako nema Java ili je verzija < 17:
   - Android Studio → File → Settings → Build, Execution, Deployment → Build Tools → Gradle
   - **Gradle JDK**: Select "Embedded JDK (Android Studio)"

---

## 📱 KORAK 2: TicWatch Pro 5 Developer Mode

### **2.1 Enable Developer Options na satu**

1. **Na TicWatch-u**:
   - Swipe down from top (notifications)
   - Tap ⚙️ **Settings**
   - Scroll down → Tap **System**
   - Tap **About**
   - Tap **Build number** **7 puta** (brzo!)
   - Videćeš poruku: "You are now a developer!"

2. **Enable Developer Options**:
   - Nazad u **Settings**
   - Sada vidiš **Developer options** (novi meni)
   - Tap **Developer options**

3. **Enable ADB Debugging**:
   ```
   ☑ Developer options (toggle ON)
   ☑ ADB debugging (toggle ON)
   ☑ Debug over Wi-Fi (toggle ON) - OPTIONAL ali preporučujem
   ```

4. **OPTIONAL - Keep screen awake**:
   ```
   ☑ Stay awake (sat neće lock-ovati dok je na charging-u)
   ```

---

### **2.2 Spoji TicWatch sa računarom**

**Opcija A: USB Cable (Jednostavnija za početak)**

TicWatch Pro 5 koristi **magnetni charging dock**. Problem: Ne možeš direktno USB konekciju!

**REŠENJE: Debug preko WiFi!**

---

**Opcija B: ADB over WiFi (PREPORUČUJEM)**

1. **Proveri WiFi konekciju**:
   - TicWatch i računar moraju biti na **ISTOJ WiFi mreži**
   - Na TicWatch-u: Settings → Connectivity → Wi-Fi
   - Proveri koja je mreža connected

2. **Na TicWatch-u**:
   - Settings → Developer options
   - Tap **Debug over Wi-Fi**
   - Videćeš IP adresu, npr: `192.168.1.100:5555`
   - **ZAPIŠI OVU ADRESU!**

3. **Na računaru** (otvori Command Prompt):
   ```cmd
   cd C:\Users\debra\AppData\Local\Android\Sdk\platform-tools
   adb connect 192.168.1.100:5555
   ```

   (Zameni `192.168.1.100:5555` sa IP adresom sa sata!)

4. **Na TicWatch-u će iskočiti dialog**:
   ```
   "Allow USB debugging from this computer?"

   [CANCEL]  [OK]
   ```

   Tap **OK** i check-uj **"Always allow from this computer"**

5. **Proveri konekciju**:
   ```cmd
   adb devices
   ```

   Trebao bi videti:
   ```
   List of devices attached
   192.168.1.100:5555    device
   ```

✅ **Ako vidiš "device" - uspešno spojeno!**

---

## 🛠️ KORAK 3: Kreiraj Wear OS Projekat

Sad ćemo kreirati projekat u Android Studio.

1. **Android Studio → New Project**

2. **Select "Wear OS" template**:
   ```
   Phone and Tablet tab → Skip
   Wear OS tab → Select "Empty Wear OS App"
   ```

3. **Configure Project**:
   ```
   Name:                OBEDIO Crew Watch
   Package name:        com.obedio.crewwatch
   Save location:       C:\Users\debra\OneDrive\Desktop\Luxury Minimal Web App Design\wear-os-app
   Language:            Kotlin
   Minimum SDK:         API 30 (Wear OS 3.0)
   ```

4. **Finish** - Android Studio će generisati projekat

---

## 🎨 KORAK 4: Basic App Structure (dolazi sledeće)

Sada kada imaš:
- ✅ Android Studio instaliran
- ✅ TicWatch u developer mode
- ✅ ADB konekcija uspostavljena
- ✅ Prazan Wear OS projekat kreiran

Sledeći korak:
1. Napraviti UI za incoming request notifikaciju
2. Dodati Accept/Delegate buttons
3. Povezati sa OBEDIO backendom
4. Testirati na TicWatch-u

---

## ⚠️ Troubleshooting

### Problem: "adb is not recognized as an internal or external command"

**Rešenje**: Dodaj Android SDK platform-tools u PATH:

1. Otvori System Environment Variables:
   ```
   Windows Key → Search "environment" → Edit system environment variables
   ```

2. Klikni **Environment Variables** button

3. Под **System variables**, find **Path**, click **Edit**

4. Click **New** i dodaj:
   ```
   C:\Users\debra\AppData\Local\Android\Sdk\platform-tools
   ```

5. Click **OK** na sve

6. **Zatvori i ponovo otvori Command Prompt**

7. Probaj ponovo:
   ```cmd
   adb devices
   ```

---

### Problem: "adb connect" ne radi

**Rešenje 1**: Proveri Firewall
- Windows Defender Firewall može blokirati ADB
- Privremeno disable Firewall i probaj ponovo

**Rešenje 2**: Restart ADB server
```cmd
adb kill-server
adb start-server
adb connect 192.168.1.100:5555
```

**Rešenje 3**: Proveri da li je TicWatch i dalje na istoj WiFi mreži

---

### Problem: Android Studio ne vidi TicWatch

1. Run → Select Device → (TicWatch se ne pojavljuje)

**Rešenje**:
```cmd
adb devices
```

Ako vidiš device, ali Android Studio ne vidi:
- File → Invalidate Caches → Invalidate and Restart

---

## 📞 Javi kada stigneš do ovde!

Posle KORAK 3, javi mi i krenem sa implementacijom incoming request notifikacije.
