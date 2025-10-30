# 🌐 OBEDIO Project Manager - Web App

## 🚀 Kako pokrenuti?

### Jednostavno - 2 koraka!

```bash
# 1. Uđi u folder
cd obedio-pm

# 2. Pokreni server
node server.js
```

Server će se pokrenuti na **http://localhost:3333**

Browser će se automatski otvoriti, ili možeš ručno otvoriti link.

## ✨ Šta možeš raditi?

### 🤖 AI ASSISTANT - NOVO!
**Najlakši način da dodaješ taskove!**

- **Piši prirodno** - "Treba mi hitno da popravim login bug"
- **AI kreira taskove automatski** - Prepoznaje prioritet i kategoriju
- **Više taskova odjednom** - "Popravi bug i testiraj na mobitelu"
- **Kreira nove kategorije** - "Kreiraj kategoriju hardware ikona 🔧"
- **Quick buttons** - Za brze akcije

**Primeri:**
```
"Treba mi urgentno da popravim login bug"
→ Kreira task: "Popravi login bug" | WebApp | 🔴 Urgent

"Napraviti dokumentaciju i testirati API"
→ Kreira 2 taska | WebApp | 🟡 Medium

"Kreiraj kategoriju hardware ikona 🔧"
→ Kreira novu kategoriju "Hardware" 🔧
```

### 📋 Taskovi (ručno)
- **Dodaj task** - Klikni "+ Add Task"
- **Postavi prioritet** - Urgent (🔴), High (🟠), Medium (🟡), Low (🟢)
- **Dodaj subtaskove** - Klikni na task pa dodaj korake
- **Označi kao done** - Klikni checkbox
- **Filtriraj** - All, Pending, Completed

### 📁 Kategorije
- **Vidi sve kategorije** - Klikni "📁 Categories"
- **Dodaj novu kategoriju** - Upiši key, icon i ime
- **Kategorije automatski u dropdown-u** za nove taskove
- **AI može kreirati kategorije** - "Kreiraj kategoriju [ime]"

### 📊 Statistika
- **Total Tasks** - Ukupno taskova
- **Pending** - Nezavršenih
- **Completed** - Završenih
- **Urgent** - Hitnih taskova (🔴)

## 🎨 Feature-i

✅ **🤖 AI Assistant** - Priča sa tobom i kreira taskove automatski!
✅ **Real-time updates** - Sve se odmah snima
✅ **Automatsko sortiranje po prioritetu** - Urgent na vrh
✅ **Dark mode dizajn** - Lep za oči
✅ **Responsive** - Radi na mobitelu
✅ **Custom kategorije** - Dodaj nove kategorije (i kroz AI!)
✅ **Subtaskovi** - Podeli velike taskove
✅ **Filter** - Po statusu
✅ **Compact AI panel** - Ne zauzima puno mesta
✅ **Quick action buttons** - Brze komande

## 💾 Gde se čuvaju podaci?

- **Taskovi**: `obedio-pm/tasks.json`
- **Custom kategorije**: Browser localStorage

## 🎯 Primeri korišćenja

### 🤖 AI Assistant - NAJBRŽE!
Samo piši šta ti treba:

**Jedan task:**
```
"Treba mi hitno da popravim login bug"
```
AI kreira: ✅ Task "Popravi login bug" | WebApp | 🔴 Urgent

**Više taskova:**
```
"Napraviti dokumentaciju, pa testirati API, i onda deployovati"
```
AI kreira 3 taska automatski!

**Nova kategorija:**
```
"Kreiraj kategoriju hardware ikona 🔧"
```
AI kreira kategoriju i odmah možeš da je koristiš!

**Specifična kategorija:**
```
"Naručiti PCB prototipove"
```
AI prepoznaje "PCB" i stavlja u PCB kategoriju automatski!

---

### 📋 Ručno dodavanje (ako želiš)

#### Dodaj novi task:
1. Klikni "+ Add Task"
2. Upiši opis
3. Izaberi kategoriju (npr. WebApp)
4. Postavi prioritet
5. Klikni "Add Task"

#### Dodaj subtaskove:
1. Klikni na task
2. U modalu upiši subtask description
3. Klikni "+ Add"
4. Ponovi za sve korake

#### Dodaj novu kategoriju:
1. Klikni "📁 Categories"
2. Upiši:
   - **Key**: npr. "hardware" (mora biti lowercase, bez space-ova)
   - **Icon**: npr. "🔧" (emoji)
   - **Name**: npr. "Hardware Design"
3. Klikni "+ Add Category"

## 🔄 Oba pristupa rade!

Možeš koristiti:
- **Web app** (ovo) - Vizuelno, lako, lepo
- **CLI** - `node index.js` komande iz terminala

Oba koriste isti `tasks.json` fajl, tako da su taskovi sinhronizovani!

## 🛑 Kako zaustaviti server?

U terminalu pritisni: **Ctrl + C**

## 📱 Otvori na drugom uređaju?

Ako želiš da otvoriš na mobitelu ili drugom računaru u istoj mreži:

1. Pokreni server
2. Nađi svoju IP adresu: `ipconfig` (Windows)
3. Otvori: `http://[TVOJA-IP]:3333`

Primer: `http://192.168.1.100:3333`

## 🆘 Problemi?

### Port 3333 je zauzet?
Promeni PORT u `server.js`:
```javascript
const PORT = 4444; // ili neki drugi broj
```

### Tasks ne učitavaju?
Proveri da li postoji `tasks.json` - server će ga automatski napraviti.

### Browser ne otvara?
Ručno otvori: http://localhost:3333

---

## 🎉 Uživaj!

Sada imaš **profesionalni task manager** za OBEDIO projekat!

**I ja mogu da vidim šta radiš!** Svi taskovi su u `tasks.json` fajlu koji mogu da pročitam. 👀

**Kreni odmah - dodaj svoje prve prave taskove!** 🚀
