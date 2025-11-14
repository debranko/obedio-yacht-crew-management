# 🔧 NUC Deployment Troubleshooting Guide

Quick fixes for common issues during deployment.

---

## ✅ Fixed Issues

### ~~Build Error: "tsc: not found"~~
**Status:** ✅ FIXED in latest version

**What was wrong:** Dockerfile was only installing production dependencies, missing TypeScript compiler.

**Fix applied:**
- Now installs all dependencies for build
- Removes dev dependencies after build
- Added entrypoint script for automatic migrations

**Action:** Just pull latest version from your fork (already done!)

---

## 🚨 Common Issues & Solutions

### Issue 1: Build takes too long / times out

**Symptoms:**
```
Building backend... (taking 10+ minutes)
```

**Solution:**
```bash
# Cancel current build (Ctrl+C)

# Clean Docker cache
docker builder prune -af

# Retry deployment
./deploy-exhibition.sh
```

---

### Issue 2: "Cannot connect to database"

**Symptoms:**
```
Database is unavailable - sleeping
```

**Solution:**
```bash
# Check if database container is running
docker ps | grep obedio-db

# If not running, start it
docker compose -f docker-compose.prod.yml up -d db

# Wait 10 seconds
sleep 10

# Try backend again
docker compose -f docker-compose.prod.yml up -d backend
```

---

### Issue 3: "Port already in use"

**Symptoms:**
```
Error: bind: address already in use
```

**Solution:**
```bash
# Find what's using the port
sudo netstat -tulpn | grep -E '3000|3001|5432'

# Stop conflicting services
docker stop $(docker ps -aq)  # Stop all containers

# OR kill specific process
sudo kill -9 <PID>

# Retry deployment
./deploy-exhibition.sh
```

---

### Issue 4: Frontend shows "Cannot connect to backend"

**Symptoms:**
- Frontend loads but shows connection errors
- Dashboard is empty

**Solution:**
```bash
# 1. Check backend is running
docker ps | grep obedio-backend

# 2. Check backend health
curl http://localhost:3001/api/health

# 3. Check backend logs
docker logs obedio-backend --tail 50

# 4. If backend has errors, restart it
docker restart obedio-backend

# 5. If still issues, check database
docker exec obedio-db pg_isready -U obedio_user
```

---

### Issue 5: "Prisma migrate failed"

**Symptoms:**
```
Error: P3009: migrate.lock file is missing
```

**Solution:**
```bash
# Use db push instead (for first deployment)
docker exec obedio-backend npx prisma db push --accept-data-loss

# Then seed
docker exec obedio-backend npx prisma db seed
```

---

### Issue 6: Out of disk space

**Symptoms:**
```
no space left on device
```

**Solution:**
```bash
# Check disk space
df -h

# Clean Docker
docker system prune -a --volumes
# WARNING: This removes ALL unused containers, images, and volumes

# Remove old backups
cd /opt/obedio-yacht-crew-management
rm backup_*.sql  # Keep recent ones

# Check space again
df -h
```

---

### Issue 7: Containers keep restarting

**Symptoms:**
```
docker ps shows containers constantly restarting
```

**Solution:**
```bash
# Check logs to see why
docker logs obedio-backend --tail 100
docker logs obedio-frontend --tail 100
docker logs obedio-db --tail 100

# Common causes:
# - Database not ready: Wait 30 seconds and check again
# - Migration failed: See Issue 5 above
# - Memory issue: Restart NUC
```

---

### Issue 8: Frontend build fails

**Symptoms:**
```
npm ERR! code ELIFECYCLE
```

**Solution:**
```bash
# Check if backend built successfully first
docker images | grep obedio

# Try building frontend separately
docker compose -f docker-compose.prod.yml build frontend --no-cache

# Check Node.js memory
docker compose -f docker-compose.prod.yml build --memory 2g frontend
```

---

## 🔄 Fresh Start (Nuclear Option)

If nothing works, complete reset:

```bash
# 1. Stop everything
docker compose -f docker-compose.prod.yml down -v

# 2. Remove all Docker data
docker system prune -a --volumes
# Type 'y' to confirm

# 3. Remove cloned repo
cd /opt
sudo rm -rf obedio-yacht-crew-management

# 4. Start from scratch
sudo git clone https://github.com/Kruppes/obedio-yacht-crew-management.git
sudo chown -R obedio:obedio obedio-yacht-crew-management
cd obedio-yacht-crew-management

# 5. Deploy
chmod +x deploy-exhibition.sh
./deploy-exhibition.sh
```

---

## 🐛 Debug Mode

For detailed debugging:

```bash
# Build with verbose output
docker compose -f docker-compose.prod.yml build --progress=plain

# Run containers in foreground (see all logs)
docker compose -f docker-compose.prod.yml up

# Check specific container
docker inspect obedio-backend

# Enter container shell
docker exec -it obedio-backend sh
```

---

## 📊 Health Checks

Quick system verification:

```bash
# All containers running?
docker ps

# Expected output:
# - obedio-db (healthy)
# - obedio-backend (Up)
# - obedio-frontend (Up)

# Backend healthy?
curl http://localhost:3001/api/health
# Expected: {"status":"OK",...}

# Frontend serving?
curl -I http://localhost:3000
# Expected: HTTP/1.1 200 OK

# Database accepting connections?
docker exec obedio-db pg_isready -U obedio_user
# Expected: accepting connections

# Check logs for errors
docker compose -f docker-compose.prod.yml logs --tail=20
```

---

## 🆘 Still Stuck?

1. **Take screenshots** of error messages
2. **Capture logs:**
   ```bash
   docker compose -f docker-compose.prod.yml logs > error-log.txt
   ```
3. **Check system resources:**
   ```bash
   free -h  # Memory
   df -h    # Disk
   top      # CPU
   ```
4. **Note what changed** (if it worked before)

---

## 📞 Quick Commands Reference

```bash
# Start
docker compose -f docker-compose.prod.yml up -d

# Stop
docker compose -f docker-compose.prod.yml down

# Restart
docker compose -f docker-compose.prod.yml restart

# Logs
docker logs obedio-backend -f

# Status
docker ps

# Clean
docker system prune -a
```

---

**Most issues are fixed by pulling latest version and rebuilding!**

```bash
cd /opt/obedio-yacht-crew-management
git pull origin main
docker compose -f docker-compose.prod.yml down
./deploy-exhibition.sh
```
