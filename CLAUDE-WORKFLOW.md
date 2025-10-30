# 🤖 CLAUDE DEVELOPMENT WORKFLOW

**OBAVEZNO: Prati ovaj workflow PRE SVAKE IZMENE!**

---

## ⛔ NAJVAŽNIJE PRAVILO (PROČITAJ PRVO!)

```
🚫 NIKADA ne počinjem da kodiram dok:
1. NE vidim aplikaciju u browser-u
2. NE pitam korisnika gde TAČNO treba izmena
3. NE potvrdim sa korisnikom šta treba da uradim
4. NE proverim da li funkcionalnost već postoji

✅ Ako korisnik kaže "dodaj X":
   - Prvo otvorim browser
   - Vidim gde je stranica/komponenta
   - Pitam: "Video sam [opis]. Gde tačno da dodam X?"
   - Čekam potvrdu
   - TEK ONDA kodiram

❌ NE improvizujem! NE pravim pretpostavke!
❌ NE dodajem kod "na slepo" bez gledanja aplikacije!
```

---

## 📋 CHECKLIST PRE IMPLEMENTACIJE

### ✅ Step 1: PROVERI POSTOJEĆU APLIKACIJU U BROWSER-U (OBAVEZNO!!!)

**⚠️ KRITIČNO PRAVILO: NIKADA NE DODAJ KOD PRE NEGO ŠTO VIDIŠ APLIKACIJU!**

```
□ Pokreni aplikaciju (frontend + backend)
□ Otvori browser i idi na stranicu koju menjaš
□ VIDI kako trenutno izgleda i funkcioniše
□ Klikni na sve relevantne dugmiće i funkcije
□ Napravi screenshot ili opisuj šta vidiš
□ Pitaj korisnika da potvrdi da vidiš TAČNO šta on vidi
```

**Komande:**
```bash
# Otvori browser
start http://localhost:5173 (ili 5174)

# Pitaj korisnika:
"Otvorio sam aplikaciju u browser-u. Trenutno vidim [opis].
Da li je ovo tačno? Gde tačno treba da dodajem funkcionalnost?"
```

**Šta tražiš u browser-u:**
- Koja stranica je u pitanju?
- Koji tab/sekcija?
- Gde je dugme/kartica/forma?
- Koji elementi već postoje?
- Šta nedostaje?

---

### ✅ Step 2: PROVERI EXISTING CODE (OBAVEZNO!)

```
□ Pročitaj PROTECTED-CODE-DO-NOT-TOUCH.md
□ Da li je funkcija već implementirana?
□ Da li postoji sličan pattern u codebase?
□ Koji hooks/services već postoje?
```

**Komande za proveru:**
```bash
# Pretraži za existing functionality
Grep pattern="functionName|componentName"
Glob pattern="**/relevant-file-name.tsx"
```

---

### ✅ Step 3: PROVERI BACKEND API

```
□ Pročitaj diagnostics/api-backend.md
□ Da li endpoint već postoji?
□ Da li ima permission checks?
□ Koji Prisma model se koristi?
```

**Ako endpoint NE postoji:**
```
❌ NE IMPLEMENTIRAJ frontend funkciju
✅ Prvo obavesti korisnika da endpoint ne postoji
✅ Pitaj da li da dodaš endpoint ili skip-uješ funkciju
```

---

### ✅ Step 3: PLANIRAJ IZMENU

```
□ Koji fajlovi će biti izmenjeni?
□ Da li će ovo pokvariti existing functionality?
□ Da li mogu koristiti postojeći hook/service?
□ Da li treba novi hook ili koristim postojeći?
```

**Pravila:**
- ✅ KORISTI postojeće hooks (useGuests, useLocations, itd.)
- ✅ KORISTI React Query patterns
- ❌ NE PRAVI nove hooks ako već postoje
- ❌ NE MENJAJ imports koji se već koriste

---

### ✅ Step 4: PITAJ KORISNIKA I POTVRDI (OBAVEZNO!)

**Pre implementacije, UVEK:**

```
□ Opišem korisniku šta sam video u aplikaciji
□ Pitam: "Gde tačno treba da dodam ovu funkcionalnost?"
□ Pitam: "Da li već postoji nešto slično što mogu da kopiram?"
□ Pitam: "Šta tačno treba da radi nova funkcija?"
□ ČEKAM potvrdu od korisnika pre nego što počnem
```

**Format pitanja:**
```
"Video sam aplikaciju. Trenutno na [naziv stranice] vidim:
- [element 1]
- [element 2]
- [element 3]

Gde tačno treba da dodam [nova funkcionalnost]?
Da li da dodam novi dugme, ili da promenim postojeće?"
```

**NE POČINJEM implementaciju dok ne dobijem:**
- ✅ Potvrdu lokacije (koji fajl, koji element)
- ✅ Potvrdu funkcionalnosti (šta treba da radi)
- ✅ Potvrdu da nisam propustio ništa što već postoji

---

### ✅ Step 5: IMPLEMENTIRAJ SA PAŽNJOM

```
□ Read fajl PRE editovanja (obavezno!)
□ Proveri da li će izmena pokvariti existing code
□ Koristi Edit tool (ne Write!) za izmene
□ Testiraj da li imports rade
```

**Anti-patterns (NE RADI OVO):**
```javascript
// ❌ NE BRISI imports koji se koriste
- import { ExistingHook } from './hooks';

// ❌ NE PRAVI duplikate
const myNewFunction = () => { /* već postoji negde! */ }

// ❌ NE HARDCODUJ podatke
const guests = [ /* data */ ]; // Koristi useGuests hook!

// ❌ NE PRAVI nove API pozive ako hook postoji
fetch('/api/guests'); // Koristi useGuests()!
```

**Best patterns (RADI OVO):**
```javascript
// ✅ Koristi postojeće hooks
const { data: guests } = useGuests();

// ✅ Koristi mutations za update
const { updateGuest } = useGuestMutations();

// ✅ Koristi React Query automatic refetch
// (ne radi manual refresh)

// ✅ Proveri da li već postoji funkcija
const existingFunction = useExistingHook();
```

---

### ✅ Step 6: TESTIRAJ POSLE SVAKOG TASKA (OBAVEZNO!)

**NOVO PRAVILO**: Posle SVAKE izmene, TESTIRAJ da li radi!

#### Backend izmene:
```
□ Pokreni backend (ako nije pokrenut)
□ Testiraj sa curl komandom sa admin token-om
□ Proveri da li vraća SUCCESS (status: true ili success: true)
□ Proveri da li permisije rade kako treba
□ Proveri da li vraća očekivane podatke
```

**Primer testa:**
```bash
# 1. Login za token
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 2. Test endpoint-a
curl -X GET http://localhost:8080/api/your-endpoint \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Proveri response - treba da bude success: true
```

#### Frontend izmene:
```
□ Pokreni frontend (ako nije pokrenut)
□ Otvori u browser-u
□ Testiraj funkcionalnost ručno
□ Proveri da li nema error-a u konzoli (F12)
□ Proveri da li UI pokazuje zeleni marker (ako je potrebno)
```

#### Kada je test PROŠAO ✅:
```
□ Označi task kao completed u TODO listi
□ Dodaj u PROTECTED-CODE-DO-NOT-TOUCH.md (RECENTLY FIXED sekcija)
□ Dodaj zeleni marker/badge u frontend (ako je Security fix)
```

#### Kada test NE PROLAZI ❌:
```
□ Debuguj problem (proveri backend logs)
□ Ispravi kod
□ Testiraj ponovo
□ NE PRELAZI na sledeći task dok ovaj ne radi 100%!
```

**VAŽNO**: Ako backend ili test ne rade, ZAUSTAVI se i ispravi!

---

### ✅ Step 6: UPDATE PROTECTED CODE

```
□ Nakon što funkcija RADI, dodaj je u PROTECTED-CODE-DO-NOT-TOUCH.md
□ Dokumentuj šta si uradio
□ Označi datum implementacije
```

---

## 🔴 RED FLAGS (STOP AND ASK USER!)

### 🚨 Zastani i pitaj korisnika ako:

1. **Funkcija već postoji** u PROTECTED CODE
   ```
   ❌ Ne diraj je
   ✅ Pitaj korisnika da li baš treba izmena
   ```

2. **Backend endpoint ne postoji**
   ```
   ❌ Ne pravi frontend funkciju
   ✅ Pitaj korisnika šta da radiš
   ```

3. **Ne znaš koji hook/service da koristiš**
   ```
   ❌ Ne pretpostavljaj
   ✅ Prvo Grep/Glob pretraga za existing patterns
   ```

4. **Izmena može pokvariti existing funkcionalnost**
   ```
   ❌ Ne nastavljaj bez provere
   ✅ Pitaj korisnika ili proveri detaljno
   ```

5. **Vidiš duplikat koda**
   ```
   ❌ Ne pravi novi duplikat
   ✅ Konsoliduj u jedan pattern
   ```

---

## 📊 EXAMPLE WORKFLOW

### Primer: "Dodaj notification count u header"

#### ❌ LOŠE (što sam radio do sada):
```
1. Odmah počnem da pišem kod
2. Napravim novu funkciju za notifications
3. Napravim API call direktno
4. Ne proverim da li već postoji
5. Duplikat koda
6. Aplikacija ne radi
```

#### ✅ DOBRO (kako treba):
```
1. Grep: "notification|useNotifications"
   → Pronašao sam: useNotifications hook već postoji!

2. Read: hooks/useNotifications.ts
   → Vidim da već vraća unreadCount

3. Proveri PROTECTED CODE
   → Notifications nisu u listi - mogu da menjam

4. Implementacija:
   const { unreadCount } = useNotifications();

5. RADI! Nisam napravio duplikat.
```

---

## 🛠️ TOOLS USAGE GUIDELINES

### Grep Tool:
```
Koristiti PRE svake implementacije
Pretražiti postojeće patterns
Output mode: "files_with_matches" za brzo pronalaženje
```

### Glob Tool:
```
Pronaći fajlove po patternu
Korisno za pronalaženje sličnih komponenti
```

### Read Tool:
```
UVEK pročitaj fajl PRE Edit/Write
Proveri imports
Proveri existing functions
```

### Edit Tool:
```
Koristi za izmene postojećih fajlova
NIKADA ne briši važne imports
Proveri context pre i posle izmene
```

### Write Tool:
```
Samo za NOVE fajlove
NE koristiti za izmenu postojećih!
```

---

## 📝 DOCUMENTATION UPDATES

### Kada dodaješ novu funkciju:

1. **Update PROTECTED-CODE-DO-NOT-TOUCH.md**
   ```
   Dodaj u odgovarajuću sekciju
   Označi datum
   Napiši šta radi
   ```

2. **Ne dupliciraj dokumentaciju**
   ```
   Ne pravi novi fajl ako već postoji
   Update postojeći
   ```

---

## 🎯 SUMMARY - KEY TAKEAWAYS

### UVEK PRE IZMENE:
1. ✅ Proveri PROTECTED CODE
2. ✅ Grep/Glob pretraga
3. ✅ Proveri backend API (diagnostics/api-backend.md)
4. ✅ Koristi postojeće hooks
5. ✅ Read PRE Edit

### NIKADA:
1. ❌ Ne diraj protected code bez dozvole
2. ❌ Ne pravi duplikate
3. ❌ Ne briši imports koji se koriste
4. ❌ Ne pretpostavljaj - PROVERI!
5. ❌ Ne pravi frontend bez backend-a

---

**Zapamti: "Measure twice, cut once" - Proveri dvaput, izmeni jednom!**

---

**Last updated**: 2025-01-28
