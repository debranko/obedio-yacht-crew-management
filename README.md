# 🛥️ Obedio Yacht Crew Management System

**Production-ready Windows server application for luxury yacht crew management with ESP32 smart button integration.**

---

## ⚡ **QUICK START** → Otvori `README-START-HERE.md`

```bash
# Windows:
SETUP-COMPLETE.bat    # Prvi put
START-ALL.bat         # Pokreni aplikaciju

# Linux/Mac:
./SETUP-COMPLETE.sh   # Prvi put
```

**Login:** `admin` / `admin123`  
**URL:** http://localhost:3000

---

## 🚀 **Current Status**

### ✅ **COMPLETED - Full-Stack Migration**
- **Backend:** Node.js + Express + TypeScript + Prisma + PostgreSQL 
- **Frontend:** React + TypeScript + Tailwind CSS v4 + TanStack Query
- **Database:** PostgreSQL with 15+ tables and proper foreign key relationships
- **Authentication:** JWT-based with role permissions (admin/admin123)
- **Real-time:** WebSocket communication for instant updates
- **Deployment:** Windows server ready with PM2 configuration

### ✅ **COMPLETED - Critical Fixes (19.10.2025)**
- ✅ **requirePermission middleware** - Dodato kompletno permission sistema
- ✅ **JWT token** - Popravljena struktura i validacija
- ✅ **Prisma Schema** - Kompletirana sa svim modelima (Device, Assignment, ActivityLog, etc.)
- ✅ **6 API Ruta** - Registrovano i aktivirano (/service-requests, /devices, etc.)
- ✅ **Rate Limiting** - Login zaštićen od brute force napada
- ✅ **Seed Data** - Mock podaci direktno u seed fajlu (9 lokacija, 6 crew, 4 gosta)
- ✅ **Setup Scripts** - Automatizovani SETUP-COMPLETE i START-ALL

### ✅ **COMPLETED - Code Quality**
- **AppDataContext refactored:** 2558 → 533 lines (79% reduction!)
- **Type definitions organized:** `src/types/` (625 lines extracted)
- **Mock data generators:** `src/mock-data/` (392 lines extracted)
- **Service layer pattern:** Unified across all components
- **Critical bugs:** SVE POPRAVLJENO - aplikacija RADI!

### 📅 **Future Enhancements**
- TypeScript strict mode
- WebSocket URL u environment variables
- Replace `any` types sa proper interfaces
- ESP32 hardware integration

## 🏗️ **Architecture**

### **Backend (Node.js + PostgreSQL)**
```
backend/
├── src/server.ts              # Express server + WebSocket
├── prisma/schema.prisma       # Database schema (15+ tables)
├── src/routes/               # API endpoints (CRUD operations)
├── src/services/             # Business logic + database
├── src/middleware/           # Auth + logging + error handling
└── src/utils/               # Logger + utilities
```

### **Frontend (React + TypeScript)**
```
src/
├── types/                   # Type definitions (organized)
├── mock-data/              # Mock data generators
├── services/               # API integration + WebSocket
├── contexts/               # AppDataContext (refactored)
├── components/             # UI components
├── hooks/                  # Custom hooks
└── pages/                  # Page components
```

### **Database (PostgreSQL)**
- **Users:** JWT authentication with roles
- **Locations:** 9 yacht locations with DND status
- **Guests:** Guest management with proper foreign keys
- **Crew:** Duty roster assignments + device management
- **Service Requests:** Real-time guest call system
- **Smart Buttons:** ESP32 device integration

## 🌐 **Access URLs**

- **Frontend:** http://localhost:3000 (React development server)
- **Backend:** http://localhost:3001 (API + WebSocket server)
- **API Health:** http://localhost:3001/api/health
- **Database:** PostgreSQL on localhost:5432

## 🔑 **Login Credentials**

- **Username:** admin
- **Password:** admin123
- **Role:** ADMIN (full permissions)

## 📊 **Current Data**

**In PostgreSQL Database:**
- 1 Admin user
- 9 Yacht locations (with DND status)
- 3 Guests (with foreign key relationships)
- 3 Crew members (with duty assignments)
- 2 Service requests
- 2 Smart buttons (ESP32 ready)

## 🛠️ **Development**

**Start Backend:**
```bash
cd backend
npm run dev
```

**Start Frontend:**
```bash
npm run dev
```

**Database Setup:**
```bash
cd backend
npx prisma generate
npx prisma db push
npm run db:seed
```

## 🚨 **Known Issues**

**NONE - Sve kritične greške su popravljene! ✅**

Manje probleme (opciono):
- TypeScript strict mode isključen (funkcioniše, ali nije "striktno")
- Neki `any` tipovi u kodu (radi, ali može bolje)
- Console.log umesto logger-a u nekoliko fajlova

## 🎯 **How to Use**

### Prvi Put:
1. **Run:** `SETUP-COMPLETE.bat` (Windows) ili `./SETUP-COMPLETE.sh` (Linux/Mac)
2. **Wait:** Script će instalirati sve i seedovati bazu

### Svaki Drugi Put:
1. **Run:** `START-ALL.bat` (Windows)
2. **Open:** http://localhost:3000
3. **Login:** admin / admin123

**Detaljne instrukcije:** `README-START-HERE.md`

---

**Built for luxury yacht operations with production-ready Windows server deployment.**