# 🛥️ Obedio Yacht Crew Management System

**Production-ready Windows server application for luxury yacht crew management with ESP32 smart button integration.**

## 🚀 **Current Status**

### ✅ **COMPLETED - Full-Stack Migration**
- **Backend:** Node.js + Express + TypeScript + Prisma + PostgreSQL 
- **Frontend:** React + TypeScript + Tailwind CSS v4 + TanStack Query
- **Database:** PostgreSQL with 15+ tables and proper foreign key relationships
- **Authentication:** JWT-based with role permissions (admin/admin123)
- **Real-time:** WebSocket communication for instant updates
- **Deployment:** Windows server ready with PM2 configuration

### ✅ **COMPLETED - Code Quality**
- **AppDataContext refactored:** 2558 → 533 lines (79% reduction!)
- **Type definitions organized:** `src/types/` (625 lines extracted)
- **Mock data generators:** `src/mock-data/` (392 lines extracted)
- **Service layer pattern:** Unified across all components
- **6 critical code issues:** Resolved

### 🔄 **IN PROGRESS - Code Cleanup**
- **TypeScript errors:** 100+ errors from refactoring (need to fix import paths)
- **Nepotrebni fajlovi:** Obrisano 11 dokumentacijskih fajlova
- **Import standardization:** In progress

### 📅 **TODO - Remaining Work**
- Fix TypeScript import paths after refactoring
- Create frontend login component for database access
- Complete code cleanup (duplicates, unused files)
- Standardize all import paths

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

1. **TypeScript Errors:** 100+ errors from refactoring (components can't find moved types)
2. **Authentication:** Frontend needs login component to access database instead of localStorage
3. **Import Paths:** Need standardization after type extraction

## 🎯 **Next Steps**

1. Fix TypeScript import paths
2. Create login component
3. Complete code cleanup
4. Deploy to Windows server
5. ESP32 device integration

---

**Built for luxury yacht operations with production-ready Windows server deployment.**