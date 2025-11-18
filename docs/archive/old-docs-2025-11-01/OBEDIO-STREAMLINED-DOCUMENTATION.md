# 📚 OBEDIO STREAMLINED DOCUMENTATION PLAN

**Cilj:** Smanjiti konfuziju i duplikate za AI asistente  
**Datum:** 1. Novembar 2025

---

## ✅ DOKUMENTI KOJE ZADRŽAVAMO (5 esencijalnih)

### 1. **OBEDIO-CONSOLIDATED-RULES-FOR-AI.md** ⭐ NOVO
- Zamenjuje sve stare rules dokumente
- Sažeta pravila na jednom mestu
- Jasne instrukcije bez duplikata

### 2. **OBEDIO-IMPLEMENTATION-TODO-LIST.md**
- 95 konkretnih zadataka sa checkboxes
- Progress tracking
- Definition of Done

### 3. **OBEDIO-TECHNICAL-SPECIFICATIONS.md**
- Code templates
- Backend/Frontend patterns
- Validation checklists

### 4. **README.md**
- Project overview
- Setup instrukcije
- Osnovne informacije

### 5. **CLAUDE-CODE-START-INSTRUCTIONS.md**
- Kako početi rad
- Primer promptova
- Emergency help

---

## ❌ DOKUMENTI ZA BRISANJE (svi ostali)

### Razlozi za brisanje:
1. **Duplikovana pravila** - već su u CONSOLIDATED-RULES
2. **Session notes** - privremeni, zastareli
3. **Status reports** - završeni, nepotrebni
4. **CLAUDE-* fajlovi** - mnogo verzija istog

### Posebno problematični:
- **OBEDIO-STRICT-DEVELOPMENT-RULES.md** (180 linija)
- **OBEDIO-MANDATORY-DEVELOPMENT-RULES.md** (1478 linija!)
- Oba su predugi i imaju duplikovane informacije

---

## 🎯 PREDLOG AKCIJE

### 1. Brisanje nepotrebnih fajlova:
```bash
# Kreirati backup folder prvo
mkdir docs/archive/old-session-notes

# Premestiti sve CLAUDE-* fajlove (osim START-INSTRUCTIONS)
mv CLAUDE-*.md docs/archive/old-session-notes/

# Premestiti sve status/complete fajlove
mv *-COMPLETE*.md docs/archive/old-session-notes/
mv *-STATUS*.md docs/archive/old-session-notes/
mv *-REPORT*.md docs/archive/old-session-notes/

# Premestiti stare rules
mv OBEDIO-STRICT-DEVELOPMENT-RULES.md docs/archive/old-session-notes/
mv OBEDIO-MANDATORY-DEVELOPMENT-RULES.md docs/archive/old-session-notes/
```

### 2. Ostavi samo:
```
Root folder:
- OBEDIO-CONSOLIDATED-RULES-FOR-AI.md
- OBEDIO-IMPLEMENTATION-TODO-LIST.md  
- OBEDIO-TECHNICAL-SPECIFICATIONS.md
- CLAUDE-CODE-START-INSTRUCTIONS.md
- README.md
- HOW-TO-RUN.md (korisno za setup)
```

---

## 💡 ZAŠTO JE OVO BOLJE

### Problem sa trenutnim stanjem:
- **1478 linija pravila** u jednom fajlu!
- **Duplikovane informacije** u 5+ fajlova
- **Konfuzija** - koji dokument je važeći?
- **AI gubi vreme** čitajući zastarele dokumente

### Rešenje - konsolidovani pristup:
- **109 linija** umesto 1478+ (93% kraće!)
- **Jedan izvor istine** za pravila
- **Jasna hijerarhija** dokumenata
- **Brže AI razumevanje** projekta

---

## 📋 NOVA STRUKTURA ZA AI

Kada AI počne rad, treba da pročita SAMO:

1. **OBEDIO-CONSOLIDATED-RULES-FOR-AI.md** (pravila)
2. **OBEDIO-IMPLEMENTATION-TODO-LIST.md** (zadaci)
3. **OBEDIO-TECHNICAL-SPECIFICATIONS.md** (ako radi na kodu)

To je SVE! Ostalo po potrebi.

---

## 🚀 INSTRUKCIJA ZA CLAUDE CODE

```
Pozdrav! Radimo na OBEDIO projektu.

PROČITAJ SAMO OVA 3 DOKUMENTA:
1. OBEDIO-CONSOLIDATED-RULES-FOR-AI.md (109 linija pravila)
2. OBEDIO-IMPLEMENTATION-TODO-LIST.md (lista zadataka)
3. OBEDIO-TECHNICAL-SPECIFICATIONS.md (code patterns)

NE ČITAJ stare rules dokumente - oni su zastareli!

Počni sa prvim zadatkom iz TODO liste.
```

---

**Rezultat:** Čišća struktura, manje konfuzije, brži rad! 🎯