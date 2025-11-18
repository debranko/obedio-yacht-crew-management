# 🔄 Git/NUC/Windows Coordination Plan - Metstrade Prep
**Created:** 2025-11-16 11:34 UTC
**Status:** PLANNING PHASE - Before Any Implementation

---

## 📊 CURRENT STATE ANALYSIS

### 1. **Windows Current Folder** (What You're Working In)
**Branch:** `bmad` (NOT deployment-fixes!)
**Status:** 
- ✅ 48 commits ahead of origin/bmad
- ✅ Backend working, login working, button simulator working
- ✅ Wear OS receiving notifications
- ⚠️ Modified upload.ts (I just added audio endpoint - NEED TO REVERT)
- ⚠️ Many .md files deleted

**Critical:** This is on `bmad` branch, not `deployment-fixes`!

---

### 2. **Git Repository - deployment-fixes Branch**
**Repo:** https://github.com/debranko/obedio-yacht-crew-management.git
**Branch:** deployment-fixes
**Recent Commits (Last 10):**

```
8cf16ca - Add missing otadata partition (OTA boot persistence)
53b54df - Add MQTT-triggered OTA with LED task management
61b67b1 - Fix HTTP OTA downloads and cache crashes
a01ddec - Add MQTT-triggered OTA update support
b09714e - Fix ESP32-S3 firmware: working button detection
563a218 - Add ESP-IDF firmware for OBEDIO Smart Button
c8f9fef - Add deployment fixes summary documentation
c71301e - Fix MQTT broker URL for frontend build
aa775a5 - Add MQTT WebSocket broker URL for frontend
6f6d79f - Fix auth cookie for HTTP access
```

**Key Features in deployment-fixes:**
- ✅ OTA (Over-the-Air) updates for ESP32
- ✅ MQTT-triggered firmware updates
- ✅ ESP32-S3 firmware improvements
- ✅ MQTT broker URL fixes
- ✅ WebSocket improvements

**QUESTION:** Does deployment-fixes have light toggle feature from your friend?

---

### 3. **NUC Linux Server Status**
**IP:** 10.10.0.10
**Hostname:** obedio
**Access:** SSH (obedio / meinBruder!)
**Branch:** deployment-fixes (presumably)

**What's Working on NUC:**
- ✅ OTA updates with ESPressif IDE
- ✅ MQTT light toggle (just implemented by friend)
- ✅ Tailscale connectivity

**UNKNOWNS - NEED YOUR INPUT:**
- What's the project path on NUC?
- Is it synced with origin/deployment-fixes?
- Where is the light toggle code?
- Has friend committed/pushed changes?

---

## ⚠️ CRITICAL ISSUE: Branch Mismatch

**Problem:**
```
Windows Folder:  bmad branch (48 commits ahead)
NUC:            deployment-fixes branch
Git Remote:     Both branches exist, possibly diverged
```

**This means:**
- Your Windows work is NOT in deployment-fixes
- NUC is NOT seeing your Windows changes
- Friend's NUC changes are NOT in your Windows folder
- We have a 3-way divergence!

---

## 🎯 COORDINATION STRATEGY (Choose One)

### **Option A: Merge Everything to deployment-fixes** (RECOMMENDED for Metstrade)
**Steps:**
1. Commit Windows changes on bmad branch
2. Switch to deployment-fixes branch
3. Merge bmad into deployment-fixes (gets your 48 commits)
4. Pull friend's NUC changes from origin/deployment-fixes
5. Resolve any conflicts
6. Implement voice-to-text on unified deployment-fixes
7. Push to Git
8. Pull on NUC

**Time:** 2-3 hours
**Risk:** Medium (merge conflicts possible)
**Benefit:** Clean unified codebase

---

### **Option B: Work on bmad, Merge Later** (FASTEST)
**Steps:**
1. Stay on bmad branch (Windows)
2. Implement voice-to-text here
3. Test thoroughly on Windows
4. AFTER Metstrade, merge everything

**Time:** 4 hours (voice-to-text only)
**Risk:** Low (no Git conflicts during implementation)
**Benefit:** Fast, isolated development
**Drawback:** NUC stays separate until after Metstrade

---

### **Option C: Fresh Start on deployment-fixes** (SAFEST)
**Steps:**
1. Save current bmad work
2. Switch to deployment-fixes
3. Pull latest from origin/deployment-fixes (gets friend's changes)
4. Cherry-pick important commits from bmad
5. Implement voice-to-text on deployment-fixes
6. Test and deploy to NUC

**Time:** 3-4 hours
**Risk:** Low (clean base)
**Benefit:** Already synced with NUC

---

## 📋 WHAT I NEED FROM YOU

### Immediate Questions:
1. **Which branch should we work on?** (bmad vs deployment-fixes)
2. **Friend's changes:** Has he pushed to Git? What did he add exactly?
3. **NUC status:** Can you run these commands and paste output?
   ```bash
   ssh obedio@10.10.0.10
   cd /home/obedio/obedio-app  # (or wherever project is)
   git branch
   git status
   git log -3 --oneline
   ```
4. **Priority:** Metstrade demo on Windows only? Or NUC must work too?

### What I've Already Done (Can Revert):
- ✅ Added imports to upload.ts
- ✅ Created audio upload configuration
- ✅ Added /api/upload-audio endpoint
- ⚠️ **Can easily revert these if we choose different strategy**

---

## 🎯 RECOMMENDATION

**For 24-hour deadline:**

**OPTION B - Work on bmad (Current Windows) FIRST:**

**Why:**
1. System already working on bmad
2. No risk of Git merge breaking things
3. Can test immediately
4. Merge with deployment-fixes AFTER Metstrade

**Then AFTER Metstrade:**
1. Merge bmad → deployment-fixes
2. Push to Git
3. Pull on NUC
4. Full system unified

**This gives you a working demo tomorrow, clean merge later.**

---

## ❓ DECISION NEEDED

Please tell me:
1. **Which approach?** (A, B, or C)
2. **NUC info:** Paste SSH command outputs OR tell me to skip NUC for now
3. **Friend's feature:** What exactly is the light toggle? Where is it?
4. **Approval:** Should I continue with audio endpoint OR revert and start fresh?

**I'm waiting for your direction before proceeding further!**