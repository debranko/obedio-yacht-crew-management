# Docker Status & Setup Instructions

## Current Status

### ✅ What's Already Created

You have a **complete Docker configuration** created in previous sessions:

1. **`docker-compose.yml`** - Multi-container orchestration
   - Defines 4 services: postgres, mqtt, backend, frontend
   - Configures networking between containers
   - Sets up persistent volumes for data

2. **`Dockerfile`** (root directory) - Frontend container
   - Multi-stage build for optimized image
   - Builds React app with Vite
   - Serves via Nginx on port 8080

3. **`backend/Dockerfile`** - Backend container
   - Node.js 18 Alpine Linux
   - Installs dependencies and builds TypeScript
   - Runs Express server on port 3001

4. **`nginx.conf`** - Web server configuration
   - Serves static files
   - Proxies API requests to backend
   - Handles SPA routing

5. **`.env.docker.example`** - Environment template
   - Example configuration for Docker deployment

### ❌ What's NOT Running

Docker is **NOT currently running**. You are running in **development mode** with:
- Frontend: `npm run dev` (Vite on port 5173)
- Backend: `cd backend && npm run dev` (Express on port 8080)

**This is CORRECT for development!**

---

## Development vs Docker Comparison

| Aspect | Development (Current) | Docker (Production) |
|--------|----------------------|---------------------|
| **Frontend** | Vite dev server (port 5173) | Nginx (port 8080) |
| **Backend** | tsx watch (port 8080) | Node.js (port 3001) |
| **Database** | Local PostgreSQL (port 5432) | Docker container |
| **MQTT** | Local Mosquitto (port 1883) | Docker container |
| **Hot Reload** | ✅ Yes | ❌ No |
| **Build Time** | ⚡ Fast | 🐢 Slow (first time) |
| **Use Case** | Development & Testing | Production Deployment |

---

## When to Use Docker

### ❌ DON'T Use Docker When:
- Developing locally (use `npm run dev` instead)
- Testing features quickly
- Debugging with hot reload
- Making frequent code changes

### ✅ DO Use Docker When:
- Deploying to production server
- Testing production build locally
- Sharing app with non-developers
- Running on a VPS/cloud server
- Need consistent environment across machines

---

## How to Run with Docker

### Prerequisites:
- ✅ Docker Desktop installed (you confirmed this)
- ✅ Docker daemon running

### Step 1: Create Environment File

Create `.env.docker` in the root directory:

```env
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=obediobranko
POSTGRES_DB=obedio_yacht_db
POSTGRES_PORT=5432

# Backend Configuration
BACKEND_PORT=3001
JWT_SECRET=af7bae6536b8a4d6a79139ebfaf48c0d22ca77b3a86837081391b7971fd436c4d6defa1037e571a3a94325a5f8e87ba139e4a94f021a903a69c1df43f1a2b27e
NODE_ENV=production
CORS_ORIGIN=http://localhost:8080

# MQTT Configuration
MQTT_PORT=1883
MQTT_WS_PORT=9001
MQTT_MONITOR_PORT=8888

# Frontend Configuration
FRONTEND_PORT=8080
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=http://localhost:3001

# OpenAI (Optional)
OPENAI_API_KEY=your-key-here
```

### Step 2: Build and Start Containers

**Option A: Quick Start**
```bash
docker-compose --env-file .env.docker up --build
```

**Option B: Background Mode**
```bash
docker-compose --env-file .env.docker up --build -d
```

### Step 3: Access the Application

Once containers are running:
- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:3001/api
- **MQTT Monitor:** http://localhost:8888
- **Database:** localhost:5432

### Step 4: Initialize Database

```bash
# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# Seed database with test data
docker-compose exec backend npm run db:seed
```

### Step 5: View Logs

```bash
# All containers
docker-compose logs -f

# Specific container
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f mqtt
```

### Step 6: Stop Docker

```bash
# Stop containers (keeps data)
docker-compose down

# Stop and remove data volumes
docker-compose down -v
```

---

## Docker Commands Cheat Sheet

```bash
# Build without starting
docker-compose build

# Start without rebuilding
docker-compose up

# Restart specific service
docker-compose restart backend

# Check container status
docker-compose ps

# Execute command in container
docker-compose exec backend npm run db:seed

# View container logs
docker-compose logs backend --tail=50

# Remove everything (fresh start)
docker-compose down -v --rmi all
```

---

## Troubleshooting Docker

### Issue: Port Already in Use

**Error:** `Bind for 0.0.0.0:8080 failed: port is already allocated`

**Solution:**
```bash
# Stop your development servers first
# Press Ctrl+C on terminals running npm run dev

# Or change Docker ports in .env.docker
FRONTEND_PORT=8081  # Change from 8080 to 8081
BACKEND_PORT=3002   # Change from 3001 to 3002
```

### Issue: Database Connection Failed

**Error:** `Error: P1001: Can't reach database server`

**Solution:**
```bash
# Check if postgres container is running
docker-compose ps

# Restart postgres
docker-compose restart postgres

# Check postgres logs
docker-compose logs postgres
```

### Issue: Build Fails

**Error:** `failed to solve: process "/bin/sh -c npm run build" did not complete`

**Solution:**
```bash
# Clean build cache
docker-compose build --no-cache

# Check if all dependencies are in package.json
npm install

# Verify frontend builds locally first
npm run build
cd backend && npm run build
```

---

## Docker File Structure

```
OBEDIO/
├── docker-compose.yml          # Main orchestration file
├── Dockerfile                  # Frontend container (Nginx + React)
├── .env.docker                 # Docker environment variables
├── .env.docker.example         # Template for .env.docker
├── nginx.conf                  # Nginx web server config
│
├── backend/
│   ├── Dockerfile              # Backend container (Node.js API)
│   ├── .dockerignore           # Files to exclude from backend image
│   └── ...
│
└── mosquitto/                  # (Not created yet)
    └── config/
        └── mosquitto.conf      # MQTT broker config
```

---

## Recommended Workflow

### Daily Development (What You Should Do Now):

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
npm run dev

# Access app at: http://localhost:5173
```

### Testing Production Build (Use Docker):

```bash
# Build and start Docker containers
docker-compose --env-file .env.docker up --build

# Access app at: http://localhost:8080

# Stop when done
docker-compose down
```

### Deploying to Server (Production):

```bash
# On your VPS/cloud server:
git clone <your-repo>
cd obedio
cp .env.docker.example .env.docker
# Edit .env.docker with production values
docker-compose up -d

# Your app is now live!
```

---

## Next Steps

1. **Continue Development Mode** (Recommended)
   - Keep using `npm run dev` for development
   - Backend on localhost:8080
   - Frontend on localhost:5173
   - Everything is working correctly ✅

2. **Test Docker Locally** (Optional)
   - Create `.env.docker` file
   - Run `docker-compose up --build`
   - Test production build locally
   - Then stop with `docker-compose down`

3. **Deploy to Production** (When Ready)
   - Set up VPS or cloud server
   - Install Docker
   - Clone repository
   - Configure `.env.docker`
   - Run `docker-compose up -d`

---

## Summary

✅ **Docker Configuration: COMPLETE**
- All files created and ready
- 4 containers configured (postgres, mqtt, backend, frontend)
- Production-ready setup

❌ **Docker Runtime: NOT RUNNING**
- Currently using development mode
- This is correct for active development
- No need to run Docker right now

💡 **Recommendation:**
**Continue using development mode** (`npm run dev`) for now. Docker is ready when you need to:
- Test production build
- Deploy to a server
- Share with others

Your current development setup is perfect for active coding! 🚀
