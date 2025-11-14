# 🚀 OBEDIO Exhibition Deployment Guide - NUC Server

**Target Server:** NUC @ `10.10.0.10`
**User:** `obedio`
**Network:** GLinet Router
**Deployment Method:** Docker Compose
**Date:** November 2025

---

## 📋 Prerequisites Checklist

Before starting, ensure:
- ✅ NUC is powered on and accessible at `10.10.0.10`
- ✅ SSH access: `ssh obedio@10.10.0.10`
- ✅ Docker is installed and running
- ✅ GLinet router is configured and running
- ✅ Minimum 5GB free disk space
- ✅ Internet connection for pulling images

---

## 🎯 Quick Start (First Time Setup)

### 1. SSH into the NUC

```bash
ssh obedio@10.10.0.10
```

### 2. Clone the Repository

```bash
cd /opt
sudo git clone https://github.com/debranko/obedio-yacht-crew-management.git
sudo chown -R obedio:obedio obedio-yacht-crew-management
cd obedio-yacht-crew-management
```

### 3. Make Scripts Executable

```bash
chmod +x deploy-exhibition.sh
chmod +x update-from-git.sh
```

### 4. Run Initial Deployment

```bash
./deploy-exhibition.sh
```

This script will:
- ✅ Check Docker installation
- ✅ Build all Docker images (PostgreSQL, Backend, Frontend)
- ✅ Start all containers
- ✅ Run database migrations
- ✅ Seed demo data (locations, guests, crew, service requests)
- ✅ Verify all services are healthy

**⏱️ Estimated time:** 5-10 minutes

### 5. Access the Application

Once deployment completes:

**From any device on the GLinet network:**
- 🌐 **Web App:** http://10.10.0.10:3000
- 🔌 **API:** http://10.10.0.10:3001
- 📊 **Health Check:** http://10.10.0.10:3001/api/health

**Login Credentials:**
- 👤 Username: `admin`
- 🔑 Password: `admin123`

---

## 🔄 Updating to Latest Code (When Friend Pushes Changes)

Your friend pushes changes to GitHub → You pull and redeploy on NUC:

```bash
cd /opt/obedio-yacht-crew-management
./update-from-git.sh
```

This script will:
- ✅ Backup the database automatically
- ✅ Show what changes will be pulled
- ✅ Pull latest code from GitHub
- ✅ Rebuild Docker images
- ✅ Restart all services
- ✅ Apply any database migrations
- ✅ Verify everything is working

**⏱️ Estimated time:** 3-5 minutes

---

## 🐳 Docker Container Management

### View Running Containers

```bash
cd /opt/obedio-yacht-crew-management
docker compose -f docker-compose.prod.yml ps
```

You should see:
- `obedio-db` (PostgreSQL database)
- `obedio-backend` (Node.js API)
- `obedio-frontend` (Nginx + React)

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker logs obedio-backend -f
docker logs obedio-frontend -f
docker logs obedio-db -f

# Last 50 lines only
docker logs obedio-backend --tail 50
```

### Stop All Services

```bash
cd /opt/obedio-yacht-crew-management
docker compose -f docker-compose.prod.yml down
```

### Start All Services

```bash
cd /opt/obedio-yacht-crew-management
docker compose -f docker-compose.prod.yml up -d
```

### Restart a Specific Service

```bash
docker restart obedio-backend
docker restart obedio-frontend
docker restart obedio-db
```

---

## 🗄️ Database Management

### Backup Database

```bash
# Manual backup
docker exec obedio-db pg_dump -U obedio_user obedio_yacht_crew > backup_$(date +%Y%m%d).sql
```

### Restore Database

```bash
# Restore from backup
docker exec -i obedio-db psql -U obedio_user obedio_yacht_crew < backup_20251114.sql
```

### Reset Database (CAUTION: Deletes all data!)

```bash
docker exec obedio-backend npx prisma migrate reset --force
docker exec obedio-backend npx prisma db seed
```

### Access Database Console

```bash
docker exec -it obedio-db psql -U obedio_user obedio_yacht_crew
```

Common queries:
```sql
-- View all users
SELECT username, role, "isActive" FROM "User";

-- View all guests
SELECT "firstName", "lastName", status FROM "Guest";

-- View service requests
SELECT * FROM "ServiceRequest" ORDER BY "createdAt" DESC LIMIT 10;

-- Exit
\q
```

---

## 🔧 Troubleshooting

### Problem: Services won't start

**Solution:**
```bash
# Check logs
docker compose -f docker-compose.prod.yml logs

# Check disk space
df -h

# Remove old containers and rebuild
docker compose -f docker-compose.prod.yml down -v
docker system prune -a
./deploy-exhibition.sh
```

### Problem: Database connection errors

**Solution:**
```bash
# Check if database is running
docker ps | grep obedio-db

# Check database health
docker exec obedio-db pg_isready -U obedio_user

# Restart database
docker restart obedio-db
```

### Problem: Frontend shows blank page

**Solution:**
```bash
# Check frontend logs
docker logs obedio-frontend

# Check if backend is reachable
curl http://localhost:3001/api/health

# Rebuild frontend
docker compose -f docker-compose.prod.yml up -d --build frontend
```

### Problem: "Cannot connect to backend API"

**Solution:**
```bash
# Check backend logs
docker logs obedio-backend --tail 100

# Check if backend is running
curl http://localhost:3001/api/health

# Restart backend
docker restart obedio-backend
```

### Problem: Out of disk space

**Solution:**
```bash
# Check space
df -h

# Clean up Docker
docker system prune -a --volumes

# Remove old backups
cd /opt/obedio-yacht-crew-management
ls -lh backup_*.sql
rm backup_YYYYMMDD.sql  # Remove old backups
```

---

## 📊 System Monitoring

### Check Service Health

```bash
# Frontend
curl http://10.10.0.10:3000/health

# Backend
curl http://10.10.0.10:3001/api/health

# Database
docker exec obedio-db pg_isready -U obedio_user
```

### Check Resource Usage

```bash
# Docker stats
docker stats --no-stream

# System resources
htop  # or top

# Disk usage
df -h
du -sh /opt/obedio-yacht-crew-management
```

### Check Network Connectivity

```bash
# From NUC to internet
ping -c 3 google.com

# From another device to NUC
ping -c 3 10.10.0.10

# Check open ports
sudo netstat -tulpn | grep -E '3000|3001|5432'
```

---

## 🎨 Exhibition Tips

### Auto-start on Boot

To ensure the application starts when NUC boots:

```bash
# Create systemd service
sudo nano /etc/systemd/system/obedio.service
```

Add:
```ini
[Unit]
Description=Obedio Yacht Crew Management
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/obedio-yacht-crew-management
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down
User=obedio

[Install]
WantedBy=multi-user.target
```

Enable:
```bash
sudo systemctl daemon-reload
sudo systemctl enable obedio.service
sudo systemctl start obedio.service
```

### Display on TV/Monitor

If you want to display the app on a screen at the exhibition:

```bash
# Install Chromium in kiosk mode (on NUC)
sudo apt install chromium-browser -y

# Create kiosk script
nano ~/start-kiosk.sh
```

Add:
```bash
#!/bin/bash
chromium-browser --kiosk --noerrdialogs --disable-infobars --no-first-run \
  --disable-session-crashed-bubble --disable-features=TranslateUI \
  http://10.10.0.10:3000
```

```bash
chmod +x ~/start-kiosk.sh
```

### QR Code for Mobile Access

Generate a QR code pointing to `http://10.10.0.10:3000` so exhibition visitors can access on their phones.

---

## 📁 File Structure

```
/opt/obedio-yacht-crew-management/
├── backend/
│   ├── Dockerfile              # Backend container definition
│   ├── src/                    # Backend source code
│   ├── prisma/                 # Database schema & migrations
│   ├── logs/                   # Application logs
│   └── uploads/                # User uploaded files
├── src/                        # Frontend source code
├── docker-compose.prod.yml     # Production deployment config
├── Dockerfile.frontend         # Frontend container definition
├── nginx.conf                  # Nginx web server config
├── deploy-exhibition.sh        # Initial deployment script
├── update-from-git.sh          # Update script
└── backup_*.sql                # Database backups
```

---

## 🆘 Emergency Contacts

- **Repository:** https://github.com/debranko/obedio-yacht-crew-management
- **Your Friend:** (Contact details)
- **This Guide Location:** `/opt/obedio-yacht-crew-management/DEPLOYMENT-GUIDE-NUC.md`

---

## 🎯 Pre-Exhibition Checklist

**1 Day Before:**
- [ ] SSH into NUC and run `./update-from-git.sh`
- [ ] Verify all services are running: `docker compose -f docker-compose.prod.yml ps`
- [ ] Test login at http://10.10.0.10:3000
- [ ] Create fresh demo data if needed
- [ ] Take a database backup

**On Exhibition Day:**
- [ ] Power on NUC and GLinet router
- [ ] Wait 2-3 minutes for services to start
- [ ] Test from phone: http://10.10.0.10:3000
- [ ] Verify login works
- [ ] Test creating a service request
- [ ] Keep this guide handy on your phone

**During Exhibition:**
- [ ] Monitor logs occasionally: `docker logs obedio-backend --tail 20`
- [ ] Check disk space: `df -h`
- [ ] If issues: `docker compose -f docker-compose.prod.yml restart`

---

## ✅ Success Criteria

The deployment is successful when:
1. ✅ All 3 containers are running (db, backend, frontend)
2. ✅ http://10.10.0.10:3000 loads the login page
3. ✅ You can login with admin/admin123
4. ✅ Dashboard shows widgets with demo data
5. ✅ Creating a new service request works
6. ✅ Backend health check returns OK: http://10.10.0.10:3001/api/health

---

**Good luck with the exhibition! 🎉**
