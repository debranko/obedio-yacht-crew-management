# 🔍 Infrastructure Audit - Hardcoded URLs & Missing Services

**Date:** November 14, 2025
**Purpose:** Complete audit of all service dependencies and hardcoded configurations

---

## 🚨 **CRITICAL FINDINGS**

### **1. Hardcoded Service URLs**

#### **Backend (`backend/src/config/hardcoded-settings.ts`):**
```typescript
// Line 63: Primary server config
host: 'obedio-server.local',  // ❌ HARDCODED
websocket: 'ws://obedio-server.local:8080',  // ❌ HARDCODED

// Line 119: MQTT Broker
broker: 'mqtt://obedio-server.local:1883',  // ❌ HARDCODED
```

#### **Frontend Service Files:**
```typescript
// src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';  // ⚠️ Wrong port

// src/services/auth.ts (Line 20)
const API_BASE_URL = 'http://localhost:8080/api';  // ❌ HARDCODED, wrong port

// src/services/guests.ts (Line 46)
private static baseUrl = 'http://localhost:8080/api/guests';  // ❌ HARDCODED, wrong port

// src/services/locations.ts (Line 32)
private baseUrl = 'http://localhost:8080/api/locations';  // ❌ HARDCODED, wrong port

// src/services/websocket.ts (Line 103)
const serverUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8080';  // ⚠️ Wrong port
```

**ISSUE:**
- Backend runs on port **3001** (from docker-compose)
- Frontend expects port **8080**
- This will cause ALL API calls to fail!

---

## 🔧 **Missing Services**

### **1. MQTT Broker (Mosquitto) - MANDATORY**

**Evidence from your friend:**
> "Mosquitto is absolutely mandatory because that's how the button devices and watches exchange messages"

**Current Status:**
- ❌ NOT in docker-compose.prod.yml
- ✅ Referenced in backend/src/config/hardcoded-settings.ts
- ✅ Expected at: `mqtt://obedio-server.local:1883`

**Impact:**
- Device communication won't work
- Smart button presses won't be received
- Watch notifications can't be sent

---

## 📊 **Service Dependency Map**

### **What We Have:**
```
✅ PostgreSQL (obedio-db) - Port 5432
✅ Backend API (obedio-backend) - Port 3001
✅ Frontend Web (obedio-frontend) - Port 3000
✅ WebSocket (included in backend via Socket.IO)
```

### **What's Missing:**
```
❌ MQTT Broker (Mosquitto) - Port 1883
   └─ Needed for: ESP32 buttons, watches, device telemetry
```

### **What's Misconfigured:**
```
⚠️ Frontend API calls → Port 8080 (wrong!)
   Should be → Port 3001 (where backend actually runs)
```

---

## 🌐 **Network Architecture Issues**

### **Current Configuration:**
```
Frontend → http://localhost:8080/api  ❌ (Nothing listening here!)
Backend  → http://localhost:3001      ✅ (Actually running)
Database → postgresql://db:5432       ✅ (Working)
MQTT     → mqtt://obedio-server.local:1883  ❌ (Doesn't exist)
```

### **What Should Be:**
```
Frontend → http://10.10.0.10:3001/api  ✅ (or use nginx proxy)
Backend  → http://backend:3001         ✅ (Docker network)
Database → postgresql://db:5432        ✅ (Already correct)
MQTT     → mqtt://mosquitto:1883       ✅ (Need to add)
```

---

## 🔴 **Critical Fixes Needed**

### **Priority 1: Fix Port Mismatch (BLOCKING)**

All frontend service files are calling port 8080, but backend is on 3001!

**Files to fix:**
1. `src/services/api.ts` - Line 6
2. `src/services/auth.ts` - Line 20
3. `src/services/guests.ts` - Line 46
4. `src/services/locations.ts` - Line 32
5. `src/services/websocket.ts` - Line 103

**Solution:**
- Option A: Change hardcoded URLs to port 3001
- Option B: Use environment variables (better)
- Option C: Use nginx proxy in frontend container (best)

---

### **Priority 2: Add Mosquitto MQTT Broker (MANDATORY)**

**Add to docker-compose.prod.yml:**
```yaml
mosquitto:
  image: eclipse-mosquitto:2
  container_name: obedio-mqtt
  restart: unless-stopped
  ports:
    - "1883:1883"
    - "9001:9001"
  volumes:
    - ./mosquitto/config:/mosquitto/config
    - ./mosquitto/data:/mosquitto/data
    - ./mosquitto/log:/mosquitto/log
  networks:
    - obedio-network
```

**Create Mosquitto config:**
```
# mosquitto/config/mosquitto.conf
listener 1883
allow_anonymous true
persistence true
persistence_location /mosquitto/data/
log_dest file /mosquitto/log/mosquitto.log
```

---

### **Priority 3: Remove Hardcoded Hostnames**

**Replace in code:**
- `obedio-server.local` → `backend` (Docker service name)
- `mqtt://obedio-server.local:1883` → `mqtt://mosquitto:1883`

**OR use environment variables:**
```bash
MQTT_BROKER_URL=mqtt://mosquitto:1883
BACKEND_URL=http://backend:3001
```

---

## 🛠️ **Environment Variables Needed**

### **Backend (.env):**
```bash
# Already have
DATABASE_URL=postgresql://obedio_user:obedio_secure_pass_2025@db:5432/obedio_yacht_crew
JWT_SECRET=obedio-jwt-secret-exhibition-2025-ultra-secure
PORT=3001

# Need to add
MQTT_BROKER_URL=mqtt://mosquitto:1883
MQTT_CLIENT_ID=obedio-backend
MQTT_USERNAME=
MQTT_PASSWORD=
```

### **Frontend (.env):**
```bash
# Need to create
VITE_API_URL=http://10.10.0.10:3001/api
VITE_WS_URL=http://10.10.0.10:3001
```

---

## 📝 **File-by-File Fix List**

### **Files with Hardcoded Port 8080:**
- [ ] `src/services/api.ts` - Change 8080 → 3001 or use env var
- [ ] `src/services/auth.ts` - Change 8080 → 3001 or use env var
- [ ] `src/services/guests.ts` - Change 8080 → 3001 or use env var
- [ ] `src/services/locations.ts` - Change 8080 → 3001 or use env var
- [ ] `src/services/websocket.ts` - Change 8080 → 3001 or use env var

### **Files with Hardcoded obedio-server.local:**
- [ ] `backend/src/config/hardcoded-settings.ts` - Use env vars or Docker service names

### **Missing Service Configs:**
- [ ] `mosquitto/config/mosquitto.conf` - Create
- [ ] `docker-compose.prod.yml` - Add mosquitto service

---

## 🎯 **Recommended Fix Strategy**

### **Phase 1: Make Current Setup Work (15 min)**
1. Fix frontend port mismatch (8080 → 3001)
2. Build .env file for frontend with correct URLs
3. Rebuild frontend container
4. Test API connectivity

### **Phase 2: Add MQTT Support (20 min)**
1. Add Mosquitto to docker-compose
2. Create mosquitto config
3. Update backend MQTT connection code
4. Add MQTT env vars
5. Restart all containers

### **Phase 3: Remove All Hardcodes (15 min)**
1. Replace all hardcoded IPs with env vars
2. Update configs to use Docker service names
3. Test full system

---

## ✅ **Verification Commands**

After fixes:

```bash
# Check all services running
docker ps

# Test frontend can reach backend
curl http://10.10.0.10:3001/api/health

# Test MQTT broker
mosquitto_sub -h 10.10.0.10 -t "test" -v

# Check backend connects to MQTT
docker logs obedio-backend | grep -i mqtt

# Test frontend loads
curl http://10.10.0.10:3000
```

---

## 🚨 **Why Backend is "Full of Errors"**

Based on this audit, the errors are likely:

1. **Frontend cannot reach backend** (wrong port 8080)
2. **MQTT connection failures** (broker doesn't exist)
3. **WebSocket connection failures** (wrong port)
4. **API calls timeout** (port mismatch)

All fixable! Let's do it systematically.
