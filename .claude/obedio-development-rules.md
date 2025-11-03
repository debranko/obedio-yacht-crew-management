# 🚨 OBEDIO DEVELOPMENT RULES - MANDATORY WORKFLOW
**CRITICAL: YOU MUST FOLLOW THIS WORKFLOW FOR EVERY TASK - NO EXCEPTIONS**

---

## ⚡ PHASE 1: API & CODE INVENTORY (ALWAYS FIRST!)

**Before making ANY changes, you MUST:**

### 1.1 Search for Existing APIs

**Backend Routes:**
```bash
# Search all route files
Search: backend/src/routes/*.ts

# Document each endpoint:
| API Endpoint | Method | File | Purpose | Auth | Permissions |
|--------------|--------|------|---------|------|-------------|
| /api/guests | GET | guests.ts | List guests with filters | ✅ | guests.view |
| /api/guests/:id | PUT | guests.ts | Update guest | ✅ | guests.update |
```

**Controllers/Services:**
```bash
# Check for business logic
Search: backend/src/services/
Search: backend/src/controllers/
```

### 1.2 Find ALL Usages

**Frontend API Calls:**
```bash
# Search for API usage
Search: src/**/*.tsx for "fetch", "api.", "axios"
Search: src/hooks/use*Api*.ts
Search: src/services/*.ts

# Document usage:
| API Endpoint | Used In Files | Component/Hook | Purpose |
|--------------|---------------|----------------|---------|
| GET /api/guests | guests-list.tsx | GuestsListPage | Display guest list |
| GET /api/guests | GuestsContext.tsx | useGuests hook | Global state |
```

### 1.3 Check Database Schema

**Prisma Models:**
```bash
# Always read schema first
Read: backend/prisma/schema.prisma

# Document related tables:
| Model | Related Models | Foreign Keys | Important Fields |
|-------|----------------|--------------|------------------|
| Guest | Location, ServiceRequest | locationId | firstName, lastName, type, status |
```

### 1.4 Check API Master Reference

```bash
# ALWAYS check this first!
Read: OBEDIO-API-MASTER-REFERENCE.md

# Search for the feature you need (Ctrl+F)
# Check Backend API Endpoints section
# Check Component-to-API Mapping section
```

### 1.5 Create Inventory Table

**Before proceeding, create this table:**

```markdown
## API & CODE INVENTORY FOR [TASK NAME]

### Existing APIs Found:
| Endpoint | Method | File | Used By | DB Tables | Status |
|----------|--------|------|---------|-----------|--------|
| /api/guests | GET | backend/src/routes/guests.ts | guests-list.tsx, GuestsContext.tsx | Guest, Location | ✅ EXISTS |
| /api/guests/:id | PUT | backend/src/routes/guests.ts | guest-form-dialog.tsx | Guest | ✅ EXISTS |

### Frontend Components Affected:
| File | Current API Usage | Will Be Affected? |
|------|-------------------|-------------------|
| src/components/pages/guests-list.tsx | GET /api/guests | ✅ YES |
| src/hooks/useGuestsApi.ts | CRUD operations | ✅ YES |

### Database Schema:
| Table | Fields | Relationships |
|-------|--------|---------------|
| Guest | id, firstName, lastName, locationId, type, status | → Location, → ServiceRequest |

### Conclusion:
- ✅ API already exists: /api/guests
- ⚠️ Need to extend: Add new filter parameter
- ❌ Do NOT create new endpoint
```

---

## ⚡ PHASE 2: IMPACT ANALYSIS & APPROVAL

**Before changing ANYTHING:**

### 2.1 List All Affected Files

```markdown
## IMPACT ANALYSIS

### Files That Will Change:
1. ✏️ backend/src/routes/guests.ts - Add filter parameter
2. ✏️ src/services/guests.ts - Update API call
3. ✏️ src/components/pages/guests-list.tsx - Use new filter
4. ✏️ OBEDIO-API-MASTER-REFERENCE.md - Update documentation

### Files That Might Break:
1. ⚠️ src/contexts/GuestsContext.tsx - Uses guests API
2. ⚠️ src/components/guest-form-dialog.tsx - Might need cache invalidation

### Breaking Changes:
- ❌ None - backward compatible
```

### 2.2 Present Plan to User

**STOP HERE! Present the plan:**

```markdown
## PROPOSED CHANGES

**Goal:** [What you're trying to achieve]

**Current State:**
- API: /api/guests exists
- Used by: 3 frontend components
- DB: Uses Guest table

**Proposed Solution:**
1. Extend existing /api/guests with new query parameter
2. Update frontend components to use new parameter
3. NO new API endpoints needed

**Risk Assessment:**
- LOW - Backward compatible
- All existing functionality preserved

**Do you approve this approach?**
```

**DO NOT IMPLEMENT UNTIL USER APPROVES!**

---

## ⚡ PHASE 3: IMPLEMENTATION (Only After Approval!)

### 3.1 Make Changes Incrementally

**One change at a time:**

1. ✅ Backend endpoint first
2. ✅ Test with curl/Postman
3. ✅ Frontend API service
4. ✅ React Query hook (if needed)
5. ✅ Update components
6. ✅ WebSocket events (if needed)

### 3.2 Test Each Change

**After EVERY change:**
```bash
# Backend change
npm run dev (backend)
curl -b cookies.txt http://localhost:8080/api/guests?newParam=value

# Frontend change
npm run dev (frontend)
# Open browser, test manually
```

### 3.3 Preserve Existing Functionality

**CRITICAL RULES:**

- ✅ If API exists → EXTEND it, don't create new
- ✅ If component uses API → UPDATE usage, don't duplicate
- ✅ Keep backward compatibility unless user approves breaking change
- ✅ Test that old functionality still works

### 3.4 Required Patterns

**Backend API Endpoint:**
```typescript
// ALWAYS use this pattern:
router.get('/',
  authMiddleware,                          // ✅ Auth REQUIRED
  requirePermission('resource.view'),       // ✅ Permissions
  validate(schema),                         // ✅ Validation (if POST/PUT)
  asyncHandler(async (req, res) => {
    const data = await prisma.resource.findMany({ /* ... */ });

    // ✅ Emit WebSocket event on changes
    websocketService.emitResourceEvent('updated', data);

    // ✅ Standard response format
    res.json(apiSuccess(data, paginationMeta));
  })
);
```

**Frontend React Query Hook:**
```typescript
// ALWAYS use React Query, NEVER localStorage/mock data
export function useResources() {
  return useQuery({
    queryKey: ['resources'],
    queryFn: () => api.resources.getAll(),
    staleTime: 1000 * 60 * 5,  // 5 minutes
  });
}
```

**WebSocket Listener:**
```typescript
// ALWAYS invalidate queries on real-time events
useEffect(() => {
  const unsubscribe = wsOn('resource:updated', () => {
    queryClient.invalidateQueries({ queryKey: ['resources'] });
  });
  return () => unsubscribe();
}, [wsOn, queryClient]);
```

---

## ⚡ PHASE 4: DOCUMENTATION

**After successful implementation:**

### 4.1 Create Change Log

```markdown
## CHANGE LOG - [Task Name]

### ✅ Modified APIs:
- GET /api/guests - Added `favoriteOnly` query parameter
  - File: backend/src/routes/guests.ts:17
  - Backward compatible: YES

### 📝 Updated Components:
- src/components/pages/guests-list.tsx - Uses new filter
- src/services/guests.ts - Added parameter to API call

### 📚 Updated Documentation:
- OBEDIO-API-MASTER-REFERENCE.md - Section 2 (Guests API)

### ⚠️ Breaking Changes:
- None

### 🧪 Testing Completed:
- ✅ Backend: curl test successful
- ✅ Frontend: Manual browser test successful
- ✅ WebSocket: Real-time updates working
```

### 4.2 Update API Master Reference

**ALWAYS update OBEDIO-API-MASTER-REFERENCE.md:**

1. Find the relevant API section
2. Update the endpoint table with new parameters
3. Update "Used By" if new components use it
4. Update document date at top

---

## 🚨 CRITICAL RULES - NEVER VIOLATE

### Rule #1: SEARCH FIRST, CREATE NEVER (Unless Proven Necessary)

```
❌ WRONG: "I'll create a new /api/guests/favorites endpoint"
✅ RIGHT: "I searched and /api/guests exists. I'll add a filter parameter."
```

**Checklist:**
- [ ] Searched backend/src/routes/ for similar endpoints
- [ ] Searched OBEDIO-API-MASTER-REFERENCE.md
- [ ] Verified no existing API can be extended
- [ ] User approved creating new endpoint

### Rule #2: CHECK ALL USAGES BEFORE MODIFYING

```
❌ WRONG: Modify API endpoint without checking who uses it
✅ RIGHT: Search entire codebase for the endpoint, list all usages, assess impact
```

**Checklist:**
- [ ] Searched all .tsx files for API calls
- [ ] Searched all hooks (use*Api*.ts)
- [ ] Listed ALL components that use this API
- [ ] Verified backward compatibility OR got user approval for breaking change

### Rule #3: NEVER ASSUME - ALWAYS VERIFY

```
❌ WRONG: "I assume the database has a 'favorites' field"
✅ RIGHT: "I read schema.prisma and confirmed Guest table has 'favorites' field"
```

**Checklist:**
- [ ] Read actual code, not assumptions
- [ ] Verified database schema in prisma/schema.prisma
- [ ] Checked TypeScript interfaces/types
- [ ] Tested with actual API calls

### Rule #4: PRESENT PLAN BEFORE IMPLEMENTING

```
❌ WRONG: Make changes immediately
✅ RIGHT: Show inventory → Show impact analysis → Get approval → Implement
```

**Required Format:**
```markdown
## MY PLAN

1. API Inventory: [table]
2. Impact Analysis: [affected files]
3. Proposed Solution: [what I'll do]
4. Risk Assessment: [breaking changes?]

**Waiting for your approval before proceeding.**
```

### Rule #5: OBEDIO IS SERVER SOFTWARE (Backend-First)

```
✅ Backend runs 24/7, has ALL business logic
❌ Frontend is just a dashboard, NO business logic
```

**This means:**
- Backend APIs must work WITHOUT frontend
- All data validation happens on backend
- Frontend just displays and sends requests
- WebSocket broadcasts work without frontend being open

### Rule #6: NO MOCK DATA, NO LOCALSTORAGE

```
❌ FORBIDDEN:
const mockGuests = [{...}];
localStorage.setItem('data', ...);

✅ REQUIRED:
const { data } = useQuery(['guests'], () => api.guests.getAll());
```

**100% backend-driven data flow!**

### Rule #7: DON'T BREAK WHAT WORKS

```
✅ Completed components - listed in rules, don't modify without reason
⚠️ If you MUST modify, test thoroughly
❌ Never refactor working code "to make it better"
```

### Rule #8: TEST BEFORE SAYING "DONE"

**Every change must be tested:**

```bash
# Backend changes
curl -b cookies.txt http://localhost:8080/api/endpoint

# Frontend changes
# Open browser, manually test the feature

# Database changes
npx prisma studio
# Verify data is correct
```

**Do NOT say "done" until you've verified it works!**

---

## 🔍 QUICK REFERENCE COMMANDS

### When Starting ANY Task:

```
1. "Let me check if this API already exists"
   → Search backend/src/routes/
   → Search OBEDIO-API-MASTER-REFERENCE.md

2. "Let me find all places this API is used"
   → Search src/**/*.tsx for API endpoint
   → Search src/hooks/use*Api*.ts

3. "Let me check the database schema"
   → Read backend/prisma/schema.prisma

4. "Let me create an inventory table"
   → Create table with findings
   → Present to user BEFORE implementing
```

### When User Asks for a Feature:

```
STEP 1: Search existing code (15-30 minutes minimum)
STEP 2: Create inventory table
STEP 3: Impact analysis
STEP 4: Present plan
STEP 5: Wait for approval
STEP 6: Implement incrementally
STEP 7: Test each change
STEP 8: Update documentation
```

### When Stuck or Unsure:

```
❌ DON'T: Guess and implement
✅ DO: Ask user for clarification
```

**Examples:**
- "I found 2 similar APIs. Which should I extend?"
- "This will break backward compatibility. Proceed anyway?"
- "The database doesn't have this field. Should I add it?"

---

## 📋 MANDATORY WORKFLOW CHECKLIST

**Copy this checklist for EVERY task:**

```markdown
## TASK: [Name]

### Phase 1: Inventory ✅
- [ ] Searched backend/src/routes/ for existing APIs
- [ ] Searched OBEDIO-API-MASTER-REFERENCE.md
- [ ] Listed all frontend usages
- [ ] Read database schema
- [ ] Created inventory table

### Phase 2: Analysis ✅
- [ ] Listed all affected files
- [ ] Identified potential breaking changes
- [ ] Created impact analysis
- [ ] Presented plan to user
- [ ] **Got user approval** ← CRITICAL!

### Phase 3: Implementation ✅
- [ ] Backend changes made incrementally
- [ ] Each change tested with curl/Postman
- [ ] Frontend changes made incrementally
- [ ] Each change tested in browser
- [ ] WebSocket events added (if needed)
- [ ] Existing functionality preserved

### Phase 4: Documentation ✅
- [ ] Created change log
- [ ] Updated OBEDIO-API-MASTER-REFERENCE.md
- [ ] Verified all changes documented

### Final Verification ✅
- [ ] All tests passed
- [ ] No breaking changes (or user approved)
- [ ] Backend runs without errors
- [ ] Frontend works correctly
- [ ] Real-time updates working
```

---

## 🎯 EXAMPLES OF CORRECT WORKFLOW

### Example 1: User asks to "add favorite guests feature"

**❌ WRONG Approach:**
```
1. Create new API: POST /api/guests/:id/favorite
2. Implement immediately
3. Tell user it's done
```

**✅ CORRECT Approach:**
```
1. SEARCH: Check if GET /api/guests exists
   → Found: backend/src/routes/guests.ts has full CRUD

2. SEARCH: Check if Guest table has 'favorite' field
   → Read: backend/prisma/schema.prisma
   → Found: No 'favorite' field exists

3. INVENTORY TABLE:
   | Current API | Can Extend? | Missing | Action |
   |-------------|-------------|---------|--------|
   | GET /api/guests | YES | favorite field in DB | 1) Add DB field, 2) Add query param |

4. PRESENT PLAN TO USER:
   "I found GET /api/guests already exists. The Guest table doesn't have a
   'favorite' field. I propose:

   1. Add 'favorite Boolean @default(false)' to Guest model
   2. Run migration
   3. Add 'favoriteOnly' query param to GET /api/guests
   4. Update frontend to use new filter

   Do you approve?"

5. WAIT FOR APPROVAL

6. IMPLEMENT (after approval):
   - Update schema.prisma
   - Run npx prisma db push
   - Update backend/src/routes/guests.ts
   - Test: curl -b cookies.txt http://localhost:8080/api/guests?favoriteOnly=true
   - Update frontend
   - Test in browser

7. DOCUMENT:
   - Update OBEDIO-API-MASTER-REFERENCE.md
   - Create change log
```

### Example 2: User asks to "fix the crew page"

**❌ WRONG Approach:**
```
1. Assume it's broken
2. Refactor the entire component
3. Create new APIs
```

**✅ CORRECT Approach:**
```
1. ASK: "What exactly is broken? Can you describe the issue?"
   (Don't assume - get specific error/behavior)

2. SEARCH: Check if crew API exists
   → Found: backend/src/routes/crew.ts has 4 endpoints
   → Found: Used by crew-list.tsx and crew-management.tsx

3. VERIFY: Read the components
   → Check if they're using the API correctly
   → Check console for errors

4. TEST: Run backend and open crew page in browser
   → Document actual error
   → Check network tab for failed requests

5. PRESENT FINDINGS:
   "I checked the crew page. Here's what I found:
   - Backend API exists and works (tested with curl)
   - Frontend component exists at crew-list.tsx
   - Error: [specific error from console]
   - Root cause: [identified issue]

   Proposed fix: [specific change]

   This is a minimal fix that preserves existing functionality."

6. WAIT FOR APPROVAL
```

---

## 📚 REFERENCE FILES

**ALWAYS consult these files:**

1. **OBEDIO-API-MASTER-REFERENCE.md**
   - Complete API inventory
   - Component-to-API mapping
   - Use this FIRST before any task

2. **OBEDIO-CONSOLIDATED-RULES-FOR-AI.md**
   - Technical patterns
   - Code examples
   - Best practices

3. **backend/prisma/schema.prisma**
   - Database schema
   - Always check before adding/modifying data

4. **.claude/obedio-development-rules.md**
   - THIS FILE
   - The complete workflow you MUST follow

---

## ⚠️ CONSEQUENCES OF NOT FOLLOWING RULES

**If you skip the workflow:**

1. ❌ You might create duplicate APIs
2. ❌ You might break existing functionality
3. ❌ You might create inconsistent patterns
4. ❌ User will have to correct you
5. ❌ Time wasted

**If you follow the workflow:**

1. ✅ No duplicate APIs
2. ✅ Existing functionality preserved
3. ✅ Consistent patterns
4. ✅ User approves before you invest time
5. ✅ Efficient development

---

## 🚀 FINAL REMINDER

```
EVERY. SINGLE. TASK. FOLLOWS. THIS. WORKFLOW.

No shortcuts. No assumptions. No "I'll fix it later."

INVENTORY → ANALYSIS → APPROVAL → IMPLEMENTATION → DOCUMENTATION

This is how professional developers work.
This is how you will work on OBEDIO.
```

**ACKNOWLEDGE THESE RULES BY CREATING AN API INVENTORY FOR YOUR NEXT TASK!**

---

**Document Version:** 2.0
**Last Updated:** 2025-11-03
**Status:** ACTIVE - MANDATORY FOR ALL TASKS
**Combines:** User's INVENTORY-FIRST workflow + OBEDIO technical rules
