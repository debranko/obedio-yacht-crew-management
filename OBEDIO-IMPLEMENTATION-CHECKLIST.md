# OBEDIO IMPLEMENTATION CHECKLIST
## Actionable Tasks for Code Mode

Generated: 2025-11-02
Priority: CRITICAL → HIGH → MEDIUM → LOW

---

## 🔴 CRITICAL FIXES (Must fix for 24/7 operation)

### 1. ADD AUTHENTICATION TO UNPROTECTED ROUTES
**Priority**: CRITICAL - Security Vulnerability
**Files to modify**:
- [ ] `/backend/src/routes/guests.ts`
  - Add `import { authMiddleware } from '../middleware/auth';`
  - Add `router.use(authMiddleware);` after line 7
- [ ] `/backend/src/routes/locations.ts`
  - Add `import { authMiddleware } from '../middleware/auth';`
  - Add `r.use(authMiddleware);` after line 7

### 2. FIX SERVICE REQUEST FIELD MISMATCH
**Priority**: CRITICAL - Breaks core functionality
**Files to modify**:
- [ ] `/backend/src/routes/service-requests.ts`
  - Change response to include populated relations
  - Add `.include({ guest: true, location: true, CrewMember: true })`
- [ ] `/backend/prisma/schema.prisma`
  - Verify `assignedToId` field exists in ServiceRequest model
- [ ] `/src/services/api.ts` (line 215)
  - Change `assignedToId?: string | null;` 
  - Keep as is - backend should match this

### 3. IMPLEMENT MISSING WEBSOCKET EVENTS
**Priority**: CRITICAL - No real-time updates
**Files to modify**:
- [ ] `/backend/src/routes/guests.ts`
  - Add WebSocket emission on status change:
  ```typescript
  // After guest update
  if (req.body.status) {
    websocketService.emitGuestStatusChanged(data);
  }
  ```
- [ ] `/backend/src/services/websocket.ts`
  - Add missing emit methods:
  ```typescript
  emitGuestStatusChanged(guest: any) {
    this.io?.emit('guest:status-changed', guest);
  }
  ```

---

## 🟡 HIGH PRIORITY FIXES

### 4. CONSOLIDATE MQTT SERVICES
**Priority**: HIGH - Code duplication
**Actions**:
- [ ] Delete `/backend/src/services/mqtt-monitor.OLD.ts`
- [ ] Delete `/backend/src/services/mqtt-monitor.NEW.ts`
- [ ] Keep only `/backend/src/services/mqtt-monitor.ts`
- [ ] Verify `/backend/src/server.ts` imports correct file

### 5. FIX PRISMA TYPE CONFLICTS
**Priority**: HIGH - Performance impact
**Files to modify**:
- [ ] `/backend/prisma/schema.prisma`
  - Option 1: Rename fields to avoid conflicts
    - `Device.type` → `Device.deviceType`
    - `Device.status` → `Device.deviceStatus`
  - Option 2: Use Prisma field mapping
    ```prisma
    type String @map("device_type")
    status String @map("device_status")
    ```
- [ ] Update all routes using raw SQL to use Prisma queries

### 6. STANDARDIZE API RESPONSES
**Priority**: HIGH - Consistency
**Create utility file**:
- [ ] `/backend/src/utils/api-response.ts`
  ```typescript
  export const apiSuccess = <T>(data: T, pagination?: any) => ({
    success: true,
    data,
    ...(pagination && { pagination })
  });

  export const apiError = (error: string, code?: string) => ({
    success: false,
    error,
    ...(code && { code })
  });
  ```
- [ ] Update all routes to use these utilities

### 7. FIX YACHT SETTINGS API RESPONSE
**Priority**: HIGH - Data not saving
**Files to modify**:
- [ ] `/backend/src/routes/yacht-settings.ts`
  - Change response format:
  ```typescript
  // Instead of: res.json({ success: true, data: settings });
  res.json(settings); // Direct data response
  ```
- [ ] `/src/hooks/useYachtSettings.ts` (line 76)
  - Simplify to: `return response.data;`

---

## 🟢 MEDIUM PRIORITY FIXES

### 8. IMPLEMENT SERVICE REQUEST HISTORY PROPERLY
**Priority**: MEDIUM - Feature incomplete
**Files to modify**:
- [ ] `/backend/src/routes/service-request-history.ts`
  - Fix `/completed` endpoint response format
  - Match frontend `ServiceRequestHistory` type
- [ ] `/src/contexts/ServiceRequestsContext.tsx`
  - Remove local state management
  - Use API for all history operations

### 9. STANDARDIZE PAGINATION
**Priority**: MEDIUM - API consistency
**Files to modify**:
- [ ] All routes using `offset/limit` → change to `page/limit`
- [ ] Create shared pagination utility:
  ```typescript
  export const paginate = (page: number, limit: number) => ({
    skip: (page - 1) * limit,
    take: limit
  });
  ```

### 10. COMPLETE SERVICE CATEGORIES INTEGRATION
**Priority**: MEDIUM - Feature incomplete
**Files to check**:
- [ ] Backend route exists: `/backend/src/routes/service-categories.ts` ✓
- [ ] Frontend hook exists: `/src/hooks/useServiceCategories.ts` ✓
- [ ] Add to service request creation/edit forms
- [ ] Display category in service request lists

---

## 🔵 LOW PRIORITY FIXES

### 11. ADD ERROR HANDLING MIDDLEWARE
**Priority**: LOW - Improves debugging
- [ ] Enhance `/backend/src/middleware/error-handler.ts`
- [ ] Add request ID tracking
- [ ] Add detailed logging

### 12. IMPLEMENT SMART BUTTONS UI
**Priority**: LOW - New feature
- [ ] Create `/src/components/pages/smart-buttons.tsx`
- [ ] Add route to App.tsx
- [ ] Create management interface

### 13. ADD API DOCUMENTATION
**Priority**: LOW - Developer experience
- [ ] Update Swagger definitions
- [ ] Document WebSocket events
- [ ] Create API testing collection (Postman/Insomnia)

---

## 📋 TESTING CHECKLIST

### For Each Fixed Endpoint:
- [ ] Test unauthenticated access (should fail)
- [ ] Test CRUD operations
- [ ] Test WebSocket events fire correctly
- [ ] Test error scenarios
- [ ] Test pagination
- [ ] Test with invalid data

### Integration Tests:
- [ ] Service request flow: Create → Accept → Complete
- [ ] Guest check-in/out with location updates
- [ ] Device button press → Service request creation
- [ ] DND toggle affects service availability
- [ ] Real-time updates across multiple clients

---

## 🚀 DEPLOYMENT READINESS

### Before Going Live:
- [ ] All CRITICAL fixes completed
- [ ] All routes have authentication
- [ ] WebSocket events working
- [ ] No localStorage usage
- [ ] API response times < 200ms
- [ ] Error rate < 0.1%
- [ ] Load testing completed
- [ ] Backup/restore tested
- [ ] Monitoring configured

---

## 📊 PROGRESS TRACKING

Update this section as tasks are completed:

**Total Tasks**: 50+
**Completed**: 0
**In Progress**: 0
**Remaining**: 50+

**Estimated Hours**:
- CRITICAL: 8-12 hours
- HIGH: 16-20 hours
- MEDIUM: 12-16 hours
- LOW: 8-12 hours
- TOTAL: 44-60 hours

---

## 🎯 QUICK WINS (Can be done immediately)

1. Delete old MQTT files (5 min)
2. Add auth middleware to routes (15 min)
3. Fix yacht settings response (10 min)
4. Add WebSocket import statements (10 min)

Start with these to build momentum!