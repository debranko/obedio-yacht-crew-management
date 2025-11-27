# 📚 How to Use the Architecture Documentation

**Created:** October 23, 2025  
**For:** Developers, Team Members, Stakeholders

---

## 🎯 Purpose

This guide explains **how to navigate and use** the Obedio architecture documentation to understand the system, contribute code, and solve problems.

---

## 📖 Documentation Structure

The documentation is organized into **focused, modular files** so you don't have to read everything at once.

```
docs/
├── README.md                      ← Start here (documentation index)
├── HOW-TO-USE-ARCHITECTURE-DOCS.md  ← You are here
├── SYSTEM-OVERVIEW.md             ← Big picture (30 min read)
├── FRONTEND-ARCHITECTURE.md       ← React app details (20 min)
├── BACKEND-ARCHITECTURE.md        ← API server details (20 min)
├── DATABASE-ARCHITECTURE.md       ← PostgreSQL schema (15 min)
├── INTEGRATION-GUIDE.md           ← How everything connects (25 min)
└── TASK-STATUS.md                 ← What's done, what's pending
```

**Total Reading Time:** ~2 hours for complete understanding

---

## 🚀 Quick Start Paths

### **Path 1: "I just joined the project"**

**Goal:** Understand what Obedio is and how it works

**Read in this order:**
1. `docs/README.md` (5 min) - Overview
2. `docs/SYSTEM-OVERVIEW.md` (30 min) - Architecture
3. `docs/TASK-STATUS.md` (10 min) - Current state
4. Root `README.md` (10 min) - Setup instructions

**Time:** ~1 hour  
**Result:** You understand the system and can run it locally

---

### **Path 2: "I'm a backend developer"**

**Goal:** Work on API endpoints and database

**Read in this order:**
1. `docs/SYSTEM-OVERVIEW.md` - Get the big picture
2. `docs/BACKEND-ARCHITECTURE.md` - API patterns
3. `docs/DATABASE-ARCHITECTURE.md` - Schema details
4. `docs/INTEGRATION-GUIDE.md` - How frontend calls backend

**Focus Areas:**
- `backend/src/routes/` - API endpoints
- `backend/prisma/schema.prisma` - Database schema
- `backend/.env` - Configuration

**Time:** ~1 hour  
**Result:** Ready to create/modify API endpoints

---

### **Path 3: "I'm a frontend developer"**

**Goal:** Build UI components and connect to APIs

**Read in this order:**
1. `docs/SYSTEM-OVERVIEW.md` - Architecture overview
2. `docs/FRONTEND-ARCHITECTURE.md` - React patterns
3. `docs/INTEGRATION-GUIDE.md` - API integration

**Focus Areas:**
- `src/components/pages/` - Page components
- `src/hooks/` - React Query hooks
- `src/services/` - API clients

**Time:** ~1 hour  
**Result:** Ready to build/modify UI features

---

### **Path 4: "I need to fix a bug"**

**Goal:** Understand where to look and what to change

**Steps:**
1. **Identify the layer:**
   - UI bug? → Read `FRONTEND-ARCHITECTURE.md`
   - API error? → Read `BACKEND-ARCHITECTURE.md`
   - Data issue? → Read `DATABASE-ARCHITECTURE.md`
   - Connection problem? → Read `INTEGRATION-GUIDE.md`

2. **Find the relevant file:**
   - Use the folder structure diagrams in each doc
   - Search for component/route/table name

3. **Understand the pattern:**
   - Follow the existing code pattern
   - Check similar working features

4. **Test the fix:**
   - Follow testing sections in docs
   - Verify no regressions

**Time:** 10-30 min to locate + time to fix  
**Result:** Targeted bug fix with minimal side effects

---

### **Path 5: "I want to add a new feature"**

**Goal:** Understand the full stack and add feature properly

**Steps:**
1. **Read** `docs/SYSTEM-OVERVIEW.md` - Understand architecture layers
2. **Plan** which layers you'll touch:
   - Database? → Create migration
   - Backend? → Add route + service
   - Frontend? → Add component + hook
   - Real-time? → Add WebSocket event

3. **Read** relevant architecture docs for each layer
4. **Follow** the patterns shown in docs
5. **Test** each layer independently
6. **Integrate** and test end-to-end

**Time:** 2-4 hours depending on feature complexity  
**Result:** Feature implemented following best practices

---

### **Path 6: "I'm a project manager/stakeholder"**

**Goal:** Understand what's built and what's pending

**Read in this order:**
1. `docs/SYSTEM-OVERVIEW.md` (focus on "What is Obedio?" section)
2. `docs/TASK-STATUS.md` - See progress
3. `METSTRADE-2025-ROADMAP.md` - Timeline

**Time:** 20 min  
**Result:** Clear understanding of project status

---

## 🔍 How to Find Information

### **By Topic:**

| I want to know about... | Read this document | Section |
|-------------------------|-------------------|---------|
| What Obedio does | `SYSTEM-OVERVIEW.md` | "What is Obedio?" |
| Overall architecture | `SYSTEM-OVERVIEW.md` | "Architecture Layers" |
| React components | `FRONTEND-ARCHITECTURE.md` | "Folder Structure" |
| API endpoints | `BACKEND-ARCHITECTURE.md` | "API Endpoints" |
| Database tables | `DATABASE-ARCHITECTURE.md` | "Core Tables" |
| Authentication | `INTEGRATION-GUIDE.md` | "Authentication Flow" |
| Real-time updates | `INTEGRATION-GUIDE.md` | "Real-Time Event Flow" |
| ESP32 integration | `INTEGRATION-GUIDE.md` | "ESP32 ↔ Backend" |
| WebSocket events | `BACKEND-ARCHITECTURE.md` | "WebSocket Events" |
| Deployment | `BACKEND-ARCHITECTURE.md` | "Deployment" |

### **By File/Folder:**

| File/Folder | Documented in | Section |
|-------------|---------------|---------|
| `src/components/pages/` | `FRONTEND-ARCHITECTURE.md` | "Key Pages" |
| `src/hooks/` | `FRONTEND-ARCHITECTURE.md` | "Data Fetching Pattern" |
| `backend/src/routes/` | `BACKEND-ARCHITECTURE.md` | "API Endpoints" |
| `backend/prisma/schema.prisma` | `DATABASE-ARCHITECTURE.md` | "Core Tables" |
| `src/contexts/AuthContext.tsx` | `FRONTEND-ARCHITECTURE.md` | "Authentication Flow" |
| `backend/src/server.ts` | `BACKEND-ARCHITECTURE.md` | "Architecture Layers" |

---

## 💡 Pro Tips

### **Tip 1: Use the diagrams**

Every architecture doc has **ASCII diagrams** showing:
- Data flow
- Component relationships
- Architecture layers

**These are gold!** Refer to them when confused.

---

### **Tip 2: Follow the "Expected Outcome" sections**

Many docs include:
```
Expected Outcome:
- Before: [problem]
- After: [solution]
```

These help you understand **why** things are built the way they are.

---

### **Tip 3: Check code examples**

All docs include **real code snippets** from the project.  
These show:
- Naming conventions
- Coding patterns
- Best practices

**Copy these patterns** when adding new code.

---

### **Tip 4: Use the troubleshooting sections**

Each doc has a **"Troubleshooting"** section at the end.

Check these **before** asking for help. Most common issues are already documented.

---

### **Tip 5: Cross-reference between docs**

Docs link to each other. Example:
- `FRONTEND-ARCHITECTURE.md` says "See INTEGRATION-GUIDE.md for API details"
- `BACKEND-ARCHITECTURE.md` says "See DATABASE-ARCHITECTURE.md for schema"

**Follow these links** for deeper understanding.

---

## 🔄 Documentation Workflow

### **When Reading Code:**
1. Open the relevant architecture doc
2. Find the folder/file in the structure diagram
3. Read the pattern explanation
4. Refer back to code with new understanding

### **When Writing Code:**
1. Read the architecture doc for that layer
2. Find a similar existing feature
3. Follow the same pattern
4. Test thoroughly

### **When Reviewing Code:**
1. Check if it follows patterns in docs
2. Verify naming conventions
3. Ensure tests match the patterns

---

## 📝 Keeping Docs Updated

### **If you add a new feature:**
- Update the relevant architecture doc
- Add the file to the folder structure diagram
- Explain the pattern you used

### **If you find outdated info:**
- Create an issue or PR
- Mark the section with `⚠️ OUTDATED`
- Propose the correction

### **If something is unclear:**
- Add a question in the doc as a comment
- Ask the team
- Update the doc once answered

---

## 🆘 Still Stuck?

### **Can't find what you're looking for?**
1. Check `docs/README.md` - The master index
2. Search files for keywords (Ctrl+F in each doc)
3. Ask the team with specific document + section reference

### **Docs are outdated?**
1. Check git commit dates at top of each file
2. Cross-reference with actual code
3. Update the doc and submit a PR

### **Need help understanding architecture?**
1. Start with `SYSTEM-OVERVIEW.md`
2. Draw your own diagrams
3. Discuss with the team

---

## ✅ Documentation Best Practices

### **For Readers:**
- ✅ Start with overview, then dive deep
- ✅ Read code examples carefully
- ✅ Follow the quick start path for your role
- ✅ Refer back to docs when stuck

### **For Writers:**
- ✅ Keep sections focused and modular
- ✅ Include code examples from actual codebase
- ✅ Add diagrams for complex flows
- ✅ Update "Last Updated" date when you change anything

---

## 🎯 Success Criteria

**You've successfully used the docs if:**
- ✅ You can run the project locally
- ✅ You understand how to add a feature
- ✅ You know where to look when debugging
- ✅ You can explain the architecture to someone else

**The docs are successful if:**
- ✅ New developers can onboard in <1 day
- ✅ Bugs are fixed in the right layer
- ✅ Features follow consistent patterns
- ✅ Code reviews reference the docs

---

## 📚 Additional Resources

**In the root folder:**
- `README.md` - Quick start guide
- `HOW-TO-RUN.md` - Development setup
- `METSTRADE-2025-ROADMAP.md` - Project timeline
- `OBEDIO-TASK-LIST-FOR-NEXT-DEVELOPER.md` - Task breakdown

**In backend folder:**
- `backend/README.md` - Backend setup
- `backend/API-ENDPOINTS-SUMMARY.md` - API reference

**In src folder:**
- `src/README.md` - Frontend code overview
- `src/Attributions.md` - Third-party libraries

---

**Last Updated:** October 23, 2025  
**Maintained by:** Obedio Development Team

**Questions?** Check `docs/README.md` or ask the team!
