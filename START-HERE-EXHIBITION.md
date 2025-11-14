# 🎯 START HERE - Exhibition Setup for OBEDIO

**Your Mission:** Get OBEDIO running on the NUC at 10.10.0.10 for the exhibition

---

## 📦 What I've Prepared For You

I've created a complete Docker-based deployment system with:

✅ **Docker Compose configuration** - Runs PostgreSQL, Backend API, and Frontend
✅ **Automated deployment script** - One command to deploy everything
✅ **Auto-update script** - Pull latest changes from GitHub easily
✅ **Complete documentation** - Step-by-step guides
✅ **Quick reference** - Commands you'll need during exhibition

---

## 🚀 The 3-Step Process

### Step 1: Transfer Files to NUC (5 minutes)

**Option A - Via GitHub (Recommended):**
```bash
# On your Mac - coordinate with your friend first!
cd /Users/nicolas/vibecoding/obedio/obedio-yacht-crew-management
git add .
git commit -m "Add exhibition deployment files"
git push origin main

# On NUC
ssh obedio@10.10.0.10
cd /opt
sudo git clone https://github.com/debranko/obedio-yacht-crew-management.git
sudo chown -R obedio:obedio obedio-yacht-crew-management
```

**Option B - Direct Transfer:**
```bash
# From your Mac
cd /Users/nicolas/vibecoding/obedio/obedio-yacht-crew-management
scp -r . obedio@10.10.0.10:/opt/obedio-yacht-crew-management/
```

📖 **Detailed instructions:** See `TRANSFER-TO-NUC.md`

---

### Step 2: Run Deployment (10 minutes)

```bash
# SSH into NUC
ssh obedio@10.10.0.10

# Navigate to project
cd /opt/obedio-yacht-crew-management

# Make scripts executable
chmod +x deploy-exhibition.sh update-from-git.sh

# Deploy!
./deploy-exhibition.sh
```

**What happens:**
- ✅ Builds Docker containers (PostgreSQL, Backend, Frontend)
- ✅ Starts all services
- ✅ Creates database and runs migrations
- ✅ Seeds demo data (guests, crew, locations, service requests)
- ✅ Verifies everything is healthy

---

### Step 3: Test & Verify (2 minutes)

**From any device on the GLinet network:**

Open browser: **http://10.10.0.10:3000**

Login:
- **Username:** admin
- **Password:** admin123

You should see:
- ✅ Dashboard with widgets
- ✅ Demo guests, crew members, locations
- ✅ Ability to create service requests
- ✅ Real-time updates

---

## 🔄 When Your Friend Updates Code

After initial setup, whenever code changes are pushed to GitHub:

```bash
ssh obedio@10.10.0.10
cd /opt/obedio-yacht-crew-management
./update-from-git.sh
```

**That's it!** The script handles everything:
- Backs up database
- Pulls latest code
- Rebuilds containers
- Restarts services
- Verifies health

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| **TRANSFER-TO-NUC.md** | How to get files onto the NUC |
| **DEPLOYMENT-GUIDE-NUC.md** | Complete deployment guide |
| **QUICK-COMMANDS.md** | Quick reference for common tasks |
| **docker-compose.prod.yml** | Docker configuration |
| **deploy-exhibition.sh** | Initial deployment script |
| **update-from-git.sh** | Update from Git script |

---

## 🐳 What Gets Deployed

```
┌─────────────────────────────────────┐
│         NUC @ 10.10.0.10           │
├─────────────────────────────────────┤
│                                     │
│  🌐 Frontend (Port 3000)           │
│     - React + TypeScript           │
│     - Nginx web server             │
│     - User Interface               │
│                                     │
│  🔌 Backend API (Port 3001)        │
│     - Node.js + Express            │
│     - WebSocket support            │
│     - REST API endpoints           │
│                                     │
│  🗄️  PostgreSQL (Port 5432)        │
│     - Database                     │
│     - Demo data                    │
│     - Automatic backups            │
│                                     │
└─────────────────────────────────────┘
```

---

## ⚡ Quick Reference

### Most Important Commands

```bash
# SSH to NUC
ssh obedio@10.10.0.10

# Check if running
docker ps

# View logs
docker logs obedio-backend -f

# Restart everything
cd /opt/obedio-yacht-crew-management
docker compose -f docker-compose.prod.yml restart

# Update from Git
./update-from-git.sh
```

### Access URLs

- **Web App:** http://10.10.0.10:3000
- **API:** http://10.10.0.10:3001
- **Health Check:** http://10.10.0.10:3001/api/health

### Login

- **Username:** admin
- **Password:** admin123

---

## 🆘 Troubleshooting

**Can't access web app?**
```bash
docker ps  # Check containers running
docker logs obedio-frontend --tail 20  # Check logs
```

**Backend not responding?**
```bash
curl http://localhost:3001/api/health  # Check health
docker restart obedio-backend  # Restart
```

**Need to reset everything?**
```bash
cd /opt/obedio-yacht-crew-management
docker compose -f docker-compose.prod.yml down
./deploy-exhibition.sh
```

---

## 🎪 Exhibition Day Checklist

### Before Exhibition:
- [ ] Run `./update-from-git.sh` to get latest code
- [ ] Test login at http://10.10.0.10:3000
- [ ] Verify demo data looks good
- [ ] Create database backup
- [ ] Print QUICK-COMMANDS.md

### Day Of:
- [ ] Power on NUC and router
- [ ] Wait 3 minutes for services to start
- [ ] Test from phone: http://10.10.0.10:3000
- [ ] Keep laptop nearby for monitoring

### During Exhibition:
- [ ] Check logs occasionally: `docker logs obedio-backend --tail 20`
- [ ] Monitor disk space: `df -h`
- [ ] If issues: `docker compose -f docker-compose.prod.yml restart`

---

## ✅ Success Criteria

Deployment is successful when:

1. ✅ All 3 containers running: `docker ps` shows obedio-db, obedio-backend, obedio-frontend
2. ✅ Web app loads: http://10.10.0.10:3000
3. ✅ Login works: admin / admin123
4. ✅ Dashboard shows demo data
5. ✅ Can create new service request
6. ✅ Backend health: http://10.10.0.10:3001/api/health returns OK

---

## 🎬 Your Action Plan

1. **NOW:** Read `TRANSFER-TO-NUC.md`
2. **NEXT:** Transfer files to NUC (choose method)
3. **THEN:** Run `./deploy-exhibition.sh`
4. **FINALLY:** Test at http://10.10.0.10:3000
5. **BEFORE EXHIBITION:** Run `./update-from-git.sh` for latest code

---

## 📞 Key Files Locations

**On your Mac:**
```
/Users/nicolas/vibecoding/obedio/obedio-yacht-crew-management/
```

**On NUC (after transfer):**
```
/opt/obedio-yacht-crew-management/
```

---

**You've got everything you need. Let's make this exhibition awesome! 🚀**

**Questions? All answers are in `DEPLOYMENT-GUIDE-NUC.md`**
