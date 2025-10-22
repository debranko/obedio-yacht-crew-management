# 🎯 KOMPLEKSNI ZADACI - ZA SKUPLJI AI MODEL

**Datum:** 22. Oktobar 2025, 21:55  
**Pripremio:** Cascade (jeftiniji AI)  
**Namena:** Lista kompleksnih zadataka za napredniji AI model  
**Status:** Ready for expensive AI to take over

---

## ✅ **ŠTA JE VEĆ URAĐENO (Jeftiniji AI):**

1. ✅ Registrovao 3 API route-a (activity-logs, settings, smart-buttons)
2. ✅ Backend sada 92% complete (20/20 routes)
3. ✅ METSTRADE readiness: 82% (+2%)
4. ✅ Git pushed
5. ✅ Dokumentacija ažurirana

**Vreme:** 5 minuta  
**Troškovi:** Minimalni ✅

---

## 🔴 **PRIORITET #1: TOKEN PERSISTENCE FIX** ⭐⭐⭐

### **Problem:**
Token se gubi kada korisnik refreshuje stranicu (F5). Mora ponovo da se login-uje svaki put.

### **Zašto je ovo KRITIČNO:**
- Veoma iritantno za korišćenje
- Loš UX
- Demo će biti frustrirajući
- Blokira normalno testiranje

### **Vreme potrebno:** 2-3 sata

---

### **Tehnički detalji:**

**Fajlovi za izmenu:**
1. `backend/src/routes/auth.ts` - Authentication endpoint
2. `src/contexts/AuthContext.tsx` - React authentication context
3. `src/services/auth.ts` - Auth service layer

---

### **Šta treba uraditi:**

#### **Korak 1: Backend - Token Refresh Mechanism**

**File:** `backend/src/routes/auth.ts`

**Dodaj novi endpoint:**
```typescript
// POST /api/auth/refresh
// Primi stari token, vrati novi token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    // 1. Verify old token
    // 2. Check if user still exists & active
    // 3. Generate new JWT token
    // 4. Return new token
    
    res.json({
      success: true,
      token: newToken,
      user: userData
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});
```

**Implementacija:**
- Verify JWT token even if expired (short window)
- Check user exists in database
- Generate new token (same secret)
- Return user data + new token

---

#### **Korak 2: Frontend - Token Persistence**

**File:** `src/contexts/AuthContext.tsx`

**Promene:**

1. **Save token to localStorage on login:**
```typescript
const login = async (username: string, password: string) => {
  const response = await api.post('/api/auth/login', { username, password });
  const { token, user } = response.data;
  
  // SAVE to localStorage
  localStorage.setItem('authToken', token);
  localStorage.setItem('user', JSON.stringify(user));
  
  setToken(token);
  setUser(user);
};
```

2. **Load token on app start:**
```typescript
useEffect(() => {
  // On mount, check localStorage
  const savedToken = localStorage.getItem('authToken');
  const savedUser = localStorage.getItem('user');
  
  if (savedToken && savedUser) {
    // Verify token is still valid
    verifyToken(savedToken).then(isValid => {
      if (isValid) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } else {
        // Token expired, clear it
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    });
  }
}, []);
```

3. **Clear on logout:**
```typescript
const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  setToken(null);
  setUser(null);
};
```

---

#### **Korak 3: API Service - Auto Token Injection**

**File:** `src/services/api.ts`

**Dodaj interceptor:**
```typescript
// Axios interceptor - automatski dodaj token u header
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Axios interceptor - handle 401 errors
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Token expired, try refresh
      const newToken = await refreshToken();
      if (newToken) {
        // Retry original request
        return axios(error.config);
      } else {
        // Refresh failed, logout
        logout();
      }
    }
    return Promise.reject(error);
  }
);
```

---

### **Testing Plan:**

**Kako testirati:**

1. Login kao admin/admin123
2. Proveri da si login-ovan (vidiš Dashboard)
3. Refresh stranicu (F5)
4. **OČEKUJEŠ:** Još uvek si login-ovan (ne vidiš login page)
5. Čekaj 1 sat, refresh opet
6. **OČEKUJEŠ:** Još uvek radi (token refresh)
7. Logout
8. **OČEKUJEŠ:** Vidiš login page

**Ako radi sve ovo → FIXED!** ✅

---

### **Expected Outcome:**

**Before:**
- Login → Browse → Refresh (F5) → Back to login screen ❌

**After:**
- Login → Browse → Refresh (F5) → Still logged in ✅
- Token automatically refreshes every hour ✅
- Only logout when user clicks Logout ✅

---

## 🔴 **PRIORITET #2: YACHT SETTINGS DATABASE PERSISTENCE** ⭐⭐

### **Problem:**
Yacht settings (name, timezone, floors, etc.) su hardcoded u kodu. Ne čuvaju se u bazi.

### **Zašto je ovo VAŽNO:**
- Settings se gube kada restartujemo server
- Ne možeš promeniti yacht name preko UI
- Ne možeš dodati/ukloniti floors (decks)
- Production neupotrebljivo

### **Vreme potrebno:** 2-3 sata

---

### **Tehnički detalji:**

**Fajlovi za kreiranje/izmenu:**
1. `backend/prisma/schema.prisma` - Database schema
2. `backend/prisma/migrations/` - Nova migration
3. `backend/src/routes/yacht-settings.ts` - Replace hardcoded data

---

### **Šta treba uraditi:**

#### **Korak 1: Kreirati Prisma Model**

**File:** `backend/prisma/schema.prisma`

**Dodaj model na kraj fajla:**
```prisma
model YachtSettings {
  id              String   @id @default(cuid())
  name            String   @default("Serenity")
  type            String   @default("motor") // "motor", "sailing", "catamaran"
  timezone        String   @default("Europe/Monaco")
  floors          String[] @default(["Lower Deck", "Main Deck", "Upper Deck", "Sun Deck"])
  dateFormat      String   @default("DD/MM/YYYY")
  timeFormat      String   @default("24h") // "12h" ili "24h"
  weatherUnits    String   @default("metric") // "metric" ili "imperial"
  windSpeedUnits  String   @default("knots") // "knots", "km/h", "mph"
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@map("yacht_settings")
}
```

**Objašnjenje:**
- `name` - Ime jahte (Serenity, Azimut, etc.)
- `type` - Tip jahte (motor, sailing, catamaran)
- `timezone` - Timezone gde je jahta trenutno (Europe/Monaco, America/New_York, etc.)
- `floors` - Array deck-ova ["Lower Deck", "Main Deck", ...]
- `dateFormat` - Kako prikazati datum
- `timeFormat` - 12h ili 24h
- `weatherUnits` - metric (Celsius, km/h) ili imperial (Fahrenheit, mph)
- `windSpeedUnits` - knots (nautical), km/h, mph

---

#### **Korak 2: Kreirati Migration**

**Terminal komande:**
```bash
cd backend
npx prisma migrate dev --name add-yacht-settings
```

**Očekuješ:**
- Kreiraće novu migration u `backend/prisma/migrations/`
- Primeniće je na bazu
- Ažuriraće Prisma Client

**Ako vidiš "Migration successful" → Good!** ✅

---

#### **Korak 3: Seed Default Data**

**File:** `backend/prisma/seed.ts`

**Dodaj na kraj:**
```typescript
// Create default yacht settings
const yachtSettings = await prisma.yachtSettings.upsert({
  where: { id: 'default' }, // or use cuid
  update: {},
  create: {
    name: 'Serenity',
    type: 'motor',
    timezone: 'Europe/Monaco',
    floors: ['Lower Deck', 'Main Deck', 'Upper Deck', 'Sun Deck'],
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    weatherUnits: 'metric',
    windSpeedUnits: 'knots',
  }
});

console.log('✅ Yacht settings created:', yachtSettings.name);
```

**Pokreni:**
```bash
cd backend
npm run db:seed
```

---

#### **Korak 4: Ažuriraj API Route**

**File:** `backend/src/routes/yacht-settings.ts`

**ZAMENI ceo fajl sa:**
```typescript
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/yacht-settings
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Fetch from database (should only be 1 record)
    let settings = await prisma.yachtSettings.findFirst();
    
    // If no settings exist, create default
    if (!settings) {
      settings = await prisma.yachtSettings.create({
        data: {
          name: 'Serenity',
          type: 'motor',
          timezone: 'Europe/Monaco',
          floors: ['Lower Deck', 'Main Deck', 'Upper Deck', 'Sun Deck'],
          dateFormat: 'DD/MM/YYYY',
          timeFormat: '24h',
          weatherUnits: 'metric',
          windSpeedUnits: 'knots',
        }
      });
    }

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching yacht settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch yacht settings',
    });
  }
});

// PUT /api/yacht-settings
router.put('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, type, timezone, floors, dateFormat, timeFormat, weatherUnits, windSpeedUnits } = req.body;

    // Get existing settings
    let settings = await prisma.yachtSettings.findFirst();
    
    if (!settings) {
      // Create new
      settings = await prisma.yachtSettings.create({
        data: {
          name,
          type,
          timezone,
          floors,
          dateFormat,
          timeFormat,
          weatherUnits,
          windSpeedUnits,
        }
      });
    } else {
      // Update existing
      settings = await prisma.yachtSettings.update({
        where: { id: settings.id },
        data: {
          name,
          type,
          timezone,
          floors,
          dateFormat,
          timeFormat,
          weatherUnits,
          windSpeedUnits,
        }
      });
    }

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error updating yacht settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update yacht settings',
    });
  }
});

export default router;
```

**Objašnjenje:**
- GET - Učita iz baze (ne hardcoded!)
- PUT - Sačuva u bazu
- Ako ne postoji ni jedan record, kreira default

---

### **Testing Plan:**

**Kako testirati:**

1. Pokreni backend: `cd backend && npm run dev`
2. Test GET endpoint:
   ```bash
   curl http://localhost:8080/api/yacht-settings
   ```
   **Očekuješ:** JSON sa yacht settings

3. Test PUT endpoint (promeni ime jahte):
   ```bash
   curl -X PUT http://localhost:8080/api/yacht-settings \
     -H "Content-Type: application/json" \
     -d '{"name":"My Awesome Yacht","type":"motor","timezone":"Europe/Monaco","floors":["Deck 1","Deck 2"],"dateFormat":"DD/MM/YYYY","timeFormat":"24h","weatherUnits":"metric","windSpeedUnits":"knots"}'
   ```

4. Test GET opet:
   ```bash
   curl http://localhost:8080/api/yacht-settings
   ```
   **Očekuješ:** Ime jahte je sada "My Awesome Yacht"

5. **RESTART backend** (Ctrl+C, pa `npm run dev` opet)

6. Test GET opet:
   ```bash
   curl http://localhost:8080/api/yacht-settings
   ```
   **Očekuješ:** JOŠ UVEK "My Awesome Yacht" (nije lost!) ✅

**Ako ime persists after restart → FIXED!** ✅

---

### **Expected Outcome:**

**Before:**
- Settings hardcoded u kodu
- Ne može se menjati preko UI
- Gubi se na restart

**After:**
- Settings u bazi (PostgreSQL)
- Može se menjati preko UI
- Persists after restart ✅
- Production-ready! ✅

---

## 🟡 **PRIORITET #3: DASHBOARD SAVE/LOAD UI INTEGRATION** ⭐

### **Problem:**
Dashboard može da se drag-and-drop arrange, ali ne čuva pozicije widgeta. Svaki refresh vraća default layout.

### **Zašto je ovo SREDNJE VAŽNO:**
- Nice-to-have feature
- Impresivno za demo
- User experience improvement
- Ali ne blokira osnovnu funkcionalnost

### **Vreme potrebno:** 1-2 sata

---

### **Tehnički detalji:**

**Backend API:** ✅ VEĆ POSTOJI!  
**Endpoint:** `PUT /api/user-preferences/dashboard`

**Frontend Hook:** ✅ VEĆ POSTOJI!  
**File:** `src/hooks/useUserPreferences.ts`

**Što treba:**
- Dodati Save button u Dashboard
- Dodati Reset button u Dashboard
- Wire up API pozive
- Loading states
- Success/error toasts

---

### **Šta treba uraditi:**

#### **Korak 1: Update Dashboard Page**

**File:** `src/components/pages/dashboard.tsx`

**Dodaj state za tracking changes:**
```typescript
const [hasChanges, setHasChanges] = useState(false);
const [isSaving, setIsSaving] = useState(false);
```

**Dodaj Save button:**
```tsx
{hasChanges && (
  <Button 
    onClick={handleSave}
    disabled={isSaving}
  >
    {isSaving ? 'Saving...' : 'Save Layout'}
  </Button>
)}
```

**Dodaj Reset button:**
```tsx
<Button 
  variant="outline"
  onClick={handleReset}
>
  Reset to Default
</Button>
```

**Implementiraj funkcije:**
```typescript
const handleSave = async () => {
  setIsSaving(true);
  try {
    await saveDashboardLayout(currentLayout);
    toast.success('Dashboard layout saved!');
    setHasChanges(false);
  } catch (error) {
    toast.error('Failed to save layout');
  } finally {
    setIsSaving(false);
  }
};

const handleReset = async () => {
  try {
    await resetDashboardLayout();
    toast.success('Dashboard reset to default');
    // Reload layout
    loadDefaultLayout();
  } catch (error) {
    toast.error('Failed to reset layout');
  }
};
```

---

#### **Korak 2: Track Layout Changes**

**U Dashboard component:**

```typescript
const onLayoutChange = (newLayout) => {
  setCurrentLayout(newLayout);
  setHasChanges(true); // Mark as changed
};
```

**Na mount, učitaj saved layout:**
```typescript
useEffect(() => {
  loadUserDashboardLayout().then(savedLayout => {
    if (savedLayout) {
      setCurrentLayout(savedLayout);
    }
  });
}, []);
```

---

### **Testing Plan:**

**Kako testirati:**

1. Login u aplikaciju
2. Idi na Dashboard
3. Drag-and-drop widget na novu poziciju
4. Vidiš "Save Layout" button (jer je changed)
5. Klikni "Save Layout"
6. Vidiš toast "Dashboard layout saved!"
7. Refresh stranicu (F5)
8. **OČEKUJEŠ:** Widgeti na istoj poziciji (saved!) ✅
9. Klikni "Reset to Default"
10. **OČEKUJEŠ:** Widgeti vraćeni na original pozicije ✅

**Ako layout persists → FIXED!** ✅

---

### **Expected Outcome:**

**Before:**
- Drag widgets → Refresh → Lost positions ❌

**After:**
- Drag widgets → Save → Refresh → Same positions ✅
- Reset button vraća na default ✅
- Per-user layouts (svaki user ima svoj!) ✅

---

## 🟡 **PRIORITET #4: DEVICE MANAGER FULL IMPLEMENTATION** ⭐

### **Problem:**
Device Manager page postoji, ali neke funkcionalnosti nisu povezane sa backend-om.

### **Zašto je ovo SREDNJE VAŽNO:**
- Veliki feature (impresivno)
- Ali nije kritično za osnovnu funkcionalnost
- Nice-to-have za demo

### **Vreme potrebno:** 3-4 sata

---

### **Tehnički detalji:**

**Backend API:** ✅ VEĆ POSTOJI!  
**Endpoints:** `/api/devices/*`

**Frontend Page:** ✅ VEĆ POSTOJI!  
**File:** `src/components/pages/device-manager-full.tsx` (22KB!)

**Što treba:**
- Add Device dialog sa formom
- Battery status real-time monitoring
- Assign device to crew/location
- Device configuration editor
- Status indicators (online/offline)

---

### **Šta treba uraditi:**

#### **Feature 1: Add Device Dialog**

**Kreirati modal za dodavanje novog device-a:**

```tsx
<Dialog open={showAddDevice} onOpenChange={setShowAddDevice}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Add New Device</DialogTitle>
    </DialogHeader>
    
    <Form>
      <FormField name="deviceId" label="Device ID" />
      <FormField name="name" label="Device Name" />
      <FormSelect name="type" label="Type">
        <option>Smart Button</option>
        <option>Tablet</option>
        <option>Watch</option>
      </FormSelect>
      <FormSelect name="location" label="Location" />
      <FormSelect name="crew" label="Assign to Crew" />
      
      <Button onClick={handleAddDevice}>Add Device</Button>
    </Form>
  </DialogContent>
</Dialog>
```

**Backend call:**
```typescript
const handleAddDevice = async (formData) => {
  try {
    await api.post('/api/devices', formData);
    toast.success('Device added!');
    refreshDeviceList();
  } catch (error) {
    toast.error('Failed to add device');
  }
};
```

---

#### **Feature 2: Battery Status Monitoring**

**Real-time battery display:**

```tsx
<div className="battery-indicator">
  {device.batteryLevel > 75 && <Battery className="text-green-500" />}
  {device.batteryLevel > 25 && device.batteryLevel <= 75 && <Battery className="text-yellow-500" />}
  {device.batteryLevel <= 25 && <BatteryLow className="text-red-500" />}
  <span>{device.batteryLevel}%</span>
</div>
```

**Auto-refresh battery levels:**
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    refreshDeviceStatus();
  }, 30000); // Every 30 seconds
  
  return () => clearInterval(interval);
}, []);
```

---

#### **Feature 3: Assign Device**

**Dialog za assignment:**

```tsx
<Button onClick={() => openAssignDialog(device)}>
  Assign
</Button>

// Dialog
<Dialog>
  <Select onChange={handleAssignToCrew}>
    {crewMembers.map(crew => (
      <option value={crew.id}>{crew.name}</option>
    ))}
  </Select>
  
  <Select onChange={handleAssignToLocation}>
    {locations.map(loc => (
      <option value={loc.id}>{loc.name}</option>
    ))}
  </Select>
</Dialog>
```

---

#### **Feature 4: Status Indicators**

**Real-time online/offline:**

```tsx
<Badge variant={device.status === 'online' ? 'success' : 'destructive'}>
  {device.status === 'online' && <Circle className="fill-green-500" />}
  {device.status === 'offline' && <Circle className="fill-gray-500" />}
  {device.status}
</Badge>

{device.lastSeen && (
  <span className="text-sm text-muted-foreground">
    Last seen: {formatDistanceToNow(device.lastSeen)} ago
  </span>
)}
```

---

### **Testing Plan:**

**Kako testirati:**

1. Idi na Device Manager page
2. Klikni "Add Device"
3. Popuni formu (Device ID: BTN-001, Name: Cabin 5 Button, etc.)
4. Submit
5. **OČEKUJEŠ:** Device se pojavljuje u listi ✅
6. Proveri battery indicator (zeleno/žuto/crveno)
7. Klikni "Assign"
8. Izaberi crew member i location
9. **OČEKUJEŠ:** Device assigned, vidiš imena u kartici ✅
10. Proveri status (online/offline)
11. **OČEKUJEŠ:** "Last seen" timestamp se update-uje ✅

**Ako sve radi → COMPLETE!** ✅

---

### **Expected Outcome:**

**Before:**
- Device Manager UI exists
- Ne radi Add Device
- Ne radi Assignment
- Status ne update-uje

**After:**
- Full CRUD operations ✅
- Real-time battery monitoring ✅
- Assign to crew/location ✅
- Status indicators working ✅
- Production-ready! ✅

---

## 📊 **SUMMARY TABELA:**

| Prioritet | Zadatak | Složenost | Vreme | Kritičnost | Impact |
|-----------|---------|-----------|-------|------------|--------|
| **#1** | Token Persistence | Visoka | 2-3h | KRITIČNO | Blocker |
| **#2** | Yacht Settings DB | Srednja | 2-3h | VAŽNO | High |
| **#3** | Dashboard Save/Load | Srednja | 1-2h | Nice-to-have | Medium |
| **#4** | Device Manager | Visoka | 3-4h | Nice-to-have | High |

**Total:** 8-12 sati rada za skuplji AI model

---

## 🎯 **PREPORUČENI WORKFLOW:**

### **Session 1 (3 hours):**
1. Token Persistence Fix (2-3h)
2. Test thoroughly

### **Session 2 (3 hours):**
3. Yacht Settings DB (2-3h)
4. Test thoroughly

### **Session 3 (2 hours):**
5. Dashboard Save/Load (1-2h)
6. Test

### **Session 4 (4 hours):**
7. Device Manager Full (3-4h)
8. Final testing

**Total:** 12 sati maksimum → **100% Demo-Ready!** 🎉

---

## 📝 **NAPOMENE ZA SKUPLJI AI:**

### **Kada radiš Token Persistence:**
- Koristi JWT standard (već postoji u backend-u)
- localStorage je OK za dev (production će biti HTTP-only cookies)
- Test refresh behavior thoroughly!
- Implement token expiry check

### **Kada radiš Yacht Settings:**
- Prisma migration MORA biti run-ovana
- Seed data je kritičan
- Test persistence after server restart!
- Validation je važna (type, timezone format, etc.)

### **Kada radiš Dashboard:**
- React-grid-layout već postoji (check package.json)
- Serializuj layout u JSON format
- Per-user saving je important!
- Test sa više usera (admin vs crew)

### **Kada radiš Device Manager:**
- WebSocket updates bi bili bonus
- Battery threshold alerts (< 20%)
- RSSI signal strength visualizacija
- Device logs istorija

---

## ✅ **FINAL CHECKLIST (Za skuplji AI):**

**Nakon što završiš SVE zadatke:**

- [ ] Token Persistence tested (refresh, 1h wait, logout)
- [ ] Yacht Settings persist after restart
- [ ] Dashboard layouts saved per user
- [ ] Device Manager CRUD working
- [ ] No console errors
- [ ] All endpoints return 200 OK
- [ ] Git committed & pushed
- [ ] Documentation updated

**Ako je SVE checked → 100% METSTRADE READY!** 🚀

---

## 💰 **COST EFFICIENCY:**

**Jeftiniji AI (ja) uradio:**
- Simple tasks: Route registration, documentation
- Vreme: 5-10 minuta
- Troškovi: ~$0.10

**Skuplji AI radi:**
- Complex tasks: Authentication, Database, React state
- Vreme: 8-12 sati
- Troškovi: ~$5-10

**Ukupno:** ~$5-10 umesto ~$15-20 (ušteda 50%!) 💰

---

**Status:** READY FOR EXPENSIVE AI  
**Prioritet lista:** CLEAR ✅  
**Documentation:** COMPLETE ✅  
**Next:** Predaj skupljem AI-ju! 🚀
