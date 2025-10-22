# Backend/Database Test Plan

**Date:** Oct 22, 2025  
**Goal:** Test that Locations, Guests, and Service Requests work with PostgreSQL database

---

## 🎯 **Pre-Test Checklist:**

### **1. Backend Running:**
```bash
cd backend
npm run dev
```
**Expected:** Server running on http://localhost:3001

### **2. Database Seeded:**
```bash
cd backend
npm run seed
```
**Expected:** Database has test data (users, locations, guests, crew)

### **3. Frontend Running:**
```bash
npm run dev
```
**Expected:** Frontend on http://localhost:5173

---

## 🧪 **Test Suite 1: Locations API**

### **Test 1.1: Get All Locations**
**Action:**
1. Login to app (admin / password)
2. Open DevTools → Network tab
3. Navigate to Locations page

**Expected:**
- ✅ Network request: `GET http://localhost:3001/api/locations`
- ✅ Response: `{ success: true, data: [...], count: N }`
- ✅ Locations displayed in UI
- ❌ NO localStorage.getItem('obedio-locations') in console

**Verify:**
```sql
-- Check database directly
SELECT * FROM "Location" ORDER BY name ASC;
```

---

### **Test 1.2: Create Location**
**Action:**
1. Click "Add Location" button
2. Fill form:
   - Name: "Test Cabin 999"
   - Type: "cabin"
   - Floor: "Main Deck"
3. Submit

**Expected:**
- ✅ Network request: `POST http://localhost:3001/api/locations`
- ✅ Response: `{ success: true, data: { id, name, ... } }`
- ✅ New location appears in list
- ❌ NO localStorage.setItem in console

**Verify:**
```sql
SELECT * FROM "Location" WHERE name = 'Test Cabin 999';
```

---

### **Test 1.3: Update Location**
**Action:**
1. Edit "Test Cabin 999"
2. Change name to "Test Cabin 999 Updated"
3. Save

**Expected:**
- ✅ Network request: `PUT http://localhost:3001/api/locations/{id}`
- ✅ Response: `{ success: true, data: { ... } }`
- ✅ Name updated in UI

**Verify:**
```sql
SELECT * FROM "Location" WHERE name = 'Test Cabin 999 Updated';
```

---

### **Test 1.4: Delete Location**
**Action:**
1. Delete "Test Cabin 999 Updated"
2. Confirm deletion

**Expected:**
- ✅ Network request: `DELETE http://localhost:3001/api/locations/{id}`
- ✅ Location removed from list

**Verify:**
```sql
SELECT * FROM "Location" WHERE name LIKE 'Test Cabin 999%';
-- Should return 0 rows
```

---

### **Test 1.5: Backend Down Scenario**
**Action:**
1. Stop backend server (Ctrl+C)
2. Refresh frontend
3. Try to view locations

**Expected:**
- ✅ Error message shown (not silent fallback)
- ✅ User knows backend is down
- ❌ NO localStorage fallback

**Verify:**
- Console should show fetch error
- UI should show "Cannot connect to server" message

---

## 🧪 **Test Suite 2: Guests API**

### **Test 2.1: Get All Guests**
**Action:**
1. Navigate to Guests page
2. Watch Network tab

**Expected:**
- ✅ Network request: `GET http://localhost:3001/api/guests?page=1&limit=25`
- ✅ Response: `{ data: [...], pagination: {...} }`
- ✅ Guests displayed in table
- ❌ NO localStorage.getItem('obedio-guests')

**Verify:**
```sql
SELECT * FROM "Guest" ORDER BY "firstName" ASC;
```

---

### **Test 2.2: Search Guests**
**Action:**
1. Type "John" in search box
2. Watch Network tab

**Expected:**
- ✅ Network request: `GET /api/guests?q=John&page=1&limit=25`
- ✅ Filtered results shown
- ✅ Backend does filtering (not frontend)

---

### **Test 2.3: Filter by Status**
**Action:**
1. Select "Onboard" status filter
2. Watch Network tab

**Expected:**
- ✅ Network request: `GET /api/guests?status=onboard&page=1&limit=25`
- ✅ Only onboard guests shown

**Verify:**
```sql
SELECT * FROM "Guest" WHERE status = 'onboard';
```

---

### **Test 2.4: Create Guest**
**Action:**
1. Click "Add Guest"
2. Fill form:
   - First Name: "Test"
   - Last Name: "Guest"
   - Type: "guest"
   - Status: "expected"
   - Cabin: Select a cabin
   - Check-in: Tomorrow
   - Check-out: Next week
3. Submit

**Expected:**
- ✅ Network request: `POST http://localhost:3001/api/guests`
- ✅ Response: `{ success: true, data: { id, ... } }`
- ✅ New guest in list
- ❌ NO localStorage.setItem

**Verify:**
```sql
SELECT * FROM "Guest" WHERE "firstName" = 'Test' AND "lastName" = 'Guest';
```

---

### **Test 2.5: Update Guest**
**Action:**
1. Edit "Test Guest"
2. Change status to "onboard"
3. Save

**Expected:**
- ✅ Network request: `PUT http://localhost:3001/api/guests/{id}`
- ✅ Status updated in UI

**Verify:**
```sql
SELECT * FROM "Guest" WHERE "firstName" = 'Test' AND status = 'onboard';
```

---

### **Test 2.6: Delete Guest**
**Action:**
1. Delete "Test Guest"
2. Confirm

**Expected:**
- ✅ Network request: `DELETE http://localhost:3001/api/guests/{id}`
- ✅ Guest removed

**Verify:**
```sql
SELECT * FROM "Guest" WHERE "firstName" = 'Test' AND "lastName" = 'Guest';
-- Should return 0 rows
```

---

## 🧪 **Test Suite 3: Service Requests API**

### **Test 3.1: Get All Service Requests**
**Action:**
1. Navigate to Service Requests page (or Dashboard)
2. Watch Network tab

**Expected:**
- ✅ Network request: `GET http://localhost:3001/api/service-requests`
- ✅ Response: `{ success: true, data: [...], pagination: {...} }`
- ✅ Service requests displayed
- ❌ NO localStorage.getItem('obedio-service-requests')

**Verify:**
```sql
SELECT * FROM "ServiceRequest" ORDER BY "createdAt" DESC;
```

---

### **Test 3.2: Create Service Request (Simulated Button Press)**
**Action:**
1. Use Button Simulator widget OR
2. Use API directly:

```bash
curl -X POST http://localhost:3001/api/service-requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "locationId": "SOME_LOCATION_ID",
    "type": "call",
    "priority": "normal",
    "description": "Test service request"
  }'
```

**Expected:**
- ✅ Request saved to database
- ✅ Frontend shows new request (after refetch)

**Verify:**
```sql
SELECT * FROM "ServiceRequest" WHERE description = 'Test service request';
```

---

### **Test 3.3: Accept Service Request**
**Action:**
1. View open service requests
2. Click "Accept" on one request
3. Select crew member

**Expected:**
- ✅ Network request: `PUT /api/service-requests/{id}/accept`
- ✅ Status changes to "accepted"
- ✅ Crew member assigned

**Verify:**
```sql
SELECT * FROM "ServiceRequest" 
WHERE id = 'REQUEST_ID' 
  AND status = 'accepted' 
  AND "assignedToId" IS NOT NULL;
```

---

### **Test 3.4: Complete Service Request**
**Action:**
1. Accept a request (if not already)
2. Click "Complete"

**Expected:**
- ✅ Network request: `PUT /api/service-requests/{id}/complete`
- ✅ Status changes to "completed"
- ✅ completedAt timestamp set

**Verify:**
```sql
SELECT * FROM "ServiceRequest" 
WHERE id = 'REQUEST_ID' 
  AND status = 'completed' 
  AND "completedAt" IS NOT NULL;
```

---

### **Test 3.5: ESP32 Button Scenario (Backend Only)**

**Scenario:** Button pressed when frontend is NOT running

**Action:**
1. Stop frontend (Ctrl+C)
2. Backend still running
3. Send request via API (simulating ESP32):

```bash
curl -X POST http://localhost:3001/api/service-requests \
  -H "Content-Type: application/json" \
  -d '{
    "locationId": "cabin-123",
    "type": "call",
    "priority": "normal",
    "description": "Guest pressed button in Cabin 123"
  }'
```

**Expected:**
- ✅ Request saved to database
- ✅ No frontend running = No problem!

4. Start frontend again
5. Login
6. Navigate to Service Requests

**Expected:**
- ✅ Request appears in list
- ✅ Created while frontend was down

**Verify:**
```sql
SELECT * FROM "ServiceRequest" 
WHERE description = 'Guest pressed button in Cabin 123'
ORDER BY "createdAt" DESC;
```

**This proves:** ✅ Backend/Database works independently of frontend!

---

## 🧪 **Test Suite 4: Multi-Device Scenario**

### **Test 4.1: Two Browser Windows**
**Action:**
1. Open app in Chrome
2. Open app in Firefox (or Incognito)
3. Login to both (same user)
4. Create a location in Chrome
5. Refresh Firefox

**Expected:**
- ✅ Location appears in Firefox
- ✅ Both see same data (from database)
- ✅ NO localStorage sync issues

---

### **Test 4.2: Mobile Simulation**
**Action:**
1. Desktop: Create a guest
2. DevTools: Switch to mobile view
3. Refresh

**Expected:**
- ✅ Guest visible on mobile
- ✅ Same database = Same data

---

## 📊 **Test Results Template:**

```markdown
## Test Results - [Date]

### Locations API:
- [ ] Get All: ✅ Pass / ❌ Fail
- [ ] Create: ✅ Pass / ❌ Fail
- [ ] Update: ✅ Pass / ❌ Fail
- [ ] Delete: ✅ Pass / ❌ Fail
- [ ] Backend Down: ✅ Pass / ❌ Fail

### Guests API:
- [ ] Get All: ✅ Pass / ❌ Fail
- [ ] Search: ✅ Pass / ❌ Fail
- [ ] Filter: ✅ Pass / ❌ Fail
- [ ] Create: ✅ Pass / ❌ Fail
- [ ] Update: ✅ Pass / ❌ Fail
- [ ] Delete: ✅ Pass / ❌ Fail

### Service Requests API:
- [ ] Get All: ✅ Pass / ❌ Fail
- [ ] Create: ✅ Pass / ❌ Fail
- [ ] Accept: ✅ Pass / ❌ Fail
- [ ] Complete: ✅ Pass / ❌ Fail
- [ ] ESP32 Scenario: ✅ Pass / ❌ Fail

### Multi-Device:
- [ ] Two browsers: ✅ Pass / ❌ Fail
- [ ] Mobile view: ✅ Pass / ❌ Fail

**Notes:**
[Any issues or observations]
```

---

## 🚨 **Common Issues & Fixes:**

### **Issue 1: "401 Unauthorized"**
**Cause:** JWT token expired or invalid

**Fix:**
1. Logout and login again
2. Check token in localStorage: `localStorage.getItem('obedio-auth-token')`

---

### **Issue 2: "Cannot connect to server"**
**Cause:** Backend not running

**Fix:**
```bash
cd backend
npm run dev
```

---

### **Issue 3: "Database connection failed"**
**Cause:** PostgreSQL not running

**Fix:**
```bash
# Check if PostgreSQL is running
# Windows: Services → PostgreSQL
# Or restart backend after starting PostgreSQL
```

---

### **Issue 4: "No data showing"**
**Cause:** Database empty

**Fix:**
```bash
cd backend
npm run seed
```

---

## ✅ **Success Criteria:**

### **ALL of these must be TRUE:**

1. ✅ Locations CRUD works via API
2. ✅ Guests CRUD works via API
3. ✅ Service Requests CRUD works via API
4. ✅ NO localStorage fallbacks triggered
5. ✅ Backend down shows proper error (not silent fallback)
6. ✅ ESP32 button scenario works (backend-only)
7. ✅ Multi-device sync works (same database)
8. ✅ Database persists after server restart

---

**Test Status:** ⏳ Ready to execute  
**Tester:** [Your Name]  
**Date:** [Test Date]
