# Service Requests Implementation Checklist for Claude Code

## CRITICAL FIXES (Must complete for MVP)

### 1. Fix Accept Service Request Functionality ❌
**File**: `src/components/pages/service-requests.tsx`
**Line**: ~232-236

**Current broken code**:
```typescript
const handleAccept = (request: ServiceRequest) => {
  const currentUser = 'Maria Lopez'; // Hardcoded!
  acceptServiceRequest(request.id, currentUser); // This doesn't call API!
  toast.success(`Now serving ${userPreferences.serviceRequestDisplayMode === 'guest-name' ? request.guestName : request.guestCabin}`);
};
```

**Fix needed**:
```typescript
const { mutate: acceptRequest } = useAcceptServiceRequest();

const handleAccept = (request: ServiceRequest) => {
  // TODO: Get current crew member ID from auth context
  const currentCrewId = 'current-crew-id'; // Replace with auth.user.crewMemberId
  
  acceptRequest(
    { id: request.id, crewId: currentCrewId },
    {
      onSuccess: () => {
        toast.success(`Now serving ${request.guestName || request.guestCabin}`);
      },
      onError: (error) => {
        toast.error('Failed to accept request: ' + error.message);
      }
    }
  );
};
```

### 2. Fix Location Image Loading ❌
**File**: `src/hooks/useServiceRequestsApi.ts`
**Line**: ~48

**Current broken code**:
```typescript
cabinImage: dto.location?.imageUrl || undefined,
```

**Fix needed**:
```typescript
// Map location name to actual image file
const getLocationImage = (locationName?: string): string | undefined => {
  if (!locationName) return undefined;
  
  // Clean location name for filename (handle spaces, special chars)
  const imageName = locationName.trim();
  return `/images/locations/${imageName}.jpg`;
};

// In transformServiceRequest:
cabinImage: dto.location?.imageUrl || getLocationImage(dto.location?.name),
```

### 3. Fix Data Transformation to Use Populated Data ❌
**File**: `src/hooks/useServiceRequestsApi.ts`
**Lines**: ~32-36

**Current broken code**:
```typescript
const guestName = dto.guest
  ? `${dto.guest.firstName} ${dto.guest.lastName}`.trim()
  : 'Unknown Guest'; // Falls back to "Unknown Guest"!
```

**Fix needed**:
```typescript
// Use all available data sources
const guestName = dto.guest
  ? `${dto.guest.firstName} ${dto.guest.lastName}`.trim()
  : dto.guestName || 'Guest'; // Use guestName from DTO if guest not populated

const guestCabin = dto.location?.name || dto.guestCabin || 'Unknown Location';
```

### 4. Connect Complete and Delegate Functions ❌
**File**: `src/contexts/ServiceRequestsContext.tsx`
**Lines**: ~65-108

**Issue**: These functions don't actually call the backend API, they just invalidate cache

**Fix for completeServiceRequest**:
```typescript
const { mutate: completeRequest } = useCompleteServiceRequest();

const completeServiceRequest = useCallback((requestId: string, crewMemberName?: string) => {
  completeRequest(requestId, {
    onSuccess: () => {
      // Invalidation will happen automatically via mutation
      toast.success('Service request completed');
    }
  });
}, [completeRequest]);
```

### 5. Restore Original Forward Functionality ❌
**Issue**: Forward to teams (Galley, Housekeeping, etc.) was working but got replaced with service categories

**Add back the original InteriorTeam functionality**:
1. Keep the InteriorTeam type from `src/types/service-requests.ts`
2. Add a `forwardToTeam` field back to ServiceRequest interface
3. Create API endpoint for forwarding to teams (not just categories)
4. Restore the original forward dialog with team selection

## UI/UX IMPROVEMENTS

### 6. Implement Left/Right Split Layout ❌
**File**: `src/components/pages/service-requests.tsx`
**Current**: Single column layout
**Target**: Two-column layout for better space usage

```typescript
// Main container structure needed:
<div className="flex h-full">
  {/* Left Column - Pending Requests */}
  <div className="w-1/2 p-6 border-r overflow-y-auto">
    <h3>Pending Requests ({pendingRequests.length})</h3>
    {/* Pending request cards */}
  </div>
  
  {/* Right Column - Serving Now */}
  <div className="w-1/2 p-6 overflow-y-auto">
    <h3>Serving Now ({servingRequests.length})</h3>
    {/* Serving request cards */}
  </div>
</div>
```

### 7. Ensure Background Images Show ❌
**File**: `src/components/pages/service-requests.tsx`
**Lines**: ~478-489

The image code is there but images don't load. Check:
1. Image paths are correct
2. Gradient overlay isn't too dark (currently 85%/70%/50% - might be too dark)
3. Images actually exist in public folder

## ERROR HANDLING & ROBUSTNESS

### 8. Add Proper Error Handling ❌
Every API call needs error handling:
- Accept request → Show error toast if fails
- Complete request → Show error toast if fails
- Delegate request → Show error toast if fails
- Image loading → Fallback to placeholder

### 9. Add Loading States ❌
Show loading indicators during:
- Accepting a request
- Completing a request
- Delegating a request

### 10. Handle Edge Cases ❌
- What if guest is null?
- What if location is null?
- What if crew member not found?
- What if WebSocket disconnects?

## TESTING CHECKLIST

### 11. Manual Testing Steps
1. [ ] Click "Test Request" button → Creates new request
2. [ ] New request appears with guest name and location
3. [ ] Background image loads for location
4. [ ] Click "Accept" → Status changes to "serving"
5. [ ] Click "Complete" → Timer starts countdown
6. [ ] After countdown → Request disappears
7. [ ] Click "Delegate" → Can select crew member
8. [ ] Test with multiple simultaneous requests

### 12. MQTT Button Press Test
1. [ ] Start button simulator
2. [ ] Press virtual button
3. [ ] Request appears in UI
4. [ ] All data populated correctly

### 13. WebSocket Real-time Test
1. [ ] Open app in two browser tabs
2. [ ] Create request in tab 1
3. [ ] Request appears in tab 2
4. [ ] Accept request in tab 1
5. [ ] Status updates in tab 2

## IMPLEMENTATION ORDER

1. **First**: Fix accept functionality (Critical for demo)
2. **Second**: Fix data transformation (Show real names)
3. **Third**: Fix image loading (Visual appeal)
4. **Fourth**: Add error handling (Robustness)
5. **Fifth**: Test everything with button simulator
6. **Sixth**: UI layout improvements (if time allows)

## NOTES FOR CLAUDE CODE

- The system was working before refactoring - check git history if needed
- Forward functionality was removed but user wants it back
- Beautiful yacht interior images exist in `/public/images/locations/`
- Don't over-complicate - MVP needs basic functionality working
- Test with real MQTT button presses, not just UI button