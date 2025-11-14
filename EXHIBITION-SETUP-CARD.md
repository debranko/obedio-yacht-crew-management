# 🎯 OBEDIO Exhibition - Quick Setup Card

**Print this or save to your phone!**

---

## 📋 Your Setup (Ready to Go!)

- ✅ **Your Fork:** https://github.com/Kruppes/obedio-yacht-crew-management
- ✅ **NUC IP:** 10.10.0.10
- ✅ **User:** obedio
- ✅ **All deployment files already in your fork!**

---

## 🚀 Deploy on NUC (3 Commands)

```bash
# 1. SSH to NUC
ssh obedio@10.10.0.10

# 2. Clone your fork
cd /opt
sudo git clone https://github.com/Kruppes/obedio-yacht-crew-management.git
sudo chown -R obedio:obedio obedio-yacht-crew-management
cd obedio-yacht-crew-management

# 3. Deploy!
chmod +x deploy-exhibition.sh
./deploy-exhibition.sh
```

⏱️ **Time:** 5-10 minutes

---

## 🌐 Access

- **Web:** http://10.10.0.10:3000
- **Login:** admin / admin123

---

## 🔄 Update from Friend's Repo

```bash
ssh obedio@10.10.0.10
cd /opt/obedio-yacht-crew-management
git pull https://github.com/debranko/obedio-yacht-crew-management.git main
./update-from-git.sh
```

---

## 🆘 Quick Fixes

**Check status:**
```bash
docker ps
```

**Restart:**
```bash
cd /opt/obedio-yacht-crew-management
docker compose -f docker-compose.prod.yml restart
```

**View logs:**
```bash
docker logs obedio-backend --tail 20
```

**Full reset:**
```bash
cd /opt/obedio-yacht-crew-management
docker compose -f docker-compose.prod.yml down
./deploy-exhibition.sh
```

---

## ✅ Success Check

After deployment:
- [ ] `docker ps` shows 3 containers
- [ ] http://10.10.0.10:3000 loads
- [ ] Login works: admin/admin123
- [ ] Dashboard shows demo data

---

**Everything is in your fork and ready to go! 🚀**

**Full docs:** See README-NUC-DEPLOYMENT.md in your fork
