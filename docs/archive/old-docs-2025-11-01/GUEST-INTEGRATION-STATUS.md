# GUEST MODULE - Backend Integration Status

**Date**: 2025-10-31
**Status**: ⚠️ PARTIALLY INTEGRATED - Schema Missing Fields

---

## ✅ 1. GUEST CRUD OPERATIONS

### Backend API (backend/src/routes/guests.ts)
**Status**: ✅ FULLY IMPLEMENTED

All endpoints are implemented and functional:

| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/api/guests` | GET | ✅ Working | List with filtering, sorting, pagination |
| `/api/guests/stats` | GET | ✅ Working | KPI statistics (onboard, expected, vip, dietary alerts) |
| `/api/guests/meta` | GET | ✅ Working | Filter metadata (statuses, types, diets, allergies, cabins) |
| `/api/guests` | POST | ✅ Working | Create new guest |
| `/api/guests/:id` | GET | ✅ Working | Get single guest with service requests |
| `/api/guests/:id` | PUT | ✅ Working | Update guest |
| `/api/guests/:id` | DELETE | ✅ Working | Delete guest |

**Features**:
- Server-side filtering: q, status, type, diet, allergy, cabin, vip
- Server-side sorting: name, checkInDate
- Pagination: page, limit
- Raw SQL queries for array operations (allergies, dietary)

### Frontend Integration (src/services/guests.ts)
**Status**: ✅ FULLY INTEGRATED

- `GuestsService` class with all API methods
- JWT authentication with `Authorization: Bearer` header
- Proper error handling
- CSV export functionality

### React Query Hooks
**Status**: ✅ FULLY INTEGRATED

- `useGuests(params)` - List with filters
- `useGuestsStats()` - KPI stats
- `useGuestsMeta()` - Filter metadata
- `useGuest(id)` - Single guest
- `useGuestMutations()` - CRUD mutations with automatic cache invalidation

---

## ⚠️ 2. DATABASE SCHEMA ISSUES

### MISSING FIELDS IN PRISMA SCHEMA

The Prisma schema is **missing critical fields** that the frontend expects:

| Field | Type | Frontend Uses | Schema Has | Priority |
|-------|------|---------------|------------|----------|
| `checkInTime` | String | ✅ Yes | ❌ No | HIGH |
| `checkOutTime` | String | ✅ Yes | ❌ No | HIGH |
| `foodDislikes` | String[] | ✅ Yes | ❌ No | HIGH |
| `favoriteFoods` | String[] | ✅ Yes | ❌ No | HIGH |
| `favoriteDrinks` | String[] | ✅ Yes | ❌ No | HIGH |
| `specialOccasion` | String? | ✅ Yes | ❌ No | MEDIUM |
| `specialOccasionDate` | DateTime? | ✅ Yes | ❌ No | MEDIUM |
| `specialRequests` | String? | ✅ Yes | ❌ No | HIGH |
| `vipNotes` | String? | ✅ Yes | ❌ No | HIGH |
| `crewNotes` | String? | ✅ Yes | ❌ No | HIGH |
| `contactPerson` | Json? | ✅ Yes | ❌ No | MEDIUM |
| `createdBy` | String? | ✅ Yes | ❌ No | LOW |
| `cabin` | String? | ✅ Yes (legacy) | ❌ No | LOW |

### Current Schema Fields (backend/prisma/schema.prisma)

```prisma
model Guest {
  id             String   @id @default(cuid())
  firstName      String
  lastName       String
  preferredName  String?
  photo          String?
  type           String   @default("guest")
  status         String   @default("onboard")
  nationality    String?
  languages      String[] @default([])
  passportNumber String?
  locationId     String?
  doNotDisturb   Boolean  @default(false)

  // Accommodation & Check-in Info
  checkInDate    DateTime?
  checkOutDate   DateTime?

  // Dietary & Medical
  allergies              String[] @default([])
  dietaryRestrictions    String[] @default([])
  medicalConditions      String[] @default([])

  // Preferences & Notes
  preferences            String?
  notes                  String?

  // Emergency Contact
  emergencyContactName   String?
  emergencyContactPhone  String?
  emergencyContactRelation String?

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  location        Location?        @relation(fields: [locationId], references: [id])
  serviceRequests ServiceRequest[]
  activityLogs    ActivityLog[]
}
```

---

## ⚠️ 3. VALIDATOR ISSUES

### Current Validator (backend/src/validators/schemas.ts)

The `CreateGuestSchema` validator is **missing the same fields** as the Prisma schema:

```typescript
export const CreateGuestSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  preferredName: z.string().max(50).optional().nullable(),
  photo: z.string().url().optional().nullable(),
  type: z.enum(['owner', 'vip', 'guest', 'partner', 'family']).default('guest'),
  status: z.enum(['expected', 'onboard', 'ashore', 'departed']).default('onboard'),
  nationality: z.string().max(50).optional().nullable(),
  languages: z.array(z.string()).optional().default([]),
  passportNumber: z.string().max(50).optional().nullable(),
  locationId: z.string().optional().nullable(),
  doNotDisturb: z.boolean().optional().default(false),

  // Dates
  checkInDate: z.string().datetime().optional().nullable(),
  checkOutDate: z.string().datetime().optional().nullable(),

  // Arrays
  allergies: z.array(z.string()).optional().default([]),
  dietaryRestrictions: z.array(z.string()).optional().default([]),
  medicalConditions: z.array(z.string()).optional().default([]),

  // Text fields
  preferences: z.string().max(2000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),

  // Emergency contact
  emergencyContactName: z.string().max(100).optional().nullable(),
  emergencyContactPhone: z.string().max(50).optional().nullable(),
  emergencyContactRelation: z.string().max(50).optional().nullable(),
});
```

**Missing in validator**:
- `checkInTime`, `checkOutTime`
- `foodDislikes[]`, `favoriteFoods[]`, `favoriteDrinks[]`
- `specialOccasion`, `specialOccasionDate`
- `specialRequests`, `vipNotes`, `crewNotes`
- `contactPerson`
- `createdBy`, `cabin`

---

## ✅ 4. FRONTEND COMPONENTS STATUS

### Main Components
**Status**: ✅ FULLY FUNCTIONAL

| Component | Path | Status | Features |
|-----------|------|--------|----------|
| Guests List | `src/components/pages/guests-list.tsx` | ✅ Working | Table, filters, pagination, bulk actions |
| Guest Form | `src/components/guest-form-dialog.tsx` | ✅ Working | 4-tab form (Basic, Accommodation, Dietary, Notes) |
| Guest Details | `src/components/guest-details-dialog.tsx` | ✅ Working | Read-only view with all info |
| Guest Card View | `src/components/guest-card-view.tsx` | ✅ Working | Grid layout alternative |
| Guests Toolbar | `src/components/guests/GuestsToolbar.tsx` | ✅ Working | Search, filters, quick toggles, sort |

### Widgets
| Widget | Path | Status | Features |
|--------|------|--------|----------|
| Guest Status | `src/components/guest-status-widget.tsx` | ✅ Working | Onboard guests by cabin |
| DND Widget | `src/components/dnd-guests-widget.tsx` | ✅ Working | Do Not Disturb tracking |
| DND KPI Card | `src/components/dnd-guests-kpi-card.tsx` | ✅ Working | Compact DND display |

---

## ⚠️ 5. DATA PERSISTENCE ISSUES

### Current Behavior

When users fill out the **Guest Form**, these fields are sent to the API but **NOT SAVED** to database:

1. **Check-in/Check-out Times** (checkInTime, checkOutTime)
   - Form has time pickers
   - Data sent to API
   - ❌ Not saved - fields don't exist in database

2. **Dietary Preferences** (foodDislikes, favoriteFoods, favoriteDrinks)
   - Form has dynamic array inputs
   - Data sent to API
   - ❌ Not saved - fields don't exist in database

3. **Special Occasions** (specialOccasion, specialOccasionDate)
   - Form has text input + date picker
   - Data sent to API
   - ❌ Not saved - fields don't exist in database

4. **Notes Categories** (specialRequests, vipNotes, crewNotes)
   - Form has separate text areas for each
   - Data sent to API
   - ❌ Not saved - fields don't exist in database

5. **Contact Person** (contactPerson object)
   - Form has name, phone, email, role inputs
   - Data sent to API
   - ❌ Not saved - fields don't exist in database

### Impact

Users can enter this data, but after page refresh or when viewing the guest later, **all this data is lost** because it's not persisted to the database.

---

## ❌ 6. GUEST ASSIGNMENTS

**Status**: ❌ NOT IMPLEMENTED

There is no "Guest Assignment" system in the current implementation. Guests are only linked to locations via `locationId`.

**What might be needed**:
- Assign crew members to specific guests (like a personal steward/stewardess)
- Track which crew member is responsible for which guest
- Service request auto-assignment based on guest assignments

**Database**: No `GuestAssignment` model exists.

---

## ✅ 7. SERVICE REQUESTS INTEGRATION

**Status**: ✅ WORKING

Service requests are fully integrated with guests:

### Database Relationship
```prisma
model ServiceRequest {
  guestId     String?
  guest       Guest? @relation(fields: [guestId], references: [id])
  // ... other fields
}

model Guest {
  serviceRequests ServiceRequest[]
  // ... other fields
}
```

### Backend Integration
- GET `/api/guests/:id` includes `serviceRequests: true`
- Service requests can be filtered by `guestId`
- Guest name displayed in service requests

### Frontend Integration
- Guest Details Dialog shows related service requests
- Service Request Panel allows selecting guest
- Guest name auto-filled when creating request from guest context

---

## 📋 ACTION ITEMS

### Priority 1: Fix Database Schema
- [ ] Add missing fields to Prisma schema
- [ ] Create and apply database migration
- [ ] Test schema changes

### Priority 2: Update Validators
- [ ] Add missing fields to `CreateGuestSchema`
- [ ] Add missing fields to `UpdateGuestSchema`
- [ ] Test validation

### Priority 3: Update Frontend Types
- [ ] Ensure frontend types match schema
- [ ] Update Guest interface if needed
- [ ] Add JSDoc comments for new fields

### Priority 4: Test CRUD Operations
- [ ] Create guest with all fields
- [ ] Update guest with all fields
- [ ] Verify data persistence
- [ ] Test filtering with new fields

### Priority 5: Documentation
- [ ] Update API documentation
- [ ] Update developer guide
- [ ] Add migration notes

---

## 🔄 COMPARISON WITH CREW MODULE

Based on the recent Crew integration work:

| Feature | Crew Module | Guest Module |
|---------|-------------|--------------|
| CRUD API | ✅ Complete | ✅ Complete |
| Database Schema | ✅ Complete | ⚠️ Missing fields |
| Validators | ✅ Complete | ⚠️ Missing fields |
| Frontend Integration | ✅ Complete | ✅ Complete |
| Data Persistence | ✅ Working | ⚠️ Partial - some fields not saved |
| Assignments | ✅ Duty Roster | ❌ Not implemented |
| Change Logs | ✅ Implemented | ❌ Not implemented |

---

## 📝 NOTES

1. **Backend API is solid** - all endpoints work correctly
2. **Frontend is solid** - all UI components work correctly
3. **Main issue**: Schema and validators don't match frontend expectations
4. **User Impact**: Data loss on fields that don't exist in database
5. **Fix Complexity**: LOW - just need to add missing fields to schema

---

## ✅ RECOMMENDED APPROACH

1. **Update Prisma Schema** - Add all missing fields
2. **Create Migration** - Apply changes to database
3. **Update Validators** - Add validation for new fields
4. **Test End-to-End** - Create/Update/Read guest with all fields
5. **Optional**: Add Guest Assignment system (like Crew assignments)
6. **Optional**: Add Guest Change Logs (like Crew change logs)

**Estimated Time**: 30-60 minutes
**Risk**: LOW (additive changes only, no breaking changes)
