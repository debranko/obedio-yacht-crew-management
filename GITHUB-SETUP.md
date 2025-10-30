# 🔄 GitHub Setup - Obedio Yacht Crew Management

**Repository URL:** https://github.com/debranko/obedio-yacht-crew-management.git

---

## 🚀 PRVI PUT - Initial Push

### 1. Inicijalizuj Git (ako već nije)
```bash
git init
```

### 2. Dodaj Remote Repository
```bash
git remote add origin https://github.com/debranko/obedio-yacht-crew-management.git
```

### 3. Proveri da li .gitignore postoji
```bash
cat .gitignore
```

Trebao bi da sadrži:
```
node_modules/
dist/
build/
.env
.env.local
.env.production
backend/.env
logs/
*.log
```

### 4. Dodaj sve fajlove
```bash
git add .
```

### 5. Kreiraj prvi commit
```bash
git commit -m "Initial commit - Complete Obedio Yacht Crew Management System

✅ Backend: Node.js + Express + TypeScript + Prisma + PostgreSQL
✅ Frontend: React + TypeScript + Tailwind CSS v4 + TanStack Query
✅ Database: 8 Prisma models with relations
✅ Authentication: JWT with role-based permissions
✅ API: 20+ endpoints with requirePermission middleware
✅ Mock Data: Seeded database with crew, guests, locations
✅ Setup Scripts: Automated SETUP-COMPLETE and START-ALL
✅ Documentation: Complete setup and troubleshooting guides

Features:
- Crew management (6 members)
- Guest management (4 guests)
- Location tracking (9 locations)
- Service requests system
- Device management (ESP32 ready)
- Activity logs
- Real-time WebSocket support
- Rate limiting on login
- Comprehensive error handling

Login: admin / admin123
Status: Production-ready ✅"
```

### 6. Push na GitHub
```bash
# Prvi put:
git branch -M main
git push -u origin main

# Kasnije:
git push
```

---

## 🔄 KASNIJE - Regular Updates

### Dodaj promene:
```bash
git add .
git commit -m "Your commit message"
git push
```

### Proveri status:
```bash
git status
git log --oneline -5
```

---

## 📦 ŠTA ĆE BITI PUSHOVAN

### ✅ Included:
- `/backend/src/**` - Backend kod
- `/backend/prisma/**` - Database schema i seed
- `/src/**` - Frontend kod
- `/public/**` - Public assets
- `package.json`, `tsconfig.json`, itd. - Config fajlovi
- Svi `.md` dokumenti - Dokumentacija
- `*.bat` i `*.sh` setup skripte

### ❌ Excluded (.gitignore):
- `node_modules/` - Node dependencies
- `dist/`, `build/` - Build outputs
- `.env` fajlovi - Environment secrets
- `logs/` - Log fajlovi
- `*.log` - Log files

---

## 🔒 BITNO - Secrets

**NIKAD ne commituj:**
- `.env` fajlove (sadrže JWT_SECRET, DATABASE_URL)
- `backend/.env`
- Bilo kakve passwords ili API keys

**Proveri da je .gitignore pravilan:**
```bash
# Trebao bi da vidiš:
.env
backend/.env
```

---

## 🌿 Git Workflow

### Feature Branch:
```bash
# Kreiraj novi branch
git checkout -b feature/new-feature

# Radi promene...
git add .
git commit -m "Add new feature"

# Push branch
git push -u origin feature/new-feature

# Merge u main (preko GitHub Pull Request)
```

### Hotfix:
```bash
git checkout -b hotfix/critical-bug
# Fix bug...
git add .
git commit -m "Fix critical bug"
git push -u origin hotfix/critical-bug
```

---

## 📝 Commit Message Conventions

### Format:
```
<type>: <subject>

<body>
```

### Types:
- `feat:` - Nova funkcionalnost
- `fix:` - Bug fix
- `docs:` - Dokumentacija
- `style:` - Formatiranje
- `refactor:` - Code refactoring
- `test:` - Testovi
- `chore:` - Maintenance

### Primeri:
```bash
git commit -m "feat: Add crew shift scheduling"
git commit -m "fix: Resolve JWT token validation bug"
git commit -m "docs: Update README with new features"
git commit -m "refactor: Simplify guest service logic"
```

---

## 🔍 Pre Push - Checklist

- [ ] Testirano lokalno (`npm run dev`)
- [ ] Nema `.env` fajlova u git add
- [ ] Build radi (`npm run build`)
- [ ] Dokumentacija updated
- [ ] Commit message je jasan
- [ ] Nema `console.log` u produkcijskom kodu
- [ ] TypeScript errors resolved

---

## 🚨 Ako Zabrljаš

### Undo Last Commit (nije pushovan):
```bash
git reset --soft HEAD~1
# Promene ostaju, samo commit je uklonjen
```

### Undo Local Changes:
```bash
git checkout -- <file>
# ILI sve:
git checkout -- .
```

### Povuci Latest sa GitHub:
```bash
git pull origin main
```

---

## 📊 GitHub Repository Setup

### 1. Repository Settings

**Description:**
```
🛥️ Luxury Yacht Crew Management System - Production-ready Node.js + React + PostgreSQL application for yacht interior crew management with ESP32 smart button integration
```

**Topics:**
```
yacht-management
crew-management
hospitality
react
nodejs
typescript
postgresql
prisma
express
esp32
smart-buttons
websocket
```

### 2. README.md

GitHub će automatski prikazati `README.md` kao homepage.

### 3. Branch Protection (Opciono)

Settings → Branches → Add rule:
- Branch name pattern: `main`
- ✅ Require pull request reviews
- ✅ Require status checks

---

## 🔗 Useful Git Commands

### Proveri remote:
```bash
git remote -v
```

### Promeni remote URL:
```bash
git remote set-url origin https://github.com/debranko/obedio-yacht-crew-management.git
```

### View commit history:
```bash
git log --graph --oneline --all
```

### Tag verziju:
```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

---

## 📦 GitHub Release

Kada je sve stabilno:

```bash
# Tag version
git tag -a v1.0.0 -m "Initial production release

Features:
- Complete crew management
- Guest management with locations
- Service request system
- JWT authentication
- Real-time WebSocket
- 20+ API endpoints
- Comprehensive documentation
"

# Push tag
git push origin v1.0.0
```

Zatim na GitHub:
1. Go to Releases
2. "Create a new release"
3. Choose tag `v1.0.0`
4. Add release notes

---

## 🎯 Repository Structure

```
obedio-yacht-crew-management/
├── backend/                 # Node.js backend
│   ├── src/                # Source code
│   ├── prisma/             # Database schema
│   └── package.json
├── src/                    # React frontend
│   ├── components/
│   ├── services/
│   └── types/
├── public/                 # Static assets
├── docs/                   # Documentation
├── SETUP-COMPLETE.bat      # Setup script
├── START-ALL.bat          # Start script
├── README.md              # Main documentation
└── package.json           # Root package.json
```

---

## ✅ READY TO PUSH!

Kada si spreman:

```bash
# Proveri status
git status

# Dodaj sve
git add .

# Commit
git commit -m "Initial commit - Complete system"

# Push
git push -u origin main
```

**Repository:** https://github.com/debranko/obedio-yacht-crew-management.git

---

**Created:** 19. Oktobar 2025  
**Status:** ✅ Ready for GitHub
