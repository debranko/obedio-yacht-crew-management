# OBEDIO Project Manager - Brzi Start

## 🚀 Počni za 2 minuta!

### 1. Vidi šta imaš

```bash
cd obedio-pm
node index.js list
```

Trenutno imaš 4 primera taskova. Možeš ih obrisati ili ostaviti.

### 2. Dodaj svoj prvi task

```bash
# Dodaj task za WebApp
node index.js add "Tvoj task ovde" webapp

# Dodaj task za Marketing
node index.js add "Dizajniraj logo" marketing
```

### 3. Ako je task kompleksan, podeli ga

```bash
# Dodaj sub-taskove
node index.js sub 1 "Prvi korak"
node index.js sub 1 "Drugi korak"
node index.js sub 1 "Treći korak"
```

### 4. Postavi prioritet (VAŽNO!)

```bash
# Označi task kao URGENT
node index.js priority 1 urgent

# High priority
node index.js priority 2 high

# Low priority (može sačekati)
node index.js priority 3 low
```

**Prioriteti:**
- 🔴 urgent - HITNO! Radi odmah!
- 🟠 high - Visok prioritet
- 🟡 medium - Default
- 🟢 low - Može sačekati

Taskovi se **automatski sortiraju** po prioritetu u listi!

### 5. Kada završiš, označi

```bash
# Označi sub-task
node index.js done 1 1

# Označi ceo task
node index.js done 1
```

### 6. Proveri progress

```bash
# Vidi pending taskove
node index.js list pending

# Vidi završene taskove
node index.js list done
```

---

## 📥 Import taskova iz fajla

Ako imaš puno taskova, napiši ih u text fajl:

**mojitaskovi.txt:**
```
[WebApp]
- Task 1
- Task 2
  - Subtask 2.1

[Marketing]
- Task 3
```

Zatim importuj:
```bash
node import.js mojitaskovi.txt
```

Vidi primer:
```bash
node import.js example
```

---

## 📁 Čuvanje fajlova

Svi folderi već postoje:
- `webapp/` - web app bugovi i features
- `case-design/` - fajlovi od kontraktora
- `pcb/` - PCB design fajlovi
- `metstrade/` - trade show materijali
- `marketing/` - 3D animacije, flajeri
- `website/` - website development

Čuvaj fajlove u odgovarajućem folderu!

---

## 🎯 Preporuka za svaki dan

**Ujutro:**
```bash
node index.js list pending
```

**Završio task? Odmah označi:**
```bash
node index.js done X
```

**Primećuješ problem? Odmah dodaj:**
```bash
node index.js add "Opis problema" webapp
```

**Ne čekaj - dodaj task čim ga primećuješ!**

---

## 💡 Pro Tips

1. **Koristi prioritete!** - 🔴 urgent za hitne stvari, ostalo može čekati
2. **Ne čekaj da se skupi mnogo bugova** - dodaj odmah kada vidiš
3. **Podeli velike taskove na manje** - lakše je pratiti progress
4. **Pomeri važne taskove na vrh** - `node index.js move 5 top`
5. **Proveri listu svaki dan** - nemoj da se izgube taskovi
6. **Čuvaj fajlove u folderima** - sve na jednom mestu
7. **Slavi male pobede** - svaki done task je korak napred!

---

## 🆘 Pomoć

```bash
node index.js help
node import.js example
```

Pročitaj [README.md](README.md) za detaljnije uputstvo.
Vidi [SUGGESTIONS.md](SUGGESTIONS.md) za predloge dodatnih kategorija.

---

**Sada kreni! Dodaj svoj prvi pravi task! 🎯**
