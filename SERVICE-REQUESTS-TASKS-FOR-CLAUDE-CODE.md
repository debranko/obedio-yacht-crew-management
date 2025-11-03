# SERVICE REQUESTS - CRITICAL TASKS FOR CLAUDE CODE

**DEADLINE**: Before METSTRADE 2025
**PRIORITY**: CRITICAL - This is a production yacht management system, not a demo

## CONTEXT
The service requests system handles real guest call button presses on luxury yachts. It MUST work flawlessly 24/7. The system was working before but got broken during refactoring.

## TASKS IN PRIORITY ORDER

### TASK 1: Fix Accept Service Request (CRITICAL)
**File**: `src/components/pages/service-requests.tsx` (line ~232)
**Problem**: Accept button doesn't call backend API, uses hardcoded crew member
**Solution**: Use `useAcceptServiceRequest` hook to make proper API call
**Test**: Click Accept → Status must change to "serving" in database

### TASK 2: Fix Guest Names Display
**File**: `src/hooks/useServiceRequestsApi.ts` (line ~32)
**Problem**: Shows "Unknown Guest" instead of actual guest names
**Solution**: Use populated data from backend: `dto.guest.firstName + lastName`
**Test**: Service request cards must show real guest names

### TASK 3: Fix Location Images
**File**: `src/hooks/useServiceRequestsApi.ts` (line ~48)
**Problem**: Beautiful yacht interior images not loading
**Solution**: Map location name to image path: `/images/locations/${locationName}.jpg`
**Images exist in**: `/public/images/locations/`
**Test**: Each request card must show yacht cabin background image

### TASK 4: Fix Complete Service Request
**File**: `src/contexts/ServiceRequestsContext.tsx`
**Problem**: Complete button doesn't call backend API
**Solution**: Use `useCompleteServiceRequest` hook
**Test**: Click Complete → Timer countdown → Request disappears

### TASK 5: Restore Forward to Teams
**Problem**: Forward functionality was removed but it was working before
**Original**: Forward to teams (Galley, Housekeeping, Bar Service, etc.)
**Current**: Uses service categories (user wants original back)
**Solution**: Restore InteriorTeam forwarding alongside categories

### TASK 6: Implement Left/Right Split Layout
**File**: `src/components/pages/service-requests.tsx`
**Current**: Single column layout
**Required**: 
- Left column: Pending Requests
- Right column: Serving Now
- Fullscreen mode: 2 columns side by side

### TASK 7: Add Error Handling
**All API calls need**:
- Loading states during operations
- Error toasts on failure
- No crashes - graceful degradation
- Professional error messages (no technical jargon)

### TASK 8: Test with Button Simulator
**Test Flow**:
1. Start button simulator
2. Press virtual button
3. Service request appears with correct data
4. Accept request → Status changes
5. Complete request → Disappears after countdown
6. Test with 10+ simultaneous requests

## VALIDATION CHECKLIST
- [ ] Accept button connects to API and updates status
- [ ] Real guest names display (not "Unknown Guest")
- [ ] Yacht interior images load as backgrounds
- [ ] Complete button works with countdown timer
- [ ] Forward to teams restored (not just categories)
- [ ] Left/right split layout implemented
- [ ] Error handling prevents all crashes
- [ ] Tested with MQTT button simulator
- [ ] WebSocket real-time updates work
- [ ] System handles 50+ simultaneous requests

## CRITICAL NOTES
1. This system manages billionaire yacht guests - it MUST be perfect
2. Will be demonstrated at METSTRADE - cannot fail during demo
3. Emergency button presses are life safety - must always work
4. The system was working before - check git history if needed
5. Beautiful UI matters - yacht owners expect luxury

## FILES ALREADY ANALYZED
- `/src/contexts/ServiceRequestsContext.tsx`
- `/src/hooks/useServiceRequestsApi.ts` 
- `/src/components/pages/service-requests.tsx`
- `/backend/src/routes/service-requests.ts`
- `/backend/src/services/mqtt.service.ts`

All implementation details are in `OBEDIO-DEBUG-FINDINGS-SUMMARY.md`