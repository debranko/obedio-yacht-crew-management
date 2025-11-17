# 🔥 FIREBASE SETUP - UPUTSTVO

## Šta je Firebase?
Firebase je Google servis za push notifikacije. Android aplikacija koristi Firebase Cloud Messaging (FCM) da prima obaveštenja o novim service request-ima.

---

## ⚠️ VAŽNO
**Aplikacija će raditi i BEZ Firebase-a!** Push notifikacije neće raditi, ali sve ostale funkcije funkcionišu normalno:
- ✅ Login
- ✅ Service Requests
- ✅ Guests
- ✅ Locations
- ✅ WebSocket real-time updates
- ❌ Push notifikacije (kada je app zatvoren)

---

## 📝 KORAK PO KORAK SETUP (opciono)

### Korak 1: Kreiraj Firebase Projekat

1. **Idi na Firebase Console**
   - https://console.firebase.google.com/

2. **Klikni "Add project" (Dodaj projekat)**

3. **Unesi ime projekta**
   - Ime: `OBEDIO Yacht`
   - Klikni "Continue"

4. **Google Analytics**
   - Možeš da ostaviš uključeno ili isključiš (nije bitno)
   - Klikni "Continue"

5. **Kreiraj projekat**
   - Sačekaj 30-60 sekundi
   - Klikni "Continue" kada se završi

---

### Korak 2: Dodaj Android App

1. **Klikni na Android ikonu** (veliki Android logo)

2. **Unesi Package Name**
   ```
   com.obedio.app
   ```
   ⚠️ Mora biti TAČNO `com.obedio.app` - ne menjaj!

3. **App nickname** (opciono)
   ```
   OBEDIO Android
   ```

4. **Debug signing certificate SHA-1** (opciono - može se preskočiti)
   - Klikni "Register app"

---

### Korak 3: Preuzmi google-services.json

1. **Preuzmi `google-services.json` fajl**
   - Klikni na "Download google-services.json"
   - Sačuvaj fajl na Desktop

2. **Premesti fajl u projekat**
   - Kopiraj `google-services.json`
   - Zalepi u: `C:\Users\debra\OneDrive\Desktop\Luxury Minimal Web App Design\mobile\android\app\`

   **VAŽNO:** Fajl MORA biti u `app` folderu, NE u `android` folderu!

3. **Proveri lokaciju**
   ```
   mobile/
   └── android/
       └── app/
           ├── build.gradle.kts
           └── google-services.json  ← MORA BITI OVDE
   ```

4. **Klikni "Next" u Firebase Console**

---

### Korak 4: Dodaj Firebase SDK (već urađeno ✅)

Firebase SDK je već dodat u projekat, možeš kliknuti "Next" i "Continue to console".

---

### Korak 5: Testiraj Push Notifikacije

1. **Pokreni aplikaciju** na telefonu

2. **U Firebase Console:**
   - Idi na "Engage" → "Messaging"
   - Klikni "Send your first message"

3. **Kreiraj poruku:**
   - Notification title: `Test Notification`
   - Notification text: `Hello from Firebase!`
   - Klikni "Send test message"

4. **Dodaj FCM registration token:**
   - U Logcat-u (Android Studio) pronaći liniju sa FCM token
   - Kopiraj token
   - Zalepi u Firebase test message
   - Klikni "Test"

5. **Proveri telefon**
   - Treba da dobiješ notifikaciju!

---

## 🔧 BACKEND INTEGRACIJA (opciono)

Ako želiš da backend šalje push notifikacije, dodaj Server Key u backend `.env`:

1. **U Firebase Console:**
   - Project Settings (⚙️ ikona)
   - "Cloud Messaging" tab
   - Kopiraj "Server Key"

2. **U backend `.env` fajlu dodaj:**
   ```env
   FIREBASE_SERVER_KEY="tvoj-server-key-ovde"
   ```

3. **Restart backend servera**

---

## ❓ TROUBLESHOOTING

### Problem: "google-services.json not found"
**Rešenje:**
- Proveri da li je fajl u `app/` folderu, ne u `android/` folderu
- File → Sync Project with Gradle Files
- Rebuild projekat

### Problem: Ne dobijam notifikacije
**Rešenje:**
- Proveri da je aplikacija pokrenuta
- Proveri da su notifikacije omogućene u phone settings
- Proveri u Logcat-u da li ima FCM token

### Problem: "Default FirebaseApp is not initialized"
**Rešenje:**
- Dodaj `google-services.json` u `app/` folder
- Sync Gradle
- Rebuild projekat

---

## 📞 DODATNA POMOĆ

- Firebase dokumentacija: https://firebase.google.com/docs/android/setup
- FCM dokumentacija: https://firebase.google.com/docs/cloud-messaging

---

**Napomena:** Firebase setup je **OPCIONI** korak. Aplikacija radi normalno bez njega!
