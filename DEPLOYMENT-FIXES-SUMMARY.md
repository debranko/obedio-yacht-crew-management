# Deployment Fixes Summary

This document summarizes all fixes applied to the `deployment-fixes` branch for the NUC exhibition deployment at `http://10.10.0.10:3000`.

## Issues Fixed

### 1. Database Being Cleared on Container Restart
**Commits:** `46deb07`, `5d17209`

**Problem:**
- Every time the backend container restarted, all database data was deleted
- `docker-entrypoint.sh` was running `prisma db push --accept-data-loss`
- Seed script only created admin/crew users, no locations or guests

**Fix:**
- Changed `--accept-data-loss` to `--skip-generate` in docker-entrypoint.sh
- Replaced seed.js with comprehensive version creating:
  - 18 locations (cabins, common areas, decks)
  - 4 crew members (interior stewardesses)
  - 3 demo guests (owner, VIP, guest)
  - 10 smart button devices with MAC addresses
- Fixed device status enum value (`online` instead of `active`)

**Files Modified:**
- `backend/docker-entrypoint.sh`
- `backend/prisma/seed.js`

---

### 2. Auth Cookies Not Working Over HTTP
**Commit:** `6f6d79f`

**Problem:**
- Cookies set with `secure: true` which requires HTTPS
- Exhibition setup uses HTTP (`http://10.10.0.10:3000`)
- Browsers refused to send cookies, causing all API requests to fail with "Auth required"

**Fix:**
- Changed all cookie configurations to `secure: false` to allow HTTP
- Updated login, refresh token, and logout cookie settings

**Files Modified:**
- `backend/src/routes/auth.ts` (3 cookie locations)

**Result:**
- ✅ Login working
- ✅ Locations and guests API accessible
- ✅ Dashboard preferences save working

---

### 3. MQTT Connection to Wrong Host
**Commit:** `7dceced`

**Problem:**
- Backend services had hardcoded fallback `mqtt://localhost:1883`
- Should use `mqtt://mosquitto:1883` (Docker container name)
- MQTT connection failures in backend logs

**Fix:**
- Updated MQTT broker URL fallback in 3 backend files
- Added `MQTT_BROKER` environment variable to docker-compose.prod.yml

**Files Modified:**
- `backend/src/services/mqtt.service.ts`
- `backend/src/services/mqtt-monitor.ts`
- `backend/src/routes/smart-buttons.ts`
- `docker-compose.prod.yml`

**Result:**
- ✅ Backend successfully connects to Mosquitto broker
- ✅ MQTT subscriptions working

---

### 4. Frontend MQTT WebSocket Connection
**Commits:** `aa775a5`, `c71301e`

**Problem:**
- Frontend trying to connect to `ws://localhost:9001` (user's machine)
- Should connect to `ws://10.10.0.10:9001` (NUC's MQTT WebSocket)
- Button presses not creating service requests

**Fix:**
- Added `VITE_MQTT_BROKER: ws://10.10.0.10:9001` build arg to docker-compose.prod.yml
- Added `ARG` and `ENV` for `VITE_MQTT_BROKER` in Dockerfile.frontend
- MQTT broker URL now baked into frontend JavaScript at build time

**Files Modified:**
- `docker-compose.prod.yml`
- `Dockerfile.frontend`

**Result:**
- ✅ Frontend connects to MQTT broker
- ✅ Button presses create service requests
- ✅ Service request popups appear
- ✅ Requests visible in Service Requests list

---

### 5. Docker Build Issues
**Commits:** `e0838cb`, `7fa377a`

**Problem:**
- `npm ci` failing with "requires package-lock.json"
- package-lock.json was in .dockerignore
- bmad's multi-stage Dockerfile incompatible with deployment

**Fix:**
- Reverted to simpler working Dockerfile
- Commented out package-lock.json in .dockerignore
- Ensured npm ci has required files

**Files Modified:**
- `backend/Dockerfile`
- `backend/.dockerignore`

---

### 6. CORS Blocking Login
**Commit:** `80c1a18`

**Problem:**
- Backend reads `CORS_ORIGIN` env var in production
- Variable was missing from docker-compose
- Login returning HTTP 500 with "Not allowed by CORS"

**Fix:**
- Added `CORS_ORIGIN: http://10.10.0.10:3000,http://localhost:3000` to docker-compose.prod.yml

**Files Modified:**
- `docker-compose.prod.yml`

---

### 7. Port Mismatches After Merge
**Commit:** `5a1c377` (merge commit)

**Problem:**
- After merging bmad branch, some files still referenced port 8080
- Should use port 3001 for backend

**Fix:**
- Fixed error messages in AuthContext.tsx
- Fixed WebSocket URL in websocket.ts

**Files Modified:**
- `src/contexts/AuthContext.tsx`
- `src/services/websocket.ts`

---

## Architecture Notes

### Why `ws://10.10.0.10:9001` and Not `ws://localhost:9001`?

**Frontend runs in the browser, not in Docker:**
- User accesses `http://10.10.0.10:3000` in their browser
- Browser tries to connect to MQTT WebSocket
- `ws://localhost:9001` would try user's own machine ❌
- `ws://mosquitto:9001` can't be resolved by browser ❌
- **`ws://10.10.0.10:9001` is correct** ✅ (NUC's external IP)

**Backend containers use internal networking:**
- Backend uses `mqtt://mosquitto:1883` (container name) ✅
- This is already correctly configured

### HTTP vs HTTPS

The exhibition setup uses HTTP (`http://10.10.0.10:3000`), not HTTPS:
- Auth cookies: `secure: false` ✅
- MQTT WebSocket: `ws://` (not `wss://`) ✅
- All URLs use `http://` protocol ✅

For production with HTTPS, these would need to be updated.

---

## Database Schema

### Current Data (After Seed)
- **19 locations** - cabins, common areas, decks
- **21 guests** - owner, VIP, and regular guests
- **4 crew members** - Sarah Johnson, Emma Williams, Lisa Brown, Maria Garcia
- **10 smart button devices** - assigned to cabin locations

### Login Credentials
- **Admin:** username: `admin`, password: `admin123`
- **Crew:** username: `crew`, password: `crew123`

---

## Deployment Process

### To Deploy Latest Changes on NUC:

```bash
# SSH to NUC
ssh obedio@10.10.0.10

# Navigate to project
cd /opt/obedio-yacht-crew-management

# Pull latest changes
git pull origin deployment-fixes

# Rebuild and restart containers
docker compose -f docker-compose.prod.yml up -d --build

# Check logs
docker compose -f docker-compose.prod.yml logs -f
```

### To Rebuild Just Frontend (After Code Changes):

```bash
docker compose -f docker-compose.prod.yml up -d --build --no-deps frontend
```

### To Rebuild Just Backend (After Code Changes):

```bash
docker compose -f docker-compose.prod.yml up -d --build --no-deps backend
```

---

## Service Endpoints

### Frontend
- URL: `http://10.10.0.10:3000`
- Container: `obedio-frontend`
- Port: 3000 → 80 (nginx)

### Backend API
- URL: `http://10.10.0.10:3001/api`
- Container: `obedio-backend`
- Port: 3001 → 3001

### WebSocket (Socket.IO)
- URL: `http://10.10.0.10:3001`
- Container: `obedio-backend`
- Port: 3001 (same as API)

### MQTT Broker (Mosquitto)
- MQTT: `mqtt://10.10.0.10:1883`
- WebSocket: `ws://10.10.0.10:9001`
- Container: `obedio-mqtt`
- Ports: 1883 (MQTT), 9001 (WebSocket)

### Database (PostgreSQL)
- Host: `10.10.0.10:5432`
- Container: `obedio-db`
- Port: 5432 → 5432
- Database: `obedio_yacht_crew`
- User: `obedio_user`
- Password: `obedio_secure_pass_2025`

---

## Troubleshooting

### Button Presses Not Working
1. Check browser console for MQTT connection errors
2. Verify MQTT broker URL: should show `ws://10.10.0.10:9001`
3. Hard refresh browser (Ctrl+F5) to clear cached JavaScript
4. Check backend logs: `docker compose -f docker-compose.prod.yml logs backend`

### Login Not Working
1. Check if auth cookie is being set (Browser DevTools → Application → Cookies)
2. Verify CORS_ORIGIN is set in docker-compose.prod.yml
3. Check backend logs for CORS errors

### Database Empty After Restart
1. Check docker-entrypoint.sh doesn't have `--accept-data-loss`
2. Verify Docker volume exists: `docker volume ls | grep dbdata`
3. Re-run seed: `docker compose exec backend npx prisma db seed`

### MQTT Not Connecting (Backend)
1. Check Mosquitto is running: `docker ps | grep mosquitto`
2. Verify MQTT_BROKER env var: `docker compose config`
3. Check backend uses `mqtt://mosquitto:1883` not `localhost`

---

## Files Changed Summary

### Configuration Files
- `docker-compose.prod.yml` - Added CORS_ORIGIN, MQTT_BROKER, VITE_MQTT_BROKER
- `Dockerfile.frontend` - Added VITE_MQTT_BROKER ARG and ENV
- `backend/.dockerignore` - Allowed package-lock.json
- `backend/docker-entrypoint.sh` - Fixed database persistence

### Backend Source
- `backend/src/routes/auth.ts` - Fixed cookie secure flag
- `backend/src/services/mqtt.service.ts` - Fixed MQTT broker URL
- `backend/src/services/mqtt-monitor.ts` - Fixed MQTT broker URL
- `backend/src/routes/smart-buttons.ts` - Fixed MQTT broker URL
- `backend/prisma/seed.js` - Comprehensive demo data

### Frontend Source
- `src/contexts/AuthContext.tsx` - Fixed port reference
- `src/services/websocket.ts` - Fixed port reference

---

## System Status

✅ **All Systems Operational**

- Frontend: Running (http://10.10.0.10:3000)
- Backend: Running (http://10.10.0.10:3001)
- Database: Running (PostgreSQL 15)
- MQTT Broker: Running (Mosquitto 2)
- Auth: Working (HTTP-only cookies)
- WebSocket: Connected (Socket.IO)
- MQTT WebSocket: Connected (ws://10.10.0.10:9001)
- Button Simulator: Creating service requests ✓
- Service Request Popups: Displaying ✓
- Database Persistence: Fixed ✓

---

**Last Updated:** 2025-11-15
**Branch:** deployment-fixes
**Latest Commit:** c71301e
**Deployment Target:** NUC Server at 10.10.0.10
