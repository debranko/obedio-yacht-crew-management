# 🚀 Quick Reference Commands - OBEDIO NUC

**Copy this file to your phone for quick access during exhibition!**

---

## 📱 Most Used Commands

### SSH into NUC
```bash
ssh obedio@10.10.0.10
```

### Navigate to Project
```bash
cd /opt/obedio-yacht-crew-management
```

### Update from Git (When friend pushes changes)
```bash
cd /opt/obedio-yacht-crew-management
./update-from-git.sh
```

### Check if Everything is Running
```bash
docker compose -f docker-compose.prod.yml ps
```

### View Logs (Real-time)
```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Just backend
docker logs obedio-backend -f

# Last 30 lines of backend
docker logs obedio-backend --tail 30
```

### Restart Everything
```bash
cd /opt/obedio-yacht-crew-management
docker compose -f docker-compose.prod.yml restart
```

### Stop Everything
```bash
docker compose -f docker-compose.prod.yml down
```

### Start Everything
```bash
docker compose -f docker-compose.prod.yml up -d
```

---

## 🆘 Emergency Commands

### Quick Restart (if app not responding)
```bash
docker restart obedio-backend obedio-frontend
```

### Full Rebuild (if something is really broken)
```bash
cd /opt/obedio-yacht-crew-management
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

### Check Backend Health
```bash
curl http://localhost:3001/api/health
```

### Check Disk Space (if running slow)
```bash
df -h
```

### Clean up Docker (if out of space)
```bash
docker system prune -a
# WARNING: This removes unused images!
```

---

## 🔄 Sync with Friend's Updates

```bash
# If your friend pushes to his original repo, pull those changes:
cd /opt/obedio-yacht-crew-management
git pull https://github.com/debranko/obedio-yacht-crew-management.git main
./update-from-git.sh
```

---

## 🗄️ Database Quick Commands

### Backup Database RIGHT NOW
```bash
docker exec obedio-db pg_dump -U obedio_user obedio_yacht_crew > emergency_backup.sql
```

### Check Database is Running
```bash
docker exec obedio-db pg_isready -U obedio_user
```

### View Recent Service Requests
```bash
docker exec -it obedio-db psql -U obedio_user obedio_yacht_crew -c \
  "SELECT * FROM \"ServiceRequest\" ORDER BY \"createdAt\" DESC LIMIT 5;"
```

---

## 📊 Access URLs

- **Web App:** http://10.10.0.10:3000
- **API:** http://10.10.0.10:3001
- **Health Check:** http://10.10.0.10:3001/api/health

**Login:** admin / admin123

---

## 📞 Troubleshooting Decision Tree

**Problem: Can't access http://10.10.0.10:3000**
1. Check containers: `docker ps`
2. If not running: `docker compose -f docker-compose.prod.yml up -d`
3. Check logs: `docker logs obedio-frontend --tail 20`

**Problem: Login doesn't work**
1. Check backend: `curl http://localhost:3001/api/health`
2. If error: `docker logs obedio-backend --tail 30`
3. Restart: `docker restart obedio-backend`

**Problem: Data is missing/wrong**
1. Check database: `docker ps | grep obedio-db`
2. Restore backup: `docker exec -i obedio-db psql -U obedio_user obedio_yacht_crew < backup_file.sql`

**Problem: Slow performance**
1. Check space: `df -h`
2. Check resources: `docker stats --no-stream`
3. Restart: `docker compose -f docker-compose.prod.yml restart`

---

## ⚡ One-Liner for Common Tasks

```bash
# Full status check
docker ps && curl -s http://localhost:3001/api/health && curl -s http://localhost:3000/health

# Quick restart
docker restart obedio-backend obedio-frontend

# View all recent logs
docker compose -f docker-compose.prod.yml logs --tail=20

# Backup + restart
docker exec obedio-db pg_dump -U obedio_user obedio_yacht_crew > backup_$(date +%Y%m%d_%H%M).sql && docker compose -f docker-compose.prod.yml restart
```

---

**Print this and keep nearby during exhibition!**
