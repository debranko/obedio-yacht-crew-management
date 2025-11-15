# 🚀 OBEDIO Exhibition - NUC Deployment

**Super Simple Setup - Just 3 Commands!**

---

## 📦 What You Need

- ✅ NUC at `10.10.0.10` with Docker installed
- ✅ GLinet router configured
- ✅ SSH access: `ssh obedio@10.10.0.10`
- ✅ Internet connection

---

## ⚡ Quick Setup (5-10 minutes)

### Step 1: SSH into NUC
```bash
ssh obedio@10.10.0.10
```

### Step 2: Clone Your Fork
```bash
cd /opt
sudo git clone -b deployment-fixes https://github.com/debranko/obedio-yacht-crew-management.git obedio-yacht-crew-management
sudo chown -R obedio:obedio obedio-yacht-crew-management
cd obedio-yacht-crew-management
```

### Step 3: Deploy!
```bash
chmod +x deploy-exhibition.sh
./deploy-exhibition.sh
```

**Done!** 🎉

---

## 🌐 Access the Application

**From any device on your network:**
- Open browser: **http://10.10.0.10:3000**
- Login: **admin** / **admin123**

---

## 🔄 Update When Your Friend Makes Changes

Your friend pushes to his repo → You sync:

```bash
ssh obedio@10.10.0.10
cd /opt/obedio-yacht-crew-management

# Pull latest deployment fixes
git pull origin deployment-fixes
./update-from-git.sh
```

---

## 🆘 Quick Commands

**Check Status:**
```bash
docker ps
```

**View Logs:**
```bash
docker logs obedio-backend -f
```

**Restart Everything:**
```bash
cd /opt/obedio-yacht-crew-management
docker compose -f docker-compose.prod.yml restart
```

**Stop Everything:**
```bash
docker compose -f docker-compose.prod.yml down
```

**Start Again:**
```bash
docker compose -f docker-compose.prod.yml up -d
```

---

## 📚 Full Documentation

For detailed guides, see:
- **START-HERE-EXHIBITION.md** - Complete overview
- **DEPLOYMENT-GUIDE-NUC.md** - Full deployment guide
- **QUICK-COMMANDS.md** - Command reference

---

## ✅ Verify Deployment

After deployment completes, check:

```bash
# 1. Containers running
docker ps
# Should show: obedio-db, obedio-backend, obedio-frontend

# 2. Backend healthy
curl http://localhost:3001/api/health
# Should return: {"status":"OK"}

# 3. Frontend accessible
curl http://localhost:3000
# Should return: HTML content
```

**From another device:**
- Visit: http://10.10.0.10:3000
- Login: admin / admin123

---

## 🎪 Exhibition Day

### Morning Of:
```bash
# SSH to NUC
ssh obedio@10.10.0.10
cd /opt/obedio-yacht-crew-management

# Get latest updates
git pull origin main
./update-from-git.sh

# Verify
docker ps
curl http://localhost:3001/api/health
```

### During Exhibition:
- Monitor: `docker logs obedio-backend --tail 20`
- If issues: `docker compose -f docker-compose.prod.yml restart`

---

## 📞 Troubleshooting

**App not accessible?**
```bash
docker ps  # Check running
docker logs obedio-frontend --tail 20  # Check errors
```

**Backend errors?**
```bash
docker logs obedio-backend --tail 50
docker restart obedio-backend
```

**Need fresh start?**
```bash
cd /opt/obedio-yacht-crew-management
docker compose -f docker-compose.prod.yml down
./deploy-exhibition.sh
```

---

**Repository:** https://github.com/debranko/obedio-yacht-crew-management
**Branch:** deployment-fixes

**Everything is ready to go! 🚢**
