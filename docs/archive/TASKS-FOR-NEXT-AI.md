# ZADACI ZA NASTAVAK - OBEDIO YACHT APP

## 🎯 PRIORITETI (HITNO)

### 1. **User Preferences API** (PRIORITET #1)
**Fajl za kreiranje:** `backend/src/routes/user-preferences.ts`
```typescript
- GET /api/user-preferences - dobavi sve preference
- PUT /api/user-preferences/dashboard - sačuvaj dashboard layout
- PUT /api/user-preferences/language - promeni jezik
- PUT /api/user-preferences/theme - promeni temu
```

### 2. **Dashboard Save/Load** (PRIORITET #2)
**Fajlovi za izmenu:**
- `src/components/pages/dashboard.tsx` - dodaj Save/Reset dugmad
- `src/hooks/useUserPreferences.ts` - već postoji, samo treba povezati sa API

**Funkcionalnost:**
- Čuvanje pozicije widgeta po user-u
- Različiti layout za admin/crew role
- Reset na default layout

### 3. **Device Manager** (PRIORITET #3)
**Fajl:** `src/components/pages/device-manager.tsx`
- Add Device dialog
- Battery status monitoring
- Assign device to crew/location
- Device configuration

## 📋 KOMPLETNA LISTA PREOSTALIH ZADATAKA

### Backend API Endpoints (4 preostala)
1. **User Preferences** - `/api/user-preferences/*`
2. **Dashboard Layouts** - `/api/dashboard-layouts/*`
3. **Duty Roster** - `/api/duty-roster/*`
4. **Device Logs** - `/api/device-logs/*`

### Frontend Integracije (15 zadataka)
1. Settings - save to backend
2. Dashboard - save/load layouts
3. Service Requests - real-time updates
4. Guests - verify API only (no mock data)
5. Locations - real-time DND toggle
6. Crew - shift management
7. Weather widget - use real location
8. Clock widgets - use saved timezone
9. Device Manager - full implementation
10. Activity Log - device logs tab
11. Error handling - loading states
12. WebSocket - reconnection logic
13. Authentication - token refresh
14. Push notifications
15. Image upload for locations

### Security & Performance (10 zadataka)
1. CORS production config
2. Rate limiting
3. Input validation
4. CSRF protection
5. Redis caching
6. Query optimization
7. Pagination on all lists
8. Error retry logic
9. Permission middleware
10. Remove console.logs

### ESP32 & IoT (6 zadataka)
1. Communication protocol
2. Firmware base
3. Button events
4. MQTT broker
5. LoRa network
6. Mobile app specs

## 🛠️ KAKO RADITI

### Za svaki API endpoint:
1. Kreiraj rutu u `backend/src/routes/`
2. Dodaj u `backend/src/server.ts`
3. Kreiraj hook u `src/hooks/`
4. Testiraj sa Postman/curl

### Za svaku frontend integraciju:
1. Proveri da li hook postoji
2. Zameni mock data sa API pozivom
3. Dodaj error handling
4. Testiraj u browseru

## 📁 STRUKTURA PROJEKTA

```
backend/
├── src/
│   ├── routes/        # API rute - OVDE DODAJ NOVE
│   ├── services/      # Business logika
│   └── server.ts      # Main server file
│
src/
├── hooks/            # React hooks - KORISTI OVE
├── services/         # API servisi
├── components/
│   └── pages/       # Stranice - OVDE MENJAJ
└── contexts/        # Global state

```

## ⚠️ NAPOMENE

1. **NE MENJAJ** port konfiguraciju (sve je na 8080)
2. **NE DODAVAJ** mock data u AppDataContext
3. **UVEK** koristi postojeće hooks iz `/src/hooks/`
4. **TESTIRAJ** login pre rada (admin/admin123)

## 🔧 DEBUG KOMANDE

```bash
# Proveri da li backend radi
curl http://localhost:8080/api/health

# Test login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Popravi password ako ne radi
cd backend && npx tsx fix-admin-password.ts
```

## 💡 SAVETI

1. Počni sa User Preferences API - najlakše
2. Dashboard save/load - korisno za demo
3. Device Manager - kompleksno ali impresivno
4. WebSocket updates - na kraju kad sve radi

Srećno! 🚀