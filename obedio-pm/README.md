# OBEDIO Project Manager

## 📋 Šta je ovo?
Organizacioni sistem za OBEDIO projekat. Pomaže ti da se ne izgubiš u zadacima i da završiš projekat na vreme!

## 🌐 WEB APLIKACIJA - PREPORUČENO!

**Najlakši način - pokreni u browseru!**

### Brzo pokretanje:
```bash
# Duplim klikom na:
START-WEB-APP.bat

# Ili iz terminala:
cd obedio-pm
node server.js
```

**Otvori:** http://localhost:3333

✅ Vizuelni interfejs - klikni i radi!
✅ Real-time updates - sve se odmah čuva
✅ Statistika i filter
✅ Dodaj svoje custom kategorije
✅ I ja vidim šta radiš! (taskovi u tasks.json)

👉 **Detaljno uputstvo:** [WEB-APP-README.md](WEB-APP-README.md)

---

## 💻 CLI Verzija (za terminal)

## 🚀 Kako da koristiš

### Osnove

```bash
# Prikaži sve taskove
node index.js list

# Prikaži samo pending taskove
node index.js list pending

# Prikaži završene taskove
node index.js list done

# Prikaži kategorije
node index.js categories
```

### Dodavanje taskova

```bash
# Dodaj task za WebApp
node index.js add "Fix login bug" webapp

# Dodaj task za Case Design
node index.js add "Review v3 design files" case

# Dodaj task za PCB
node index.js add "Order 10 prototypes from JLCPCB" pcb

# Dodaj task za METSTRADE
node index.js add "Prepare demo device" metstrade
```

### Sub-taskovi (za komplikovane probleme)

```bash
# Dodaj sub-task na task #1
node index.js sub 1 "Check authentication flow"
node index.js sub 1 "Test with different browsers"
node index.js sub 1 "Update documentation"

# Označi sub-task kao gotov
node index.js done 1 2  # Task #1, subtask #2
```

### Prioriteti i organizacija

```bash
# Postavi prioritet (urgent, high, medium, low)
node index.js priority 1 urgent
node index.js priority 2 high
node index.js priority 3 low

# Pomeri task gore/dole u listi
node index.js move 1 up
node index.js move 2 down
node index.js move 3 top
node index.js move 4 bottom
```

**Prioriteti:**
- 🔴 **urgent** - HITNO! Radi odmah!
- 🟠 **high** - Visok prioritet
- 🟡 **medium** - Srednji prioritet (default)
- 🟢 **low** - Nizak prioritet

Taskovi se automatski sortiraju po prioritetu!

### Završavanje i brisanje

```bash
# Označi task kao gotov
node index.js done 1

# Obriši task
node index.js delete 1
```

## 📁 Folder struktura

```
obedio-pm/
├── index.js           # CLI alat
├── import.js          # Import taskova iz fajla
├── tasks.json         # Svi taskovi (automatski se kreira)
├── webapp/            # Web aplikacija fajlovi
├── case-design/       # Case design fajlovi od kontraktora
├── pcb/               # PCB design fajlovi
├── metstrade/         # Trade show materijali
├── marketing/         # 3D animacije, flajeri, promo
└── website/           # Website development
```

## 🎯 Kategorije

### 🌐 WebApp
Sve vezano za OBEDIO softver - bugovi, features, optimizacije.
Ovde dodaj sve što primećuješ da ne radi, i rešavaćemo zajedno!

### 📦 Case Design
Fajlovi od Upwork kontraktora za dizajn kućišta.
Skoro gotovo!

### ⚡ PCB
PCB dizajn i planiranje testiranja.
Dodaj predloge šta treba testirati i naručiti.

### ⚓ METSTRADE
Trade show priprema - demo, marketing, logistika.

### 🎨 Marketing
3D animacije, flajeri, promo materijal, branding.

### 🌍 Website
OBEDIO website development i content.

## 💡 Workflow

1. **Primećuješ problem?** → Dodaj task
2. **Kompleksan problem?** → Podeli na sub-taskove
3. **Rešio?** → Označi kao done
4. **Potrebni fajlovi?** → Čuvaj u odgovarajućem folderu

## 🎯 Primer rada

```bash
# Pronašao si bug u login-u
node index.js add "Login doesn't work with special characters" webapp

# Vidio da je kompleksno, pa pravimo plan
node index.js sub 1 "Test which special characters fail"
node index.js sub 1 "Check password validation logic"
node index.js sub 1 "Fix regex in validator"
node index.js sub 1 "Add unit tests"

# Rešio prvi korak
node index.js done 1 1

# Lista taskova da vidiš progress
node index.js list pending
```

## 📥 Import taskova iz fajla

Možeš napraviti text fajl sa taskovima i importovati ih odjednom!

```bash
# Vidi primer formata
node import.js example

# Importuj taskove iz fajla
node import.js mojitaskovi.txt
```

**Primer fajla (tasks.txt):**
```
[WebApp]
- Fix login bug
  - Check authentication flow
  - Test with different browsers
- Add dark mode

[Marketing]
- Create 3D animation
- Design flyers
```

Jednostavno napiši listu taskova, dodaj kategoriju u zagradi, i importuj!

## 📝 Pomoć

```bash
node index.js help
node import.js example
```

## ⏰ Ostani organizovan!

- Svaki dan proveri: `node index.js list pending`
- Dodavaj taskove čim primećuješ problem - nemoj odlagati!
- Podeli velike taskove na manje korake
- Slavi pobede - označi done kad završiš! ✓

---

**Cilj**: Završiti OBEDIO projekat na vreme!
**Metoda**: Jedan task po jedan! 🎯
