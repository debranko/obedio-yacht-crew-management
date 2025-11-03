# Service Requests System Analysis & Restructuring Plan

## Current State Analysis

### 1. MQTT → Service Request Flow (WORKING ✅)
The flow is actually 90% functional:
1. ESP32 button press → MQTT message
2. Backend receives MQTT → Creates ServiceRequest in DB
3. Backend emits WebSocket event 'service-request:created'
4. Frontend receives WebSocket event
5. Frontend invalidates React Query cache
6. Service requests list updates

### 2. Major Issues Identified

#### Issue 1: Accept Functionality Not Connected ❌
**Problem**: The `acceptServiceRequest` function in `ServiceRequestsContext.tsx` doesn't call the backend API.
```typescript
// Current (broken):
const acceptServiceRequest = useCallback((requestId: string, crewMemberName: string) => {
    const request = apiServiceRequests.find(r => r.id === requestId);
    if (!request) return;
    // TODO: Properly implement - NO API CALL!
```

**Fix**: Use the `useAcceptServiceRequest` hook from `useServiceRequestsApi.ts`

#### Issue 2: Location Images Not Loading ❌
**Problem**: Service requests have `cabinImage` field but image paths are incorrect
**Current**: The images exist in `/public/images/locations/` but the path mapping is broken
**Fix**: Ensure proper path transformation in data transformation

#### Issue 3: Data Transformation Not Using Populated Data ❌
**Problem**: Backend sends populated guest/location data but frontend ignores it
```typescript
// Backend sends:
{
  guest: { firstName: "John", lastName: "Doe" },
  location: { name: "Master Suite", imageUrl: "..." }
}
// But frontend shows:
guestName: "Unknown Guest" // Should use populated data!
```

#### Issue 4: Forward Button Was Removed ❌
**Problem**: The forward functionality was working but got removed during refactoring
**Original**: Forward button sent requests to specific teams (Galley, Housekeeping, etc.)
**Current**: Forward dialog uses service categories instead

### 3. Beautiful Original Design Elements Lost
- Location background images behind request cards ✅ (Still there but not loading)
- Gradient overlays to show images while maintaining readability ✅
- Two-column layout for fullscreen mode ✅
- Visual hierarchy with pending/serving sections ✅

## Implementation Plan

### Phase 1: Fix Critical Functionality (2-3 hours)

#### 1.1 Fix Accept Service Request
- Connect `acceptServiceRequest` to backend API
- Use the existing `useAcceptServiceRequest` mutation hook
- Get current crew member ID from auth context (not just name)
- Update service request status to "accepted" or "serving"

#### 1.2 Fix Location Image Loading
- Update data transformation to use `location.imageUrl` from backend
- Map location names to image files correctly
- Add fallback for missing images
- Ensure paths work: `/images/locations/${imageName}.jpg`

#### 1.3 Fix Data Transformation
```typescript
// Correct transformation:
const guestName = dto.guest 
  ? `${dto.guest.firstName} ${dto.guest.lastName}`.trim()
  : dto.guestName || 'Unknown Guest';

const guestCabin = dto.location?.name || dto.guestCabin || 'Unknown Location';
const cabinImage = dto.location?.imageUrl || `/images/locations/${dto.location?.name}.jpg`;
```

### Phase 2: UI Restructuring (2 hours)

#### 2.1 Left/Right Split Layout
```
+------------------+------------------+
|  PENDING         |  SERVING NOW     |
|  REQUESTS        |                  |
|                  |                  |
| [Card 1]         | [Active 1]       |
| [Card 2]         | [Active 2]       |
| [Card 3]         |                  |
+------------------+------------------+
```

#### 2.2 Merge Delegate/Forward into Single Button
- Single "Delegate" button
- Dialog shows both crew members AND service categories
- Unified handling for both delegation types

### Phase 3: Testing & Validation (1 hour)

#### 3.1 MQTT Integration Test
- Use button simulator to create requests
- Verify real-time updates via WebSocket
- Check status transitions: pending → accepted → serving → completed

#### 3.2 Image Loading Test
- Verify all location images load correctly
- Test fallback behavior for missing images

#### 3.3 User Flow Test
- Accept request → Status changes to "serving"
- Complete request → Timer countdown → Disappears
- Delegate request → Assigned to crew member

## Code Structure Improvements

### 1. Service Request Hook Architecture
```
useServiceRequestsApi.ts (✅ Well structured)
  ├── useServiceRequestsApi() - GET all
  ├── useCreateServiceRequest() - POST
  ├── useAcceptServiceRequest() - PUT accept
  ├── useCompleteServiceRequest() - PUT complete
  └── transformServiceRequest() - DTO → Frontend model
```

### 2. WebSocket Integration
- Already working correctly
- Events: 'service-request:created', 'service-request:updated'
- Invalidates React Query cache on events

### 3. Context Cleanup Needed
- Remove unused functions from ServiceRequestsContext
- Use API hooks directly in components
- Keep only shared state in context

## Priority Fixes for MVP

1. **CRITICAL**: Fix accept functionality - requests must be assignable
2. **CRITICAL**: Fix location images - visual appeal is important
3. **HIGH**: Fix data display - show actual guest names, not "Unknown Guest"
4. **MEDIUM**: Restore forward functionality or improve delegate
5. **LOW**: UI polish and animations

## Technical Debt to Address Later

1. ServiceRequestsContext has many TODO comments
2. History tracking not properly implemented
3. No error handling for failed API calls
4. No offline support or retry logic
5. Performance: Re-renders on every WebSocket event