# 🎯 METSTRADE 2025 - 24 DAYS ROADMAP

**Date:** Oct 22, 2025  
**Deadline:** Nov 15, 2025 (METSTRADE Amsterdam)  
**Days Remaining:** 24 days  
**Status:** Sprint Mode 🚀

---

## 📅 **TIMELINE:**

| Week | Dates | Focus | Goal |
|------|-------|-------|------|
| **Week 1** | Oct 22-28 (7 days) | **CORE FEATURES** | Functional demo |
| **Week 2** | Oct 29 - Nov 4 (7 days) | **HARDWARE INTEGRATION** | ESP32 buttons working |
| **Week 3** | Nov 5-11 (7 days) | **POLISH & TESTING** | Production-ready |
| **Week 4** | Nov 12-14 (3 days) | **FINAL PREP** | Travel & setup |

---

## 🎯 **CRITICAL PATH (Must-Have for Demo):**

### **WEEK 1: CORE FEATURES (Oct 22-28)**

#### **Day 1-2: Backend Stability** ⭐⭐⭐
- [ ] Fix authentication issues (JWT token persistence)
- [ ] Test all API endpoints (Locations, Guests, Service Requests)
- [ ] Database migrations working reliably
- [ ] User preferences saving/loading
- **Deliverable:** Backend 100% stable, no crashes

#### **Day 3-4: Service Request Flow** ⭐⭐⭐
- [ ] Button simulator → Service Request → Notification
- [ ] Accept/Complete workflow smooth
- [ ] Real-time updates (WebSocket or polling)
- [ ] Priority handling (normal/urgent/emergency)
- **Deliverable:** Complete butler call workflow working

#### **Day 5-6: Dashboard Polish** ⭐⭐
- [ ] Serving Now widget clean & functional
- [ ] Guest Status widget with real data
- [ ] Duty Timer accurate
- [ ] No hardcoded data anywhere!
- **Deliverable:** Dashboard impressive for demo

#### **Day 7: Testing & Bug Fixes** ⭐⭐⭐
- [ ] Test all pages (Dashboard, Locations, Guests, Service Requests)
- [ ] Fix critical bugs
- [ ] Performance optimization
- [ ] Create demo data seed script
- **Deliverable:** Smooth, reliable demo

---

### **WEEK 2: HARDWARE + MOBILE (Oct 29 - Nov 4)**

#### **Day 8-9: ESP32 Smart Button - Phase 1** ⭐⭐⭐
- [ ] MQTT broker setup (local or cloud)
- [ ] ESP32 firmware basic button press → MQTT publish
- [ ] Backend MQTT client listening
- [ ] Button press creates service request
- **Deliverable:** Physical button working!

#### **Day 10-11: Mobile App Foundation** ⭐⭐
**Option A: React Native (Faster, Recommended)**
- [ ] React Native project setup
- [ ] API service integration (reuse web hooks!)
- [ ] Authentication screen (login with existing backend)
- [ ] Service requests list view
- **Deliverable:** Basic mobile app connecting to backend

**Option B: Native iOS (More polished, but slower)**
- [ ] SwiftUI project setup
- [ ] API client (Alamofire)
- [ ] JWT authentication
- [ ] Service requests view
- **Deliverable:** iOS app prototype

#### **Day 12-13: Mobile App Core Features** ⭐⭐
- [ ] Push notifications setup (FCM for Android, APNS for iOS)
- [ ] Accept/Complete service request buttons
- [ ] Real-time updates (polling or WebSocket)
- [ ] Guest/Location info display
- **Deliverable:** Functional mobile app for demo

#### **Day 14: Watch App Prototype** ⭐
- [ ] Apple Watch companion app (SwiftUI)
- [ ] Notification on wrist when button pressed
- [ ] Quick action buttons (Accept, Complete)
- [ ] Haptic feedback for urgent requests
- **Deliverable:** Watch app showing "crew on the go" vision

---

### **WEEK 3: POLISH & TESTING (Nov 5-11)**

#### **Day 15-16: UI/UX Polish** ⭐⭐
- [ ] Animations smooth
- [ ] Loading states professional
- [ ] Error handling graceful
- [ ] Mobile-responsive (show on tablet during demo)
- **Deliverable:** Professional, polished UI

#### **Day 17-18: Demo Script & Storytelling** ⭐⭐⭐
- [ ] Write demo script (5-minute pitch)
- [ ] Prepare demo data (realistic guests, locations)
- [ ] Practice demo flow
- [ ] Screenshot/video backup if live demo fails
- **Deliverable:** Confident demo presentation

#### **Day 19-20: Production Deployment** ⭐⭐
- [ ] Deploy backend to cloud (Heroku/Railway/DigitalOcean)
- [ ] Deploy frontend to Vercel/Netlify
- [ ] Domain name setup (obedio.com or demo.obedio.com)
- [ ] HTTPS working
- **Deliverable:** Live, accessible demo URL

#### **Day 21: Final Testing & Bug Bash** ⭐⭐⭐
- [ ] Test entire system end-to-end
- [ ] Fix all critical bugs
- [ ] Performance optimization
- [ ] Backup plan for internet issues
- **Deliverable:** Production-ready system

---

### **WEEK 4: FINAL PREP (Nov 12-14)**

#### **Day 22: Marketing Materials** ⭐⭐
- [ ] Print brochures/flyers
- [ ] Business cards
- [ ] Booth banner design
- [ ] Product demo video (backup)
- **Deliverable:** Professional marketing materials

#### **Day 23: Travel & Setup** ⭐
- [ ] Travel to Amsterdam
- [ ] Booth setup
- [ ] Hardware testing at booth
- [ ] Internet connectivity test
- **Deliverable:** Booth ready

#### **Day 24: METSTRADE Day 1** 🎉
- [ ] Live demo to visitors
- [ ] Collect leads
- [ ] Network with potential clients
- [ ] Show ESP32 buttons working!
- **Deliverable:** SUCCESSFUL DEMO! 🚀

---

## 🚨 **UPDATED PRIORITIES (Realistic Assessment):**

### **ALREADY WORKING (Just Need Testing):**
- ✅ **Voice-to-text** - Backend ready, just test it!
- ✅ **Backend API** - All endpoints functional
- ✅ **Database** - Production-ready schema
- ✅ **Authentication** - JWT working (just fix token persistence)

### **HIGH PRIORITY (Must Have for Demo):**
- ⭐⭐⭐ Service Requests (butler call system) - **CORE DEMO**
- ⭐⭐⭐ Locations management - **ESSENTIAL**
- ⭐⭐⭐ Guest management - **ESSENTIAL**
- ⭐⭐⭐ Dashboard with real-time updates - **IMPRESSIVE**
- ⭐⭐⭐ ESP32 button working - **WOW FACTOR**
- ⭐⭐⭐ Voice transcription demo - **ALREADY WORKS!**

### **MEDIUM PRIORITY (Doable in 24 Days):**
- ⭐⭐ **Mobile App (iOS/Android)** - Just frontend on existing API!
- ⭐⭐ **Watch Apps** - Push notifications + quick actions
- ⭐⭐ Device Manager - Shows scalability
- ⭐ Real-time notifications - WebSocket or SSE

### **LOW PRIORITY (Skip for Demo):**
- ❌ LoRa integration (WiFi sufficient, mention as "coming soon")
- ❌ Advanced analytics & reports
- ❌ Crew scheduling/duty roster
- ❌ Guest preferences AI
- ❌ Multi-yacht management

---

## 🎬 **DEMO SCRIPT (5 Minutes):**

### **Minute 1: Problem Statement**
"Yacht crew management is chaotic. Guests call for service via phone, intercom, or random methods. Crew can't track requests, prioritize tasks, or coordinate efficiently."

### **Minute 2: Solution Overview**
"Obedio is an intelligent butler call system with smart buttons in every cabin and public area. One press alerts crew with location, guest info, and priority level."

### **Minute 3: Live Demo - Service Request**
1. Press physical ESP32 button
2. Show dashboard lighting up with new request
3. Show notification on crew device
4. Accept request, show status update
5. Complete request, show history

### **Minute 4: Show Multi-Platform**
- **Web Dashboard** - Real-time updates, location management
- **Mobile App** - Crew accepts requests on iPhone/Android
- **Watch App** - Notifications on Apple Watch (show prototype!)
- **Voice Transcription** - Guest speaks, crew sees text

### **Minute 5: Scalability & Business Model**
- Works on yachts of any size (show 200+ locations)
- **All crew devices** - Web, mobile, watch, tablet
- **Voice messages** - Already integrated (Whisper API)
- **Hardware options** - ESP32 buttons (show physical unit)
- **Future:** LoRa for superyachts, AI predictions

**Call to Action:** "Book a demo installation for your yacht. First 10 sign-ups get 50% off hardware."

---

## 💰 **BUDGET & RESOURCES:**

### **Hardware (Bring to METSTRADE):**
- [x] 3-5 ESP32 DevKits (already have)
- [ ] 3D-printed button enclosures (professional look)
- [ ] USB-C power banks (backup power)
- [ ] LED strips for visual effect
- [ ] **iPad/Tablet** for web dashboard demo
- [ ] **iPhone** with mobile app installed
- [ ] **Apple Watch** with watch app (show wrist notifications!)
- [ ] **Portable WiFi router** (backup internet)

### **Software:**
- [x] Backend deployed (Railway/Heroku)
- [x] Frontend deployed (Vercel/Netlify)
- [ ] Domain name (obedio.com or demo.obedio.com)
- [ ] Cloud MQTT broker (CloudMQTT or AWS IoT)

### **Marketing:**
- [ ] Brochures/Flyers (100 copies)
- [ ] Business cards (200 copies)
- [ ] Banner for booth (1.5m x 1m)
- [ ] QR code stickers (link to demo)

**Total Estimated Cost:** €500-800

---

## 📊 **SUCCESS METRICS:**

### **Demo Day Goals:**
- ✅ **50+ business cards collected**
- ✅ **10+ qualified leads** (yacht captains, interior managers)
- ✅ **3+ demo bookings** for real yachts
- ✅ **1+ pilot installation** agreement

### **Technical Goals:**
- ✅ **Zero crashes** during demos
- ✅ **<500ms latency** for button press → notification
- ✅ **100% uptime** during METSTRADE
- ✅ **ESP32 buttons working** reliably

---

## 🚀 **FOCUS AREAS (Next 7 Days):**

### **THIS WEEK (Oct 22-28):**

**Today (Oct 22):**
- [x] Git push ✅
- [ ] Fix authentication token persistence
- [ ] Test service request flow end-to-end
- [ ] Remove any remaining hardcoded data

**Tomorrow (Oct 23):**
- [ ] Dashboard layout persistence working
- [ ] Real-time updates (WebSocket or SSE)
- [ ] Button simulator perfect (backup for hardware)

**Oct 24:**
- [ ] Locations CRUD fully tested
- [ ] Guest profiles complete
- [ ] Service request priority handling

**Oct 25:**
- [ ] Start ESP32 firmware (button press → MQTT)
- [ ] MQTT broker setup
- [ ] Backend MQTT listener

**Oct 26-27:**
- [ ] ESP32 button working end-to-end
- [ ] LED feedback
- [ ] Device Manager integration

**Oct 28:**
- [ ] Full system test
- [ ] Bug fixes
- [ ] Demo data preparation

---

## 🎯 **DAILY STANDUP (Self-Check):**

Every morning ask yourself:
1. **What did I finish yesterday?**
2. **What am I working on today?**
3. **Any blockers?**
4. **Am I on track for METSTRADE?**

**No distractions, no scope creep, focus on MUST-HAVE features only!**

---

## 🏆 **MOTIVATION:**

**METSTRADE is one of the BIGGEST maritime trade shows in the world.**
- 30,000+ visitors
- 1,500+ exhibitors
- Yacht captains, owners, managers
- **YOUR CHANCE TO LAUNCH OBEDIO! 🚀**

**24 days is ENOUGH time IF you stay focused!**

**Rule:** If it doesn't contribute to a working demo, SKIP IT!

---

## 📞 **EMERGENCY CONTACTS:**

**If you need help:**
- Backend issues → Cascade (me!) 🤖
- Hardware issues → ESP32 community forums
- MQTT issues → CloudMQTT support
- Deployment issues → Vercel/Railway support

**Keep a backup plan for everything!**

---

## ✅ **DAILY PROGRESS TRACKING:**

| Date | Hours Worked | Tasks Completed | Blockers | Tomorrow's Plan |
|------|--------------|-----------------|----------|-----------------|
| Oct 22 | ? | Git push, scripts, hardcode removal | Auth token issue | Fix auth, test service requests |
| Oct 23 | | | | |
| Oct 24 | | | | |
| ... | | | | |

---

**LET'S MAKE OBEDIO A SUCCESS AT METSTRADE 2025!** 🎉🚀

**Remember:** Production-ready beats feature-rich. One working demo is worth 10 planned features!

**STAY FOCUSED. SHIP FAST. ITERATE LATER.** 💪
