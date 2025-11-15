# MANDATORY CHECKLIST FOR CLAUDE - READ BEFORE EVERY ACTION!

## ⚠️ CRITICAL: THIS IS YOUR ROOT CHECKLIST

**BEFORE YOU DO ANYTHING - CHECK THIS LIST!**

---

## ✅ STEP 1: BEFORE CREATING ANY NEW FILE

### Ask yourself:
- [ ] **Does this file already exist?**
  - Use `Glob` tool to search: `**/*filename*`
  - Use `Grep` tool to search content
  - **DO NOT ASSUME IT DOESN'T EXIST!**

- [ ] **Is there a similar file that does the same thing?**
  - Check `src/components/` for component files
  - Check `src/hooks/` for React hooks
  - Check `src/services/` for API services
  - Check `backend/src/routes/` for API routes

- [ ] **Can I modify existing file instead of creating new?**
  - **ALWAYS PREFER EDITING OVER CREATING!**
  - Read the existing file first
  - Add to it, don't duplicate

### If file doesn't exist:
- [ ] **Is it really needed?** Ask user if unsure
- [ ] **Where does it belong?** Follow existing folder structure
- [ ] **Will it break existing imports?** Check dependencies

---

## ✅ STEP 2: BEFORE MODIFYING ANY FILE

### Ask yourself:
- [ ] **Does this file currently work?**
  - If YES - **BE EXTREMELY CAREFUL!**
  - If NO - safe to fix

- [ ] **Am I working on a related feature?**
  - If NO - **DO NOT TOUCH THIS FILE!**
  - If YES - proceed carefully

- [ ] **Will this change break existing functionality?**
  - Check who imports this file: `Grep` tool with filename
  - Check if it's used in multiple places
  - **IF UNSURE - ASK USER FIRST!**

### Before editing:
- [ ] **Read the ENTIRE file first** - use `Read` tool
- [ ] **Understand what it does currently**
- [ ] **Check if there are tests** - don't break them
- [ ] **Make smallest possible change** - no refactoring unless asked

---

## ✅ STEP 3: BEFORE CREATING NEW API ENDPOINT

### Mandatory checks:
- [ ] **Does this endpoint already exist in backend?**
  ```bash
  Glob: backend/src/routes/*.ts
  Grep: "router.METHOD('/endpoint-path'"
  ```

- [ ] **Does frontend already have API call for this?**
  ```bash
  Glob: src/services/*.ts
  Glob: src/hooks/*.ts
  Grep: "api.resource.method"
  ```

- [ ] **Is there a similar endpoint I can modify?**
  - Check existing routes first
  - Extend existing endpoint if possible

### If creating new endpoint:
- [ ] Backend route file created in `backend/src/routes/`
- [ ] Route registered in `backend/src/server.ts`
- [ ] TypeScript types added in `src/types/`
- [ ] API function added in `src/services/api.ts`
- [ ] API function **EXPORTED** from `api` object (don't forget!)
- [ ] React Query hook created in `src/hooks/`
- [ ] Tested with curl or Postman
- [ ] Auth middleware added
- [ ] Permission check added
- [ ] Rate limiting added (if POST/PUT/DELETE)
- [ ] Input validation added (Zod schema)

---

## ✅ STEP 4: BEFORE DELETING ANY FILE

### STOP AND CHECK:
- [ ] **Is this file imported anywhere?**
  ```bash
  Grep: "from './filename'"
  Grep: "import { } from 'path/filename'"
  ```

- [ ] **Is this file used by any component/service?**
  - Check all references first
  - **NEVER delete without checking imports!**

- [ ] **Will deleting this break the build?**
  - If unsure - **ASK USER!**

### If safe to delete:
- [ ] Remove all imports of this file
- [ ] Remove from exports
- [ ] Test that app still runs
- [ ] Update documentation

---

## ✅ STEP 5: BEFORE TOUCHING DATABASE

### Ask yourself:
- [ ] **Am I modifying Prisma schema?**
  - **CREATE BACKUP FIRST!** (`npm run backup:create`)
  - Check enum format (use underscore with @map)
  - Check existing constraints
  - Run migration after change
  - Update seed files if needed

- [ ] **Am I modifying seed files?**
  - Check enum values (use DASH format: `on-leave`)
  - Check that foreign keys exist
  - Test seed on clean database

- [ ] **Am I adding new migration?**
  - Check for duplicate constraints
  - Check that enum values match schema
  - Test migration on copy of production DB first

---

## ✅ STEP 6: BEFORE MAKING LARGE CHANGES

### If changing more than 5 files:
- [ ] **STOP! Ask user for confirmation first**
- [ ] List exactly what you're changing
- [ ] Explain WHY each change is needed
- [ ] Wait for user approval

### Never do:
- ❌ "Major cleanup" without user approval
- ❌ Refactoring working code without being asked
- ❌ Deleting files "to organize" without permission
- ❌ Changing 100+ files in one go
- ❌ Breaking changes without explicit user request

---

## ✅ STEP 7: GENERAL RULES

### ALWAYS:
- ✅ **Read existing code before creating new**
- ✅ **Use Glob/Grep to check if file exists**
- ✅ **Make smallest possible change**
- ✅ **Test after every change**
- ✅ **Ask user if unsure**
- ✅ **Follow existing patterns in codebase**
- ✅ **Preserve working functionality**

### NEVER:
- ❌ **Assume file doesn't exist without checking**
- ❌ **Create duplicate files**
- ❌ **Break working code when working on unrelated feature**
- ❌ **Delete files without checking imports**
- ❌ **Make changes without reading current code**
- ❌ **Touch working code unnecessarily**
- ❌ **Create new files when you can modify existing**

---

## 🚨 IF YOU BREAK THESE RULES

**You will waste user's time and effort.**
**You will break working functionality.**
**You will create bugs and problems.**

**THESE RULES ARE NOT OPTIONAL!**

---

## 📋 QUICK CHECKLIST BEFORE EVERY ACTION

```
[ ] Did I search if this already exists? (Glob/Grep)
[ ] Did I read existing code? (Read tool)
[ ] Is this the smallest possible change?
[ ] Am I working on related feature? (not touching unrelated code)
[ ] Will this break existing functionality? (checked imports)
[ ] Did I check enum format? (if database)
[ ] Did I export API function? (if new endpoint)
[ ] Am I making <5 file changes? (if more, ask user)
[ ] Did I test this change?
```

**IF ANY ANSWER IS "NO" OR "UNSURE" - STOP AND CHECK OR ASK USER!**

---

END OF CHECKLIST - **FOLLOW THIS RELIGIOUSLY!**
