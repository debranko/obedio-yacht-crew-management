# WebSocket Infinite Loop Fix - Service Requests

**Date:** 2025-11-05
**Issue:** Infinite API request loop causing 429 rate limit errors and delayed popup dialogs

---

## Problem Description

When a virtual button was pressed to create a service request, the popup dialog appeared very late or didn't appear at all. Investigation revealed an infinite API request loop:

- **Frontend**: Sending `/api/service-requests` every 15-20ms (50-60 requests/second)
- **Backend**: Responding with `429 Too Many Requests` due to rate limiting
- **Impact**: Popup dialog couldn't load data, causing the reported issue

### Root Cause

Multiple components were subscribing to WebSocket events and calling `invalidateQueries`, creating cascading duplicate invalidations:

1. **useWebSocket hook** (13+ components using it)
   - Each subscription called `invalidateQueries` twice (lines 103-104)
   - Result: 26+ simultaneous API calls per WebSocket event

2. **service-requests.tsx page**
   - Added 3 MORE subscriptions (created, updated, completed)
   - Each called `invalidateQueries` twice (lines 134-135)
   - Result: +6 more API calls per event

3. **ServiceRequestsContext**
   - `addServiceRequest` called `invalidateQueries` twice (lines 62-63)
   - Result: +2 API calls when creating requests

4. **All mutation hooks** (create, update, accept, complete, cancel)
   - Each called `invalidateQueries` in `onSuccess`
   - Backend also emitted WebSocket events
   - Result: Double invalidation (mutation + WebSocket)

**Total**: ONE WebSocket event triggered 50-100+ simultaneous API fetches!

---

## Solution

Implemented **centralized WebSocket invalidation** with single source of truth:

### Changes Made

#### 1. `src/hooks/useWebSocket.ts`
**Removed:** Service request subscription (lines 100-115)
```typescript
// BEFORE: This was creating 26+ invalidations across all components
const unsubscribeServiceRequests = websocketService.subscribe('service-request', (event) => {
  queryClient.invalidateQueries({ queryKey: ['service-requests'] });
  queryClient.invalidateQueries({ queryKey: ['service-requests-api'] });
});

// AFTER: Comment explaining the move
// NOTE: Service request invalidation moved to useServiceRequestsApi hook
// to prevent duplicate invalidations when multiple components use this hook
```

#### 2. `src/components/pages/service-requests.tsx`
**Simplified:** WebSocket listeners to only handle sound notifications
```typescript
// BEFORE: 3 listeners each calling invalidateQueries twice
const unsubscribeCreated = wsOn('service-request:created', handleServiceRequestEvent);
const unsubscribeUpdated = wsOn('service-request:updated', handleServiceRequestEvent);
const unsubscribeCompleted = wsOn('service-request:completed', handleServiceRequestEvent);

// AFTER: Single listener for sound only
const unsubscribeCreated = wsOn('service-request:created', handleServiceRequestCreated);
// NOTE: Query invalidation is handled in useServiceRequestsApi hook
```

#### 3. `src/hooks/useServiceRequestsApi.ts`
**Added:** Centralized WebSocket integration in `useServiceRequestsApi()`
```typescript
// WebSocket integration - single subscription for all service request events
useEffect(() => {
  console.log('🔌 Setting up WebSocket subscription for service requests');

  const unsubscribe = websocketService.subscribe('service-request', (event) => {
    console.log('📞 Service request WebSocket event:', event.type);

    // Invalidate queries to trigger refetch
    queryClient.invalidateQueries({ queryKey: ['service-requests'] });
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  });

  return () => {
    console.log('🔌 Cleaning up WebSocket subscription for service requests');
    unsubscribe();
  };
}, [queryClient]);
```

**Removed:** All `invalidateQueries` calls from mutation hooks
- `useCreateServiceRequest()` - Removed invalidation (WebSocket handles it)
- `useUpdateServiceRequest()` - Removed invalidation (WebSocket handles it)
- `useAcceptServiceRequest()` - Removed invalidation (WebSocket handles it)
- `useCompleteServiceRequest()` - Removed invalidation (WebSocket handles it)
- `useCancelServiceRequest()` - Removed invalidation (WebSocket handles it)

#### 4. `src/contexts/ServiceRequestsContext.tsx`
**Removed:** Duplicate invalidation from `addServiceRequest()`
```typescript
// BEFORE: Called invalidateQueries on local add
queryClient.invalidateQueries({ queryKey: ['service-requests'] });
queryClient.invalidateQueries({ queryKey: ['service-requests-api'] });

// AFTER: Comment explaining WebSocket handles it
// NOTE: No need to invalidate queries here - WebSocket will handle sync
// This prevents duplicate invalidations (local + WebSocket)
```

---

## Results

### Before Fix
- **API Rate**: 50-60 requests per second
- **Backend Response**: 429 Too Many Requests (rate limited)
- **Popup Dialog**: Very slow or not appearing
- **Connections**: 162+ established connections

### After Fix
- **API Rate**: 1 request per 60 seconds (as configured)
- **Backend Response**: Normal 200 OK responses
- **Popup Dialog**: Appears promptly
- **Connections**: Normal WebSocket connections only

### Backend Log Comparison
```
BEFORE:
[13:22:05.871Z] GET /api/service-requests
[13:22:05.880Z] GET /api/service-requests  ← 9ms later!
[13:22:05.893Z] GET /api/service-requests  ← 13ms later!
... (50-60 per second)

AFTER:
[13:23:06.403Z] GET /api/service-requests
[13:24:06.771Z] GET /api/service-requests  ← 60 seconds later ✓
```

---

## Architecture Improvement

### Single Source of Truth Pattern

**OLD PATTERN** (Multiple subscriptions):
```
Component A → useWebSocket → invalidateQueries
Component B → useWebSocket → invalidateQueries
Component C → useWebSocket → invalidateQueries
... × 13 components = 26+ API calls
```

**NEW PATTERN** (Centralized):
```
useServiceRequestsApi (ONE place) → WebSocket subscription → invalidateQueries
All components use → useServiceRequestsApi → Single fetch triggered
```

### Benefits

1. **Performance**: Reduced API calls by 98% (60/second → 1/minute)
2. **Reliability**: No more rate limiting errors
3. **Maintainability**: Single location for WebSocket sync logic
4. **Scalability**: Pattern can be applied to other resources

---

## Testing Verification

✅ **WebSocket Events**: Working correctly via `useServiceRequestsApi.ts:119`
✅ **No 429 Errors**: Rate limiting issues completely resolved
✅ **No Infinite Loop**: Clean, controlled fetching
✅ **Popup Dialog**: Appears promptly for new requests
✅ **All Mutations**: Working without manual invalidation

---

## Files Modified

1. `src/hooks/useWebSocket.ts` - Removed service-request subscription
2. `src/components/pages/service-requests.tsx` - Simplified WebSocket listeners
3. `src/hooks/useServiceRequestsApi.ts` - Added centralized WebSocket integration
4. `src/contexts/ServiceRequestsContext.tsx` - Removed duplicate invalidation

---

## Lessons Learned

1. **Avoid duplicate subscriptions**: When using React hooks, be careful about multiple components creating duplicate subscriptions
2. **Centralize side effects**: Real-time sync should have ONE source of truth
3. **WebSocket vs Mutations**: If backend emits WebSocket events, mutations don't need manual invalidation
4. **Monitor API patterns**: Watch for excessive requests early in development
5. **Follow Rule #9**: Always review the ENTIRE codebase before making changes

---

## Future Recommendations

Apply this same pattern to other resources:
- Guests (useGuestsApi)
- Crew (useCrewApi)
- Locations (useLocationsApi)
- Activity Logs (useActivityLogsApi)

This will prevent similar issues and improve overall application performance.
