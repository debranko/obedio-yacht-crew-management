# CODER PROMPT: FIX OBEDIO API CONNECTIVITY
## Critical System Repairs for 24/7 Operation

**Context**: The OBEDIO yacht management system has been refactored to move all data storage from localStorage to the backend database. Multiple critical API connectivity issues are preventing the system from operating reliably 24/7.

**Your Mission**: Fix all critical security vulnerabilities and API misalignments to restore full system functionality.

---

## 🚨 CRITICAL SECURITY FIXES (Do These First!)

### Task 1: Add Authentication to Guest Routes
**File**: `/backend/src/routes/guests.ts`
**Current State**: NO authentication - anyone can access guest data!
**Action Required**:
1. Add import at top of file:
   ```typescript
   import { authMiddleware } from '../middleware/auth';
   ```
2. Add after line 7 (after `const router = Router();`):
   ```typescript
   router.use(authMiddleware);
   ```
3. Test that unauthenticated requests now return 401

### Task 2: Add Authentication to Location Routes
**File**: `/backend/src/routes/locations.ts`
**Current State**: NO authentication - anyone can modify locations!
**Action Required**:
1. Add import at top of file:
   ```typescript
   import { authMiddleware } from '../middleware/auth';
   ```
2. Add after line 7 (after `const r = Router();`):
   ```typescript
   r.use(authMiddleware);
   ```
3. Test that unauthenticated requests now return 401

---

## 🔧 CRITICAL FUNCTIONAL FIXES

### Task 3: Fix Service Request Field Mismatch
**Problem**: Frontend expects populated relations, backend returns only IDs
**File**: `/backend/src/routes/service-requests.ts`

**Line 18** - Update the query:
```typescript
// BEFORE:
const result = await dbService.getServiceRequests(filters);

// AFTER:
const result = await dbService.getServiceRequests({
  ...filters,
  include: {
    guest: true,
    location: true,
    CrewMember: true
  }
});
```

**Also check** `/backend/src/services/database.ts` - ensure getServiceRequests method supports includes.

### Task 4: Add Missing WebSocket Events
**File**: `/backend/src/services/websocket.ts`

Add these methods to the WebSocketService class:
```typescript
emitGuestStatusChanged(guest: any) {
  this.io?.emit('guest:status-changed', {
    guestId: guest.id,
    status: guest.status,
    locationId: guest.locationId,
    timestamp: new Date()
  });
  console.log(`📡 Emitted guest:status-changed for ${guest.id}`);
}

emitServiceRequestAssigned(request: any) {
  this.io?.emit('service-request:assigned', {
    requestId: request.id,
    assignedToId: request.assignedToId,
    assignedTo: request.assignedTo,
    timestamp: new Date()
  });
  console.log(`📡 Emitted service-request:assigned for ${request.id}`);
}

emitServiceRequestStatusChanged(request: any) {
  this.io?.emit('service-request:status-changed', {
    requestId: request.id,
    status: request.status,
    previousStatus: request.previousStatus,
    timestamp: new Date()
  });
  console.log(`📡 Emitted service-request:status-changed for ${request.id}`);
}
```

### Task 5: Use WebSocket Events in Routes
**File**: `/backend/src/routes/guests.ts`

After any guest update that changes status (around line 240):
```typescript
// After successful update
if (req.body.status && req.body.status !== existingGuest.status) {
  websocketService.emitGuestStatusChanged(data);
}
```

**File**: `/backend/src/routes/service-requests.ts`

In the accept endpoint (line 32):
```typescript
// After successful accept
websocketService.emitServiceRequestAssigned(request);
websocketService.emitServiceRequestStatusChanged({
  ...request,
  previousStatus: 'pending'
});
```

---

## 🧹 HIGH PRIORITY CLEANUP

### Task 6: Delete Duplicate MQTT Files
**Action**: Delete these files:
- `/backend/src/services/mqtt-monitor.OLD.ts`
- `/backend/src/services/mqtt-monitor.NEW.ts`

Keep only: `/backend/src/services/mqtt-monitor.ts`

### Task 7: Create API Response Utilities
**Create File**: `/backend/src/utils/api-response.ts`
```typescript
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

export const apiSuccess = <T>(
  data: T, 
  pagination?: any
): ApiSuccessResponse<T> => ({
  success: true,
  data,
  ...(pagination && { pagination })
});

export const apiError = (
  error: string, 
  code?: string, 
  details?: any
): ApiErrorResponse => ({
  success: false,
  error,
  ...(code && { code }),
  ...(details && { details })
});
```

### Task 8: Fix Yacht Settings Response
**File**: `/backend/src/routes/yacht-settings.ts`

Find all responses and change format:
```typescript
// BEFORE:
res.json({ success: true, data: settings });

// AFTER:
res.json(settings);
```

**File**: `/src/hooks/useYachtSettings.ts` line 76:
```typescript
// BEFORE:
return response.data?.data || response.data;

// AFTER:
return response;
```

---

## 📋 TESTING CHECKLIST

After each fix, test:

### Authentication Tests:
```bash
# Should return 401 Unauthorized
curl http://localhost:8080/api/guests
curl http://localhost:8080/api/locations

# Should work with token
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8080/api/guests
```

### WebSocket Tests:
1. Open two browser tabs with the app
2. Update a guest status in one tab
3. Verify the other tab receives the update without refresh
4. Check browser console for WebSocket messages

### Service Request Tests:
1. Create a service request
2. Accept it (assign to crew)
3. Verify populated data includes guest name and location
4. Check WebSocket events fire

---

## 🎯 SUCCESS CRITERIA

You'll know you succeeded when:
1. ✅ All routes require authentication (no 200 responses without token)
2. ✅ Service requests show guest names, not just IDs
3. ✅ Real-time updates work across multiple clients
4. ✅ No duplicate MQTT files exist
5. ✅ All API responses follow consistent format
6. ✅ Yacht settings save and load correctly

---

## ⚠️ IMPORTANT NOTES

1. **Test as you go** - Don't make all changes at once
2. **Check existing auth** - Some routes already have auth, don't duplicate
3. **Preserve functionality** - Ensure nothing breaks that currently works
4. **Use TypeScript** - Add proper types where missing
5. **Log everything** - Add console.logs for debugging WebSocket events

---

## 🚀 Quick Start Commands

```bash
# Start backend in watch mode
cd backend
npm run dev

# Test auth with curl
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Save the token and use it for protected routes
```

Remember: The system must work 24/7 on a yacht. Reliability is crucial!