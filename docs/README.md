# 📚 Obedio Architecture Documentation

Complete architecture documentation for the Obedio Yacht Crew Management System.

---

## 📖 Documentation Files

### 1. [SYSTEM-OVERVIEW.md](./SYSTEM-OVERVIEW.md)
**Start here!** High-level system architecture, components, and key decisions.

**Topics:**
- What is Obedio?
- System components
- Architecture layers
- Key design decisions
- Current status

---

### 2. [HOW-TO-USE-ARCHITECTURE-DOCS.md](./HOW-TO-USE-ARCHITECTURE-DOCS.md)
**Usage guide!** How to navigate and use the documentation effectively.

**Topics:**
- Quick start paths by role
- Finding information fast
- How to fix bugs using docs
- How to add features
- Pro tips & workflows

---

### 3. [TASK-STATUS.md](./TASK-STATUS.md)
**Current state!** What's completed and what's pending.

**Topics:**
- Completion statistics
- Completed features
- In progress work
- Pending tasks (prioritized)
- METSTRADE readiness
- Next actions

---

### 4. [FRONTEND-ARCHITECTURE.md](./FRONTEND-ARCHITECTURE.md)
React application structure and patterns.

**Topics:**
- Technology stack
- Folder structure
- Authentication flow
- Data fetching (React Query)
- Real-time updates (WebSocket)
- Key pages
- UI component library

---

### 5. [BACKEND-ARCHITECTURE.md](./BACKEND-ARCHITECTURE.md)
API server architecture and implementation.

**Topics:**
- Express server structure
- API endpoints
- Authentication middleware
- Service layer pattern
- WebSocket events
- Security features
- Logging
- Deployment

---

### 6. [DATABASE-ARCHITECTURE.md](./DATABASE-ARCHITECTURE.md)
PostgreSQL database schema and relationships.

**Topics:**
- Core tables (10 tables)
- Key relationships
- Foreign key constraints
- Atomic operations
- Performance indexes
- Seed data
- Prisma commands

---

### 7. [INTEGRATION-GUIDE.md](./INTEGRATION-GUIDE.md)
How all components connect and communicate.

**Topics:**
- Frontend ↔ Backend integration
- Backend ↔ Database queries
- ESP32 ↔ Backend communication
- Real-time event flow
- Authentication flow
- Data sync strategy
- Multi-platform architecture
- Troubleshooting

---

## 🎯 Quick Navigation

### For New Developers

**Start Here (Everyone):**
1. Read: [HOW-TO-USE-ARCHITECTURE-DOCS.md](./HOW-TO-USE-ARCHITECTURE-DOCS.md) (5 min)
2. Read: [TASK-STATUS.md](./TASK-STATUS.md) (10 min)
3. Follow your role-specific path below

**Backend Developer:**
1. Read: [SYSTEM-OVERVIEW.md](./SYSTEM-OVERVIEW.md) (30 min)
2. Read: [BACKEND-ARCHITECTURE.md](./BACKEND-ARCHITECTURE.md) (20 min)
3. Read: [DATABASE-ARCHITECTURE.md](./DATABASE-ARCHITECTURE.md) (15 min)
4. Code: `backend/src/` folder

**Frontend Developer:**
1. Read: [SYSTEM-OVERVIEW.md](./SYSTEM-OVERVIEW.md) (30 min)
2. Read: [FRONTEND-ARCHITECTURE.md](./FRONTEND-ARCHITECTURE.md) (20 min)
3. Read: [INTEGRATION-GUIDE.md](./INTEGRATION-GUIDE.md) (15 min - API section)
4. Code: `src/` folder

**Full-Stack Developer:**
1. Read: [SYSTEM-OVERVIEW.md](./SYSTEM-OVERVIEW.md) (30 min)
2. Read: [INTEGRATION-GUIDE.md](./INTEGRATION-GUIDE.md) (25 min)
3. Read: [TASK-STATUS.md](./TASK-STATUS.md) (10 min)
4. Read all layer-specific docs as needed

**Hardware/IoT Developer:**
1. Read: [INTEGRATION-GUIDE.md](./INTEGRATION-GUIDE.md) - Section 3 (ESP32)
2. Read: `../ESP32-HARDWARE-SPECIFICATION.md`
3. Check: [TASK-STATUS.md](./TASK-STATUS.md) - MQTT status

**Project Manager/Stakeholder:**
1. Read: [SYSTEM-OVERVIEW.md](./SYSTEM-OVERVIEW.md) - First 2 sections
2. Read: [TASK-STATUS.md](./TASK-STATUS.md) - Full review
3. Review: METSTRADE readiness section

---

## 📊 Architecture Summary

### Tech Stack
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript + Prisma
- **Database:** PostgreSQL 14+
- **Real-time:** Socket.io (WebSocket)
- **Hardware:** ESP32 (WiFi + LoRa)

### Key Patterns
- **Database-First:** PostgreSQL is single source of truth
- **Real-Time:** WebSocket for instant updates
- **JWT Auth:** Stateless authentication with RBAC
- **Service Layer:** Business logic separation
- **React Query:** Server state management
- **Optimistic Updates:** Instant UI feedback

---

## 🔗 Related Documentation

### In Root Folder
- `README.md` - Quick start guide
- `HOW-TO-RUN.md` - Development setup
- `ESP32-HARDWARE-SPECIFICATION.md` - Hardware specs
- `BUTLER-CALL-FLOW.md` - Service request workflow
- `ROLES-PERMISSIONS.md` - Role-based access control

### In Backend Folder
- `backend/README.md` - Backend setup guide
- `backend/API-ENDPOINTS-SUMMARY.md` - API reference
- `backend/prisma/schema.prisma` - Database schema

### In Frontend Folder
- `src/README.md` - Frontend code structure
- `src/Attributions.md` - Third-party libraries

---

## 🚀 Quick Start

```bash
# Clone repository
git clone <repo-url>
cd obedio

# Install dependencies
npm install
cd backend && npm install && cd ..

# Setup database
cd backend
npx prisma generate
npx prisma db push
npm run db:seed
cd ..

# Start backend (Terminal 1)
cd backend && npm run dev

# Start frontend (Terminal 2)
npm run dev

# Open browser
http://localhost:3000
# Login: admin / admin123
```

---

## 🆘 Need Help?

### Documentation Issues
- File not found? Check if you're in the correct directory
- Broken links? File may have moved or been renamed
- Outdated info? Check git commit date

### Technical Issues
- Backend won't start? See [INTEGRATION-GUIDE.md](./INTEGRATION-GUIDE.md) troubleshooting
- Frontend errors? Check browser console
- Database issues? Verify PostgreSQL is running

### Questions
- Architecture questions? See [SYSTEM-OVERVIEW.md](./SYSTEM-OVERVIEW.md)
- Integration questions? See [INTEGRATION-GUIDE.md](./INTEGRATION-GUIDE.md)
- Specific component? Check relevant architecture doc

---

## 📝 Contributing to Docs

### Updating Documentation
1. Edit the relevant `.md` file in `docs/` folder
2. Update "Last Updated" date
3. Test all code examples
4. Check links work
5. Commit with message: `docs: update <filename>`

### Adding New Documentation
1. Create `.md` file in `docs/` folder
2. Add entry to this README.md
3. Link from related documents
4. Follow existing format/style

---

**Last Updated:** October 23, 2025  
**Maintained by:** Obedio Development Team
