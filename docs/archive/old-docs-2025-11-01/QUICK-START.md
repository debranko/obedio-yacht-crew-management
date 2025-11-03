# 🚀 BRZO POKRETANJE - Obedio Yacht Crew Management

## ⚡ 5-MINUTNO POKRETANJE

### 1️⃣ Pripremi Environment Variables
```bash
cd backend
copy .env.example .env
```

**VAŽNO:** Otvori `.env` i postavi:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/obedio"
JWT_SECRET="tvoj-super-tajni-kljuc-promeni-ovo"
PORT=3001
```

### 2️⃣ Setup Database
```bash
# Instaliraj dependencies (ako već nisi)
npm install

# Generiši Prisma Client
npx prisma generate

# Push schema u PostgreSQL
npx prisma db push

# Seeduj podatke
npm run db:seed
```

### 3️⃣ Pokreni Backend Server
```bash
npm run dev
```

Trebao bi da vidiš:
```
✅ Database connected successfully
🚀 Obedio Server Started Successfully!

📍 Server Details:
   • Host: localhost:3001
```

### 4️⃣ Pokreni Frontend (NOVI TERMINAL)
```bash
cd ..
npm install  # ako već nisi
npm run dev
```

Frontend: http://localhost:3000
Backend: http://localhost:3001

---

## 🔑 LOGIN CREDENTIALS

**Username:** `admin`  
**Password:** `admin123`  
**Role:** ADMIN (sve dozvole)

---

## 🧪 TESTIRANJE

### Test Health Check
```bash
curl http://localhost:3001/api/health
```

Očekivano:
```json
{"status":"OK","timestamp":"2025-10-19T..."}
```

### Test Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Očekivano:
```json
{
  "success": true,
  "message": "Login successful",
  "user": {...},
  "token": "eyJhbGc..."
}
```

### Test Protected Endpoint
```bash
curl http://localhost:3001/api/crew \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📡 DOSTUPNI API ENDPOINTS

### Autentifikacija
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Crew Management
- `GET /api/crew` - Lista crew članova
- `POST /api/crew` - Kreiraj crew člana

### Guest Management
- `GET /api/guests` - Lista gostiju
- `POST /api/guests` - Kreiraj gosta
- `GET /api/guests/:id` - Detalji gosta
- `PUT /api/guests/:id` - Update gosta
- `DELETE /api/guests/:id` - Obriši gosta

### Locations
- `GET /api/locations` - Lista lokacija

### Service Requests 🔒 (Zahteva auth)
- `GET /api/service-requests` - Lista zahteva
- `POST /api/service-requests` - Novi zahtev
- `PUT /api/service-requests/:id/accept` - Prihvati
- `PUT /api/service-requests/:id/complete` - Završi

### Devices 🔒 (Zahteva auth)
- `GET /api/devices` - Lista uređaja
- `POST /api/devices` - Dodaj uređaj
- `PUT /api/devices/:id` - Update uređaj

### Activity Logs 🔒 (Zahteva auth)
- `GET /api/activity-logs` - Sistem logovi
- `POST /api/activity-logs` - Kreiraj log

### Duty Roster 🔒 (Zahteva auth)
- `GET /api/duty-roster` - Roster pregled

### Settings 🔒 (Zahteva auth)
- `GET /api/settings` - Podešavanja
- `PUT /api/settings` - Update podešavanja

### Smart Buttons 🔒 (Zahteva auth)
- `POST /api/smart-buttons/press` - ESP32 button event

🔒 = Zahteva `Authorization: Bearer <token>` header

---

## 🐛 TROUBLESHOOTING

### Problem: "Cannot connect to database"
**Rešenje:** 
1. Proveri da PostgreSQL radi
2. Proveri `DATABASE_URL` u `.env`
3. Kreiraj bazu: `createdb obedio`

### Problem: "JWT_SECRET not configured"
**Rešenje:** 
1. Otvori `backend/.env`
2. Dodaj: `JWT_SECRET="tvoj-tajni-kljuc-minimum-32-karaktera"`

### Problem: "Port 3001 already in use"
**Rešenje:**
1. Zaustavi drugi proces na 3001
2. Ili promeni PORT u `.env`

### Problem: "Prisma Client not generated"
**Rešenje:**
```bash
cd backend
npx prisma generate
```

### Problem: "requirePermission is not a function"
**Rešenje:** Ovo je POPRAVLJENO u najnovijoj verziji. Povuci latest kod.

---

## 📦 PRODUKCIJSKI BUILD

### Backend
```bash
cd backend
npm run build
npm run start
```

### Frontend
```bash
npm run build
# Frontend build ide u dist/ folder
```

---

## 🔄 RESET BAZE (Oprez!)

```bash
cd backend
npx prisma migrate reset --force
npm run db:seed
```

**⚠️ OVO BRIŠE SVE PODATKE!**

---

## 📚 DODATNA DOKUMENTACIJA

- `README.md` - Opšti pregled projekta
- `FIXES.md` - Detaljne popravke
- `backend/README.md` - Backend dokumentacija
- `backend/.env.example` - Sve environment varijable

---

**Status:** ✅ SVE RADI - SPREMO ZA POKRETANJE!
