# 🔧 BACKEND TESTING CHECKLIST

**Goal:** Backend 100% production-ready for METSTRADE demo

---

## ✅ **AUTHENTICATION & SESSIONS:**

### **Test Cases:**
- [ ] Login with valid credentials → Returns JWT token
- [ ] Login with invalid credentials → Returns 401 error
- [ ] API call with valid token → Works
- [ ] API call with invalid token → Returns 401 error
- [ ] API call with expired token → Returns 401 error
- [ ] Token persists after page refresh
- [ ] Logout clears token and session

### **Endpoints:**
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me` (current user info)

### **Test Command:**
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Should return:
# {
#   "success": true,
#   "data": {
#     "user": {...},
#     "token": "eyJhbGci..."
#   }
# }
```

---

## ✅ **SERVICE REQUESTS API:**

### **Test Cases:**
- [ ] GET `/api/service-requests` - List all requests
- [ ] GET `/api/service-requests/:id` - Get single request
- [ ] POST `/api/service-requests` - Create new request
- [ ] PUT `/api/service-requests/:id` - Update request
- [ ] POST `/api/service-requests/:id/accept` - Assign to crew
- [ ] POST `/api/service-requests/:id/complete` - Mark completed
- [ ] POST `/api/service-requests/:id/cancel` - Cancel request

### **Test Command:**
```bash
# Create service request
curl -X POST http://localhost:3001/api/service-requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "guestId": "guest-123",
    "locationId": "loc-456",
    "priority": "normal",
    "notes": "Test request"
  }'
```

---

## ✅ **LOCATIONS API:**

### **Test Cases:**
- [ ] GET `/api/locations` - List all locations
- [ ] GET `/api/locations/:id` - Get single location
- [ ] POST `/api/locations` - Create new location
- [ ] PUT `/api/locations/:id` - Update location
- [ ] DELETE `/api/locations/:id` - Delete location
- [ ] Image upload works
- [ ] DND (Do Not Disturb) toggle works

### **Test Command:**
```bash
# Get all locations
curl http://localhost:3001/api/locations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ✅ **GUESTS API:**

### **Test Cases:**
- [ ] GET `/api/guests` - List all guests
- [ ] GET `/api/guests/:id` - Get single guest
- [ ] POST `/api/guests` - Create new guest
- [ ] PUT `/api/guests/:id` - Update guest
- [ ] DELETE `/api/guests/:id` - Delete guest
- [ ] Guest profile with dietary restrictions works
- [ ] Guest location assignment works

### **Test Command:**
```bash
# Create guest
curl -X POST http://localhost:3001/api/guests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "type": "vip",
    "status": "onboard"
  }'
```

---

## ✅ **VOICE-TO-TEXT API:**

### **Test Cases:**
- [ ] POST `/api/transcribe` - Upload audio, get transcript
- [ ] Whisper API integration works
- [ ] Audio file upload (WAV, MP3, WebM)
- [ ] Transcript returned correctly
- [ ] Original audio URL stored

### **Test Command:**
```bash
# Transcribe audio
curl -X POST http://localhost:3001/api/transcribe \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "audio=@test-audio.mp3"
```

---

## ✅ **CREW/DUTY ASSIGNMENT API:**

### **Test Cases:**
- [ ] GET `/api/crew` - List all crew members
- [ ] POST `/api/crew` - Create crew member
- [ ] PUT `/api/crew/:id` - Update crew member
- [ ] DELETE `/api/crew/:id` - Delete crew member
- [ ] Auto-assign duty based on shift
- [ ] On-duty/Off-duty status works

### **Test Command:**
```bash
# Get crew list
curl http://localhost:3001/api/crew \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ✅ **DEVICES API:**

### **Test Cases:**
- [ ] GET `/api/devices` - List all devices
- [ ] GET `/api/devices/:id` - Get single device
- [ ] POST `/api/devices` - Register new device
- [ ] PUT `/api/devices/:id` - Update device
- [ ] DELETE `/api/devices/:id` - Delete device
- [ ] Device status (battery, signal) works
- [ ] Location assignment works

---

## ✅ **USER PREFERENCES API:**

### **Test Cases:**
- [ ] GET `/api/user-preferences` - Get user prefs
- [ ] PUT `/api/user-preferences/dashboard` - Save layout
- [ ] PUT `/api/user-preferences/theme` - Change theme
- [ ] DELETE `/api/user-preferences/dashboard` - Reset to default

---

## 🔄 **REAL-TIME FEATURES:**

### **Test Cases:**
- [ ] WebSocket connection establishes
- [ ] Service request created → All clients notified
- [ ] Service request accepted → Status updates real-time
- [ ] Service request completed → Status updates real-time

---

## 💾 **DATABASE OPERATIONS:**

### **Test Cases:**
- [ ] Prisma migrations work (`npx prisma migrate dev`)
- [ ] Database seed works (`npm run seed`)
- [ ] Database reset works (`npx prisma migrate reset`)
- [ ] Backup script works
- [ ] Restore script works

### **Commands:**
```bash
cd backend

# Run migrations
npx prisma migrate dev

# Seed database
npm run seed

# Reset database
npx prisma migrate reset --force
```

---

## 🚨 **ERROR HANDLING:**

### **Test Cases:**
- [ ] Invalid auth token → 401 Unauthorized
- [ ] Missing required fields → 400 Bad Request
- [ ] Resource not found → 404 Not Found
- [ ] Duplicate entry → 409 Conflict
- [ ] Server error → 500 Internal Server Error
- [ ] All errors return proper JSON format

---

## 📊 **PERFORMANCE:**

### **Test Cases:**
- [ ] API response time < 200ms
- [ ] Database queries optimized (use indexes)
- [ ] No N+1 query problems
- [ ] Large datasets (200+ locations) work smoothly

---

## 🔐 **SECURITY:**

### **Test Cases:**
- [ ] JWT secret is strong
- [ ] Passwords are hashed (bcrypt)
- [ ] SQL injection protection (Prisma handles this)
- [ ] CORS configured properly
- [ ] Rate limiting works (prevent brute force)

---

## 📝 **DOCUMENTATION:**

### **Required:**
- [ ] API documentation (Swagger/OpenAPI)
- [ ] README with setup instructions
- [ ] .env.example file
- [ ] Database schema documentation
- [ ] Error codes reference

---

## ✅ **FINAL CHECKLIST:**

**Before declaring backend "production-ready":**
- [ ] All critical endpoints work 100%
- [ ] Authentication is rock-solid
- [ ] Database migrations are stable
- [ ] Error handling is graceful
- [ ] Performance is acceptable
- [ ] Security is tight
- [ ] Documentation is complete
- [ ] Demo data seed script works
- [ ] Tested on production-like environment

---

## 🚀 **TESTING WORKFLOW:**

### **Daily Testing Routine:**
1. Start backend (`npm run dev`)
2. Run health check (`curl http://localhost:3001/api/health`)
3. Test authentication (login/logout)
4. Test 3-5 critical endpoints
5. Check logs for errors
6. Fix any issues immediately

### **Weekly Deep Test:**
1. Full API test suite
2. Database migration test
3. Performance testing
4. Security audit
5. Documentation update

---

## 📅 **TIMELINE:**

| Day | Focus | Goal |
|-----|-------|------|
| **Oct 22** | Auth + Service Requests | Token persistence fixed |
| **Oct 23** | Voice-to-text + Real-time | Notifications working |
| **Oct 24** | Crew + Duty Assignment | Auto-assign working |
| **Oct 25** | Devices API | Device Manager ready |
| **Oct 26** | ESP32 Integration | Hardware → Backend |
| **Oct 27** | Full Testing | All endpoints stable |
| **Oct 28** | Documentation + Deploy | Production-ready! |

---

**FOCUS:** Backend MUST work flawlessly. Frontend can wait!

**REMEMBER:** Demo impressed them with voice-to-text and duty assignment. Make sure those are ROCK-SOLID! 💪
