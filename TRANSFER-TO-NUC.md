# 📦 How to Transfer Files to NUC and Deploy

## 🎯 Overview

I've created all the deployment files you need. Now you just need to:
1. Push these files to GitHub (or transfer directly)
2. Pull them on the NUC
3. Run the deployment script

---

## ✅ Files Created

These new files have been added to the repository:

```
📁 obedio-yacht-crew-management/
├── 🐳 docker-compose.prod.yml       # Production Docker setup
├── 🐳 Dockerfile.frontend           # Frontend container
├── 📄 nginx.conf                    # Nginx web server config
├── 🔧 deploy-exhibition.sh          # Initial deployment script ⭐
├── 🔄 update-from-git.sh            # Git update script ⭐
├── 📚 DEPLOYMENT-GUIDE-NUC.md       # Full deployment guide
├── 📝 QUICK-COMMANDS.md             # Quick reference
├── 📦 TRANSFER-TO-NUC.md            # This file
└── backend/
    └── 🐳 Dockerfile                # Backend container
```

⭐ = Scripts you'll run on the NUC

---

## 🚀 Method 1: Via GitHub (RECOMMENDED)

This is best because it keeps everything in sync with your friend's work.

### Step 1: Files Already on GitHub (Your Fork)

**✅ DONE!** All deployment files are already pushed to your fork:
https://github.com/debranko/obedio-yacht-crew-management

### Step 2: SSH into NUC and Clone Your Fork

```bash
# From your Mac, SSH to NUC
ssh obedio@10.10.0.10

# Once on NUC, clone YOUR fork
cd /opt
sudo git clone https://github.com/debranko/obedio-yacht-crew-management.git
sudo chown -R obedio:obedio obedio-yacht-crew-management
cd obedio-yacht-crew-management
```

### Step 3: Deploy

```bash
# Make scripts executable
chmod +x deploy-exhibition.sh update-from-git.sh

# Run deployment
./deploy-exhibition.sh
```

---

## 🚀 Method 2: Direct Transfer via SCP (FASTER)

If you don't want to push to GitHub yet, transfer directly:

### From Your Mac:

```bash
# Create a temporary deployment package
cd /Users/nicolas/vibecoding/obedio/obedio-yacht-crew-management

# Transfer entire project to NUC
scp -r . obedio@10.10.0.10:/opt/obedio-yacht-crew-management/

# OR transfer just the deployment files
scp docker-compose.prod.yml \
    Dockerfile.frontend \
    nginx.conf \
    deploy-exhibition.sh \
    update-from-git.sh \
    backend/Dockerfile \
    DEPLOYMENT-GUIDE-NUC.md \
    QUICK-COMMANDS.md \
    obedio@10.10.0.10:/opt/obedio-yacht-crew-management/
```

### Then SSH into NUC:

```bash
ssh obedio@10.10.0.10
cd /opt/obedio-yacht-crew-management
chmod +x deploy-exhibition.sh update-from-git.sh
./deploy-exhibition.sh
```

---

## 🚀 Method 3: Manual Copy-Paste (If SSH/Git not working)

1. SSH into NUC: `ssh obedio@10.10.0.10`
2. Create directory: `sudo mkdir -p /opt/obedio-yacht-crew-management && cd /opt/obedio-yacht-crew-management`
3. For each file, create it: `nano filename` and paste content
4. Make executable: `chmod +x *.sh`
5. Run: `./deploy-exhibition.sh`

---

## 🎬 Step-by-Step: First Time Setup

### 1. Get Files on NUC (Choose Method 1 or 2 above)

### 2. SSH into NUC
```bash
ssh obedio@10.10.0.10
```

### 3. Navigate and Prepare
```bash
cd /opt/obedio-yacht-crew-management
chmod +x deploy-exhibition.sh update-from-git.sh
ls -la  # Verify files are there
```

### 4. Run Initial Deployment
```bash
./deploy-exhibition.sh
```

**This will take 5-10 minutes.** The script will:
- Check Docker
- Build 3 containers (PostgreSQL, Backend API, Frontend)
- Start everything
- Run database migrations
- Seed demo data
- Verify health

### 5. Test Access

**From your laptop/phone on the same network:**
- Open browser: http://10.10.0.10:3000
- Login: admin / admin123
- You should see the dashboard!

---

## 🔄 Future Updates (When Friend Pushes Changes)

After initial setup, whenever your friend pushes code to GitHub:

```bash
# SSH into NUC
ssh obedio@10.10.0.10

# Navigate to project
cd /opt/obedio-yacht-crew-management

# Pull and deploy latest changes
./update-from-git.sh
```

**Done!** The update script automatically:
- Backs up database
- Pulls latest code
- Rebuilds containers
- Restarts services
- Tests everything works

---

## ✅ Verification Checklist

After deployment, verify:

```bash
# 1. Check containers are running
docker ps
# Should see: obedio-db, obedio-backend, obedio-frontend

# 2. Check backend health
curl http://localhost:3001/api/health
# Should return: {"status":"OK",...}

# 3. Check frontend loads
curl http://localhost:3000
# Should return: HTML content

# 4. Check database
docker exec obedio-db pg_isready -U obedio_user
# Should return: accepting connections
```

**From another device on network:**
- Visit: http://10.10.0.10:3000
- Login: admin / admin123
- Check dashboard loads with demo data

---

## 🆘 If Something Goes Wrong

### Deployment script fails?
```bash
# Check Docker is running
sudo systemctl status docker

# Check logs
docker compose -f docker-compose.prod.yml logs

# Try manual deployment
docker compose -f docker-compose.prod.yml up -d --build
```

### Out of disk space?
```bash
# Check space
df -h

# Clean Docker
docker system prune -a
```

### Can't connect to NUC?
```bash
# Check network
ping 10.10.0.10

# Check SSH service
ssh obedio@10.10.0.10
```

---

## 📞 Next Steps

1. **Choose transfer method** (Method 1 recommended)
2. **Transfer files to NUC**
3. **Run `./deploy-exhibition.sh`**
4. **Test access at http://10.10.0.10:3000**
5. **Keep `QUICK-COMMANDS.md` handy during exhibition**

---

**Questions? Check:**
- `DEPLOYMENT-GUIDE-NUC.md` - Full detailed guide
- `QUICK-COMMANDS.md` - Quick reference for common tasks

**Ready to deploy! 🚀**
