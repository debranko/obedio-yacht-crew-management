# Port Configuration Issues & Fixes

## 🔴 CRITICAL: Port Misalignment Found

### Current Issues:

**1. Development Environment (What you're running now):**
- Frontend: `http://localhost:5173` (Vite)
- Backend: `http://localhost:8080` (Express)
- Database: `localhost:5432` (PostgreSQL)
- MQTT Monitor: `http://localhost:8888`

**2. API Service Files Using WRONG Ports:**

| File | Current Port | Should Be |
|------|--------------|-----------|
| `src/services/api.ts:5` | **3001** ❌ | **8080** ✅ |
| `src/contexts/AuthContext.tsx:27` | **8080** ✅ | **8080** ✅ |
| `src/services/websocket.ts` | Uses env var | **8080** ✅ |

**3. Docker Configuration (Not currently running):**
- Frontend Container: `http://localhost:8080` (Nginx)
- Backend Container: `http://localhost:3001` (Express)
- Database Container: `localhost:5432` (PostgreSQL)
- MQTT Container: `localhost:1883` (Mosquitto)

---

## Fix #1: Update src/services/api.ts

**Problem:** Hardcoded port 3001 but backend runs on 8080

**Current Code (line 5):**
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
```

**Fixed Code:**
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
```

---

## Fix #2: Create .env for Frontend

Create `.env` in root directory:
```env
# Development
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=http://localhost:8080

# Production (Docker)
# VITE_API_URL=http://localhost:3001/api
# VITE_WS_URL=http://localhost:3001
```

---

## Docker Status Explanation

### What Was Created:
- ✅ `docker-compose.yml` - Complete multi-container setup
- ✅ `Dockerfile` (root) - Frontend container build
- ✅ `backend/Dockerfile` - Backend container build
- ✅ `.env.docker.example` - Docker environment template
- ✅ `nginx.conf` - Nginx web server config

### What Docker Does:
When you run `docker-compose up`, it creates 4 containers:

1. **postgres** - PostgreSQL database (port 5432)
2. **mqtt** - MQTT broker for ESP32 buttons (port 1883)
3. **backend** - Node.js API server (port 3001)
4. **frontend** - Nginx serving React app (port 8080)

### Why You're Not Using Docker Now:
You're running in **development mode** with:
- `npm run dev` (frontend on port 5173)
- `cd backend && npm run dev` (backend on port 8080)

This is CORRECT for development! Docker is for production deployment.

---

## Recommended Configuration

### Option A: Development (Current - Recommended)
**Use this while developing:**
```
Frontend: http://localhost:5173 (Vite hot reload)
Backend: http://localhost:8080 (tsx watch mode)
Database: localhost:5432 (local PostgreSQL)
```

**API Configuration:**
- All API files should use: `http://localhost:8080/api`

### Option B: Docker (Production)
**Use this for deployment:**
```
Frontend: http://localhost:8080 (Nginx)
Backend: http://localhost:3001 (Docker internal)
Database: postgres:5432 (Docker internal)
```

**API Configuration:**
- Use environment variable: `VITE_API_URL=http://localhost:3001/api`

---

## Quick Fixes Needed

1. **Fix api.ts port** (CRITICAL)
2. **Create .env file** (OPTIONAL but recommended)
3. **Verify all API calls work** (TEST)

After these fixes, your app will work correctly in development mode.
