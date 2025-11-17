# ✅ SERVICE REQUESTS REBUILD - TODO CHECKLIST

**Date:** 2025-11-07
**Approach:** Baby Steps - Small changes, frequent commits, continuous testing

---

## 📋 PRE-IMPLEMENTATION CHECKLIST

### Before Starting ANY Code Changes:

- [x] ✅ Create backup of service-requests.tsx
- [x] ✅ Complete dependency analysis
- [x] ✅ Document findings
- [ ] ⏳ Read OBEDIO-CONSOLIDATED-RULES-FOR-AI.md
- [ ] ⏳ Cross-check analysis with existing docs
- [ ] ⏳ Get user approval to proceed
- [ ] ⏳ Test current system works (baseline)

---

## 🏗️ PHASE 1: FOUNDATION (Estimated: 1 hour)

### Goal: Create new page file, set up routing, verify navigation

#### 1.1 Create New Page File
- [ ] Create `src/components/pages/service-requests-new.tsx`
- [ ] Add basic React component structure
- [ ] Import necessary dependencies (React, hooks, UI components)
- [ ] Add TypeScript interfaces
- [ ] Test file compiles without errors

**Test:** `npm run type-check` passes

#### 1.2 Set Up Minimal Structure
- [ ] Copy import statements from pop-up dialog (lines 1-40)
- [ ] Set up state variables (useState for dialogs, playing audio, etc.)
- [ ] Add useAppData() hook
- [ ] Add useAuth() hook
- [ ] Add useUserPreferences() hook
- [ ] Test component renders without crashing

**Test:** Start dev server, no console errors

#### 1.3 Update Routing
- [ ] Open `src/App.tsx`
- [ ] Find service-requests route (line 203-204)
- [ ] Comment out old route (don't delete yet!)
- [ ] Add new route: `case "service-requests-new"`
- [ ] Test navigation works

**Test:** Navigate to `/service-requests-new` - blank page renders

#### 1.4 Add Basic Layout
- [ ] Add page container div
- [ ] Add header section
- [ ] Add title "Service Requests"
- [ ] Add empty main content area
- [ ] Test layout renders

**Test:** Page shows title, no errors in console

**Checkpoint 1:**
```bash
git add src/components/pages/service-requests-new.tsx src/App.tsx
git commit -m "WIP: Service Requests rebuild - Phase 1 foundation"
```

---

## 🎯 PHASE 2: CORE FEATURES FROM POP-UP (Estimated: 1-2 hours)

### Goal: Copy working features from incoming-request-dialog.tsx

#### 2.1 Set Up Data Loading
- [ ] Add useServiceRequestsApi hooks (4 mutations)
- [ ] Copy from page lines 90-93
- [ ] Add useWebSocket() hook
- [ ] Test hooks initialize correctly

**Reference:**
- Old page: lines 90-93
- Pop-up: lines 48-58

**Test:** Console log shows hooks loaded

#### 2.2 Add Data Filtering
- [ ] Add useMemo for pending requests filter
- [ ] Add useMemo for serving requests filter
- [ ] Add useMemo for completed requests filter
- [ ] Test filters work

**Reference:** Old page lines 217-229

**Test:** Console log shows correct request counts

#### 2.3 Copy Audio Playback Logic
- [ ] Copy `handlePlayAudio` function from pop-up (lines 149-192)
- [ ] Add state: `const [playingAudio, setPlayingAudio] = useState<string | null>(null)`
- [ ] Test audio function exists (don't play yet)

**Reference:** `incoming-request-dialog.tsx` lines 149-192

**Code to Copy:**
```typescript
const handlePlayAudio = (requestId: string, audioUrl?: string) => {
  if (!audioUrl) {
    toast.error('No audio recording available');
    return;
  }

  setPlayingAudio(requestId);

  try {
    const audio = new Audio(audioUrl);

    audio.onended = () => {
      setPlayingAudio(null);
    };

    audio.onerror = () => {
      setPlayingAudio(null);
      toast.error('Failed to play audio', {
        description: 'Audio file could not be loaded'
      });
    };

    audio.play().catch((error) => {
      console.error('Audio playback error:', error);
      setPlayingAudio(null);
      toast.error('Failed to play audio', {
        description: error.message
      });
    });

    toast.info('🎵 Playing voice message...');
  } catch (error) {
    console.error('Audio creation error:', error);
    setPlayingAudio(null);
    toast.error('Failed to play audio');
  }
};
```

**Test:** Function exists, no TypeScript errors

#### 2.4 Copy Delegate Dropdown Logic
- [ ] Copy crew filtering logic from pop-up (lines 385-393)
- [ ] Add `onDutyCrew` useMemo
- [ ] Add `availableCrew` useMemo
- [ ] Copy `handleDelegateClick` from old page (lines 270-293)
- [ ] Add state for delegate dialog
- [ ] Test delegate function exists

**Reference:**
- Pop-up: lines 377-457 (dropdown UI)
- Old page: lines 270-293 (handler)

**Test:** Crew lists computed correctly (console log)

#### 2.5 Copy Forward Dropdown Logic
- [ ] Copy forward options from pop-up (lines 56-65)
- [ ] Copy `handleForwardClick` from old page (lines 295-323)
- [ ] Add state for forward dialog
- [ ] Test forward function exists

**Reference:**
- Pop-up: lines 459-486 (dropdown UI)
- Old page: lines 295-323 (handler)

**Test:** Forward options array exists

#### 2.6 Copy Accept/Complete Handlers
- [ ] Copy `handleAccept` from old page (lines 246-268)
- [ ] Copy `handleComplete` from old page (lines 325-339)
- [ ] Test handlers exist

**Reference:** Old page lines 246-268, 325-339

**Test:** Handlers exist, no TypeScript errors

**Checkpoint 2:**
```bash
git add src/components/pages/service-requests-new.tsx
git commit -m "WIP: Service Requests rebuild - Phase 2 core features added"
```

---

## 📊 PHASE 3: LIST VIEW LAYOUT (Estimated: 1 hour)

### Goal: Add sections for pending/serving/completed requests

#### 3.1 Add Pending Requests Section
- [ ] Copy section header from old page (lines 525-537)
- [ ] Add grid layout for pending cards
- [ ] Copy single pending card structure (lines 538-671)
- [ ] Add cabin image with gradient overlay
- [ ] Add guest name/cabin display
- [ ] Add priority badge
- [ ] Add voice transcript display
- [ ] Add action buttons (Accept/Delegate/Forward)
- [ ] Test section renders

**Reference:** Old page lines 525-671

**Test:** Pending requests display correctly (use test data)

#### 3.2 Add Serving Requests Section
- [ ] Copy section header from old page (lines 674-688)
- [ ] Use ServingRequestCard component (already shared)
- [ ] Map over servingRequests array
- [ ] Pass handleComplete to cards
- [ ] Test section renders

**Reference:** Old page lines 674-702

**Test:** Serving requests display correctly

#### 3.3 Add Completed Requests Section with Timer
- [ ] Copy section header from old page (lines 704-714)
- [ ] Copy countdown timer logic (lines 342-364)
- [ ] Add state: `const [completingRequests, setCompletingRequests] = useState<Record<string, number>>({})`
- [ ] Copy useEffect for timer countdown (lines 346-364)
- [ ] Map over completed requests
- [ ] Show "Clearing in Xs..." message
- [ ] Test section renders

**Reference:** Old page lines 704-771

**Test:** Completed requests show with countdown

#### 3.4 Add Empty States
- [ ] Copy empty state from old page (lines 774-784)
- [ ] Show when no pending requests
- [ ] Show when no serving requests
- [ ] Show when no completed requests
- [ ] Test empty states display

**Reference:** Old page lines 774-784

**Test:** Empty message shows when arrays empty

**Checkpoint 3:**
```bash
git add src/components/pages/service-requests-new.tsx
git commit -m "WIP: Service Requests rebuild - Phase 3 list view layout complete"
```

---

## 🎨 PHASE 4: HEADER & DIALOGS (Estimated: 30 min)

### Goal: Add header features and dialog components

#### 4.1 Add Statistics Badges
- [ ] Copy stats useMemo from old page (lines 232-239)
- [ ] Count pending requests
- [ ] Count urgent requests
- [ ] Count emergency requests
- [ ] Display badges in header
- [ ] Test counts are correct

**Reference:** Old page lines 231-239

**Test:** Badge numbers match actual counts

#### 4.2 Add WebSocket Status Indicator
- [ ] Copy WebSocket indicator from old page (lines 435-446)
- [ ] Show green dot when connected
- [ ] Show red dot when disconnected
- [ ] Test indicator updates

**Reference:** Old page lines 435-446

**Test:** Indicator shows correct status

#### 4.3 Add Settings Button
- [ ] Import ServiceRequestsSettingsDialog component
- [ ] Add settings button in header (line 486-495)
- [ ] Add state for settings dialog open/close
- [ ] Wire up dialog
- [ ] Test dialog opens

**Reference:** Old page lines 486-495

**Test:** Settings dialog opens and closes

#### 4.4 Add Clear All Button
- [ ] Copy clear all button from old page (lines 474-484)
- [ ] Copy confirmation dialog (lines 953-998)
- [ ] Add state for confirmation dialog
- [ ] Wire up useCreateServiceRequest mutation
- [ ] Test button shows confirmation
- [ ] Test clearing works

**Reference:** Old page lines 474-484, 953-998

**Test:** Clear all shows confirmation, works correctly

#### 4.5 Add Delegate Dialog
- [ ] Copy delegate dialog UI from pop-up (lines 377-457)
- [ ] Use crew filtering from step 2.4
- [ ] Add on-duty section (always visible)
- [ ] Add available crew section (collapsible)
- [ ] Wire up to handleDelegateClick
- [ ] Test dialog opens and delegates

**Reference:** Pop-up lines 377-457

**Test:** Delegate dialog works, crew assignment successful

#### 4.6 Add Forward Dialog
- [ ] Copy forward dialog UI from pop-up (lines 459-486) OR old page (lines 789-866)
- [ ] Use forward options from step 2.5
- [ ] Wire up to handleForwardClick
- [ ] Test dialog opens and forwards

**Reference:**
- Pop-up: lines 459-486 (simpler version)
- Old page: lines 789-866 (with categories)

**Test:** Forward dialog works, team assignment successful

**Checkpoint 4:**
```bash
git add src/components/pages/service-requests-new.tsx
git commit -m "WIP: Service Requests rebuild - Phase 4 header and dialogs complete"
```

---

## ✨ PHASE 5: POLISH & OPTIONAL FEATURES (Estimated: 30 min)

### Goal: Add nice-to-have features

#### 5.1 Add Display Mode Toggle
- [ ] Get displayMode from useUserPreferences
- [ ] Toggle between 'guest-name' and 'location' mode
- [ ] Update card display based on mode
- [ ] Test toggle works

**Reference:** Old page lines 83-88, 564-607

**Test:** Display mode changes work correctly

#### 5.2 Add Fullscreen Mode (Optional)
- [ ] Copy fullscreen logic from old page (lines 159-210)
- [ ] Add fullscreen button
- [ ] Add state: `const [isFullScreen, setIsFullScreen] = useState(false)`
- [ ] Wire up fullscreen API
- [ ] Test fullscreen works

**Reference:** Old page lines 159-210

**Test:** Fullscreen toggles correctly

#### 5.3 Add Test Request Button (Optional)
- [ ] Copy test button from old page (lines 456-472)
- [ ] Wire up useCreateServiceRequest
- [ ] Test button creates request

**Reference:** Old page lines 456-472

**Test:** Test request created successfully

#### 5.4 Add Voice Message Duration Display
- [ ] Copy duration parsing from pop-up (lines 296-335)
- [ ] Extract "(3.0s)" from transcript
- [ ] Display duration separately
- [ ] Test parsing works

**Reference:** Pop-up lines 296-335

**Test:** Duration extracted and displayed

#### 5.5 Add Motion Animations (Optional)
- [ ] Install framer-motion if needed
- [ ] Copy animations from pop-up (lines 239-268)
- [ ] Add subtle entrance animations
- [ ] Test animations work

**Reference:** Pop-up lines 239-268

**Test:** Animations smooth, not overwhelming

**Checkpoint 5:**
```bash
git add src/components/pages/service-requests-new.tsx
git commit -m "WIP: Service Requests rebuild - Phase 5 polish complete"
```

---

## 🧪 PHASE 6: TESTING & VALIDATION (Estimated: 30 min)

### Goal: Comprehensive testing before replacing old page

#### 6.1 Manual Testing Checklist
- [ ] Create service request (via button simulator)
- [ ] Verify appears in Pending section
- [ ] Click Accept → moves to Serving section
- [ ] Click Complete → moves to Completed section with timer
- [ ] Wait for timer → request disappears after timeout
- [ ] Test Delegate → opens dialog, assigns crew
- [ ] Test Forward → opens dialog, assigns team
- [ ] Test voice message → click play, audio plays
- [ ] Test empty states → clear all, check messages
- [ ] Test WebSocket → create request in different browser, check updates
- [ ] Test settings → open dialog, change preferences
- [ ] Test display mode toggle → switch between modes
- [ ] Test fullscreen (if added) → toggle fullscreen
- [ ] Test statistics badges → counts match actual

#### 6.2 Edge Cases
- [ ] Request with no voice transcript
- [ ] Request with no cabin image
- [ ] Request with emergency priority
- [ ] Multiple requests at once
- [ ] No crew members available
- [ ] No on-duty crew
- [ ] WebSocket disconnected

#### 6.3 Browser Testing
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Edge
- [ ] Test on mobile (responsive)

#### 6.4 Performance Check
- [ ] Check React DevTools profiler
- [ ] Check for console warnings
- [ ] Check for memory leaks (audio objects)
- [ ] Check network requests (not duplicated)

**Test Report:** Document any issues found

---

## 🔄 PHASE 7: REPLACE OLD PAGE (Estimated: 15 min)

### Goal: Swap new page for old, update routing

#### 7.1 Update Routing
- [ ] Open `src/App.tsx`
- [ ] Change route to use new page
- [ ] Remove old route (keep commented for now)
- [ ] Test routing works

**Before:**
```typescript
case "service-requests": return <ServiceRequestsPage />;
```

**After:**
```typescript
case "service-requests": return <ServiceRequestsNewPage />;
// case "service-requests": return <ServiceRequestsPage />; // OLD - removed 2025-11-07
```

#### 7.2 Rename Files
- [ ] Rename `service-requests-new.tsx` to `service-requests.tsx`
- [ ] Update import in App.tsx
- [ ] Test everything still works

**Commands:**
```bash
# Backup old (already done)
# mv src/components/pages/service-requests.tsx src/components/pages/service-requests.tsx.BACKUP-2025-11-07

# Rename new to main
mv src/components/pages/service-requests-new.tsx src/components/pages/service-requests.tsx
```

#### 7.3 Update Imports (if needed)
- [ ] Search for any imports of old page
- [ ] Update import statements
- [ ] Test no broken imports

**Search command:**
```bash
grep -r "from.*service-requests" src/
```

#### 7.4 Final Smoke Test
- [ ] Start dev server
- [ ] Navigate to Service Requests page
- [ ] Create, accept, complete a request
- [ ] Verify all features work
- [ ] Check console for errors
- [ ] Check network tab for API calls

**Checkpoint 6:**
```bash
git add src/App.tsx src/components/pages/service-requests.tsx
git commit -m "feat: Replace Service Requests page with rebuilt version

- Rebuilt from scratch using pop-up dialog as template
- Real audio playback (not simulated)
- Better code structure and maintainability
- 40% less code (600 lines vs 1,002)
- All features preserved or improved

Old page backed up as: service-requests.tsx.BACKUP-2025-11-07

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 🧹 PHASE 8: CLEANUP (Estimated: 15 min)

### Goal: Remove old code, verify system health

#### 8.1 Verify Backup Exists
- [ ] Check backup file exists
- [ ] Check backup is readable
- [ ] Document backup location

**Command:**
```bash
ls -lh src/components/pages/service-requests.tsx.BACKUP-2025-11-07
```

#### 8.2 Delete WIP Files
- [ ] Delete any test files created
- [ ] Delete any temporary backups
- [ ] Keep only main backup

#### 8.3 Update Documentation
- [ ] Update SERVICE-REQUESTS-MASTER-PLAN-V2.md with completion status
- [ ] Document any deviations from plan
- [ ] Note any issues encountered

#### 8.4 Run Full Test Suite
- [ ] Run TypeScript type check: `npm run type-check`
- [ ] Run linter: `npm run lint`
- [ ] Run tests (if any): `npm test`
- [ ] Fix any issues

#### 8.5 Final Code Review
- [ ] Check for console.log statements (remove)
- [ ] Check for commented code (remove)
- [ ] Check for TODOs (resolve or document)
- [ ] Check for hardcoded values (extract to config)

**Checkpoint 7:**
```bash
git add .
git commit -m "chore: Cleanup after Service Requests rebuild"
git push
```

---

## 🎉 COMPLETION CHECKLIST

- [ ] ✅ All phases complete
- [ ] ✅ All tests passing
- [ ] ✅ No console errors
- [ ] ✅ Documentation updated
- [ ] ✅ Code pushed to git
- [ ] ✅ User tested and approved

---

## 🚨 ROLLBACK INSTRUCTIONS

If something goes wrong:

### Quick Rollback (restore from backup):
```bash
cp src/components/pages/service-requests.tsx.BACKUP-2025-11-07 src/components/pages/service-requests.tsx
git checkout src/App.tsx  # if routing was changed
npm run dev
```

### Git Rollback (if committed):
```bash
git log --oneline  # find commit before rebuild
git revert <commit-hash>
```

### Nuclear Option (restore everything):
```bash
git stash  # save any uncommitted work
git reset --hard HEAD~N  # N = number of commits to undo
```

---

## 📝 NOTES & DEVIATIONS

**Document any changes from plan here:**

-

**Issues encountered:**

-

**Time actual vs estimated:**

- Phase 1: _____ (estimated 1h)
- Phase 2: _____ (estimated 1-2h)
- Phase 3: _____ (estimated 1h)
- Phase 4: _____ (estimated 30min)
- Phase 5: _____ (estimated 30min)
- Phase 6: _____ (estimated 30min)
- Phase 7: _____ (estimated 15min)
- Phase 8: _____ (estimated 15min)
- **Total:** _____ (estimated 3-4h)

---

**Created:** 2025-11-07
**Status:** Ready to execute
**Next Action:** User approval + Phase 1
