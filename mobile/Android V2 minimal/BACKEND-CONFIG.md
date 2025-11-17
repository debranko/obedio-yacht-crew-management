# Backend Konfiguracija - Obedio Android V2 Minimal

## ✅ Konfiguracija Kompletirana!

Android aplikacija je automatski konfigurisana da se povežu sa tvojim backend serverom.

---

## 🔧 Trenutna Konfiguracija

### Backend Server
- **Port**: 3333 (iz backend/.env)
- **URL**: http://localhost:3333
- **Health Check**: http://localhost:3333/api/health
- **WebSocket**: ws://localhost:3333
- **MQTT Broker**: mqtt://localhost:1883

### Android App Config
📁 Fajl: `app/src/main/java/com/obedio/minimal/data/AppConfig.kt`

```kotlin
// Za Android Emulator (default):
const val API_BASE_URL = "http://10.0.2.2:3333"
const val WEBSOCKET_URL = "http://10.0.2.2:3333"
const val MQTT_BROKER_URL = "tcp://10.0.2.2:1883"
```

**Napomena:** `10.0.2.2` je specijalna IP adresa koju Android emulator koristi za localhost tvog računara.

---

## 📱 Za Fizički Uređaj

Ako testiraj na pravom Android telefonu (ne emulatoru), moraš da koristiš IP adresu svog računara.

### Korak 1: Pronađi IP Adresu Računara

**Windows:**
```bash
ipconfig
```
Traži "IPv4 Address" (npr. `192.168.1.100`)

**Mac/Linux:**
```bash
ifconfig
```

### Korak 2: Izmeni AppConfig.kt

Otvori: `app/src/main/java/com/obedio/minimal/data/AppConfig.kt`

Izmeni URL-ove (zakomentariši emulator verziju, odkomentariši device verziju):

```kotlin
// Za Android Emulator:
// const val API_BASE_URL = "http://10.0.2.2:3333"

// Za fizički uređaj (koristi svoju IP):
const val API_BASE_URL = "http://192.168.1.100:3333" // Tvoja IP adresa
const val WEBSOCKET_URL = "http://192.168.1.100:3333"
const val MQTT_BROKER_URL = "tcp://192.168.1.100:1883"
```

**VAŽNO:** Računar i Android uređaj moraju biti na istoj Wi-Fi mreži!

---

## 🚀 Pokretanje Sistema

### 1. Pokreni Backend Server

```bash
cd backend
npm run dev
```

Očekuješ da vidiš:
```
🚀 Obedio Backend Server started successfully!

📡 Server URLs:
   • Host: 0.0.0.0:3333 (accessible from network)
   • Local: localhost:3333
   • Network: 192.168.x.x:3333

🔗 Endpoints:
   • API Health: http://localhost:3333/api/health
   • WebSocket: ws://localhost:3333
   • MQTT Monitor: http://localhost:8888
```

### 2. Proveri da Backend Radi

Otvori u browseru:
```
http://localhost:3333/api/health
```

Trebalo bi da vidiš:
```json
{
  "status": "healthy",
  "timestamp": "2025-..."
}
```

### 3. Proveri MQTT Broker

```bash
# Proveri da li Mosquitto radi
netstat -an | findstr 1883
```

Ako ne radi:
```bash
# Windows (ako je instaliran Mosquitto):
mosquitto -v -p 1883

# Ili instaliraj:
choco install mosquitto
```

### 4. Pokreni Android Aplikaciju

U Android Studio:
1. Otvori projekat "Android V2 minimal"
2. Klikni **Run** (zelena play ikonica)
3. Izaberi emulator ili uređaj
4. Aplikacija će se pokrenuti!

---

## 🔍 Testiranje Konekcije

### Očekivani Rezultat u Aplikaciji:

Kada sve radi:
- 🟢 **WebSocket**: Connected
- 🟢 **MQTT Broker**: Connected
- 🟢 **Backend API**: Reachable
- **Header**: "System Online" (zelena pozadina)

### Troubleshooting

#### Problem: "Cannot reach API"

**Proveri:**
1. Da li backend radi? → `http://localhost:3333/api/health`
2. Da li koristiš pravi port (3333)?
3. Da li koristiš emulator ili fizički uređaj?
   - Emulator: `10.0.2.2:3333`
   - Fizički: `192.168.x.x:3333`

#### Problem: "WebSocket disconnected"

**Proveri:**
1. Backend logove za greške
2. CORS podešavanja u backend-u
3. Da li WebSocket server radi na istom port-u kao API

#### Problem: "MQTT connection failed"

**Proveri:**
1. Da li Mosquitto broker radi:
   ```bash
   netstat -an | findstr 1883
   ```
2. Pokreni broker:
   ```bash
   mosquitto -v -p 1883
   ```

---

## 📊 Backend Endpoints

Tvoj backend ima sledeće endpoint-e:

### Health Check
```
GET http://localhost:3333/api/health
```

### Authentication
```
POST http://localhost:3333/api/auth/login
POST http://localhost:3333/api/auth/logout
```

### Service Requests
```
GET http://localhost:3333/api/service-requests
GET http://localhost:3333/api/service-requests/:id
POST http://localhost:3333/api/service-requests
```

### API Dokumentacija
```
http://localhost:3333/api-docs
```

---

## 🔐 Firewall Napomena

Ako koristiš fizički uređaj i ne možeš da se povežeš, možda treba da dozvoliš firewall pristup:

**Windows Firewall:**
1. Windows Security → Firewall & network protection
2. Advanced settings
3. Inbound Rules → New Rule
4. Port: 3333, 1883
5. Allow the connection

**Quick način:**
```bash
# Allow port 3333
netsh advfirewall firewall add rule name="Obedio Backend" dir=in action=allow protocol=TCP localport=3333

# Allow MQTT port 1883
netsh advfirewall firewall add rule name="Obedio MQTT" dir=in action=allow protocol=TCP localport=1883
```

---

## 📝 Quick Reference

| Šta | Vrednost |
|-----|----------|
| **Backend Port** | 3333 |
| **MQTT Port** | 1883 |
| **Emulator API URL** | http://10.0.2.2:3333 |
| **Fizički API URL** | http://[TVOJA-IP]:3333 |
| **Health Check** | /api/health |
| **Config File** | AppConfig.kt |

---

## ✅ Checklist Pre Pokretanja

- [x] Backend .env fajl ima PORT=3333
- [x] Android AppConfig.kt konfigurisano
- [ ] Backend server pokrenut (npm run dev)
- [ ] MQTT broker pokrenut (mosquitto)
- [ ] API health check works (http://localhost:3333/api/health)
- [ ] Android app build uspešan
- [ ] Testiranje u aplikaciji

---

**Sve je spremno! Pokreni backend server i Android aplikaciju će automatski moći da se poveže!** 🚀
