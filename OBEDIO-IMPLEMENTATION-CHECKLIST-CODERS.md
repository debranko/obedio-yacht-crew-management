# OBEDIO IMPLEMENTATION CHECKLIST FOR CODERS
## Actionable Tasks Based on System Analysis
Generated: 2025-11-02 22:20 CET
Priority: CRITICAL → HIGH → MEDIUM → LOW

---

## 🚨 CRITICAL - BLOCKERS FOR 24/7 OPERATION (Must Fix First)

### 1. REMOVE LOCALSTORAGE USAGE
**File**: `/src/services/api.ts`
**Line**: 21
**Current Code**:
```typescript
const token = localStorage.getItem('obedio-auth-token');
```

**REPLACE WITH**:
```typescript
// Option 1: Use HTTP-only cookies (recommended)
// Remove this line - auth token will be sent automatically via cookies

// Option 2: Get token from auth context
import { useAuth } from '../contexts/AuthContext';
const { token } = useAuth();
```

**Additional Changes Required**:
- [ ] Update login endpoint to set HTTP-only cookie
- [ ] Update logout to clear cookie
- [ ] Remove all localStorage references to auth
- [ ] Test authentication flow end-to-end

---

### 2. MOVE FRONTEND TRANSFORMATIONS TO BACKEND
**File**: `/src/hooks/useServiceRequestsApi.ts`
**Lines**: 39-72 (Remove entire transformServiceRequest function)

**BACKEND CHANGES NEEDED**:

#### A. Update `/backend/src/routes/service-requests.ts`
**ADD** transformation before returning data:
```typescript
// In GET /api/service-requests endpoint
router.get('/', requirePermission('service-requests.view'), asyncHandler(async (req, res) => {
  // ... existing code ...
  
  // Transform data on backend before sending
  const transformedData = result.items.map(item => ({
    id: item.id,
    guestName: item.guest ? `${item.guest.firstName} ${item.guest.lastName}`.trim() : 'Guest',
    guestCabin: item.location?.name || 'Location',
    cabinId: item.locationId || '',
    requestType: 'service',
    priority: item.priority,
    timestamp: item.createdAt,
    voiceTranscript: item.voiceTranscript || undefined,
    voiceAudioUrl: item.voiceAudioUrl || undefined,
    cabinImage: item.location?.imageUrl || 
      (item.location?.name ? `/images/locations/${item.location.name}.jpg` : undefined),
    status: mapStatusForFrontend(item.status),
    assignedTo: item.CrewMember?.name || undefined,
    categoryId: item.categoryId || undefined,
    category: item.category || undefined,
    acceptedAt: item.acceptedAt || undefined,
    completedAt: item.completedAt || undefined,
    notes: item.message || undefined,
  }));
  
  res.json({ success: true, data: transformedData, pagination: {...} });
}));
```

#### B. Remove transformation from frontend
**File**: `/src/hooks/useServiceRequestsApi.ts`
**CHANGE**:
```typescript
// OLD
return dtos.map(transformServiceRequest);

// NEW
return dtos; // Backend already transformed
```

---

### 3. FIX PRISMA TYPE CONFLICTS
**Files**: Multiple routes using raw SQL

#### A. Update Prisma Schema
**File**: `/backend/prisma/schema.prisma`
**ADD** field mapping to avoid conflicts:
```prisma
model Device {
  type    String @map("device_type")
  status  DeviceStatus @map("device_status")
  // ... rest of model
}

model Location {
  type    String @map("location_type")
  // ... rest of model
}
```

#### B. Remove Raw SQL Queries
**File**: `/backend/src/routes/guests.ts`
**Lines**: 106-118
**REPLACE** raw SQL with Prisma:
```typescript
// OLD - Raw SQL
const [data, totalResult] = await Promise.all([
  prisma.$queryRawUnsafe(`...`),
  prisma.$queryRawUnsafe(`...`)
]);

// NEW - Prisma queries
const [data, total] = await Promise.all([
  prisma.guest.findMany({
    where: whereConditions,
    orderBy: orderByConditions,
    skip: offset,
    take: limitNum,
  }),
  prisma.guest.count({ where: whereConditions })
]);
```

#### C. Run Prisma Migration
```bash
npx prisma migrate dev --name fix-type-conflicts
```

---

## 🟡 HIGH PRIORITY - STANDARDIZATION (Week 1)

### 4. APPLY API RESPONSE STANDARDIZATION

#### A. Import utilities in all route files
**ADD** to top of each route file:
```typescript
import { apiSuccess, apiError } from '../utils/api-response';
```

#### B. Update all endpoints (70+ total)

**Example for `/backend/src/routes/guests.ts`**:
```typescript
// OLD (line 123)
res.json({
  success: true,
  data,
  pagination: { ... }
});

// NEW
res.json(apiSuccess(data, { 
  page: pageNum,
  limit: limitNum,
  total,
  totalPages: Math.ceil(total / limitNum)
}));
```

**Routes to update** (in order):
1. [ ] guests.ts (11 endpoints)
2. [ ] locations.ts (7 endpoints)
3. [ ] crew.ts (5 endpoints)
4. [ ] messages.ts (9 endpoints)
5. [ ] service-requests.ts (5 endpoints)
6. [ ] assignments.ts (10 endpoints)
7. [ ] shifts.ts (7 endpoints)
8. [ ] devices.ts (8 main endpoints)
9. [ ] dashboard.ts (3 endpoints)
10. [ ] user-preferences.ts (5 endpoints)
11. [ ] backup.ts (3 endpoints)

---

### 5. STANDARDIZE PAGINATION

#### A. Convert offset/limit to page/limit
**File**: `/backend/src/routes/messages.ts`
**FIND** all occurrences of:
```typescript
const { limit = 25, offset = 0 } = req.query;
```

**REPLACE WITH**:
```typescript
import { calculatePagination, buildPaginationMeta } from '../utils/pagination';
const { page = 1, limit = 25 } = req.query;
const { skip, take, page: pageNum, limit: limitNum } = calculatePagination(Number(page), Number(limit));
```

#### B. Update frontend API calls
**File**: `/src/services/api.ts`
**Line**: 594
```typescript
// OLD
offset?: number;

// NEW
page?: number;
```

---

## 🟢 MEDIUM PRIORITY - FEATURE COMPLETION (Week 2)

### 6. IMPLEMENT MISSING UI COMPONENTS

#### A. Smart Buttons Management
**CREATE**: `/src/components/pages/smart-buttons.tsx`
```typescript
import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../services/api';

export function SmartButtonsPage() {
  const { data: buttons, isLoading } = useQuery({
    queryKey: ['smart-buttons'],
    queryFn: () => api.get('/smart-buttons')
  });
  
  // TODO: Implement CRUD UI
  return (
    <div>
      <h1>Smart Button Management</h1>
      {/* Add table, forms, etc. */}
    </div>
  );
}
```

**ADD** route in `/src/App.tsx`:
```typescript
<Route path="/settings/smart-buttons" element={<SmartButtonsPage />} />
```

#### B. Role Permissions UI
**CREATE**: `/src/components/pages/role-permissions.tsx`
- Similar structure to smart buttons
- Matrix UI for permissions
- Save/reset functionality

#### C. Notification Settings
**CREATE**: `/src/components/pages/notification-settings.tsx`
- User preferences for notifications
- Push notification setup
- Email notification config

---

### 7. COMPLETE WEBSOCKET COVERAGE

**File**: `/backend/src/routes/crew.ts`
**ADD** WebSocket events:
```typescript
// After create
websocketService.emitCrewEvent('created', newCrew);

// After update
websocketService.emitCrewEvent('updated', updatedCrew);

// After delete
websocketService.emitCrewEvent('deleted', { id });
```

**File**: `/backend/src/routes/assignments.ts`
**ADD** similar events for shift assignments

---

## 🔵 LOW PRIORITY - OPTIMIZATION (Week 3)

### 8. PERFORMANCE IMPROVEMENTS

#### A. Add Database Indexes
**File**: `/backend/prisma/schema.prisma`
**ADD** indexes for common queries:
```prisma
model Guest {
  // ... existing fields ...
  
  @@index([status, type])
  @@index([firstName, lastName])
}

model ServiceRequest {
  // ... existing fields ...
  
  @@index([status, priority])
}
```

#### B. Implement Query Caching
**File**: `/src/hooks/useGuests.ts`
```typescript
// Add cache time
staleTime: 5 * 60 * 1000, // 5 minutes
cacheTime: 10 * 60 * 1000, // 10 minutes
```

---

## 📋 TESTING CHECKLIST

### For Each Fixed Endpoint:
- [ ] Test with Postman/Insomnia
- [ ] Verify response format matches apiSuccess
- [ ] Check authentication works
- [ ] Test error scenarios
- [ ] Verify WebSocket events fire
- [ ] Check frontend still works

### Integration Testing:
- [ ] Full auth flow (login → use app → logout)
- [ ] Service request lifecycle
- [ ] Real-time updates across clients
- [ ] Pagination on all lists
- [ ] Error handling throughout

---

## 🚀 DEPLOYMENT CHECKLIST

### Before Production:
1. [ ] All CRITICAL fixes complete
2. [ ] No localStorage usage anywhere
3. [ ] All data transforms on backend
4. [ ] Prisma migrations run
5. [ ] API responses standardized
6. [ ] WebSocket events complete
7. [ ] Performance tested
8. [ ] Security audit passed
9. [ ] Documentation updated
10. [ ] Monitoring configured

---

## 📊 PROGRESS TRACKING TEMPLATE

Copy this to track your progress:

```markdown
## Daily Progress - [DATE]

### Completed Today:
- [ ] Task 1
- [ ] Task 2

### Blockers:
- None / Description

### Tomorrow's Goals:
- [ ] Task 3
- [ ] Task 4

### Notes:
- Any important observations
```

---

## 🎯 QUICK WINS (Can do immediately)

1. **Remove localStorage** (30 min)
   - Update api.ts
   - Test auth still works

2. **Add apiSuccess imports** (15 min per file)
   - Start with small routes
   - Test each endpoint

3. **Fix one route completely** (2 hours)
   - Pick activity-logs as example
   - Use as template for others

4. **Add missing WebSocket events** (1 hour)
   - Copy pattern from guests.ts
   - Test with multiple clients

---

## 🔧 DEVELOPER TOOLS NEEDED

1. **Postman/Insomnia** - API testing
2. **Prisma Studio** - Database viewing
3. **Redux DevTools** - State debugging  
4. **React Query DevTools** - Cache inspection
5. **WebSocket tester** - Real-time testing

---

## 📞 ESCALATION PATH

If blocked on any task:
1. Check existing working examples
2. Review the analysis report
3. Test in isolation first
4. Ask for architecture guidance
5. Document any deviations

---

*Checklist Version: 1.0*
*Total Tasks: ~100+*
*Estimated Time: 120-160 hours*
*Team Size: 2-3 developers*

**Remember**: Fix CRITICAL issues first! The system cannot run 24/7 until localStorage is removed and transformations are moved to backend.