# CREW PAGE - COMPREHENSIVE DATA AUDIT
**Date**: 2025-10-30
**Audit Type**: Full data source analysis (Database vs Hardcode vs Mock)

---

## 📊 EXECUTIVE SUMMARY

**Key Findings**:
- ✅ **Basic crew data** (name, position, department, status) comes from DATABASE
- ⚠️  **7 fields have HARDCODE fallbacks** in AppDataContext.tsx
- ❌ **8 fields DON'T EXIST in database** (avatar, nickname, color, phone, onBoardContact, languages, skills, notes, leaveStart, leaveEnd)
- ✅ **Schedule/Shift data** comes from DATABASE (Assignments & Shifts tables)
- ⚠️  **Type mismatch** between backend (CrewMemberExtended) and frontend (CrewMember)

---

## 1️⃣ CREW LIST TABLE (Main Page)

**Location**: [src/components/pages/crew-list.tsx:744-958](src/components/pages/crew-list.tsx#L744-L958)

### Displayed Fields:

| Field | Display Location | Data Source | Status |
|-------|-----------------|-------------|--------|
| **Status Toggle** | Table Column 1 | DATABASE → `crew.status` | ✅ DATABASE |
| **Avatar** | Table Column 2 | AppDataContext → `undefined` | ❌ NOT IN DB |
| **Name** | Table Column 2 | DATABASE → `crew.name` | ✅ DATABASE |
| **On Duty Badge** | Below name | CALCULATED from `dutyStatus.onDuty` | ✅ DATABASE (via Assignments) |
| **Position** | Table Column 3 | DATABASE → `crew.position` | ✅ DATABASE |
| **Shift Schedule** | Table Column 4 | CALCULATED from `dutyStatus` | ✅ DATABASE (via Assignments) |

### Shift Schedule Column Details:
```typescript
// Line 871-884 in crew-list.tsx
{currentDutyInfo ? (
  // Shows current shift if on duty
  <Badge>{currentDutyInfo.shift}</Badge>
) : nextShift ? (
  // Shows next upcoming shift
  <span>Next: {nextShift.shift}</span>
) : (
  // Shows "-" if no assignment
  <span>-</span>
)}
```

**Source**: `dutyStatus` is calculated from:
- **Assignments** (DATABASE: `Assignment` table)
- **Shifts** (DATABASE: `Shift` table)
- **Crew Members** (DATABASE: `CrewMember` table)

---

## 2️⃣ CREW DETAILS DIALOG (Popup when clicking crew)

**Location**: [src/components/crew-member-details-dialog.tsx](src/components/crew-member-details-dialog.tsx)

### Basic Info Section:

| Field | Line | Data Source | Status |
|-------|------|-------------|--------|
| **Avatar** | 329-340 | `crewMember.avatar` | ❌ NOT IN DB (undefined) |
| **Name** | 382 | `crewMember.name` | ✅ DATABASE |
| **Nickname** | 383-385 | `crewMember.nickname` | ⚠️  GENERATED (`name.split(' ')[0]`) |
| **Position** | 387 | `crewMember.position` | ✅ DATABASE |
| **Department** | 387 | `crewMember.department` | ✅ DATABASE |
| **Status Badge** | 391 | `crewMember.status` | ✅ DATABASE |
| **Leave Dates** | 392-396 | `crewMember.leaveStart/leaveEnd` | ❌ NOT IN DB |

### Contact Information Section:

| Field | Line | Data Source | Status |
|-------|------|-------------|--------|
| **Email** | 459 | `crewMember.email` | ⚠️  DATABASE + HARDCODE FALLBACK |
| **Phone** | 463 | `crewMember.phone` | ⚠️  FALLBACK to `contact` field |
| **On Board Contact** | 468 | `crewMember.onBoardContact` | ❌ NOT IN DB (undefined) |

**Hardcode Fallback Details** ([AppDataContext.tsx:338-340](src/contexts/AppDataContext.tsx#L338-L340)):
```typescript
contact: member.contact || '+1 555 0100',  // ⚠️  HARDCODE FALLBACK!
email: member.email || `${member.name.toLowerCase().replace(' ', '.')}@yacht.com`,  // ⚠️  GENERATED EMAIL!
phone: member.contact || undefined,  // Uses 'contact' field
```

### Current Schedule Section:

| Field | Line | Data Source | Calculation | Status |
|-------|------|-------------|-------------|--------|
| **Current Shift** | 488-491 | DATABASE | Calculated from `assignments` + `shifts` | ✅ DATABASE |
| **Next Shift** | 500-505 | DATABASE | Calculated from `assignments` + `shifts` | ✅ DATABASE |
| **Hours This Week** | 510 | DATABASE | `assignments.length * 8` (estimated) | ⚠️  CALCULATED (not real hours) |
| **Days Off This Week** | 515 | DATABASE | 7 - `assignedDays.size` | ✅ CALCULATED from DB |

**Calculation Logic** ([crew-member-details-dialog.tsx:180-226](src/components/crew-member-details-dialog.tsx#L180-L226)):
```typescript
const scheduleOverview = useMemo(() => {
  const today = formatDate(new Date());

  // Find today's assignments from DATABASE
  const todayAssignments = assignments.filter(
    (a) => a.crewId === crewMember.id && a.date === today
  );

  // Find future assignments from DATABASE
  const futureAssignments = assignments
    .filter((a) => a.crewId === crewMember.id && a.date > today)
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    currentShift: todayAssignments[0] || null,  // ✅ DATABASE
    nextShift: futureAssignments[0],            // ✅ DATABASE
    hoursThisWeek: weekAssignments.length * 8,  // ⚠️  ESTIMATE (8h per shift)
    daysOffThisWeek: daysOff,                   // ✅ CALCULATED
  };
}, [assignments, crewMember.id]);
```

### Skills & Languages Section:

| Field | Line | Data Source | Status |
|-------|------|-------------|--------|
| **Languages** | 538-555 | `crewMember.languages` | ⚠️  HARDCODE `['English']` |
| **Special Skills** | 569-586 | `crewMember.skills` | ⚠️  HARDCODE `[]` |

**Hardcode Details** ([AppDataContext.tsx:345-346](src/contexts/AppDataContext.tsx#L345-L346)):
```typescript
languages: ['English'], // ⚠️  HARDCODE!
skills: [],             // ⚠️  HARDCODE!
```

### Assigned Device Section:

| Field | Line | Data Source | Status |
|-------|------|-------------|--------|
| **Current Device** | 85 | `getCrewDevice(crewMember.id)` | ✅ AppDataContext state |
| **Available Devices** | 88-98 | `useDevices()` hook → DATABASE | ✅ DATABASE |

**Note**: Available devices are filtered to only show unassigned devices ([line 91-93](src/components/crew-member-details-dialog.tsx#L91-L93)):
```typescript
const availableDevices = allDevices
  .filter(device => !device.crewMemberId)  // Only unassigned
  .map(device => ({ id, deviceId, name, type }));
```

### Availability & Leave Section:

| Field | Line | Data Source | Status |
|-------|------|-------------|--------|
| **Current Status** | 693-701 | `crewMember.status` + dates | ✅ DATABASE (status only) |
| **Leave Period** | 693-697 | `crewMember.leaveStart/leaveEnd` | ❌ NOT IN DB |

---

## 3️⃣ DATABASE SCHEMA COMPARISON

### What EXISTS in Database:
**Table**: `CrewMember` ([backend/prisma/schema.prisma:47-68](backend/prisma/schema.prisma#L47-L68))

```prisma
model CrewMember {
  id         String   @id @default(cuid())
  name       String                     ✅ USED
  position   String                     ✅ USED
  department String                     ✅ USED
  status     String   @default("active") ✅ USED
  contact    String?                    ✅ USED (as phone fallback)
  email      String?                    ✅ USED
  joinDate   DateTime?                  ✅ USED (with fallback)
  role       String?                    ✅ USED
  userId     String?  @unique           ✅ USED
}
```

### What DOESN'T EXIST in Database:

```
❌ avatar        (always undefined)
❌ nickname      (generated from name.split(' ')[0])
❌ color         (hardcode: '#A8A8A8')
❌ phone         (fallback to 'contact' field)
❌ onBoardContact (always undefined)
❌ languages     (hardcode: ['English'])
❌ skills        (hardcode: [])
❌ notes         (not stored)
❌ leaveStart    (not stored)
❌ leaveEnd      (not stored)
```

---

## 4️⃣ HARDCODE LOCATIONS

### AppDataContext.tsx - Line 328-352

**HARDCODE PROBLEM**:
```typescript
const extendedCrew = apiCrewMembers.map(member => ({
  // ✅ FROM DATABASE:
  id: member.id,
  name: member.name,
  position: member.position,
  department: member.department,
  role: member.role || member.position,
  status: (member.status as any) || 'off-duty',

  // ⚠️  HARDCODE & FALLBACKS:
  shift: '08:00 - 20:00',           // ⚠️  HARDCODE!
  contact: member.contact || '+1 555 0100',  // ⚠️  FALLBACK!
  email: member.email || `${member.name.toLowerCase().replace(' ', '.')}@yacht.com`,  // ⚠️  GENERATED!
  joinDate: member.joinDate || '2023-01-15',  // ⚠️  FALLBACK!

  // 🔄 GENERATED:
  nickname: member.name.split(' ')[0],  // Generate from name

  // ❌ NOT IN DATABASE:
  avatar: undefined,
  color: '#A8A8A8',      // ⚠️  HARDCODE!
  languages: ['English'], // ⚠️  HARDCODE!
  skills: [],            // ⚠️  HARDCODE!
  onBoardContact: undefined,
  phone: member.contact || undefined,
}));
```

---

## 5️⃣ TYPE MISMATCH PROBLEM

### Backend Type (API Response):
**File**: [src/types/crew.ts:2-13](src/types/crew.ts#L2-L13)
```typescript
interface CrewMemberExtended {
  id: string;
  name: string;
  position: string;
  department: string;
  status?: 'on-duty' | 'off-duty' | 'on-leave';
  shift?: string;
  contact?: string;
  email?: string;
  joinDate?: string;
  role?: string;
}
```

### Frontend Type (Used in Components):
**File**: [src/components/duty-roster/types.ts:3-28](src/components/duty-roster/types.ts#L3-L28)
```typescript
interface CrewMember {
  id: string;
  name: string;
  nickname?: string;        // ❌ NOT IN BACKEND
  position: string;
  department: string;
  avatar?: string;          // ❌ NOT IN BACKEND
  color: string;            // ❌ NOT IN BACKEND
  email?: string;
  phone?: string;           // ❌ NOT IN BACKEND (uses 'contact')
  onBoardContact?: string;  // ❌ NOT IN BACKEND
  status?: 'on-duty' | 'on-leave' | 'off-duty';
  leaveStart?: string;      // ❌ NOT IN BACKEND
  leaveEnd?: string;        // ❌ NOT IN BACKEND
  languages?: string[];     // ❌ NOT IN BACKEND
  skills?: string[];        // ❌ NOT IN BACKEND
  notes?: string;           // ❌ NOT IN BACKEND
}
```

**Problem**: Frontend expects 10 more fields than backend provides!

---

## 6️⃣ SHIFT SCHEDULE DISCREPANCY (User's Question)

### User Observation:
> "U listi posade u Shift Schedule koloni piše samo '-', ali kada kliknem na osobu, u Current Schedule popup-u piše 'Night (00:00 - 08:00)'. Zašto?"

### Analysis:

#### In TABLE (shows "-"):
**Location**: [crew-list.tsx:871-884](src/components/pages/crew-list.tsx#L871-L884)
```typescript
{currentDutyInfo ? (
  // Only shows if crew is CURRENTLY on duty RIGHT NOW
  <Badge>{currentDutyInfo.shift}</Badge>
) : nextShift ? (
  // Shows next upcoming shift
  <span>Next: {nextShift.shift}</span>
) : (
  // Shows "-" if NOT currently on duty AND no next shift
  <span>-</span>
)}
```

**Logic**: Shows "-" when:
1. Crew member is NOT currently on duty (status toggle is OFF)
2. AND has no next shift assignment

#### In DETAILS DIALOG (shows "Night 00:00-08:00"):
**Location**: [crew-member-details-dialog.tsx:488-505](src/components/crew-member-details-dialog.tsx#L488-L505)
```typescript
<Card>
  <p>Current Shift</p>
  <p>{scheduleOverview.currentShift
      ? getShiftName(scheduleOverview.currentShift.shiftId)
      : 'Not assigned today'
  }</p>
</Card>

<Card>
  <p>Next Shift</p>
  <p>{scheduleOverview.nextShift
      ? `${formatDateDisplay(scheduleOverview.nextShift.date)} - ${getShiftName(scheduleOverview.nextShift.shiftId)}`
      : 'No upcoming shifts'
  }</p>
</Card>
```

**Logic**: Shows actual shift assignment from database, regardless of duty status toggle.

### Why Different?

| Location | Shows | Based On |
|----------|-------|----------|
| **Table** | Only ACTIVE duty | `dutyStatus.onDuty` (requires status toggle ON) |
| **Details** | ALL assignments | `assignments` table (all scheduled shifts) |

**Example Scenario**:
- Chloe Anderson has assignment for "Night (00:00-08:00)" in database
- But her status toggle is OFF (not currently on duty)
- Result:
  - Table shows: **"-"** (not active right now)
  - Details shows: **"Night (00:00-08:00)"** (scheduled assignment exists)

**Data Source**: Both ultimately pull from DATABASE, but with different filtering logic.

---

## 7️⃣ FINAL VERDICT

### ✅ FROM DATABASE:
- Name, Position, Department, Status
- Contact, Email (with fallbacks)
- Join Date, Role, User ID
- **Assignments** (shift schedule)
- **Shifts** (shift configs: name, time, color)
- **Devices** (assigned devices)

### ⚠️  HARDCODE / GENERATED:
- Shift: '08:00 - 20:00' (fallback)
- Contact: '+1 555 0100' (fallback if empty)
- Email: generated from name (fallback if empty)
- Join Date: '2023-01-15' (fallback if empty)
- Nickname: generated from first name
- Color: '#A8A8A8' (always)
- Languages: ['English'] (always)
- Skills: [] (always empty)

### ❌ NOT IN DATABASE:
- Avatar (image)
- Phone (separate from contact)
- On Board Contact
- Leave Start/End dates
- Notes

### 📊 CALCULATED:
- Current shift (from Assignments + Shifts)
- Next shift (from Assignments + Shifts)
- Hours this week (assignments * 8)
- Days off (7 - assigned days)
- On Duty status (from dutyStatus calculation)

---

## 8️⃣ RECOMMENDATIONS

### Short-term (Fix Hardcode):
1. ❌ **Remove hardcode fallbacks** in AppDataContext
2. ✅ **Add missing fields to database** if needed (avatar, phone, leaveStart/End, languages, skills, notes)
3. ✅ **Unify type definitions** (CrewMember vs CrewMemberExtended)

### Long-term (Architecture):
1. Add proper fields to Prisma schema
2. Update backend API to return all fields
3. Remove hardcode generation logic
4. Use proper defaults only at database level

---

---

## 9️⃣ ADDITIONAL FINDINGS

### ❌ Problem: Assigned Device Dropdown Shows ALL Device Types

**Location**: [crew-member-details-dialog.tsx:91-98](src/components/crew-member-details-dialog.tsx#L91-L98)

**Current Code**:
```typescript
const availableDevices = allDevices
  .filter(device => !device.crewMemberId)  // Only filters unassigned
  .map(device => ({ id, deviceId, name, type }));
```

**Problem**: Dropdown shows:
- ✅ Watch devices (WearOS) - SHOULD show
- ❌ Virtual Buttons (`smart_button`) - SHOULD NOT show
- ❌ Repeaters (`repeater`) - SHOULD NOT show
- ❌ Mobile Apps (`mobile_app`) - SHOULD NOT show (unclear from user)

**User Quote**:
> "Other than P watch, there is also wearOS, but at this point, I didn't make it to make the t watch to work. I made only to work. Wear os."

**Fix Needed**:
```typescript
const availableDevices = allDevices
  .filter(device => !device.crewMemberId && device.type === 'watch')  // ✅ Only watch type
  .map(device => ({ id, deviceId, name, type }));
```

---

### ✅ localStorage Audit Result

**All crew-related components checked**:
- ✅ crew-list.tsx - No localStorage
- ✅ crew-member-details-dialog.tsx - No localStorage
- ✅ AppDataContext.tsx - Explicitly removed (comments on lines 327, 539, 541, 567, 572)

**Verdict**: No localStorage usage in crew system! All data from API.

---

### ⚠️ Problem: Availability & Leave System - Data Not Persisted

**Location**: [crew-member-details-dialog.tsx:684-760](src/components/crew-member-details-dialog.tsx#L684-L760)

**Current Implementation**:
```typescript
// Line 693-700: Shows leave dates
{crewMember.status === 'on-leave'
  ? `On leave from ${formatDateDisplay(crewMember.leaveStart!)} to ${formatDateDisplay(crewMember.leaveEnd!)}`
  : ...
}

// Line 708-756: Leave Calendar UI (appears in Edit mode)
<Calendar
  mode="range"
  selected={leaveRange}
  onSelect={(range) => setLeaveRange(range || {})}
  numberOfMonths={2}
/>
```

**Problems**:
1. ❌ `leaveStart` field **NOT IN DATABASE** (Prisma schema lines 47-68)
2. ❌ `leaveEnd` field **NOT IN DATABASE** (Prisma schema lines 47-68)
3. ✅ Leave Calendar UI exists and works
4. ⚠️  Selected dates are **NOT PERSISTED** (no backend endpoint)
5. ⚠️  `crewMember.status` CAN be set to 'on-leave' but dates are lost

**What Works**:
- UI: Leave Calendar appears in Edit mode
- UI: Range selection works (visual only)
- Database: `status` field supports 'on-leave' enum value

**What Doesn't Work**:
- Leave dates are not saved to database
- After refresh, leave dates are `undefined`
- Trying to display leave period will show "undefined" dates

**Fix Needed**:
1. Add fields to Prisma schema:
```prisma
model CrewMember {
  // ... existing fields
  leaveStart    DateTime?
  leaveEnd      DateTime?
}
```

2. Update backend API to accept these fields
3. Frontend already handles these fields correctly

---

### ❌ Problem: Camera Preview Shows Black Screen

**Location**: [camera-dialog.tsx](src/components/camera-dialog.tsx)

**User Report**:
> "ako pritisnem Take a photo, vidim da mi je samo crna slika. Iako mi kamera dobro radi"

**Analysis**:
- Chrome permissions work (user confirmed)
- Camera access is granted
- But video preview shows black screen

**Current Implementation**:
```typescript
// Line 44-87: Start camera function
const startCamera = async () => {
  const mediaStream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: 'user', // Front camera
      width: { ideal: 1280 },
      height: { ideal: 720 }
    }
  });

  setStream(mediaStream);

  // Attach stream to video element
  if (videoRef.current) {
    videoRef.current.srcObject = mediaStream;
  }
};

// Line 244-252: Video element
<video
  ref={videoRef}
  autoPlay
  playsInline
  muted
  className="w-full h-full object-cover"
/>
```

**Possible Issues**:
1. **Timing Issue**: Stream is set to `videoRef.current.srcObject` before video element is ready
2. **useEffect Dependencies**: Line 42 has incomplete dependency array `[open]` - doesn't include `stream`, `capturedImage`, `error`
3. **Video Not Playing**: Even with `autoPlay`, video might need explicit `.play()` call
4. **CSS Issue**: Black background (line 206) might be covering video

**Suspected Root Cause**:
Video stream connects successfully, but video element doesn't start rendering. Likely need to:
1. Call `video.play()` after setting `srcObject`
2. Wait for video metadata to load before showing

**Fix Needed**:
```typescript
// After setting srcObject, ensure video plays:
if (videoRef.current) {
  videoRef.current.srcObject = mediaStream;
  await videoRef.current.play();  // ← Missing!
}
```

---

### ❌ Problem: Upload Photo - Can't Select Images

**Location**: [crew-member-details-dialog.tsx:161-177](src/components/crew-member-details-dialog.tsx#L161-L177)

**User Report**:
> "izbaci mi prozor da mogu da ubacim sliku, ali ne mogu ništa da selektujem"

**Current Implementation**:
```typescript
const handleFileUpload = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';  // ← Problem here
  input.onchange = (e: Event) => {
    const file = (e.target as HTMLInputElement)?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditedCrew({ ...editedCrew, avatar: e.target?.result as string });
        toast.success('Photo uploaded successfully');
      };
      reader.readAsDataURL(file);
    }
  };
  input.click();
};
```

**Problem**:
- File picker opens successfully
- But images appear grayed out/disabled and can't be selected
- `accept="image/*"` is too generic and doesn't work reliably on Windows

**Root Cause**:
The `accept="image/*"` MIME type filter doesn't work consistently across all browsers and OS combinations, especially on Windows. Need explicit file extensions.

**Fix Needed**:
```typescript
// Instead of 'image/*', use explicit extensions:
input.accept = '.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg';

// OR use explicit MIME types:
input.accept = 'image/jpeg,image/png,image/gif,image/webp,image/bmp';
```

**Same Problem Exists In**:
- [crew-list.tsx:handleFileUpload](src/components/pages/crew-list.tsx) - also uses `'image/*'`

---

### ❌ Problem: Status Dropdown Should NOT Exist in Forms

**Locations**:
1. Add Crew Dialog: [crew-list.tsx:1107-1121](src/components/pages/crew-list.tsx#L1107-L1121)
2. Edit Crew Sheet: [crew-list.tsx:1411-1425](src/components/pages/crew-list.tsx#L1411-L1425)

**User Requirement**:
> "Status dropdown NE TREBA da postoji kada se dodaje i edituje. Status of duty, on duty i to je to. Možda umjeste toga da postoji leave kalendar kao što i postoji inače."

**Current Implementation**:
Both Add and Edit forms have Status dropdown with options:
```typescript
<Label htmlFor="status">Status</Label>
<Select
  value={formData.status}
  onValueChange={(value: "on-duty" | "off-duty" | "on-leave") => setFormData({ ...formData, status: value })}
>
  <SelectTrigger id="status">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="on-duty">On Duty</SelectItem>
    <SelectItem value="off-duty">Off Duty</SelectItem>
    <SelectItem value="on-leave">On Leave</SelectItem>
  </SelectContent>
</Select>
```

**Why Remove**:
- Status (on-duty/off-duty) is controlled via **Status Toggle button** in crew list
- "On Leave" status is set via **Leave Calendar** in Crew Details Dialog
- Manual status selection in form causes confusion and conflicts

**Fix Needed**:
1. **Remove** Status dropdown from Add Crew Dialog (lines 1107-1121)
2. **Remove** Status dropdown from Edit Crew Sheet (lines 1411-1425)
3. Default new crew members to `status: 'off-duty'`
4. Keep Leave Calendar in Crew Details Dialog for setting "on-leave" status

---

### ❌ Problem: Email is Mandatory in Add Crew Form

**Location**: [crew-list.tsx:1084](src/components/pages/crew-list.tsx#L1084)

**User Requirement**:
> "Email NE TREBA bude mandatory"

**Current Validation**:
```typescript
// Line 204-207
const handleAddCrew = async () => {
  if (!formData.name || !formData.position || !formData.email || !formData.role) {
    toast.error("Please fill in all required fields (Name, Position, Email, Role)");
    return;
  }
```

**Problem**:
- Email is checked in validation (line 205)
- Error message says "Email" is required (line 206)
- But backend schema allows `email` to be optional (nullable)

**Fix Needed**:
```typescript
// Remove email from validation:
if (!formData.name || !formData.position || !formData.role) {
  toast.error("Please fill in all required fields (Name, Position, Role)");
  return;
}
```

Also update field label in UI (line 1084) to show it's optional.

---

### ❌ Problem: "Validation failed" Error When Adding Crew

**Location**: [crew-list.tsx:217-226](src/components/pages/crew-list.tsx#L217-L226) + [backend validators/schemas.ts:60](backend/src/validators/schemas.ts#L60)

**User Report**:
> "Kada završim sa dodavanjem posade i stisnem add crew member, izbaci mi ovu grešku." (Screenshot shows "Validation failed")

**Current Frontend Code**:
```typescript
// Line 217-226
body: JSON.stringify({
  name: formData.name,
  position: formData.position,
  department: formData.department,
  role: formData.role,
  status: formData.status,
  contact: formData.phone || formData.contact || null,  // ✅ Properly handles null
  email: formData.email,  // ⚠️  PROBLEM: Can be empty string ""
  joinDate: new Date().toISOString(),
}),
```

**Backend Validation**:
```typescript
// Line 60 in backend/src/validators/schemas.ts
email: z.string().email('Invalid email').max(100).optional().nullable(),
```

**Root Cause**:
When user leaves email field empty, frontend sends:
```json
{
  "email": ""  // Empty string
}
```

But Zod validator expects:
- Either a **valid email** address
- Or `null` / `undefined` (optional)

Empty string `""` is **NOT** a valid email, so validation fails with "Invalid email" error.

**Why This Happens**:
Line 224: `email: formData.email` sends whatever is in formData.email, including empty string. Should convert empty string to `null` like the `contact` field does (line 223).

**Fix Needed (Frontend)**:
```typescript
// Change line 224 from:
email: formData.email,

// To:
email: formData.email || null,
```

**Alternative Fix (Backend)**:
```typescript
// Or update backend schema to transform empty string to null:
email: z.preprocess(
  (val) => (val === '' ? null : val),
  z.string().email('Invalid email').max(100).optional().nullable()
),
```

---

### ❌ Problem: Edit Button in Quick Actions (Should Be Removed)

**Location**: [crew-list.tsx:912-929](src/components/pages/crew-list.tsx#L912-L929)

**User Requirement**:
> "U quick actions dodavate tri dugmata: 1. Send message 2. Edit 3. Remove. Edit možemo skroz da izbacimo"

**Current Implementation**:
Quick Actions shows 3 buttons:
1. Send Message ✅
2. **Edit** ❌ (opens Edit Sheet - should be removed)
3. Remove ✅

**Why Remove**:
- Clicking on crew member name opens Crew Details Dialog with edit functionality
- Having Edit button in Quick Actions is redundant
- Edit button opens Sheet instead of Details Dialog (wrong behavior)

**Fix Needed**:
Remove Edit button (lines 912-929) from Quick Actions in table:
```typescript
// REMOVE THIS:
<Tooltip>
  <TooltipTrigger asChild>
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={(e) => {
        e.stopPropagation();
        openEdit(crew);
      }}
    >
      <Edit className="h-4 w-4" />
    </Button>
  </TooltipTrigger>
  <TooltipContent>
    <p>Edit</p>
  </TooltipContent>
</Tooltip>
```

---

### ❌ Problem: Edit Button in Crew Details Dialog (Should Be Removed)

**Location**: [crew-member-details-dialog.tsx:788-798](src/components/crew-member-details-dialog.tsx#L788-L798)

**User Requirement**:
> "Takođe možeš dugme edit da izbaciš jer se već nalazi u prozoru kada se klikne na ime."

**Current Implementation**:
Crew Details Dialog shows "Edit Details" button at bottom (lines 788-798)

**Why Remove**:
- User is already IN the details view
- "Edit Details" button just toggles edit mode - confusing UX
- Fields can be edited directly without explicit "Edit" button

**Alternative**:
Keep the edit functionality but remove explicit "Edit Details" button. Instead:
- Show editable fields directly in view mode
- Or use inline edit buttons next to each section

**Fix Needed**:
Remove "Edit Details" button from Quick Actions section (lines 788-798):
```typescript
// REMOVE THIS:
<Button
  variant="outline"
  size="sm"
  onClick={() => {
    setEditedCrew(crewMember);
    setIsEditing(true);
  }}
>
  <Edit className="h-4 w-4 mr-2" />
  Edit Details
</Button>
```

---

**Generated**: 2025-10-30
**Auditor**: Claude
**Status**: ✅ COMPLETE - All Problems Documented
**Total Problems Found**: 13
**Next Phase**: Awaiting user "POČNI" command to begin fixes

