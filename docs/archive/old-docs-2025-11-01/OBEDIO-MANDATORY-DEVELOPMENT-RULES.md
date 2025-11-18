# OBEDIO MANDATORY DEVELOPMENT RULES
## OBAVEZNA PRAVILA ZA SVE PROMENE U KODU - ČITATI PRE SVAKE PROMENE!

**Datum kreiranja**: 2025-10-30
**Verzija**: 1.0.0
**Status**: MANDATORY - NE SMEŠ DA RADIŠ NA PROJEKTU BEZ PREČITANJA OVOG FAJLA!

---

## ⚠️ KRITIČNO UPOZORENJE

**Commit `8c24e96` je obrisao 46,488 linija koda i sjebao 90% aplikacije!**

Ova pravila su kreirana DA SPREČE PONAVLJANJE OVOG PROBLEMA.

**SVA PRAVILA SU OBAVEZNA - NEMA IZUZETAKA!**

---

## PRAVILO #0: PRE BILO KAKVE PROMENE

### OBAVEZAN CHECKLIST PRE SVAKE PROMENE:

- [ ] Pročitao si **MASTER-API-DOCUMENTATION.md** (diagnostics folder)
- [ ] Pročitao si ovaj fajl **od početka do kraja**
- [ ] Razumeš trenutno stanje projekta
- [ ] Imaš backup trenutnog working stanja (git commit)
- [ ] Znaš TAČNO šta menjaš i ZAŠTO

**AKO NISI ČEKIRAO SVE - NE SMEŠ DA NASTAVIŠ!**

---

## PRAVILO #1: API ENDPOINTS - BACKEND-FRONTEND SINHRONIZACIJA

### 1.1 KADA KREIRAŠKREIREM NOVI BACKEND ENDPOINT

✅ **OBAVEZNO URADITI (po redosledu)**:

1. **Kreirati route u backend/src/routes/**
   ```typescript
   // Primer: backend/src/routes/users.ts
   router.get('/', authMiddleware, requirePermission('users.view'), async (req, res) => {
     // implementation
   });
   ```

2. **Registrovati route u backend/src/server.ts**
   ```typescript
   app.use('/api/users', usersRouter);
   ```

3. **Testirati endpoint sa curl ili Postman**
   ```bash
   curl http://localhost:8080/api/users -H "Authorization: Bearer TOKEN"
   ```

4. **Dodati TypeScript tip u src/types/**
   ```typescript
   // src/types/users.ts
   export interface UserDTO {
     id: string;
     username: string;
     // ...
   }
   ```

5. **Dodati API funkciju u src/services/api.ts**
   ```typescript
   export const usersApi = {
     getAll: () => api.get<UserDTO[]>('/users'),
     // ...
   };
   ```

6. **Exportovati iz api objekta**
   ```typescript
   export const api = {
     crew: crewApi,
     guests: guestsApi, // ← NE SMEŠ ZABORAVITI OVO!
     users: usersApi,   // ← NOVO
     ...
   };
   ```

7. **Kreirati React Query hook u src/hooks/**
   ```typescript
   // src/hooks/useUsers.ts
   export function useUsers() {
     return useQuery({
       queryKey: ['users'],
       queryFn: () => api.users.getAll(),
     });
   }
   ```

8. **Update MASTER-API-DOCUMENTATION.md**
   - Dodati endpoint u dokumentaciju
   - Opisati parametre, response, permissions

❌ **NE SMEŠ**:
- Kreirati backend endpoint BEZ frontend integracije
- Kreirati frontend API poziv koji ne pokazuje na postojeći endpoint
- Zaboraviti da exportuješ API iz `api` objekta (kao što je `api.guests` bug!)
- Kreirati endpoint bez permission checka
- Kreirati endpoint bez rate limiting-a (barem na POST/PUT/DELETE)

---

### 1.2 KADA BRIŠEM BACKEND ENDPOINT

✅ **OBAVEZNO URADITI (po redosledu)**:

1. **PRVO PROVERI: Ko koristi ovaj endpoint?**
   ```bash
   # Search u frontend kodu
   grep -r "api/endpoint-path" src/
   ```

2. **AKO NEKO KORISTI - NE SMEŠ OBRISATI!**
   - Prvo obrisi frontend pozive
   - Zatim obrisi backend endpoint

3. **Obrisi route iz backend/src/routes/**

4. **Obrisi registraciju iz server.ts**

5. **Obrisi API funkciju iz src/services/api.ts**

6. **Obrisi React Query hook iz src/hooks/**

7. **Update MASTER-API-DOCUMENTATION.md**
   - Označi endpoint kao DELETED
   - Dokumentuj zašto je obrisan

❌ **NE SMEŠ**:
- Obrisati backend endpoint bez provjere frontend koda
- Obrisati endpoint dok ga frontend još koristi
- Zaboraviti da obrišeš API funkcije i hookove

---

## PRAVILO #2: DATABASE SCHEMA PROMENE

### 2.1 KADA MIJENJAM PRISMA SCHEMA

✅ **OBAVEZNO URADITI (po redosledu)**:

1. **BACKUP DATABASE PRE BILO ČEGA!**
   ```bash
   npm run backup:create
   ```

2. **Izmeni schema.prisma**
   ```prisma
   model User {
     // promene
   }
   ```

3. **PROVERI ENUM FORMAT**
   - Koristi underscore u schema: `on_duty`
   - Mapuj na dash format: `@map("on-duty")`
   - Primjer:
     ```prisma
     enum CrewMemberStatus {
       active
       on_duty  @map("on-duty")  // ← OVO JE PRAVILNO!
       off_duty @map("off-duty")
       on_leave @map("on-leave")
     }
     ```

4. **Kreiraj migration**
   ```bash
   npx prisma migrate dev --name describe_change
   ```

5. **PREGLED MIGRATION FAJLA**
   - Otvori migration fajl u `backend/prisma/migrations/`
   - Proveri da nema duplikatnih constraint-a
   - Proveri da su enum vrednosti konzistentne

6. **Testiraj migration na test database**
   ```bash
   # Copy production DB
   # Apply migration
   # Test queries
   ```

7. **Update seed fajlove**
   - Ako si dodao nove enume, update seed.ts
   - Koristi DASH format: `status: 'on-leave'` (NE underscore!)

8. **Update TypeScript tipove u src/types/**

9. **Regeneriši Prisma Client**
   ```bash
   npx prisma generate
   ```

10. **Update MASTER-API-DOCUMENTATION.md**
    - Dodaj novi model/polje u dokumentaciju

❌ **NE SMEŠ**:
- Mijenjati schema bez migracije
- Kreirati migraciju bez backup-a
- Koristiti underscore format u seed fajlovima (`on_leave` je POGREŠNO!)
- Zaboraviti `npx prisma generate`
- Kreirati duplikatne constraint-e
- Mijenjati enum vrednosti bez provere postojećih podataka

---

### 2.2 ENUM VALUES - KRITIČNO PRAVILO!

**PROBLEM**: Prisma koristi underscore (`on_duty`), database koristi dash (`on-duty`)

✅ **PRAVILNO**:

**U schema.prisma**:
```prisma
enum CrewMemberStatus {
  active
  on_duty  @map("on-duty")  // ← underscore sa @map
  off_duty @map("off-duty")
  on_leave @map("on-leave")
}
```

**U seed.ts**:
```typescript
status: 'on-leave', // ← DASH format (kao u database!)
```

**U TypeScript kodu**:
```typescript
if (crewMember.status === 'on-leave') { // ← DASH format
  // ...
}
```

❌ **POGREŠNO**:
```typescript
// NE KORISTITI underscore u seed ili TypeScript kodu!
status: 'on_leave', // ← POGREŠNO!
```

---

## PRAVILO #3: AUTHENTICATION & PERMISSIONS

### 3.1 SVAKI ENDPOINT MORA IMATI AUTH

✅ **OBAVEZNO**:

```typescript
import { authMiddleware, requirePermission } from '../middleware/auth';

// Svi endpoints (osim auth) moraju imati authMiddleware
router.get('/', authMiddleware, async (req, res) => {
  // implementation
});

// Write operations moraju imati permission check
router.post('/', authMiddleware, requirePermission('resource.create'), async (req, res) => {
  // implementation
});

router.put('/:id', authMiddleware, requirePermission('resource.edit'), async (req, res) => {
  // implementation
});

router.delete('/:id', authMiddleware, requirePermission('resource.delete'), async (req, res) => {
  // implementation
});
```

❌ **IZUZECI (samo ovi endpoints ne trebaju auth)**:
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/verify`
- `POST /api/auth/setup-password`
- `GET /api/system-settings/health` (health check)

❌ **NE SMEŠ**:
- Kreirati endpoint bez `authMiddleware`
- Kreirati POST/PUT/DELETE bez `requirePermission`
- Koristiti samo auth bez permission check na sensitive operacije

---

### 3.2 RATE LIMITING - OBAVEZNO NA SVIM WRITE OPERATIONS

✅ **OBAVEZNO**:

```typescript
import { generalRateLimiter, strictRateLimiter } from '../middleware/rate-limiter';

// POST/PUT/DELETE moraju imati rate limiting
router.post('/', generalRateLimiter, authMiddleware, requirePermission(...), async (req, res) => {
  // implementation
});

// Resource-intensive operations koriste strict rate limiting
router.post('/backup/create', strictRateLimiter, authMiddleware, requirePermission(...), async (req, res) => {
  // implementation
});

// External API calls (kao OpenAI) MORAJU imati strict rate limiting
router.post('/transcribe', strictRateLimiter, authMiddleware, requirePermission(...), async (req, res) => {
  // implementation
});
```

**Rate Limiting Pravila**:
- **generalRateLimiter**: 100 requests / 15 min (default za POST/PUT/DELETE)
- **strictRateLimiter**: 10 requests / 15 min (za resource-intensive ops)
- **loginLimiter**: 5 failed attempts / 15 min (samo za login)

❌ **NE SMEŠ**:
- Kreirati POST/PUT/DELETE bez rate limiting-a
- Kreirati endpoint koji poziva external API bez strict rate limiting-a
- Kreirati file upload endpoint bez rate limiting-a

---

## PRAVILO #4: INPUT VALIDATION

### 4.1 SVAKI POST/PUT MORA IMATI VALIDATION

✅ **OBAVEZNO**:

1. **Kreiraj Zod schema u backend/src/validators/schemas.ts**
   ```typescript
   import { z } from 'zod';

   export const createUserSchema = z.object({
     username: z.string().min(3).max(50),
     email: z.string().email(),
     password: z.string().min(8),
     role: z.enum(['admin', 'chief-stewardess', 'stewardess', 'crew', 'eto']),
   });
   ```

2. **Koristi validate middleware**
   ```typescript
   import { validate } from '../middleware/validation';

   router.post('/',
     authMiddleware,
     requirePermission('users.create'),
     validate(createUserSchema), // ← VALIDATION
     async (req, res) => {
       // req.body je validiran!
     }
   );
   ```

❌ **NE SMEŠ**:
- Kreirati POST/PUT bez input validacije
- Vjerovati frontend validaciji (uvijek validuj na backend-u!)
- Koristiti `any` tip za request body

---

## PRAVILO #5: ERROR HANDLING

### 5.1 SVE GREŠKE MORAJU BITI HANDLED

✅ **OBAVEZNO**:

```typescript
import { asyncHandler } from '../utils/async-handler';

// Wrap svaki route handler sa asyncHandler
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const data = await prisma.user.findMany();

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Not found'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    // asyncHandler će automatski catch-ovati
    throw error;
  }
}));
```

**Response Format - UVIJEK OVAJ FORMAT**:
```typescript
// Success response
{
  "success": true,
  "data": { ... }
}

// Error response
{
  "success": false,
  "error": "Error message"
}
```

❌ **NE SMEŠ**:
- Kreirati endpoint bez error handling-a
- Vraćati različite response formate (uvijek success/data ili success/error)
- Logirati error-e bez context-a

---

## PRAVILO #6: WEBSOCKET EVENTS

### 6.1 KADA EMITUJEŠ WEBSOCKET EVENT

✅ **OBAVEZNO**:

```typescript
import { websocketService } from '../services/websocket';

// Emituj event nakon database promene
await prisma.serviceRequest.create({ ... });
websocketService.emitServiceRequestUpdate(newRequest);

// Emituj specific event, ne generic
websocketService.emit('service-request:new', newRequest); // ✅ OK
websocketService.emit('update', data); // ❌ POGREŠNO - previše generic
```

**Naming Convention za WebSocket events**:
- Format: `resource:action`
- Primjeri: `service-request:new`, `crew:updated`, `device:telemetry`
- NE koristi generic imena: `update`, `change`, `data`

❌ **NE SMEŠ**:
- Emitovati event bez jasnog naziva
- Zaboraviti da emituješ event nakon database promene
- Emitovati sensitive data (passwords, tokens) preko WebSocket-a

---

## PRAVILO #7: MQTT INTEGRATION

### 7.1 KADA MIJENJAM MQTT TOPICS

✅ **OBAVEZNO**:

1. **Update backend/src/services/mqtt.service.ts**
   ```typescript
   mqttClient.subscribe('obedio/button/+/press');
   ```

2. **Update hardware firmware (ESP32)**
   ```cpp
   mqttClient.publish("obedio/button/BTN-001/press", payload);
   ```

3. **Dokumentuj novi topic u MASTER-API-DOCUMENTATION.md**

**MQTT Topic Naming Convention**:
- Format: `obedio/{deviceType}/{deviceId}/{action}`
- Primjer: `obedio/button/BTN-001/press`
- NE koristi razmake ili specijalne karaktere

❌ **NE SMEŠ**:
- Mijenjati MQTT topics bez update-a firmware-a
- Koristiti wildcard subscribe bez validacije
- Slati sensitive data preko MQTT-a bez encryption-a

---

## PRAVILO #8: FRONTEND - REACT QUERY HOOKS

### 8.1 SVAKI API POZIV MORA IĆI KROZ HOOK

✅ **OBAVEZNO**:

```typescript
// src/hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => api.users.getAll(),
    staleTime: 30000, // 30 seconds
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserDTO) => api.users.create(data),
    onSuccess: () => {
      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: ['users'] });
      // Show success toast
      toast.success('User created successfully');
    },
    onError: (error) => {
      // Show error toast
      toast.error(error.message);
    },
  });
}
```

**React Query Best Practices**:
- Koristi query keys: `['resource']`, `['resource', id]`
- Invalidate cache nakon mutations
- Set staleTime za less frequent updates
- Show loading/error states u UI

❌ **NE SMEŠ**:
- Pozivati `api.*` direktno iz komponenti (uvijek kroz hook)
- Zaboraviti invalidateQueries nakon mutation
- Imati duplicate query keys

---

## PRAVILO #9: GIT WORKFLOW

### 9.1 COMMIT RULES

✅ **OBAVEZNO**:

1. **PRIJE COMMIT-A**:
   ```bash
   # Provjeri šta committuješ
   git status
   git diff

   # Run tests
   npm test

   # Run linter
   npm run lint

   # Run type check
   npm run type-check
   ```

2. **Commit Message Format**:
   ```
   [type]: Short description

   - Detailed change 1
   - Detailed change 2
   - Breaking changes (if any)

   Affected files:
   - backend/src/routes/users.ts
   - src/hooks/useUsers.ts
   ```

   **Types**: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

3. **SMALL COMMITS**:
   - Max 10-15 fajlova po commit-u
   - Jedan feature = jedan commit
   - NE commituj 420 fajlova odjednom! (kao commit 8c24e96)

❌ **NE SMEŠ**:
- Commitovati bez provjere šta committuješ
- Commitovati 100+ fajlova odjednom
- Commitovati broken kod
- Commitovati bez commit message-a

---

### 9.2 BRANCH STRATEGY

✅ **OBAVEZNO**:

```bash
# Feature development
git checkout -b feature/user-management
# Make changes
git commit -m "feat: Add user management endpoints"
git push origin feature/user-management
# Create PR

# Bug fix
git checkout -b fix/guest-api-export
git commit -m "fix: Export api.guests in api.ts"
git push origin fix/guest-api-export
```

**Branch Naming**:
- `feature/` - nove feature-e
- `fix/` - bug fix-evi
- `refactor/` - refactoring
- `docs/` - dokumentacija

❌ **NE SMEŠ**:
- Raditi direktno na `main` branch-u
- Push-ovati na `main` bez code review-a
- Merge-ovati bez testing-a

---

## PRAVILO #10: TESTING

### 10.1 WRITE TESTS ZA KRITIČNE ENDPOINTS

✅ **OBAVEZNO**:

```typescript
// backend/src/tests/users.test.ts
import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import { app } from '../server';

describe('User API', () => {
  it('should get all users', async () => {
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${testToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('should create user', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'crew',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.username).toBe('testuser');
  });
});
```

**Testing Prioriteti**:
1. Auth endpoints (login, refresh, verify)
2. CRUD operations (create, read, update, delete)
3. Permission checks
4. Input validation
5. Error handling

❌ **NE SMEŠ**:
- Deploy-ovati bez testiranja
- Mijenjati kritične endpoints bez testova
- Pisati testove koji ne testiraju ništa

---

## PRAVILO #11: DOKUMENTACIJA

### 11.1 UPDATE DOKUMENTACIJU NAKON SVAKE PROMENE

✅ **OBAVEZNO UPDATE-OVATI**:

1. **MASTER-API-DOCUMENTATION.md** (diagnostics folder)
   - Dodaj novi endpoint
   - Označi stare endpoints kao deprecated
   - Dokumentuj breaking changes

2. **README.md** (project root)
   - Update setup instructions ako se promijenio process
   - Update dependencies

3. **Code Comments**
   ```typescript
   /**
    * Creates a new user account
    * @param data - User creation data
    * @returns Created user object
    * @throws 400 if validation fails
    * @throws 409 if username already exists
    */
   async createUser(data: CreateUserDTO): Promise<User> {
     // implementation
   }
   ```

❌ **NE SMEŠ**:
- Mijenjati API bez update-a dokumentacije
- Ostaviti zastarjelu dokumentaciju
- Pisati kod bez comment-a na kompleksnim dijelovima

---

## PRAVILO #12: SECURITY

### 12.1 SECURITY CHECKLIST

✅ **OBAVEZNO PROVJERITI**:

- [ ] Auth middleware na svim endpoints (osim public)
- [ ] Permission checks na write operations
- [ ] Rate limiting na svim POST/PUT/DELETE
- [ ] Input validation sa Zod
- [ ] SQL injection protection (koristi Prisma, NE raw SQL)
- [ ] XSS protection (sanitize input)
- [ ] CORS pravilno konfigurisan
- [ ] Secrets u .env fajlu (NE u kodu!)
- [ ] API keys validirani
- [ ] Passwords hash-ovani (bcrypt)

❌ **NE SMEŠ**:
- Hard-codirati passwords ili API keys
- Logirati sensitive data (passwords, tokens)
- Vraćati sensitive data u API responses (passwords)
- Koristiti GET za sensitive operations (uvijek POST)

---

## PRAVILO #13: DEPENDENCY MANAGEMENT

### 13.1 PRIJE DODAVANJA NOVE DEPENDENCY

✅ **OBAVEZNO PROVJERITI**:

1. **Da li već postoji sličan package?**
   ```bash
   npm list | grep "similar-package"
   ```

2. **Da li je package maintained?**
   - Check last update na npm
   - Check GitHub issues
   - Check download count

3. **Security vulnerabilities?**
   ```bash
   npm audit
   ```

4. **Bundle size?**
   - Check na bundlephobia.com
   - Ne dodavaj heavy packages za simple funkcionalnosti

5. **License?**
   - Mora biti MIT, Apache, ili BSD
   - NE koristi GPL u commercial projektu

❌ **NE SMEŠ**:
- Dodavati package bez provjere
- Koristi deprecated packages
- Ignore-ovati `npm audit` warnings

---

## PRAVILO #14: PERFORMANCE

### 14.1 PERFORMANCE BEST PRACTICES

✅ **OBAVEZNO**:

1. **Database Queries**:
   ```typescript
   // ✅ DOBRO - sa pagination
   const users = await prisma.user.findMany({
     take: 50,
     skip: (page - 1) * 50,
     include: { crewMember: true },
   });

   // ❌ LOŠE - bez limita
   const users = await prisma.user.findMany({
     include: { crewMember: true },
   });
   ```

2. **N+1 Queries**:
   ```typescript
   // ✅ DOBRO - sa include
   const requests = await prisma.serviceRequest.findMany({
     include: {
       guest: true,
       location: true,
       assignedCrew: true,
     },
   });

   // ❌ LOŠE - N+1 queries
   const requests = await prisma.serviceRequest.findMany();
   for (const request of requests) {
     const guest = await prisma.guest.findUnique({ where: { id: request.guestId } });
   }
   ```

3. **Indexi**:
   - Dodaj index na sve FK columns
   - Dodaj index na často search-ovane columns
   - Check query performance sa EXPLAIN

❌ **NE SMEŠ**:
- Pisati N+1 queries
- Fetch-ovati sve podatke bez pagination
- Ignore-ovati slow query warnings

---

## PRAVILO #15: CODE STYLE

### 15.1 TYPESCRIPT BEST PRACTICES

✅ **OBAVEZNO**:

```typescript
// ✅ DOBRO - eksplicitan type
interface User {
  id: string;
  username: string;
  email: string;
}

function getUser(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

// ❌ LOŠE - any type
function getUser(id: any): Promise<any> {
  return prisma.user.findUnique({ where: { id } });
}
```

**TypeScript Pravila**:
- NE koristi `any` (koristi `unknown` ako ne znaš tip)
- Definiši interfaces za sve API responses
- Koristi enums za konstante
- Enable `strict` mode u tsconfig.json

---

## SUMMARY - TOP 10 NAJVAŽNIJIH PRAVILA

1. **BACKUP PRIJE SVEGA** - git commit, database backup
2. **BACKEND + FRONTEND SINHRONIZACIJA** - svaki backend endpoint mora imati frontend integraciju
3. **EXPORT API FUNCTIONS** - ne zaboravi export iz `api` objekta!
4. **AUTH + PERMISSIONS + RATE LIMITING** - obavezno na svim endpoints
5. **INPUT VALIDATION** - Zod schemas za sve POST/PUT
6. **ERROR HANDLING** - uvijek isti response format
7. **ENUM FORMAT** - dash u database (`on-leave`), ne underscore (`on_leave`)
8. **SMALL COMMITS** - max 10-15 fajlova, ne 420!
9. **TESTIRANJE** - testiraj prije commit-a
10. **DOKUMENTACIJA** - update MASTER-API-DOCUMENTATION.md nakon svake promene

---

## NAKON ČITANJA OVOG FAJLA

✅ **SADA MOŽEŠ**:
- Raditi na projektu
- Kreirati nove endpoints
- Mijenjati database schema
- Commit-ovati promene

❌ **ALI ZAPAMTI**:
- Svaka promjena mora pratiti ova pravila
- Nema izuzetaka
- Ako nešto nisi siguran - pitaj prije nego što uradiš

---

## LINKS

- **Master API Documentation**: [diagnostics/MASTER-API-DOCUMENTATION.md](diagnostics/MASTER-API-DOCUMENTATION.md)
- **Git History**: Pogledaj commit `8c24e96` da vidiš šta NE TREBA RADITI!
- **Project README**: [README.md](README.md)

---

---

## PRAVILO #16: PAGE-BY-PAGE WORKFLOW ⭐ NOVO!

### 16.1 KAKO RADIMO STRANICU PO STRANICU

✅ **OBAVEZNI PROCES**:

**FAZA 1: PRIPREMA**
1. User kaže: "Radimo na Crew stranici"
2. Claude MORA kreirati tracking listu za tu stranicu
3. Claude MORA provjeriti sve API endpoints za tu stranicu
4. Claude MORA pročitati trenutni kod stranice

**FAZA 2: IMPLEMENTACIJA**
1. Claude radi SAMO na toj stranici (ne dira druge stranice!)
2. Claude ažurira API tracker u realnom vremenu
3. Claude testira svaku funkcionalnost prije nego što kaže "gotovo"
4. Claude NE dira kod koji već radi

**FAZA 3: POTVRDA**
1. User testira stranicu
2. User kaže "Ovo radi" ili "Ovo ne radi"
3. Ako radi → Claude dodaje ZELENU boju u frontend
4. Ako ne radi → Claude fixuje, pa opet User testira

**FAZA 4: LOCK**
1. Kada User potvrdi da sve radi → stranica je **LOCKED** 🔒
2. Claude VIŠE NE DIRA taj kod
3. Claude dodaje zelenu boju u tekst komponenti
4. Claude prelazi na sljedeću stranicu

❌ **NE SMEŠ**:
- Raditi na više stranica odjednom
- Reći "gotovo" prije nego što User testira
- Dodati zelenu boju prije nego što User potvrdi
- Dirati kod koji je LOCKED
- Pretpostavljati da nešto radi - User MORA testirati!

---

## PRAVILO #17: VISUAL CONFIRMATION SYSTEM ⭐ NOVO!

### 17.1 ZELENA BOJA = POTVRĐENO I ZAVRŠENO

✅ **KAKO OZNAČAVAM DA JE GOTOVO**:

```typescript
// PRIJE (nepotvrđeno):
<h1 className="text-2xl font-bold">Crew Management</h1>

// POSLIJE (User potvrdio da radi):
<h1 className="text-2xl font-bold text-green-600">Crew Management</h1>
//                              ^^^^^^^^^^^^^^^^ Dodato nakon potvrde!
```

**Pravila za zelenu boju**:
- **SAMO tekst** dobija zelenu boju (`text-green-600`)
- Dodaje se **SAMO nakon** što User testira i kaže "radi"
- Označava se **cela komponenta** ili **deo stranice** koji radi
- Primeri:
  - Naslov stranice: `<h1 className="...text-green-600">`
  - Button tekst: `<button className="..."><span className="text-green-600">Save</span></button>`
  - Card title: `<CardTitle className="text-green-600">Statistics</CardTitle>`

❌ **NE SMEŠ**:
- Dodati zelenu boju bez potvrde od User-a
- Mijenjati zelene komponente (one su LOCKED!)
- Koristiti drugu boju osim `text-green-600`
- Dodati zelenu boju na background ili border (samo text!)

---

## PRAVILO #18: NO LOCALSTORAGE & NO HARDCODE ⭐ NOVO!

### 18.1 ZABRANJEN LOCALSTORAGE (osim auth tokena)

✅ **DOZVOLJENO**:
```typescript
// Samo za auth token - ništa drugo!
localStorage.setItem('auth_token', token);
localStorage.getItem('auth_token');
```

❌ **ZABRANJENO**:
```typescript
// ❌ NE SMEŠ čuvati data u localStorage
localStorage.setItem('guests', JSON.stringify(guests)); // ZABRANJENO!
localStorage.setItem('crew', JSON.stringify(crew));     // ZABRANJENO!
localStorage.setItem('settings', JSON.stringify(settings)); // ZABRANJENO!

// ❌ NE SMEŠ čitati mock data iz localStorage
const guests = JSON.parse(localStorage.getItem('guests') || '[]'); // ZABRANJENO!
```

**PRAVILO**: Svi podaci MORAJU ići iz database preko API-ja!

---

### 18.2 ZABRANJEN HARDCODE

✅ **PRAVILNO**:
```typescript
// Fetch from API
const { data: crew } = useQuery({
  queryKey: ['crew'],
  queryFn: () => api.crew.getAll()
});
```

❌ **ZABRANJENO**:
```typescript
// ❌ NE SMEŠ hardcodovati podatke u komponenti
const crew = [
  { id: '1', name: 'Maria', position: 'Stewardess' }, // ZABRANJENO!
  { id: '2', name: 'John', position: 'Butler' },      // ZABRANJENO!
];

// ❌ NE SMEŠ hardcodovati default vrednosti koje dolaze iz baze
const defaultStatus = 'active'; // ZABRANJENO ako treba iz database!
```

**IZUZECI** (samo ovo je dozvoljeno):
- UI konstante: `const ITEMS_PER_PAGE = 25;`
- Tailwind klase: `const buttonClass = "px-4 py-2 bg-blue-500";`
- Validation konstante: `const MIN_PASSWORD_LENGTH = 8;`

❌ **NE SMEŠ**:
- Hardcodovati business data (crew, guests, locations, itd.)
- Hardcodovati default vrednosti koje dolaze iz database
- Koristiti mock data osim za testing

---

## PRAVILO #19: BEFORE TOUCHING ANY CODE ⭐ NOVO!

### 19.1 OBAVEZAN CHECKLIST PRIJE BILO KAKVE PROMJENE

**PRIJE NEGO ŠTO POČNEM DA RADIM** - moram da prođem kroz ovaj checklist:

```markdown
✅ PRE-WORK CHECKLIST (za Claude):

- [ ] Da li sam pročitao OBEDIO-MANDATORY-DEVELOPMENT-RULES.md?
- [ ] Da li znam TAČNO šta User traži?
- [ ] Da li sam provjerio koje API endpoints postoje?
- [ ] Da li sam pročitao trenutni kod stranice/komponente?
- [ ] Da li sam kreirao tracking listu za ovu stranicu?
- [ ] Da li radim samo na JEDNOJ stranici/feature-u?
- [ ] Da li sam siguran da neću dirati kod koji već radi?
- [ ] Da li sam provjerio da ne koristim localStorage (osim auth)?
- [ ] Da li sam provjerio da nema hardcode-ovanih podataka?
- [ ] Da li će User moći da testira ono što radim?

AKO NISAM ČEKIRAO SVE - NE SMEŠ NASTAVITI!
```

❌ **NE SMEŠ**:
- Početi da radiš bez čekiranja ovog checklist-a
- Skip-ovati bilo koji korak
- Pretpostavljati da nešto radi

---

## PRAVILO #20: API TRACKING & TRANSPARENCY ⭐ NOVO!

### 20.1 API TRACKER - MOJA LIČNA LISTA

**SISTEM TRACKING-A**:

Claude koristi **TodoWrite tool** za tracking:

```markdown
✅ TODO LIST - CREW PAGE

🔴 NOT STARTED
- GET /api/crew - List all crew members

🟡 IN PROGRESS (radim SADA)
- POST /api/crew - Create crew member

🟢 COMPLETED (User potvrdio)
- GET /api/guests - List guests

⛔ LOCKED (User rekao NE DIRAJ!)
- GET /api/auth/login - Ne dirati auth!
```

**Status legend**:
- 🔴 **NOT STARTED** - Nisam još radio na ovome
- 🟡 **IN PROGRESS** - Radim na ovome TRENUTNO
- 🟢 **COMPLETED** - User je testirao i potvrdio da radi - **NE DIRAM VIŠE!**
- ⛔ **LOCKED** - User je eksplicitno rekao "NE DIRAJ" - **ZABRANJENO!**

**Pravila tracking-a**:
1. Update tracking ODMAH nakon što završim task
2. NE prelazim na novi task dok User ne testira prethodni
3. NE mijenjam status u COMPLETED dok User ne potvrdi
4. LOCKED status znači - **NIKAD VIŠE NE DIRAM TAJ KOD**

❌ **NE SMEŠ**:
- Raditi bez tracking liste
- Preskočiti update tracking-a
- Označiti nešto kao COMPLETED prije User potvrde
- Dirati LOCKED kod

---

## PRAVILO #21: COMMUNICATION & QUESTIONS ⭐ NOVO!

### 21.1 KADA NE ZNAM NEŠTO - PITAM!

✅ **OBAVEZNO PITAJ**:

1. **Ako ne razumiješ zahtjev**:
   ```
   "Nisam siguran da razumijem - da li želiš da:
   - Opcija A: ...
   - Opcija B: ...
   Koja opcija je tačna?"
   ```

2. **Ako nešto ne postoji u bazi**:
   ```
   "Tabela X nema polje Y u database schema.
   Da li da:
   - Kreiram migraciju za dodavanje polja?
   - Koristim postojeće polje Z?"
   ```

3. **Ako bi promjena mogla da破ま neš **:
   ```
   "Ova promjena bi mogla da utiče na:
   - Feature A
   - Feature B
   Da li da nastavim ili da prvo fixujem ovo?"
   ```

❌ **NE SMEŠ**:
- Pretpostavljati šta User želi
- Raditi nešto "na svoju ruku" bez potvrde
- Dirati kod koji User nije eksplicitno spomenuo
- Ignorisati nejasne zahtjeve

---

## PRAVILO #22: FIXING BUGS - SYSTEMATIC APPROACH ⭐ NOVO!

### 22.1 KAKO FIXUJEM BUG-OVE

✅ **SISTEMATSKI PRISTUP**:

**KORAK 1: REPRODUCE**
```typescript
// Prvo moram da REPRODUKUJEM bug
// Testiram API endpoint sa curl ili Postman
curl http://localhost:8080/api/crew -H "Authorization: Bearer TOKEN"
```

**KORAK 2: IDENTIFY**
```typescript
// Identifikujem TAČNU lokaciju bug-a
// - Koji fajl?
// - Koja linija?
// - Šta je očekivano vs šta se dešava?
```

**KORAK 3: FIX**
```typescript
// Fixujem bug sa MINIMALNOM promjenom
// NE refactor-ujem ceo fajl!
// NE diram kod koji nije povezan sa bug-om!

// ✅ DOBRO - minimalna promjena
status: 'PENDING' → status: 'pending'

// ❌ LOŠE - refactor-ujem ceo fajl
```

**KORAK 4: TEST**
```typescript
// Testiram fix
// - API poziv radi?
// - Frontend prikazuje tačno?
// - Nisam polomio nešto drugo?
```

**KORAK 5: REPORT**
```
"Fixed bug u database.ts:68
- Promjena: 'PENDING' → 'pending'
- Razlog: Database ima lowercase enum
- Testirano: API vraća tačne rezultate
- User: Molim te testiraj da potvrdiš"
```

❌ **NE SMEŠ**:
- Fixovati bug bez reprodukovanja
- Refactor-ovati dok fixuješ bug
- Dirati više fajlova nego što je potrebno
- Reći "fixed" bez testiranja

---

## SUMMARY - TOP 5 NOVIH PRAVILA ⭐

### MUST FOLLOW - NEMA IZUZETAKA:

1. **PAGE-BY-PAGE**: Radim samo na JEDNOJ stranici dok User ne potvrdi da radi
2. **ZELENA BOJA**: Dodajem `text-green-600` SAMO nakon što User testira i potvrdi
3. **NO LOCALSTORAGE/HARDCODE**: Svi podaci iz database preko API-ja (osim auth token)
4. **CHECKLIST FIRST**: Moram proći kroz checklist PRIJE bilo koje promjene
5. **LOCKED = LOCKED**: Kada User potvrdi da radi → NE DIRAM VIŠE TAJ KOD!

---

**KRAJ PRAVILA - SADA RADIM SISTEMATSKI I PAŽLJIVO!**

---

## PRAVILO #23: SERVER SOFTWARE ARCHITECTURE ⭐ KRITIČNO!

**OBEDIO je SERVER SOFTWARE - sistem radi 24/7 nezavisno od frontend-a**

### 23.1 OSNOVNI PRINCIP

```
❌ POGREŠNO: Frontend je "controller", Backend je "storage"
✅ ISPRAVNO: Backend je "brain", Frontend je "dashboard"
```

**Sistem MORA raditi čak i kad niko nije ulogovan na frontend!**

---

### 23.2 ŠTA MORA BITI NA BACKEND-U

✅ **BUSINESS LOGIC**:
- Duty status calculation (ko je trenutno on duty)
- Assignment validation (može li crew member da bude assigned)
- Auto-routing logic (gde ide service request)
- Escalation rules (šta kad nema odgovora)
- Notification rules (ko prima notifikaciju i kada)

✅ **BACKGROUND PROCESSING**:
- Cron jobs (shift start/end notifications)
- Schedulers (auto-cleanup, reports, archiving)
- Auto-notifications (bez user interakcije)
- Device sync (devices pull data from server)
- Real-time processing (guest call buttons → crew devices)

✅ **SOURCE OF TRUTH**:
- Duty status (backend zna ko je on duty)
- Service request routing (backend odlučuje assignment)
- Notifications (backend šalje, ne frontend)
- Device statuses (backend tracka)
- Activity logs (backend loguje sve)

✅ **VALIDACIJA I PERMISIJE**:
- Sve validacije (prevent on-leave crew assignment)
- Permission checks (ko sme šta)
- Data integrity (optimistic locking, version checks)
- Conflict resolution (concurrent edits)

---

### 23.3 ŠTA MOŽE BITI NA FRONTEND-U

✅ **UI STATE**:
- Search filters
- Sort order
- Dialog open/close state
- Form validation (UX only - backend mora re-validate!)
- Pagination state

✅ **VIEW LOGIC (Derived State)**:
- Formatting datuma za prikaz
- Color coding
- Sorting i filtering (nad već učitanim podacima)
- UI calculations (progress bars, percentages)
- ⚠️ **SAMO AKO** podaci već postoje na frontend-u

✅ **WORKING COPY (Explicit Save Pattern)**:
- Duty Roster editing (local copy → save → sync)
- Form drafts (before submit)
- Multi-step wizards (temp state before final save)
- ⚠️ **SA USLOVOM**: Backend ima final validation i optimistic locking

---

### 23.4 TRENUTNI PROBLEMI - ACTION ITEMS

❌ **PROBLEM 1: Backend Duty Status Service**
- Frontend računa duty status u AppDataContext.tsx:564-715
- Backend ne zna ko je on duty
- Notifications ne mogu da rade automatski

**Rešenje:**
```typescript
// Backend endpoint:
GET /api/crew/duty-status/current
Response: {
  onDuty: [...],
  backup: [...],
  nextShift: [...],
  currentShift: {...}
}

// Backend scheduler (cron - every 1 minute):
- Proveri trenutni shift
- Update duty status u bazi
- Šalje notifications za shift start/end
- Emit WebSocket update
```

Files to create/modify:
- [ ] Backend: `src/routes/duty-status.ts` (NEW)
- [ ] Backend: `src/services/duty-scheduler.ts` (NEW)
- [ ] Frontend: Remove `getCurrentDutyStatus` logic from AppDataContext
- [ ] Frontend: Replace with API call `useDutyStatus()` hook

---

❌ **PROBLEM 2: WebSocket Real-Time Updates**
- Backend šalje WebSocket notifikaciju (crew.ts:129-131)
- Frontend NE OSLUŠKUJE
- Crew status changes nisu real-time

**Rešenje:**
```typescript
// Frontend - add listener:
useEffect(() => {
  socket.on('crew:status-changed', (data) => {
    queryClient.invalidateQueries(['crew-members']);
    toast.info(`${data.name} is now ${data.status}`);
  });
}, []);
```

Files to modify:
- [ ] Frontend: `src/components/pages/crew-list.tsx` - add WebSocket listener
- [ ] Frontend: `src/hooks/useWebSocket.ts` - add event types

---

❌ **PROBLEM 3: Service Request Auto-Routing**
- Service request routing logic ne postoji na backend-u
- Mora manual assignment

**Rešenje:**
```typescript
// Backend: Kad stigne guest request
POST /api/service-requests (from device)

// Backend automatski:
1. Fetch current duty status
2. Route na on-duty crew member
3. Šalje notification na device
4. Start timer za escalation
```

Files to create/modify:
- [ ] Backend: `src/routes/service-requests.ts` - add auto-routing
- [ ] Backend: `src/services/request-router.ts` (NEW)
- [ ] Backend: `src/services/notification-service.ts` (enhance)

---

❌ **PROBLEM 4: Backend Validation**
- Assignment validation na frontend-u (crew-list.tsx:191-196)
- Moguće zaobići

**Rešenje:**
```typescript
// Backend: POST /api/assignments validation
if (crewMember.status === 'on-leave') {
  throw new BadRequestError('Crew member is on leave');
}
```

Files to modify:
- [ ] Backend: `src/routes/assignments.ts` - add validation
- [ ] Frontend: Remove client-side validation, rely on backend errors

---

❌ **PROBLEM 5: Optimistic Locking**
- No version check na update (crew.ts:121-124)
- Concurrent edits = data loss

**Rešenje:**
```typescript
// Backend: Add version check
const crewMember = await prisma.crewMember.update({
  where: {
    id: req.params.id,
    updatedAt: req.body.expectedVersion
  },
  data: req.body,
});
```

Files to modify:
- [ ] Backend: `src/routes/crew.ts` - add version check
- [ ] Backend: `src/routes/assignments.ts` - add version check
- [ ] Frontend: Pass `updatedAt` in update requests

---

### 23.5 DESIGN PATTERNS

**Pattern 1: Backend-First Data Flow**
```
✅ CORRECT:
Device/API → Backend → Validation → Database → WebSocket → Frontend

❌ WRONG:
Frontend → Calculate → Display (without backend knowing)
```

**Pattern 2: Working Copy (Explicit Save)**
```
✅ CORRECT (Duty Roster):
1. Fetch from API → local working copy
2. Edit locally (drag & drop)
3. Save button → POST to backend
4. Backend validates → saves → returns updated data
5. Frontend syncs with response

⚠️ REQUIREMENTS:
- Backend must validate all changes
- Backend must have optimistic locking
- Frontend must handle conflicts (409 Conflict)
```

**Pattern 3: Real-Time Updates**
```
✅ CORRECT:
Backend Event → WebSocket Emit → Frontend Listener → React Query Invalidate → UI Update

❌ WRONG:
Polling every X seconds (waste of resources)
```

---

### 23.6 TEST SCENARIOS

**Test 1: Frontend Closed**
```
1. Zatvori browser / logout
2. Guest pritisne call button
3. OČEKIVANO: Crew member prima notification na device
4. OČEKIVANO: Service request je assigned
5. OČEKIVANO: Logs se zapisuju
```

**Test 2: Shift Auto-Start**
```
1. Shift počinje u 06:00
2. OČEKIVANO: U 05:45 crew dobija notifikaciju "Shift starts in 15min"
3. OČEKIVANO: U 06:00 duty status se auto-update-uje
4. OČEKIVANO: Devices se sync-uju sa novim duty roster-om
```

**Test 3: Multi-User Conflict**
```
1. User A edituje crew member #1
2. User B edituje istog crew member #1
3. User A save-uje prvo
4. User B save-uje nakon
5. OČEKIVANO: User B dobija error "Conflict - data changed, please refresh"
```

---

### 23.7 ACCEPTANCE CRITERIA

**System je "server software" kada:**

1. ✅ Radi 24/7 bez frontend-a otvorenog
2. ✅ Auto-notifications rade bez user interakcije
3. ✅ Service requests se rutiraju automatski
4. ✅ Duty status je source of truth na backend-u
5. ✅ Devices pull data from server (ne od frontend-a)
6. ✅ Background jobs procesiraju automatski
7. ✅ Multi-user safe (optimistic locking)
8. ✅ Real-time updates preko WebSocket

---

**Last Updated:** 2025-01-22
**Status:** Action Items Pending
