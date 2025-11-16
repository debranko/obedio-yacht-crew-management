# 📱 OBEDIO ANDROID APP - UPUTSTVO ZA POKRETANJE

## Korak po korak vodič za neprogramere

---

## 📋 ŠTA VAM TREBA:
1. ✅ Android telefon (već imate)
2. ✅ Android Studio (već imate)
3. 📁 Fajlovi aplikacije (iz ovog foldera)
4. 🌐 IP adresa vašeg Obedio servera

---

## 🚀 KORAK 1: PRIPREMA ANDROID STUDIO

1. **Otvorite Android Studio**
   - Kliknite na ikonu Android Studio

2. **Otvorite projekat**
   - Kliknite na "Open" (ne "New Project")
   - Idite do foldera: `C:\Users\debra\OneDrive\Desktop\Luxury Minimal Web App Design\mobile\Android`
   - Kliknite "OK"

3. **Sačekajte da se projekat učita**
   - Videćete progres bar dole
   - Ovo može trajati 2-5 minuta prvi put
   - Android Studio će automatski skinuti sve potrebne biblioteke

---

## 🔧 KORAK 2: PROVERA IP ADRESE SERVERA

✅ **IP adresa je već konfigurisana!**

Trenutna konfiguracija:
- Backend URL: `http://192.168.5.150:8080/api`
- WebSocket URL: `ws://192.168.5.150:8080`
- MQTT URL: `tcp://192.168.5.150:1883`

**Ako želite da promenite IP adresu:**

1. **Pronađite fajl za izmenu**
   - U Android Studio, levo vidite listu fajlova
   - Otvorite: `app` → `build.gradle.kts`
   - Ili pritisnite `Ctrl + Shift + N` i ukucajte "build.gradle.kts"

2. **Pronađite linije sa IP adresama (oko linije 26-28)**
   ```kotlin
   buildConfigField("String", "BASE_URL", "\"http://192.168.5.150:8080/api\"")
   buildConfigField("String", "WS_URL", "\"ws://192.168.5.150:8080\"")
   buildConfigField("String", "MQTT_URL", "\"tcp://192.168.5.150:1883\"")
   ```

3. **Zamenite IP adresu**
   - Umesto `192.168.5.150` stavite IP adresu vašeg Obedio servera
   - **VAŽNO:** Promenite u SVE TRI linije!

4. **Sačuvajte fajl**
   - Pritisnite `Ctrl + S`
   - Kliknite "Sync Now" kada se pojavi gore

---

## 📱 KORAK 3: PRIPREMA TELEFONA

1. **Omogućite Developer Options**
   - Na telefonu idite u Settings
   - About phone
   - Tapnite 7 puta na "Build number"
   - Pojaviće se poruka "You are now a developer!"

2. **Uključite USB Debugging**
   - Settings → Developer options
   - Uključite "USB debugging"
   - Potvrdite sa "OK"

3. **Povežite telefon sa računarom**
   - Koristite USB kabl
   - Na telefonu će se pojaviti pitanje "Allow USB debugging?"
   - Kliknite "Allow"

---

## ▶️ KORAK 4: POKRETANJE APLIKACIJE

1. **U Android Studio**
   - Gore vidite zeleno dugme ▶️ (Play)
   - Pored njega treba da piše ime vašeg telefona
   - Ako ne vidite telefon, kliknite na padajući meni i izaberite ga

2. **Kliknite na Play dugme ▶️**
   - Aplikacija će se kompajlirati (1-2 minuta)
   - Automatski će se instalirati na telefon
   - Automatski će se pokrenuti

3. **Na telefonu**
   - Videćete Obedio login ekran
   - Username: `admin`
   - Password: `admin123`

---

## ❗ ČESTI PROBLEMI I REŠENJA

### Problem 1: "Gradle sync failed"
**Rešenje:**
- Kliknite "Try Again"
- Proverite internet konekciju
- File → Invalidate Caches → Invalidate and Restart

### Problem 2: Ne vidim telefon u Android Studio
**Rešenje:**
- Izvadite i vratite USB kabl
- Proverite da je USB debugging uključen
- Instalirajte drajvere za telefon sa sajta proizvođača

### Problem 3: Aplikacija se ruši pri pokretanju
**Rešenje:**
- Proverite da li je server pokrenut
- Proverite IP adresu u build.gradle.kts
- Telefon i server moraju biti na istoj mreži

### Problem 4: Ne mogu da se ulogujem
**Rešenje:**
- Proverite da backend radi: otvorite browser i idite na `http://VAŠ-IP:8080`
- Username: `admin` (malim slovima)
- Password: `admin123`

---

## 🎯 DODATNI SAVETI

1. **Za brže pokretanje ubuduće**
   - Kada jednom instalirate app, možete je otvarati direktno sa telefona
   - Ne morate svaki put kroz Android Studio

2. **Za testiranje bez USB kabla**
   - U Android Studio: Run → Edit Configurations
   - Installation Options → Install Flags: `-r -t`
   - Sada možete koristiti WiFi debugging

3. **Pravljenje APK fajla**
   - Build → Build Bundle(s) / APK(s) → Build APK(s)
   - APK će biti u: `app/build/outputs/apk/debug/app-debug.apk`
   - Možete ga poslati drugim telefonima

---

## 📞 DODATNA POMOĆ

Ako imate problema:
1. Proverite da li je Obedio server pokrenut
2. Proverite da su telefon i server na istoj WiFi mreži
3. Restartujte Android Studio
4. Restartujte telefon

---

**Srećno! 🚀**