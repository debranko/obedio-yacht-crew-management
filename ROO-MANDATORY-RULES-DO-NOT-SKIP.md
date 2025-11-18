# 🚨 ROO'S MANDATORY RULES - READ BEFORE ANY CODE CHANGE

**Created:** 2025-11-16 - After user frustration with repeated mistakes
**Priority:** CRITICAL - NEVER SKIP THESE STEPS

---

## ⚠️ GOLDEN RULE #1: EXAMINE BEFORE CREATE

**BEFORE creating ANY new API, function, or feature:**

1. ✅ Read `OBEDIO-API-MASTER-REFERENCE.md` COMPLETELY
2. ✅ Search codebase for similar implementations
3. ✅ Check if endpoint/function already exists
4. ✅ Compare with OBEDIO Final backup
5. ✅ Only THEN decide: use existing OR create new

**Time investment:** 30-60 minutes of investigation
**Saves:** Hours of fixing mistakes and user frustration

---

## ⚠️ GOLDEN RULE #2: USE EXISTING APIS

**Current system has:**
- 123+ backend endpoints
- 25 route files
- 7 frontend API hooks
- Complete CRUD operations

**Check THESE before coding:**
1. `OBEDIO-API-MASTER-REFERENCE.md` - Complete API list
2. `backend/src/routes/` - All existing endpoints
3. `src/hooks/use*Api.ts` - Frontend API hooks
4. `src/services/api.ts` - API client methods

**If it exists:** USE IT (don't recreate!)

---

## ⚠️ GOLDEN RULE #3: ALIGN, DON'T DUPLICATE

**When two components do similar things:**
1. ✅ Read BOTH completely
2. ✅ Compare functionality
3. ✅ Identify which is correct/better
4. ✅ Make them use SAME backend APIs
5. ✅ Align data display logic

**DON'T:** Create third variation
**DO:** Merge to single consistent approach

---

## ⚠️ GOLDEN RULE #4: READ, PLAN, THEN CODE

**Process:**
1. **INVESTIGATE** (30-60 min): Read all related code
2. **DOCUMENT** (15 min): Write what exists vs what's needed
3. **PLAN** (15 min): List exact changes needed
4. **GET APPROVAL** from user
5. **EXECUTE** carefully
6. **TEST** before moving on

**NEVER skip steps 1-4!**

---

## ⚠️ Golden RULE #5: RESPECT USER'S TIME

**User has:**
- Limited time (24h Metstrade deadline)
- Limited money (AI costs add up)
- Working system (don't break it!)

**I must:**
- Be methodical, not rushed
- Check before changing
- Test thoroughly
- Ask when uncertain
- Accept feedback gracefully

---

## 📋 MANDATORY CHECKLIST

**Before ANY code change, answer:**

- [ ] Have I read OBEDIO-API-MASTER-REFERENCE.md?
- [ ] Have I searched for existing implementations?
- [ ] Have I compared with OBEDIO Final backup?
- [ ] Do I understand current data flow?
- [ ] Am I ALIGNING existing code (not creating new)?
- [ ] Have I documented my plan?
- [ ] Did user approve my approach?

**If ANY answer is NO → STOP and investigate more!**

---

## 🎯 CURRENT TASK CHECKLIST

**Voice Feature Alignment:**

- [ ] Read incoming-request-dialog.tsx (popup window)
- [ ] Read service-requests.tsx (page display)
- [ ] Compare: Do they use SAME APIs?
- [ ] Compare: Do they display SAME data?
- [ ] Identify: What's different?
- [ ] Plan: How to align them?
- [ ] Document: Exact changes needed
- [ ] Get approval
- [ ] Execute carefully
- [ ] Test both work identically

---

**This file exists to remind me: INVESTIGATE FIRST, CODE SECOND**