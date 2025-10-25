# 🔌 Integration Guide

How all components connect and communicate.

---

## 📋 Overview

This guide explains how the frontend, backend, database, and hardware integrate.

**Integration Points:**
1. Frontend ↔ Backend (REST + WebSocket)
2. Backend ↔ Database (Prisma ORM)
3. ESP32 ↔ Backend (HTTP/MQTT)
4. Mobile/Watch ↔ Backend (Future)

---

## 1️⃣ Frontend ↔ Backend

### REST API Communication

**Base URL:** `http://localhost:3001/api` (dev)

**Authentication Header:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Example: Fetch Guests**
```typescript
// Frontend: src/services/guests.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.VITE_API_URL || 'http://localhost:3001/api'
});

// Attach token to all requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('obedio-auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function getGuests(filters) {
  const response = await apiClient.get('/guests', { params: filters });
  return response.data;
}
```

---

### WebSocket Communication

**Connection:**
```typescript
// Frontend: src/services/api.ts
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

// Authenticate
socket.emit('authenticate', localStorage.getItem('obedio-auth-token'));

// Listen for events
socket.on('service-request:new', (data) => {
  console.log('New service request:', data);
  queryClient.invalidateQueries(['service-requests']);
});
```

**Events:**
- `service-request:new` → Invalidate React Query cache
- `dnd:updated` → Refresh locations
- `crew:status-changed` → Update crew list

---

### React Query Integration

**Why React Query?**
- Automatic caching
- Background refetching
- Optimistic updates
- Loading/error states

**Example:**
```typescript
// Frontend: src/hooks/useGuests.ts
import { useQuery } from '@tanstack/react-query';
import { guestsService } from '../services/guests';

export function useGuests(filters) {
  return useQuery({
    queryKey: ['guests', filters],
    queryFn: () => guestsService.getAll(filters),
    staleTime: 60000, // Cache for 1 minute
    refetchOnWindowFocus: false
  });
}

// Usage in component
function GuestsList() {
  const { data: guests, isLoading } = useGuests({ search: '' });
  
  if (isLoading) return <Spinner />;
  
  return <div>{guests.map(guest => ...)}</div>;
}
```

---

## 2️⃣ Backend ↔ Database

### Prisma ORM

**Why Prisma?**
- Type-safe queries
- Auto-completion
- Migration management
- Database-agnostic

**Example Query:**
```typescript
// Backend: src/services/guest.service.ts
import { prisma } from '../prisma/client';

export async function getGuests(filters) {
  return prisma.guest.findMany({
    where: {
      firstName: {
        contains: filters.search,
        mode: 'insensitive'
      },
      locationId: filters.locationId || undefined
    },
    include: {
      location: true, // Join with locations
      serviceRequests: {
        where: { status: 'open' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}
```

**Result:** Type-safe query with auto-complete! ✨

---

### Transaction Example

**Problem:** Multiple database operations must succeed or all fail

**Solution:** `$transaction`

```typescript
await prisma.$transaction(async (tx) => {
  // Update location DND
  const location = await tx.location.update({
    where: { id: locationId },
    data: { doNotDisturb: true }
  });
  
  // Update all guests in that location
  await tx.guest.updateMany({
    where: { locationId },
    data: { doNotDisturb: true }
  });
  
  // Log activity
  await tx.activityLog.create({
    data: {
      action: 'dnd_toggled',
      entityType: 'location',
      entityId: locationId
    }
  });
});
```

**Result:** All operations succeed together, or all fail (rollback)

---

## 3️⃣ ESP32 ↔ Backend

### Button Press Flow

**WiFi Mode (Primary):**
```
ESP32 Button Press
  ↓
WiFi → HTTP POST
  ↓
http://SERVER_IP:3001/api/smart-buttons/press
```

**Request Payload:**
```json
{
  "buttonId": "btn-cabin-5-001",
  "locationId": "cabin-5",
  "action": "single-press",
  "batteryLevel": 87,
  "rssi": -42,
  "timestamp": "2025-10-23T08:00:00Z"
}
```

**Backend Response:**
```json
{
  "success": true,
  "requestId": "req-123",
  "message": "Service request created",
  "ledColor": "green"
}
```

---

### MQTT Mode (Alternative)

**MQTT Topics:**
```
obedio/button/{buttonId}/pressed    → Button press event
obedio/button/{buttonId}/voice      → Voice audio chunks
obedio/button/{buttonId}/status     → Battery/signal status
obedio/service/{requestId}/update   → Status change notification
```

**Example: Button Press**
```javascript
// ESP32 publishes:
topic: "obedio/button/btn-001/pressed"
payload: {
  "locationId": "cabin-5",
  "batteryLevel": 85,
  "rssi": -40
}

// Backend subscribes and handles:
mqtt.on('message', (topic, message) => {
  if (topic.includes('/pressed')) {
    const data = JSON.parse(message);
    await createServiceRequest(data);
    
    // Publish confirmation
    mqtt.publish(
      `obedio/service/${requestId}/update`,
      JSON.stringify({ status: 'created' })
    );
  }
});
```

---

### LoRa Mode (Future)

**For Large Yachts:**
```
ESP32 Button
  ↓
LoRa Radio (868/915 MHz)
  ↓
LoRa Gateway (ChirpStack/TTN)
  ↓
Backend API
```

**Limitations:**
- Text-only (no voice)
- Higher latency (~500ms-2s)
- Lower bandwidth

**Benefits:**
- Long range (2-5km)
- Ultra-low power
- Works in remote areas

---

## 4️⃣ Real-Time Event Flow

### Service Request Example

```
1. Guest presses button (ESP32)
   ↓
2. ESP32 → Backend: POST /api/smart-buttons/press
   ↓
3. Backend creates service request in database
   ↓
4. Backend broadcasts WebSocket event:
   io.emit('service-request:new', requestData)
   ↓
5. All connected clients receive event:
   - Web dashboard updates
   - Mobile apps notify
   - Crew watches vibrate
   ↓
6. Crew member accepts (mobile app)
   ↓
7. Mobile → Backend: PUT /api/service-requests/123/accept
   ↓
8. Backend updates database
   ↓
9. Backend broadcasts: 'service-request:updated'
   ↓
10. ESP32 button LED turns green (confirmation)
```

**Total Time:** ~2-5 seconds ⚡

---

## 🔐 Authentication Flow

### Login Process

```
1. User enters credentials (frontend)
   ↓
2. Frontend → Backend: POST /api/auth/login
   {
     "username": "admin",
     "password": "admin123"
   }
   ↓
3. Backend verifies password (bcrypt.compare)
   ↓
4. Backend generates JWT token
   ↓
5. Backend → Frontend: 200 OK
   {
     "token": "eyJhbGciOiJIUzI1NiIs...",
     "user": { "id": "...", "role": "admin" }
   }
   ↓
6. Frontend stores token in localStorage
   ↓
7. Frontend attaches token to all requests:
   Authorization: Bearer <token>
```

---

### Protected API Request

```
1. Frontend makes request with token
   GET /api/crew
   Authorization: Bearer <token>
   ↓
2. Backend middleware verifies token
   authenticate(req, res, next)
   ↓
3. If valid: next()
   If invalid: 401 Unauthorized
   ↓
4. Backend checks permission
   requirePermission('crew:read')
   ↓
5. If allowed: Execute handler
   If forbidden: 403 Forbidden
```

---

## 📊 Data Sync Strategy

### Optimistic Updates

**Pattern:** Update UI immediately, then sync with server

**Example: Toggle DND**
```typescript
// Frontend mutation
const toggleDnd = useMutation({
  mutationFn: (locationId) => locationsService.toggleDnd(locationId),
  
  // Optimistic update (immediate UI change)
  onMutate: async (locationId) => {
    await queryClient.cancelQueries(['locations']);
    
    const previous = queryClient.getQueryData(['locations']);
    
    queryClient.setQueryData(['locations'], (old) => 
      old.map(loc => 
        loc.id === locationId
          ? { ...loc, doNotDisturb: !loc.doNotDisturb }
          : loc
      )
    );
    
    return { previous };
  },
  
  // Rollback on error
  onError: (err, variables, context) => {
    queryClient.setQueryData(['locations'], context.previous);
  },
  
  // Refetch on success (ensure sync)
  onSuccess: () => {
    queryClient.invalidateQueries(['locations']);
  }
});
```

**Result:** Instant UI feedback, with server confirmation

---

## 🌐 Multi-Platform Architecture

```
┌────────────────────────────────────────┐
│      PostgreSQL Database               │
│      (Single Source of Truth)          │
└────────────┬───────────────────────────┘
             │
┌────────────┴───────────────────────────┐
│      Backend API (Node.js)             │
│      • REST endpoints                  │
│      • WebSocket server                │
│      • Authentication                  │
└──┬────┬────┬────┬────┬────┬────┬──────┘
   │    │    │    │    │    │    │
   ↓    ↓    ↓    ↓    ↓    ↓    ↓
 Web  iOS  And  Watch ESP32 Tab  Future
```

**Key Point:** Same backend serves all platforms!

---

## 🔧 Development Setup

### Start Full Stack

```bash
# Terminal 1: Backend
cd backend
npm run dev
# Running on http://localhost:3001

# Terminal 2: Frontend
npm run dev
# Running on http://localhost:3000
```

### Test Integration

1. **Backend Health Check:**
   ```
   http://localhost:3001/api/health
   ```

2. **WebSocket Connection:**
   ```javascript
   const socket = io('http://localhost:3001');
   socket.on('connect', () => console.log('Connected!'));
   ```

3. **API Test:**
   ```bash
   curl http://localhost:3001/api/guests \
     -H "Authorization: Bearer <token>"
   ```

---

## 🐛 Troubleshooting

### Frontend can't connect to backend
- Check backend is running: `http://localhost:3001/api/health`
- Check CORS settings in `backend/src/server.ts`
- Verify `VITE_API_URL` in frontend `.env`

### WebSocket not working
- Check browser console for errors
- Verify Socket.io version compatibility
- Test connection: `socket.connected` should be `true`

### Database connection failed
- Check PostgreSQL is running: `pg_isready`
- Verify `DATABASE_URL` in `backend/.env`
- Try: `npx prisma db push`

---

**Next:** See root README.md for quick start guide.
