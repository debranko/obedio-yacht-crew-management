# 🏗️ Obedio System Architecture - Overview

**Version:** 4.0  
**Last Updated:** October 23, 2025  
**Status:** Production Ready

---

## 📌 What is Obedio?

**Obedio** is a full-stack yacht crew management system for luxury yacht operations. It provides real-time communication between guests and crew through ESP32 smart buttons and mobile/wearable devices.

### Core Purpose
- Guests press button → Crew instantly notified
- Crew manages requests → Accept, complete, track
- Admin monitors operations → Dashboard, KPIs, analytics

---

## 🎯 System Components

### 1. Web Application (Admin)
- **Tech:** React + TypeScript + Vite
- **Users:** Captain, Chief Stewardess, ETO
- **Purpose:** Configuration and monitoring

### 2. Backend API Server
- **Tech:** Node.js + Express + PostgreSQL
- **Purpose:** Business logic, data persistence, real-time events

### 3. ESP32 Smart Buttons
- **Communication:** WiFi (MQTT) or LoRa
- **Purpose:** Physical guest interface

### 4. Mobile Apps (Future)
- **Platforms:** iOS + Android
- **Users:** Crew members

### 5. Wearables (Future)
- **Platforms:** Apple Watch + Android Wear
- **Purpose:** Instant notifications

---

## 🏛️ Architecture

```
┌──────────────────────────────────────────┐
│         PRESENTATION LAYER                │
│  Web | Mobile | Wearables | ESP32        │
└─────────────┬────────────────────────────┘
              │
┌─────────────┴────────────────────────────┐
│      APPLICATION LAYER                    │
│  Node.js + Express + Socket.io           │
│  • REST API                               │
│  • WebSocket                              │
│  • JWT Auth                               │
└─────────────┬────────────────────────────┘
              │
┌─────────────┴────────────────────────────┐
│    DATA LAYER                             │
│    PostgreSQL Database                    │
└───────────────────────────────────────────┘
```

---

## 🔄 Request Flow Example

1. **Guest presses button** → ESP32 sends POST request
2. **Backend** → Creates service request in database
3. **WebSocket** → Broadcasts to all connected clients
4. **Crew watch** → Vibrates with notification
5. **Crew accepts** → Status updated in database
6. **Button LED** → Turns green (confirmation)

**Time:** ~2-5 seconds total ⚡

---

## 🔑 Key Design Decisions

### Database-First
PostgreSQL is single source of truth. Web app is admin-only.

### Real-Time
WebSocket for instant updates (<500ms latency).

### JWT + RBAC
Role-based permissions (admin, chief, crew, eto).

### Dual Communication
WiFi (voice support) + LoRa (long range backup).

---

## 📊 Current Status

### ✅ Production Ready
- Backend API + PostgreSQL
- JWT authentication
- React admin interface
- WebSocket real-time
- Crew/Guest/Location management
- Service requests
- Windows Server deployment

### 🚧 In Progress
- MQTT integration
- Voice-to-text
- LoRa gateway

### 🔮 Future
- iOS/Android apps
- Apple Watch/Wear OS
- Multi-yacht cloud

---

## 📚 Documentation

1. **SYSTEM-OVERVIEW.md** ← You are here
2. FRONTEND-ARCHITECTURE.md
3. BACKEND-ARCHITECTURE.md
4. DATABASE-ARCHITECTURE.md
5. INTEGRATION-GUIDE.md

---

**Next:** See FRONTEND-ARCHITECTURE.md for React app details.
