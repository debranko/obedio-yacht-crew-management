# 🚨 OBEDIO STRICT DEVELOPMENT RULES 🚨

## ⛔ THIS IS A SERVER APPLICATION - NOT A DEMO!

**OBEDIO is a PRODUCTION SERVER that will be installed on a Mini PC and serve REAL HARDWARE DEVICES across a yacht network.**

---

## 🔴 ABSOLUTE FORBIDDEN PRACTICES

### 1. **NO HARDCODED DATA - EVER!**
```typescript
// ❌ FORBIDDEN
const locations = ["Master Suite", "Guest Cabin"];
const defaultUser = { name: "John Doe" };
const mockDevices = [...];

// ✅ REQUIRED
const locations = await prisma.location.findMany();
const user = await prisma.user.findUnique({ where: { id } });
const devices = await prisma.device.findMany();
```

### 2. **NO MOCK/FAKE/TEST DATA IN PRODUCTION CODE**
```typescript
// ❌ FORBIDDEN
const mockServiceRequest = { id: "123", status: "pending" };
const fakeGuest = { name: "Test Guest" };
const dummyData = generateTestData();

// ✅ REQUIRED
const serviceRequest = await prisma.serviceRequest.create({ data: {...} });
const guest = await prisma.guest.findUnique({ where: { id } });
```

### 3. **NO LOCAL-ONLY FEATURES**
```typescript
// ❌ FORBIDDEN
localStorage.setItem('devices', JSON.stringify(devices));
const settings = JSON.parse(localStorage.getItem('settings'));

// ✅ REQUIRED
await fetch('/api/user-preferences', { method: 'PUT', body: ... });
const { data: settings } = await fetch('/api/settings');
```

---

## ✅ MANDATORY REQUIREMENTS

### 1. **ALL DATA FROM DATABASE**
- **Locations**: PostgreSQL via Prisma
- **Guests**: PostgreSQL via Prisma  
- **Devices**: PostgreSQL via Prisma
- **Settings**: PostgreSQL via Prisma
- **Service Requests**: PostgreSQL via Prisma
- **User Preferences**: PostgreSQL via Prisma

### 2. **REAL-TIME UPDATES VIA WEBSOCKET**
- All clients must receive updates when data changes
- No polling except as fallback
- WebSocket is primary communication method

### 3. **MQTT FOR HARDWARE INTEGRATION**
- Real MQTT broker (Mosquitto)
- Real topics for real devices
- Must handle offline/online scenarios
- Must queue messages when devices are offline

### 4. **SERVER MUST WORK HEADLESS**
- Backend API must function without frontend
- ESP32 devices connect directly to server
- iOS/Android apps connect to server
- Multiple frontends can connect simultaneously

---

## 🏗️ ARCHITECTURE REQUIREMENTS

### 1. **Client-Server Architecture**
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   ESP32 Buttons │     │ iOS/Android App │     │  Web Dashboard  │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │ MQTT                  │ HTTP/WS                │ HTTP/WS
         │                       │                        │
    ┌────▼────────────────────────▼────────────────────────▼─────┐
    │                      OBEDIO SERVER                          │
    │  - Express API                                              │
    │  - WebSocket Server                                         │
    │  - MQTT Service                                            │
    │  - PostgreSQL Database                                     │
    └─────────────────────────────────────────────────────────────┘
```

### 2. **Database is Single Source of Truth**
- Frontend NEVER generates IDs
- Frontend NEVER stores permanent data
- All state changes go through API
- Database triggers real-time updates

### 3. **API-First Development**
- Backend API must be complete and tested
- Frontend is just one of many clients
- API must support all client types
- Swagger documentation must be accurate

---

## 📋 DEVELOPMENT CHECKLIST

Before writing ANY code, ask yourself:

1. ❓ **Where does this data come from?**
   - ✅ Database via API
   - ❌ Hardcoded/Mock/Local

2. ❓ **Will this work when installed on a yacht's mini PC?**
   - ✅ Yes, uses server API
   - ❌ No, requires local access

3. ❓ **Can ESP32/Mobile devices use this feature?**
   - ✅ Yes, via MQTT/API
   - ❌ No, web-only implementation

4. ❓ **What happens when device is offline?**
   - ✅ Queued/Cached appropriately
   - ❌ Fails silently

5. ❓ **Is this production-ready?**
   - ✅ Yes, handles errors, logs properly
   - ❌ No, has console.logs, no validation

---

## 🚀 DEPLOYMENT REALITY CHECK

**This server will be:**
- Installed on a Mini PC on a yacht
- Running 24/7 without keyboard/monitor
- Serving multiple ESP32 buttons
- Serving crew mobile devices
- Handling real guest requests
- Managing real crew assignments
- Integrating with yacht systems

**There is NO room for:**
- Mock data
- Hardcoded values
- Local-only features
- Development shortcuts
- "It works on my machine" attitudes

---

## 💡 THINK LIKE A SERVER DEVELOPER

1. **Your code runs on a remote machine**
2. **Multiple clients connect from different devices**
3. **Network can be unreliable (yacht at sea)**
4. **Hardware devices depend on your API**
5. **Real people's comfort depends on reliability**

---

## ⚠️ FINAL WARNING

**Every line of code must be production-ready.**

If you're unsure, ask:
- "Will this work on a headless server?"
- "Can an ESP32 use this feature?"
- "What if 10 devices connect at once?"
- "What happens during network issues?"

**NO EXCEPTIONS. NO SHORTCUTS. PRODUCTION ONLY.**

---

*This document is mandatory reading for anyone working on OBEDIO.*