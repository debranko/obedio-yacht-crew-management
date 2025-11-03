# 🚀 INSTRUKCIJE ZA POČETAK RADA - OBEDIO PROJECT

**CRITICAL UPDATE (November 2, 2025)**: Sistem ima ozbiljne sigurnosne i funkcionalne probleme koji moraju biti hitno rešeni!

---

## 🚨 HITNO! Trebam tvoju pomoć sa OBEDIO projektom - KRITIČNI PROBLEMI

Ovo je **production yacht crew management sistem** koji mora da radi 24/7. Analiza je otkrila KRITIČNE probleme koji blokiraju rad sistema!

### 🔴 KRITIČNI PROBLEMI KOJE MORAŠ ODMAH REŠITI:

1. **SIGURNOSNA RUPA** - Guest i Location rute NEMAJU autentifikaciju!
2. **Service Requests NE RADE** - field name mismatch (assignedToId)
3. **Nema real-time updates** - WebSocket eventi nedostaju
4. **Duplikovani MQTT servisi** - 3 verzije istog fajla
5. **API response formati nekonzistentni**

### 📋 TVOJI ZADACI:

1. **Prvo pročitaj ova 3 dokumenta (OBAVEZNO!):**
   - `CODER-PROMPT-FIX-API-CONNECTIVITY.md` - NOVI! Detaljne instrukcije za popravke
   - `OBEDIO-API-ANALYSIS-REPORT.md` - NOVI! Kompletan spisak problema
   - `OBEDIO-IMPLEMENTATION-CHECKLIST.md` - NOVI! Checklist sa 50+ zadataka

2. **Počni sa CRITICAL fixovima iz CODER-PROMPT-FIX-API-CONNECTIVITY.md:**
   - Task 1: Dodaj auth na /api/guests
   - Task 2: Dodaj auth na /api/locations
   - Task 3: Popravi service request field mismatch
   - Task 4: Dodaj WebSocket event methods
   - Task 5: Koristi WebSocket events u routes

3. **NOVA PRAVILA posle analize:**
   - OBAVEZNO dodaj auth middleware na SVE rute
   - OBAVEZNO testiraj sa curl pre nego što kažeš "gotovo"
   - OBAVEZNO emituj WebSocket events za sve promene
   - NIKAD ne vraćaj nested { success: true, data: { data: {} } }

4. **Način rada:**
   - CRITICAL fixes prvo (sigurnost!)
   - Test posle SVAKOG fixa
   - Koristi code snippets iz CODER-PROMPT dokumenta
   - NE prelazi na sledeći task dok ne testiraš

### 🎯 CILJ:
Sistem MORA biti siguran i funkcionalan za 24/7 rad na jahti. Trenutno ima ozbiljne sigurnosne propuste i ne radi real-time!

**Počni sa čitanjem `CODER-PROMPT-FIX-API-CONNECTIVITY.md` - tamo su SVI detalji i kod koji trebaš!**

---

## 📌 ALTERNATIVNI KRAĆI PROMPT:

Ako hoćeš kraći pristup:

---

HITNO! OBEDIO ima sigurnosne propuste. Molim te:

1. Pročitaj `CODER-PROMPT-FIX-API-CONNECTIVITY.md`
2. Dodaj auth na /api/guests i /api/locations ODMAH
3. Popravi service request assignedToId problem
4. Testiraj sa curl posle svakog fixa

Ovo je production sistem za jahtu sa kritičnim problemima!

---

## 🤝 KAKO DA MU POMOGNEŠ AKO ZAPNE:

### Ako pita "Gde da počnem?":
```
HITNO! Počni sa sigurnosnim fixovima:
1. Otvori backend/src/routes/guests.ts
2. Dodaj authMiddleware (vidi CODER-PROMPT Task 1)
3. Isto uradi za locations.ts
4. Testiraj sa curl da unauthorized requests vraćaju 401
```

### Ako počne da menja crew fajlove:
```
STOP! Crew management je ZAVRŠEN i radi perfektno.
Ne treba ga menjati. To je primer kako treba da izgleda.
Fokusiraj se samo na duty roster assignments.
```

### Ako dodaje mock data:
```
Bez mock data! Ovo je production sistem.
Sve mora iz baze. Pogledaj kako crew komponente rade.
```

### Ako ne testira:
```
OBAVEZNO testiraj posle svakog fixa:

# Test auth (treba da vrati 401):
curl http://localhost:8080/api/guests

# Test sa token (treba da radi):
curl -H "Authorization: Bearer TOKEN" http://localhost:8080/api/guests
```

### Ako ne zna gde su WebSocket eventi:
```
Pogledaj backend/src/services/websocket.ts
Dodaj metode iz CODER-PROMPT Task 4
Zatim ih koristi u routes kao u Task 5
```

---

## 🎬 FINALNI SAVETI:

1. **SIGURNOST PRVO** - auth middleware na sve rute!
2. **Test je OBAVEZAN** - ne prihvataj "trebalo bi da radi"
3. **Prati CODER-PROMPT** - tamo su tačni code snippets
4. **WebSocket za sve** - svaka promena mora emit event
5. **Konzistentni API** - uvek { success: true/false, data/error }

KRITIČNO: Sistem trenutno NIJE SIGURAN za produkciju! 🚨