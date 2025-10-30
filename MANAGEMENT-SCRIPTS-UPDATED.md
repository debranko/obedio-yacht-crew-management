# ✅ Management Scripts Updated - MQTT Integration

All OBEDIO management scripts have been updated to include Mosquitto MQTT broker management.

## Updated Files

### 1. [START-OBEDIO.bat](START-OBEDIO.bat)

**Changes:**
- Added Mosquitto MQTT broker as first service to start (before backend)
- Automatically creates container if it doesn't exist
- Shows MQTT status in startup summary
- Updated step counter: `[1/3]` MQTT, `[2/3]` Backend, `[3/3]` Frontend

**New Startup Flow:**
```
[1/3] Starting Mosquitto MQTT Broker...
      ✓ MQTT broker started!

[2/3] Starting Backend API Server (Port 8080)...
      ✓ Backend started successfully!

[3/3] Starting Frontend Web Server (Port 5173)...
      ✓ Frontend started successfully!
```

**Updated Summary Display:**
```
MQTT Broker:  mqtt://localhost:1883 (WebSocket: 9001)
Backend API:  http://localhost:8080/api
Frontend App: http://localhost:5173
MQTT Monitor: http://localhost:8888
Database:     PostgreSQL (active)
```

---

### 2. [STOP-OBEDIO.bat](STOP-OBEDIO.bat)

**Changes:**
- Added Mosquitto MQTT broker stop step
- Shows MQTT container status in shutdown summary
- Updated step counter: `[1/4]` Backend, `[2/4]` Frontend, `[3/4]` MQTT, `[4/4]` Cleanup

**New Shutdown Flow:**
```
[1/4] Stopping Backend API Server (Port 8080)...
[2/4] Stopping Frontend Server (Port 5173)...
[3/4] Stopping Mosquitto MQTT Broker...
      MQTT broker stopped.
[4/4] Cleaning up any remaining OBEDIO processes...
```

**Updated Summary Display:**
```
Backend API:  OFFLINE ✓
Frontend App: OFFLINE ✓
MQTT Broker:  OFFLINE ✓
Database:     Still running (PostgreSQL)
```

---

### 3. [RESTART-OBEDIO.bat](RESTART-OBEDIO.bat)

**Changes:**
- Stops and restarts Mosquitto MQTT broker
- Automatically creates container if it doesn't exist on restart
- Shows MQTT status in restart summary

**New Restart Flow:**
```
[Phase 1/2] Stopping current services...
  Stopping MQTT Broker...
  Stopping Backend API (Port 8080)...
  Stopping Frontend (Port 5173)...
  ✓ Services stopped

[Phase 2/2] Starting services...
  Starting MQTT Broker...
  Starting Backend API Server...
  ✓ Backend started
  Starting Frontend Web Server...
  ✓ Frontend started
```

**Updated Summary Display:**
```
MQTT Broker:  mqtt://localhost:1883 (WebSocket: 9001)
Backend API:  http://localhost:8080/api
Frontend App: http://localhost:5173
MQTT Monitor: http://localhost:8888
```

---

### 4. [OBEDIO-MENU.bat](OBEDIO-MENU.bat)

**Changes:**
- Added MQTT status check to main menu
- Added new menu option `[M] Open MQTT Monitor Dashboard`
- Updated system status display to show MQTT broker
- Added detailed MQTT status in "System Status Details"

**Updated Main Menu:**
```
========================================
   OBEDIO CONTROL PANEL
========================================
   Luxury Yacht Management System
========================================

System Status:
  MQTT:     ONLINE/OFFLINE
  Backend:  ONLINE/OFFLINE
  Frontend: ONLINE/OFFLINE

========================================

 [1] START System
 [2] STOP System
 [3] RESTART System
 [4] FORCE STOP (kill all Node processes)

 [5] Reset Database + Seed
 [6] Seed Database Only
 [7] Open Prisma Studio
 [8] Fix Admin Password

 [9] Open Web App (Browser)
 [M] Open MQTT Monitor Dashboard    ← NEW!
 [C] View Celebrity Guests
 [S] System Status Details

 [0] Exit
```

**New Menu Option [M]:**
- Opens MQTT Monitor Dashboard at http://localhost:8888
- Shows warning if MQTT broker is offline
- Returns to main menu after user presses any key

**Enhanced System Status Details:**
```
Mosquitto MQTT Broker:
  Status: ONLINE (Up 2 hours)
  TCP Port: 1883 (devices/backend)
  WebSocket: 9001 (browser/frontend)

Backend API Server (Port 8080):
  Status: ONLINE (PID: 12345)

Frontend Web Server (Port 5173):
  Status: ONLINE (PID: 67890)

PostgreSQL Database:
  Status: ONLINE

MQTT Monitor Dashboard (Port 8888):    ← NEW!
  Status: ONLINE

Prisma Studio (Port 5555):
  Status: OFFLINE
```

---

## Key Features

### 🔄 Automatic Container Management
All scripts automatically handle Docker container creation:
```batch
docker start obedio-mosquitto >nul 2>&1
if %errorlevel% neq 0 (
    docker run -d -p 1883:1883 -p 9001:9001 \
      -v "%~dp0mosquitto\config:/mosquitto/config" \
      --name obedio-mosquitto eclipse-mosquitto:2 >nul 2>&1
)
```

### ✅ Status Verification
Scripts verify MQTT broker status:
```batch
docker ps --filter "name=obedio-mosquitto" --format "{{.Status}}" | findstr "Up" >nul 2>&1
if %errorlevel%==0 set MQTT_STATUS=ONLINE
```

### 📊 Complete Service Management
All OBEDIO services are now fully integrated:
1. **Mosquitto MQTT Broker** (Port 1883 TCP, 9001 WebSocket)
2. **Backend API** (Port 8080)
3. **Frontend Web App** (Port 5173)
4. **MQTT Monitor Dashboard** (Port 8888)
5. **PostgreSQL Database**

---

## Usage

### Starting OBEDIO
```batch
START-OBEDIO.bat
```
Starts all services in correct order with MQTT broker first.

### Stopping OBEDIO
```batch
STOP-OBEDIO.bat
```
Gracefully stops all services including MQTT broker.

### Restarting OBEDIO
```batch
RESTART-OBEDIO.bat
```
Stops and restarts all services.

### Interactive Control Panel
```batch
OBEDIO-MENU.bat
```
Opens menu with options for:
- Start/Stop/Restart system
- Database management
- Open web app
- **Open MQTT Monitor Dashboard (NEW!)**
- View system status
- And more...

---

## Docker Requirements

**Important:** Docker must be installed and running for MQTT functionality.

If Docker is not available:
- Scripts will show warnings but continue
- Backend and Frontend will still work
- MQTT features will be unavailable

**Check Docker Status:**
```batch
docker ps
```

**Install Docker (if needed):**
1. Download Docker Desktop for Windows
2. Install and restart computer
3. Start Docker Desktop
4. Run `docker ps` to verify

---

## MQTT Integration Details

### Ports
- **1883** - TCP MQTT (for backend and future hardware devices)
- **9001** - WebSocket MQTT (for browser/frontend)

### Container Name
- `obedio-mosquitto`

### Volume Mount
- Local: `mosquitto/config`
- Container: `/mosquitto/config`
- Contains: `mosquitto.conf` configuration file

### Configuration
Location: `mosquitto/config/mosquitto.conf`

```conf
# TCP listener for devices
listener 1883
protocol mqtt
allow_anonymous true

# WebSocket listener for browser
listener 9001
protocol websockets
allow_anonymous true

# Persistence
persistence true
persistence_location /mosquitto/data/

# Logging
log_dest file /mosquitto/log/mosquitto.log
log_dest stdout
log_type all
log_timestamp true
```

---

## Testing the Updates

### 1. Test Start Script
```batch
START-OBEDIO.bat
```
Expected output:
```
[1/3] Starting Mosquitto MQTT Broker...
      ✓ MQTT broker started!
[2/3] Starting Backend API Server (Port 8080)...
      ✓ Backend started successfully!
[3/3] Starting Frontend Web Server (Port 5173)...
      ✓ Frontend started successfully!

MQTT Broker:  mqtt://localhost:1883 (WebSocket: 9001)
Backend API:  http://localhost:8080/api
Frontend App: http://localhost:5173
MQTT Monitor: http://localhost:8888
```

### 2. Test Menu
```batch
OBEDIO-MENU.bat
```
Expected output:
```
System Status:
  MQTT:     ONLINE
  Backend:  ONLINE
  Frontend: ONLINE
```

Press `M` to open MQTT Monitor Dashboard at http://localhost:8888

Press `S` to see detailed system status with MQTT info

### 3. Test Stop Script
```batch
STOP-OBEDIO.bat
```
Expected output:
```
[3/4] Stopping Mosquitto MQTT Broker...
      MQTT broker stopped.

MQTT Broker:  OFFLINE ✓
Backend API:  OFFLINE ✓
Frontend App: OFFLINE ✓
```

### 4. Verify MQTT Container
```batch
docker ps -a --filter "name=obedio-mosquitto"
```
Should show the container with status.

---

## Benefits

✅ **Integrated Management** - All services controlled together
✅ **Automatic Setup** - Container created if doesn't exist
✅ **Status Monitoring** - See MQTT status at a glance
✅ **Easy Access** - Quick menu option to open MQTT Monitor
✅ **Production Ready** - REAL MQTT, no hardcoded data
✅ **Developer Friendly** - Clear status messages and error handling

---

## Related Documentation

- [MQTT-SYSTEM-READY.md](MQTT-SYSTEM-READY.md) - Complete MQTT setup and testing guide
- [MQTT-BUTTON-SIMULATOR-SETUP.md](MQTT-BUTTON-SIMULATOR-SETUP.md) - Button simulator MQTT integration
- [START-OBEDIO.bat](START-OBEDIO.bat) - Updated start script
- [STOP-OBEDIO.bat](STOP-OBEDIO.bat) - Updated stop script
- [RESTART-OBEDIO.bat](RESTART-OBEDIO.bat) - Updated restart script
- [OBEDIO-MENU.bat](OBEDIO-MENU.bat) - Updated control panel menu

---

**All management scripts are now fully integrated with Mosquitto MQTT broker!** 🚀

Generated: 2025-10-24 08:22:13
