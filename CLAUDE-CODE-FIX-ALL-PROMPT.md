# CLAUDE CODE - FIX OBEDIO SYSTEM PROMPT

Use this prompt with Claude Code to fix all identified issues:

---

## 🚨 CRITICAL MISSION: Fix OBEDIO for 24/7 Operation

You need to fix the OBEDIO yacht management system to run 24/7 as a true server application. There are 3 CRITICAL blockers and multiple standardization issues.

### 📋 YOUR TASK ORDER (MUST FOLLOW):

#### PHASE 1 - CRITICAL BLOCKERS (Do First!)

1. **REMOVE LOCALSTORAGE** 
   - File: `/src/services/api.ts` line 21
   - Remove `localStorage.getItem('obedio-auth-token')`
   - Update to use HTTP-only cookies or get token from AuthContext
   - Test authentication still works

2. **MOVE ALL FRONTEND TRANSFORMATIONS TO BACKEND**
   - File: `/src/hooks/useServiceRequestsApi.ts` - DELETE transformServiceRequest function (lines 39-72)
   - Update `/backend/src/routes/service-requests.ts` - Add transformation in GET endpoint
   - Transform data on backend: guestName, cabinImage, status mapping, etc.
   - Test service requests display correctly

3. **FIX PRISMA TYPE CONFLICTS**
   - Update `/backend/prisma/schema.prisma`:
     - Device model: `type String @map("device_type")`
     - Device model: `status String @map("device_status")`  
     - Location model: `type String @map("location_type")`
   - Run: `npx prisma migrate dev --name fix-type-conflicts`
   - Replace ALL raw SQL queries in:
     - `/backend/src/routes/guests.ts` (lines 106-118)
     - `/backend/src/routes/locations.ts` (lines 15-19)
     - `/backend/src/routes/devices.ts` (lines 177-196)

#### PHASE 2 - API STANDARDIZATION

4. **APPLY apiSuccess/apiError TO ALL ROUTES**
   - Import `import { apiSuccess, apiError } from '../utils/api-response';`
   - Update ALL endpoints in these files (70+ total):
     - guests.ts (11 endpoints)
     - locations.ts (7 endpoints)
     - crew.ts (5 endpoints)
     - messages.ts (9 endpoints)
     - service-requests.ts (5 endpoints)
     - assignments.ts (10 endpoints)
     - shifts.ts (7 endpoints)
     - devices.ts (8 endpoints)
   - Change from `res.json({success: true, data})` to `res.json(apiSuccess(data))`

5. **STANDARDIZE PAGINATION**
   - Convert all `offset/limit` to `page/limit`
   - Use `calculatePagination` and `buildPaginationMeta` utilities
   - Update `/backend/src/routes/messages.ts` and others
   - Update frontend `/src/services/api.ts` to use page instead of offset

#### PHASE 3 - MISSING FEATURES

6. **ADD WEBSOCKET EVENTS**
   - Add to `/backend/src/routes/crew.ts`: `websocketService.emitCrewEvent()`
   - Add to `/backend/src/routes/assignments.ts`: assignment events
   - Add to `/backend/src/routes/shifts.ts`: shift change events

7. **CREATE MISSING UIs**
   - Create `/src/components/pages/smart-buttons.tsx`
   - Create `/src/components/pages/role-permissions.tsx`
   - Create `/src/components/pages/notification-settings.tsx`
   - Add routes in App.tsx

### 🎯 TESTING AFTER EACH FIX:
- Test with Postman: Check response format
- Test authentication: Login/logout flow
- Test real-time: Open 2 browser tabs
- Test pagination: Check page navigation
- Test data display: Ensure no errors

### ⚠️ IMPORTANT RULES:
1. Fix CRITICAL issues first - system won't work without them
2. Test after EACH change - don't break working features  
3. Keep error handling - wrap in try/catch
4. Maintain WebSocket events - don't remove existing ones
5. Follow TypeScript types - no `any` types

### 📊 SUCCESS CRITERIA:
- ✅ NO localStorage usage anywhere
- ✅ ALL data transformations on backend
- ✅ NO raw SQL queries
- ✅ ALL APIs return `{success: true, data: T}`
- ✅ ALL pagination uses page/limit
- ✅ WebSocket events for all CRUD operations

### 🚀 START NOW:
Begin with removing localStorage from `/src/services/api.ts` line 21.

When complete, the system will be ready for 24/7 yacht operation!

---

## ADDITIONAL CONTEXT FILES TO CHECK:
- `OBEDIO-SYSTEM-ANALYSIS-DATA-ARCHITECT.md` - Full analysis report
- `OBEDIO-IMPLEMENTATION-CHECKLIST-CODERS.md` - Detailed code examples
- `CLAUDE-CODE-PROGRESS-REPORT.md` - What's already been fixed (71% done)