# 🚀 START HERE - Obedio Yacht Crew Management

## ⚡ NAJBRŽI NAČIN (3 jednostavna koraka)

### 📋 Pre nego što počneš:
1. **PostgreSQL** mora biti instaliran i pokrenut
2. **Node.js** instaliran (v18+)
3. **Kreiraj PostgreSQL bazu:** `createdb obedio_yacht_crew`

---

## 🎯 JEDNOSTAVNO POKRETANJE

### Windows:
```bash
# 1. Setup (samo prvi put)
SETUP-COMPLETE.bat

# 2. Pokreni aplikaciju
START-ALL.bat
```

### Linux/Mac:
```bash
# 1. Setup (samo prvi put)
chmod +x SETUP-COMPLETE.sh
./SETUP-COMPLETE.sh

# 2. Pokreni aplikaciju (u dva terminala)
# Terminal 1:
cd backend && npm run dev

# Terminal 2:
npm run dev
```

---

## 🌐 PRISTUP APLIKACIJI

Kada su servisi pokrenuti:

**Frontend:** http://localhost:3000  
**Backend API:** http://localhost:3001  
**Health Check:** http://localhost:3001/api/health

---

## 🔑 LOGIN

```
Username: admin
Password: admin123
```

---

## 📊 ŠTA SE NALAZI U BAZI (Mock Podaci)

### 👤 Users:
- **Admin** (admin / admin123) - Puna pristup

### 👥 Crew Members (6):
- Sarah Johnson (Chief Stewardess)
- Emma Williams (Stewardess)
- Lisa Brown (Stewardess)
- John Smith (Captain)
- Mike Davis (First Officer)
- Tom Wilson (Chief Engineer)

### 📍 Locations (9):
- Master Suite
- VIP Suite
- Guest Cabin 1 & 2
- Main Salon
- Upper Deck
- Sun Deck
- Bridge
- Galley

### 🎩 Guests (4):
- Alexander & Victoria Montgomery (Owner + Partner) - Master Suite
- Robert Harrison (VIP) - VIP Suite
- Sophie Anderson (Family) - Guest Cabin 1

### 🔔 Service Requests (2):
- Coffee service request (Normal priority)
- Room cleaning (Urgent priority)

---

## 🐛 AKO NEŠTO NE RADI

### Problem: "Cannot connect to PostgreSQL"
**Rešenje:**
1. Proveri da li PostgreSQL radi
2. Kreiraj bazu: `createdb obedio_yacht_crew`
3. Proveri `backend/.env` - DATABASE_URL

### Problem: "JWT_SECRET not configured"
**Rešenje:**
1. Proveri da li postoji `backend/.env`
2. Ako ne: pokreni `backend/setup-env.bat`

### Problem: "Port already in use"
**Rešenje:**
- Zaustavi drugi proces ili promeni PORT u `backend/.env`

### Problem: "Module not found"
**Rešenje:**
```bash
# Backend
cd backend
npm install
npx prisma generate

# Frontend
cd ..
npm install
```

---

## 🔄 RESET BAZE (Brišesvepodatke!)

```bash
cd backend
npx prisma migrate reset --force
npm run db:seed
```

---

## 📡 API ENDPOINTS

### Javni:
- `GET /api/health` - Health check
- `POST /api/auth/login` - Login

### Zaštićeni (potreban JWT token):
- `GET /api/crew` - Lista crew članova
- `GET /api/guests` - Lista gostiju
- `GET /api/locations` - Lista lokacija
- `GET /api/service-requests` - Service zahtevi
- `GET /api/devices` - Uređaji
- `GET /api/activity-logs` - Sistem logovi

**Autentifikacija:** Dodaj header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📚 VIŠE INFORMACIJE

- **FIXES.md** - Detalji o popravkama
- **QUICK-START.md** - Detaljne instrukcije
- **BACKEND-INTEGRATION-ISSUES.md** - Backend integracija analiza
- **FINAL-BACKEND-INTEGRATION-COMPLETE.md** - ✨ Guest CRUD kompletna integracija
- **backend/README.md** - Backend dokumentacija
- **backend/.env.example** - Sve environment variable opcije

---

## 🎉 NOVO - GUEST MANAGEMENT SA PRAVOM BAZOM!

**✅ KOMPLETNO INTEGRISANO (19.10.2025):**
- ✅ **Dodavanje gosta** → PostgreSQL baza (ne localStorage!)
- ✅ **Izmena gosta** → PostgreSQL baza
- ✅ **Brisanje gosta** → PostgreSQL baza
- ✅ **Podaci perzistentni** → Ostaju posle refresh-a

**Testiranje:**
1. Dodaj gosta → Vidi ga u listi
2. Refresh browser (CTRL+F5)
3. Login ponovo
4. **Gost JOŠ TU!** ← To znači RADI SA BAZOM! 🎉

**Detalji:** Vidi `FINAL-BACKEND-INTEGRATION-COMPLETE.md`

---

## ✅ PROVERA DA LI RADI

### Test 1: Health Check
```bash
curl http://localhost:3001/api/health
```
Očekivano: `{"status":"OK","timestamp":"..."}`

### Test 2: Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```
Očekivano: `{"success":true,"token":"..."}`

### Test 3: Get Crew (sa tokenom)
```bash
curl http://localhost:3001/api/crew \
  -H "Authorization: Bearer YOUR_TOKEN"
```
Očekivano: Lista crew članova

---

## 🎯 ŠTAGOSI POPRAVLJENO

✅ `requirePermission` middleware dodat  
✅ JWT token struktura popravljena  
✅ Prisma schema kompletirana (8 modela)  
✅ 6 ruta registrovano  
✅ Rate limiting na login  
✅ Seed sa pravim mock podacima  
✅ Vite build config popravljen  
✅ Setup automatizovan  

**Aplikacija je spremna za produkciju! 🚀**

---

## 💡 SLEDEĆI KORACI

1. **Otvori http://localhost:3000 u browseru**
2. **Logiraj se:** admin / admin123
3. **Istražuj aplikaciju** - svi podaci su mock ali funkcionalni
4. **Test API endpoints** preko Postman/Insomnia

---

**Napravljena: 19. Oktobar 2025**  
**Status:** ✅ SPREMNO ZA KORIŠTENJE
