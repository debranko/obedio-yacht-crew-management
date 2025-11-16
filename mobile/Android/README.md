# 📱 OBEDIO ANDROID APP

Modern Android aplikacija za upravljanje OBEDIO yacht service requestima.

---

## ✅ ŠTA JE POPRAVLJENO

### 1. Backend Refresh Token ✅
- Dodao refreshToken u /api/auth/login response
- Dodao refreshToken u /api/auth/refresh response
- Token expiry: Access token 7 dana, Refresh token 30 dana
- Automatski refresh kada token expira

### 2. Build Configuration ✅
- Dodao manifestPlaceholders za usesCleartextTraffic
- Debug build: HTTP dozvoljen (za local development)
- Release build: HTTPS only (za production)

### 3. Admin User Credentials ✅
- Username: admin
- Password: admin123
- Testiran i radi

### 4. Gradle Wrapper Setup ✅
- Kreirao gradle-wrapper.properties (Gradle 8.4)
- Preuzeo gradle-wrapper.jar
- Kreirao gradlew.bat za Windows
- Kreirao gradlew za Mac/Linux
- Ažurirao plugin verzije (Android 8.5.0, Kotlin 1.9.24, Hilt 2.51.1)
- Ispravio plugin ID za kotlinx-serialization

### 5. IP Adresa Konfiguracija ✅
- Backend URL: http://192.168.5.150:8080/api
- WebSocket URL: ws://192.168.5.150:8080
- MQTT URL: tcp://192.168.5.150:1883
- Sve URL-ove konfigurisano u app/build.gradle.kts

---

## 🚀 KAKO POKRENUTI

1. Otvori Android Studio → Open → mobile/android
2. Sačekaj Gradle Sync (2-5 minuta)
3. Poveži telefon via USB
4. Klikni Play ▶️
5. Login: admin / admin123

---

Detaljnije informacije u UPUTSTVO-ZA-POKRETANJE.md

