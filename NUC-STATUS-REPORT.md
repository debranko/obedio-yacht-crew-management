# NUC Status Report
**Generated:** 2025-11-16 11:59 UTC
**NUC IP:** 10.10.0.10

---

## 📁 Project Directory Location

**Path:** `/opt/obedio-yacht-crew-management/`

---

## 🌿 Git Branch

**Current Branch:** `deployment-fixes`

**Status:** Up to date with origin/deployment-fixes

**Recent Commits:**
- `c71301e` - Fix MQTT broker URL not being passed to frontend build
- `aa775a5` - Add MQTT WebSocket broker URL for frontend
- `6f6d79f` - Fix auth cookie for HTTP access

---

## 💡 Light Toggle Code

**Status:** ❌ **NOT FOUND**

**Checked Location:** `/opt/obedio-yacht-crew-management/backend/src/routes/`

**Available Routes:**
- activity-logs.ts
- assignments.ts
- auth.ts
- backup.ts
- crew-change-logs.ts
- crew.ts
- dashboard.ts
- device-discovery.ts
- devices.ts
- guests.ts
- locations.ts
- messages.ts
- notification-settings.ts
- role-permissions.ts
- service-categories.ts
- service-request-history.ts
- service-requests.ts
- settings.ts
- shifts.ts
- smart-buttons.ts
- system-settings.ts
- **transcribe.ts** ✅ (Voice-to-text exists!)
- upload.ts
- user-preferences.ts
- yacht-settings.ts

**Note:** No `lights.ts` or similar light toggle route found.

---

## 🐳 Current System Status

**Deployment Method:** Docker Compose (Production)

**Container Status:**

| Container | Status | Port | Health |
|-----------|--------|------|--------|
| obedio-backend | Running 16h | 3001 | ✅ HEALTHY |
| obedio-frontend | Running 16h | 3000 | ⚠️ UNHEALTHY |
| obedio-db (PostgreSQL) | Running 17h | 5432 | ✅ HEALTHY |
| obedio-mqtt (Mosquitto) | Running 17h | 1883, 9001 | ✅ HEALTHY |

**Issues:**
- Frontend container is UNHEALTHY (needs investigation)

---

## 📝 Summary

1. ✅ Project exists on NUC at `/opt/obedio-yacht-crew-management/`
2. ✅ Git branch: `deployment-fixes`
3. ❌ Light toggle code: **NOT PRESENT** (likely only in Windows `bmad` branch)
4. ⚠️ Status: Backend/DB/MQTT running, Frontend unhealthy

---

## 🔍 Additional Findings

**Voice-to-Text:** ✅ `transcribe.ts` route exists (OpenAI Whisper implementation already present on NUC)

**Docker Config:** `/opt/obedio-yacht-crew-management/docker-compose.prod.yml`

**Mounted Volumes:**
- `/opt/obedio-yacht-crew-management/backend/uploads` → `/app/uploads`
- `/opt/obedio-yacht-crew-management/backend/logs` → `/app/logs`
