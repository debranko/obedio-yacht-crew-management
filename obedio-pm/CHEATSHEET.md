# OBEDIO PM - Brze komande

## Osnovne komande

```bash
# Lista taskova
node index.js list
node index.js list pending
node index.js list done

# Dodaj task
node index.js add "Opis taska" webapp
node index.js add "Opis taska" case
node index.js add "Opis taska" pcb
node index.js add "Opis taska" metstrade
node index.js add "Opis taska" marketing
node index.js add "Opis taska" website

# Subtaskovi
node index.js sub 1 "Subtask opis"

# Prioritet
node index.js priority 1 urgent   # 🔴 HITNO
node index.js priority 2 high     # 🟠 Visok
node index.js priority 3 medium   # 🟡 Srednji (default)
node index.js priority 4 low      # 🟢 Nizak

# Pomeri task
node index.js move 1 up           # Jedan gore
node index.js move 2 down         # Jedan dole
node index.js move 3 top          # Na vrh
node index.js move 4 bottom       # Na dno

# Označi kao gotovo
node index.js done 1              # Ceo task
node index.js done 1 2            # Subtask #2 u task #1

# Obriši
node index.js delete 1

# Pomoć
node index.js help
node index.js categories
```

## Import taskova

```bash
# Vidi primer formata
node import.js example

# Importuj iz fajla
node import.js tasks.txt
```

## Primer fajla za import (tasks.txt)

```
[WebApp]
- Fix login bug
  - Check auth flow
  - Test on mobile
- Add dark mode

[PCB]
- Order prototypes

[Marketing]
- Create animation
```

## Brzi workflow

```bash
# Ujutro
cd obedio-pm
node index.js list pending

# Vidiš bug?
node index.js add "Login ne radi sa Gmail" webapp
node index.js priority 6 urgent

# Kompleksan problem?
node index.js sub 6 "Testirati OAuth flow"
node index.js sub 6 "Proveriti API credentials"

# Rešio prvi korak?
node index.js done 6 1

# Sve gotovo?
node index.js done 6

# Proveri šta je sledeće
node index.js list pending
```

## Kategorije

- **webapp** - Software bugs i features
- **case** - Case design
- **pcb** - PCB design i testiranje
- **metstrade** - Trade show
- **marketing** - 3D animacije, flajeri
- **website** - Website development

## Saveti

1. Dodaj task **ODMAH** kada vidiš problem
2. Postavi prioritet - fokusiraj se na 🔴 urgent
3. Podeli velike taskove na subtaskove
4. Označi done čim završiš - ne čekaj!
5. Proveri listu svaki dan

---

**Sada kreni! 🎯**
