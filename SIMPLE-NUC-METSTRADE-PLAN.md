# 🎯 SIMPLE Plan - NUC Metstrade Demo (24 Hours)
**Created:** 2025-11-16 11:49 UTC
**Goal:** Get NUC ready for Metstrade with voice-to-text + light toggle

---

## ✅ WHAT WE KNOW

**Requirements (MUST WORK):**
1. ✅ NUC server for demo (not Windows)
2. ✅ Light toggle (friend's feature)
3. ✅ Voice-to-text (OpenAI Whisper)
4. ✅ ESP32 button → Service Request → Wear OS

**Current Status:**
- Windows `bmad` branch: Working (backend, frontend, MQTT, Wear OS)
- NUC `deployment-fixes` branch: Has OTA + MQTT improvements
- Git remote: Multiple branches (bmad, deployment-fixes, main)

---

## 🚫 SSH PASSWORD ISSUE

I **cannot** type passwords into SSH prompts. This is a technical limitation.

**Solution:** You manually gather NUC info, I create plan.

---

## 📋 GET NUC INFO - Do This Now (5 minutes)

### Open PuTTY or Windows Terminal:
1. **Connect to NUC:**
   ```
   Host: 10.10.0.10
   User: obedio
   Password: meinBruder!
   ```

2. **Find Project Directory:**
   ```bash
   cd ~
   ls -la
   ```
   **Look for:** Directory name that might be the project (obedio, app, yacht-crew, etc.)

3. **If You See a Directory (e.g. `obedio`):**
   ```bash
   cd obedio  # or whatever the name is
   pwd        # Shows full path
   ls -la     # Shows files
   ```

4. **Check If It's Git Repository:**
   ```bash
   git branch
   git status
   git log -3 --oneline
   ```

5. **Check for Light Toggle Code:**
   ```bash
   cd backend/src/routes/
   ls -la | grep -i light
   cat lights.ts  # if it exists
   ```

### **PASTE ALL OUTPUT HERE** (Copy everything from terminal)

---

## 🎯 WHAT HAPPENS NEXT (After You Paste NUC Info)

### **Scenario A: Project EXISTS on NUC**
1. Check which branch (deployment-fixes?)
2. Check if friend's light toggle is there
3. Pull latest from Git to NUC
4. Add voice-to-text feature
5. Test on NUC
6. Deploy for Metstrade

**Time:** 6-8 hours

### **Scenario B: Project DOESN'T EXIST on NUC**
1. Clone from Git deployment-fixes branch to NUC
2. Setup PostgreSQL database
3. Install dependencies
4. Get friend's light toggle code
5. Add voice-to-text
6. Test and deploy

**Time:** 8-10 hours (includes setup)

### **Scenario C: EMERGENCY - Use Windows for Metstrade**
If NUC setup takes too long:
1. Test current Windows system thoroughly
2. Add voice-to-text to Windows
3. Bring Windows laptop to Metstrade
4. Setup NUC properly AFTER show

**Time:** 4 hours

---

## ⏰ TIME BUDGET (24 hours from now)

**Current Time:** 11:49 UTC (12:49 CET)
**Metstrade:** ~24 hours

**Available time:**
- NUC info gathering: 0.5h
- Setup/Sync: 2-4h
- Voice-to-text implementation: 3-4h
- Light toggle integration: 1-2h  
- Testing: 2-3h
- Buffer for issues: 4-6h
- **TOTAL:** ~16-20 hours

**Sleep:** Need at least 6 hours
**Working time:** ~18 hours available

**Verdict:** Tight but doable!

---

## 🎯 RECOMMENDATION

**Based on 24-hour deadline:**

**Option 1: If NUC has project (FASTEST)**
→ Work directly on NUC deployment-fixes branch
→ Add voice feature there
→ Test and done
→ **Time:** 6-8 hours

**Option 2: If NUC empty (MEDIUM)**
→ Clone deployment-fixes to NUC
→ Quick setup
→ Add voice feature
→ **Time:** 8-10 hours

**Option 3: Emergency backup (SAFEST)**
→ Perfect Windows system
→ Bring Windows laptop
→ **Time:** 4 hours

---

## ❓ WHAT TO DO RIGHT NOW

**Step 1:** Open PuTTY/Terminal, connect to NUC

**Step 2:** Run commands above, **copy ALL output**

**Step 3:** Paste here

**Step 4:** I'll create exact action plan

---

**I'm ready! Waiting for your NUC terminal output...**