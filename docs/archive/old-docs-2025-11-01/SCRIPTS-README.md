# 🚀 OBEDIO Development Scripts

Jednostavne skripte za pokretanje, zaustavljanje i resetovanje servera!

---

## 📋 **Dostupne Skripte:**

### **1. START.bat** 🟢
**Pokreće oba servera (backend + frontend)**

**Kako koristiti:**
- Dupli-klik na `START.bat`
- Ili: Desni klik → "Run with PowerShell"
- Ili u terminalu: `.\start.ps1`

**Šta radi:**
1. Proverava da li su instalirani npm paketi
2. Instalira ih ako treba
3. Pokreće backend server (port 3001)
4. Pokreće frontend server (port 5173)
5. Otvara 2 nova PowerShell prozora (jedan za svaki server)

**Očekuješ:**
- 2 nova prozora (BACKEND SERVER i FRONTEND SERVER)
- Backend: `Server running on http://localhost:3001`
- Frontend: `Local: http://localhost:5173/`

---

### **2. STOP.bat** 🛑
**Zaustavlja sve servere**

**Kako koristiti:**
- Dupli-klik na `STOP.bat`

**Šta radi:**
1. Pronalazi sve Node.js procese
2. Zaustavlja ih
3. Proverava portove 3001 i 5173
4. Oslobađa portove

**Kada koristiti:**
- Pre zatvaranja računara
- Kada serveri krenu da glitchuju
- Pre restarta
- Pre reseta

---

### **3. RESTART.bat** 🔄
**Zaustavlja i ponovo pokreće servere**

**Kako koristiti:**
- Dupli-klik na `RESTART.bat`

**Šta radi:**
1. Zaustavlja sve servere (kao STOP.bat)
2. Čeka 3 sekunde
3. Pokreće servere ponovo (kao START.bat)

**Kada koristiti:**
- Kada promeniš kod u backend-u
- Kada backend ne reaguje
- Kada frontend ima weird bug
- **Posle svake izmene u `.env` fajlu!**

---

### **4. RESET.bat** ♻️
**KOMPLETNO resetovanje - briše sve i instalira iznova**

**⚠️ PAŽNJA: Ovo briše sve `node_modules` i reinstalira!**

**Kako koristiti:**
- Dupli-klik na `RESET.bat`
- Potvrdi da želiš (Press any key)

**Šta radi:**
1. Zaustavlja sve servere
2. Briše `node_modules` (frontend)
3. Briše `backend/node_modules`
4. Briše `.vite` cache
5. Briše `backend/dist`
6. Instalira sve pakete ispočetka (backend + frontend)
7. Regeneriše Prisma client
8. Kaže ti da očistiš localStorage u browser-u

**Kada koristiti:**
- Kada ništa drugo ne radi
- Kada backend radi čudno
- Kada frontend neće da se kompajlira
- Posle `npm install` novih paketa (ponekad treba)
- **"Najbolje rešenje za sve probleme"** 😄

**Trajanje:** 2-5 minuta (zavisi od interneta)

---

## 🎯 **Tipični Workflow:**

### **Jutarnji Start:**
```
1. Dupli-klik: START.bat
2. Sačekaj 10 sekundi
3. Otvori browser: http://localhost:5173
4. Login: admin / admin123
```

### **Problem sa Backend-om:**
```
1. Dupli-klik: RESTART.bat
2. Sačekaj 10 sekundi
3. Refresh browser (Ctrl + F5)
```

### **Sve puklo, ništa ne radi:**
```
1. Dupli-klik: RESET.bat
2. Potvrdi
3. Sačekaj 3-5 minuta
4. Otvori browser DevTools (F12)
5. Console → localStorage.clear()
6. Zatvor DevTools
7. Dupli-klik: START.bat
8. Sačekaj 10 sekundi
9. Refresh (Ctrl + F5)
10. Login: admin / admin123
```

### **Kraj Dana / Gašenje Računara:**
```
1. Dupli-klik: STOP.bat
2. Zatvori sve prozore
```

---

## 💡 **Saveti:**

### **Ako Skripte Ne Rade:**

**PowerShell Execution Policy Error:**
```powershell
# Desni klik na PowerShell → Run as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Ili pokreni direktno:
powershell -ExecutionPolicy Bypass -File start.ps1
```

**Port Već Zauzet:**
```
1. STOP.bat
2. Ako ne pomogne, ručno zaustavi u Task Manager:
   - Ctrl + Shift + Esc
   - Processes tab
   - Pronađi "Node.js"
   - End Task
3. START.bat
```

**Backend Ne Pokrene:**
```
1. Otvori terminal u /backend
2. npm run dev
3. Pogledaj greške
4. Javi mi screenshot
```

**Frontend Ne Pokrene:**
```
1. Otvori terminal u /
2. npm run dev
3. Pogledaj greške
4. Javi mi screenshot
```

---

## 🔧 **Dodatne Komande (Ako Treba):**

### **Samo Backend:**
```bash
cd backend
npm run dev
```

### **Samo Frontend:**
```bash
npm run dev
```

### **Database Reset:**
```bash
cd backend
npx prisma migrate reset
npx prisma db seed
```

### **Proveri Da Li Backend Radi:**
```powershell
curl http://localhost:3001/api/health
# Očekuješ: {"status":"OK",...}
```

---

## 📊 **Struktura Fajlova:**

```
Luxury Minimal Web App Design/
├── START.bat          ← Dupli-klik za start
├── STOP.bat           ← Dupli-klik za stop
├── RESTART.bat        ← Dupli-klik za restart
├── RESET.bat          ← Dupli-klik za reset
├── start.ps1          ← PowerShell skripta (pozadina)
├── stop.ps1           ← PowerShell skripta (pozadina)
├── restart.ps1        ← PowerShell skripta (pozadina)
├── reset.ps1          ← PowerShell skripta (pozadina)
├── SCRIPTS-README.md  ← Ovaj fajl
├── backend/           ← Backend kod
└── src/               ← Frontend kod
```

---

## 🎉 **Quick Reference:**

| Akcija | Fajl | Vreme | Kada |
|--------|------|-------|------|
| **Start servera** | `START.bat` | 10s | Jutro, posle restarta |
| **Stop servera** | `STOP.bat` | 2s | Kraj dana, pre gašenja |
| **Restart servera** | `RESTART.bat` | 15s | Backend izmene, .env izmene |
| **Kompletni reset** | `RESET.bat` | 3-5min | Kada ništa ne radi |

---

## ❓ **FAQ:**

**Q: Koliko dugo treba da sačekam posle START?**
A: 5-10 sekundi. Backend prvo, pa frontend.

**Q: Šta ako zaboravim STOP pre gašenja računara?**
A: Ništa strašno, ali bolje je stopirati.

**Q: Da li RESET briše database?**
A: NE! Samo briše `node_modules` i cache.

**Q: Kako da resetujem database?**
A: `cd backend` → `npx prisma migrate reset`

**Q: Zašto 2 prozora?**
A: Jedan je backend (3001), drugi frontend (5173). Tako vidiš oba log-a.

**Q: Mogu li da zatvorim prozore?**
A: DA, serveri će se stopirati. Ili koristi STOP.bat.

**Q: Šta je "Press any key"?**
A: Pritisni bilo koji taster da zatvoriš prozor.

---

## 🚀 **Zaključak:**

**TL;DR:**
- **START.bat** = pokreni
- **STOP.bat** = zaustavi
- **RESTART.bat** = restartuj
- **RESET.bat** = resetuj sve (ako ništa ne radi)

**Najčešće:** START.bat ujutro, STOP.bat uveče. Gotovo! 🎉

---

**Kreirao:** Cascade AI Assistant 🤖
**Datum:** Oct 22, 2025
**Za:** Debranko (Obedio Yacht Crew Management)
