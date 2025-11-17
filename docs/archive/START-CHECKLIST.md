# ✅ START CHECKLIST - Obedio Yacht Crew

## 🎯 JEDNOSTAVNO - 3 KORAKA

### ☑️ KORAK 1: Pripremi PostgreSQL

```bash
# Kreiraj bazu podataka (ako još ne postoji)
createdb obedio_yacht_crew

# ILI pomoću psql:
psql -U postgres
CREATE DATABASE obedio_yacht_crew;
\q
```

**PostgreSQL mora biti pokrenut!**

---

### ☑️ KORAK 2: Setup Projekat

#### Windows:
```bash
# Dupli-klik na:
SETUP-COMPLETE.bat
```

#### Linux/Mac:
```bash
chmod +x SETUP-COMPLETE.sh
./SETUP-COMPLETE.sh
```

**Šta će se desiti:**
1. ✅ Kreira `.env` fajl u `backend/`
2. ✅ Instalira sve dependencies (backend + frontend)
3. ✅ Generiše Prisma Client
4. ✅ Push database schema u PostgreSQL
5. ✅ Seeduje bazu sa mock podacima

**Trajanje:** ~5-10 minuta

---

### ☑️ KORAK 3: Pokreni Aplikaciju

#### Windows (NAJLAKŠE):
```bash
# Dupli-klik na:
START-ALL.bat
```

Ovo će pokrenuti:
- Backend na http://localhost:3001
- Frontend na http://localhost:3000

#### Linux/Mac (Dva terminala):
```bash
# Terminal 1 - Backend:
cd backend
npm run dev

# Terminal 2 - Frontend:
npm run dev
```

---

## 🌐 OTVORI APLIKACIJU

1. **Otvori browser:** http://localhost:3000
2. **Login:**
   - Username: `admin`
   - Password: `admin123`
3. **Istraži aplikaciju!**

---

## ✅ PROVERA DA LI RADI

### Test 1: Backend Health
Otvori: http://localhost:3001/api/health

Trebao bi da vidiš:
```json
{
  "status": "OK",
  "timestamp": "2025-10-19T..."
}
```

### Test 2: Frontend Loading
Otvori: http://localhost:3000

Trebao bi da vidiš login stranicu.

### Test 3: Login
- Username: `admin`
- Password: `admin123`

Trebao bi da uđeš u dashboard.

---

## 📊 ŠTA ĆEŠ VIDETI U APLIKACIJI

### Dashboard:
- **Crew Members:** 6 članova (Sarah, Emma, Lisa, John, Mike, Tom)
- **Guests:** 4 gosta (Alexander, Victoria, Robert, Sophie)
- **Locations:** 9 lokacija (Master Suite, VIP Suite, etc.)
- **Service Requests:** 2 aktivna zahteva

### Stranice:
- 📊 **Dashboard** - Pregled sistema
- 👥 **Crew Management** - Lista crew članova
- 🎩 **Guests** - Upravljanje gostima
- 📍 **Locations** - Yacht lokacije
- 🔔 **Service Requests** - Zahtevi za servis
- 🔧 **Devices** - ESP32 uređaji
- 📋 **Activity Logs** - Sistem logovi
- ⚙️ **Settings** - Podešavanja

**SVE PODACI SU IZ POSTGRESQL BAZE!**

---

## 🐛 TROUBLESHOOTING

### ❌ "Cannot connect to database"

**Uzrok:** PostgreSQL nije pokrenut ili DATABASE_URL pogrešan

**Rešenje:**
```bash
# 1. Proveri da li PostgreSQL radi
# Windows:
services.msc  # Traži PostgreSQL service

# Linux:
sudo systemctl status postgresql

# 2. Kreiraj bazu
createdb obedio_yacht_crew

# 3. Proveri DATABASE_URL u backend/.env
# Treba biti:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/obedio_yacht_crew"
# Zameni 'postgres:postgres' sa tvojim username:password
```

---

### ❌ "JWT_SECRET not configured"

**Uzrok:** `.env` fajl ne postoji ili je prazan

**Rešenje:**
```bash
cd backend
# Windows:
setup-env.bat

# Linux/Mac:
bash setup-env.sh
```

---

### ❌ "Port 3001 already in use"

**Uzrok:** Drugi proces već koristi port 3001

**Rešenje:**
```bash
# Option 1: Zaustavi drugi proces
# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:3001 | xargs kill

# Option 2: Promeni PORT u backend/.env
PORT=8080
```

---

### ❌ "Prisma Client not generated"

**Uzrok:** Prisma Client nije generisan posle schema promene

**Rešenje:**
```bash
cd backend
npx prisma generate
```

---

### ❌ "Module not found"

**Uzrok:** Dependencies nisu instalirane

**Rešenje:**
```bash
# Backend:
cd backend
npm install

# Frontend:
cd ..
npm install
```

---

## 🔄 RESET SVEGA (Ako zaglavi)

### Kompletna Reinstalacija:

```bash
# 1. Obriši node_modules i lock fajlove
rm -rf node_modules package-lock.json
rm -rf backend/node_modules backend/package-lock.json

# 2. Obriši .env
rm backend/.env

# 3. Resetuj bazu
cd backend
npx prisma migrate reset --force

# 4. Pokreni setup ponovo
cd ..
# Windows:
SETUP-COMPLETE.bat

# Linux/Mac:
./SETUP-COMPLETE.sh
```

---

## 📞 DODATNA POMOĆ

### Dokumentacija:
- **README-START-HERE.md** - Quick start vodič
- **FIXES.md** - Tehnički detalji popravki
- **FINAL-SUMMARY.md** - Kompletno rezime
- **backend/README.md** - Backend API dokumentacija

### API Testing:
```bash
# Health check
curl http://localhost:3001/api/health

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get crew (zameni YOUR_TOKEN sa stvarnim tokenom)
curl http://localhost:3001/api/crew \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ✅ FINALNA CHECKLIST

Pre nego što kažeš "Ne radi":

- [ ] PostgreSQL instaliran i pokrenut?
- [ ] Baza kreirana? (`createdb obedio_yacht_crew`)
- [ ] Setup script pokrenut? (`SETUP-COMPLETE.bat/sh`)
- [ ] Backend pokrenut? (http://localhost:3001/api/health radi?)
- [ ] Frontend pokrenut? (http://localhost:3000 se učitava?)
- [ ] `.env` fajl postoji u `backend/`?
- [ ] `node_modules` folderi postoje u oba projekta?

**Ako je SVE ✅ - aplikacija MORA da radi!**

---

## 🎉 SUCCESS!

Kada vidiš:
- ✅ Login stranicu na localhost:3000
- ✅ Možeš se ulogovati sa admin/admin123
- ✅ Dashboard se prikazuje sa podacima
- ✅ Crew lista pokazuje 6 članova

**USPEŠNO! Aplikacija radi! 🚀**

---

**Napravljeno: 19. Oktobar 2025**  
**Status: ✅ SPREMNO**
