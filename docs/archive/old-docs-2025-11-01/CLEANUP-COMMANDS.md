# 🧹 KOMANDE ZA ČIŠĆENJE STARIH FAJLOVA

Izvršite ove komande u terminalu da počistite stare dokumente:

## 1. Kreirati arhiv folder
```bash
mkdir -p docs/archive/old-docs-2025-11-01
```

## 2. Premestiti stare rules dokumente
```bash
# Stari rules (zamenjeni sa OBEDIO-CONSOLIDATED-RULES-FOR-AI.md)
move OBEDIO-STRICT-DEVELOPMENT-RULES.md docs/archive/old-docs-2025-11-01/
move OBEDIO-MANDATORY-DEVELOPMENT-RULES.md docs/archive/old-docs-2025-11-01/
move OBEDIO-AI-DEVELOPMENT-RULES.md docs/archive/old-docs-2025-11-01/
move OBEDIO-PROJECT-MANAGER-TASKS.md docs/archive/old-docs-2025-11-01/
move OBEDIO-COMPREHENSIVE-ANALYSIS-REPORT.md docs/archive/old-docs-2025-11-01/
```

## 3. Premestiti session notes i status fajlove
```bash
# CLAUDE session notes
move CLAUDE-API-DOCUMENTATION.md docs/archive/old-docs-2025-11-01/
move CLAUDE-CODE-CLEANUP-RECOMMENDATIONS.md docs/archive/old-docs-2025-11-01/
move CLAUDE-COMPLETE-TASK-LIST-DETAILED.md docs/archive/old-docs-2025-11-01/
move CLAUDE-DOCKER-CONFIG.md docs/archive/old-docs-2025-11-01/
move CLAUDE-ERROR-BOUNDARIES.md docs/archive/old-docs-2025-11-01/
move CLAUDE-FINAL-SUMMARY.md docs/archive/old-docs-2025-11-01/
move CLAUDE-LOADING-STATES.md docs/archive/old-docs-2025-11-01/
move CLAUDE-NEXT-TASKS.md docs/archive/old-docs-2025-11-01/
move CLAUDE-PERFORMANCE-OPTIMIZATIONS.md docs/archive/old-docs-2025-11-01/
move CLAUDE-PWA-SUPPORT.md docs/archive/old-docs-2025-11-01/
move CLAUDE-ROLE-BASED-DASHBOARD.md docs/archive/old-docs-2025-11-01/
move CLAUDE-WORK-REVIEW-FINAL.md docs/archive/old-docs-2025-11-01/

# Status i complete fajlovi
move APPLICATION-READINESS-REPORT.md docs/archive/old-docs-2025-11-01/
move BACKEND-API-PROGRESS-REPORT.md docs/archive/old-docs-2025-11-01/
move BACKEND-DATABASE-TEST-PLAN.md docs/archive/old-docs-2025-11-01/
move BACKEND-ESP32-COMPLIANCE-FIX.md docs/archive/old-docs-2025-11-01/
move BUTTON-PRESS-BACKEND-READY.md docs/archive/old-docs-2025-11-01/
move BUTTON-SIMULATOR-INTEGRATION-COMPLETE.md docs/archive/old-docs-2025-11-01/
move COMPLETE-SYSTEM-COMPLIANCE-VERIFIED.md docs/archive/old-docs-2025-11-01/
move DEPLOYMENT-AND-TESTING-COMPLETE.md docs/archive/old-docs-2025-11-01/
move FINAL-PORT-AND-DOCKER-SUMMARY.md docs/archive/old-docs-2025-11-01/
move FINAL-SESSION-COMPLETE.md docs/archive/old-docs-2025-11-01/
move SUCCESS-MQTT-FIXED.md docs/archive/old-docs-2025-11-01/
move SYSTEM-RUNNING-TEST-NOW.md docs/archive/old-docs-2025-11-01/

# MQTT temp fajlovi
move CHECK-MQTT-CONNECTION.md docs/archive/old-docs-2025-11-01/
move CHECK-MQTT-STATUS.md docs/archive/old-docs-2025-11-01/
move FIX-MQTT-NOW.md docs/archive/old-docs-2025-11-01/
move MQTT-BUTTON-SIMULATOR-SETUP.md docs/archive/old-docs-2025-11-01/
move MQTT-FIX-COMPLETE.md docs/archive/old-docs-2025-11-01/
move MQTT-FIX-INSTRUCTIONS.md docs/archive/old-docs-2025-11-01/
move MQTT-MONITOR-FIXED.md docs/archive/old-docs-2025-11-01/
move MQTT-NOTIFICATION-FIX.md docs/archive/old-docs-2025-11-01/
move MQTT-PROBLEM-FOUND.md docs/archive/old-docs-2025-11-01/
move MQTT-SYSTEM-READY.md docs/archive/old-docs-2025-11-01/

# Ostali nepotrebni
move CODE-REVIEW-SUMMARY.md docs/archive/old-docs-2025-11-01/
move CLEANUP-OLD-FILES.md docs/archive/old-docs-2025-11-01/
move COMPREHENSIVE-APP-ANALYSIS.md docs/archive/old-docs-2025-11-01/
move COMPREHENSIVE-AUDIT-REPORT.md docs/archive/old-docs-2025-11-01/
move COMPREHENSIVE-CODE-REVIEW.md docs/archive/old-docs-2025-11-01/
move COMPREHENSIVE-SYSTEM-REVIEW-2025-01-22.md docs/archive/old-docs-2025-11-01/
move COMPREHENSIVE-UPDATE-COMPARISON.md docs/archive/old-docs-2025-11-01/
move CREW-PAGE-FIXES-FINAL.md docs/archive/old-docs-2025-11-01/
move CREW-PAGE-LOCKED.md docs/archive/old-docs-2025-11-01/
move CREW-PAGE-TEST-PROMPT.md docs/archive/old-docs-2025-11-01/
move DOCKER-STATUS-AND-INSTRUCTIONS.md docs/archive/old-docs-2025-11-01/
move ESP32-FIRMWARE-DETAILED-SPECIFICATION.md docs/archive/old-docs-2025-11-01/
move ESP32-SPECIFICATION-COMPLIANCE.md docs/archive/old-docs-2025-11-01/
move GITHUB-SETUP.md docs/archive/old-docs-2025-11-01/
move GUEST-INTEGRATION-COMPLETE.md docs/archive/old-docs-2025-11-01/
move GUEST-INTEGRATION-STATUS.md docs/archive/old-docs-2025-11-01/
move IMMEDIATE-FIXES-GUIDE.md docs/archive/old-docs-2025-11-01/
move MANAGEMENT-SCRIPTS-UPDATED.md docs/archive/old-docs-2025-11-01/
move METSTRADE-2025-ROADMAP.md docs/archive/old-docs-2025-11-01/
move OBEDIO-CODE-REVIEW-REPORT.md docs/archive/old-docs-2025-11-01/
move OBEDIO-COMPREHENSIVE-TASK-LIST.md docs/archive/old-docs-2025-11-01/
move ONE-CLICK-MANAGEMENT.md docs/archive/old-docs-2025-11-01/
move PORT-CONFIGURATION-FIX.md docs/archive/old-docs-2025-11-01/
move PRIORITY-ACTION-PLAN.md docs/archive/old-docs-2025-11-01/
move PRODUCTION-CHECKLIST.md docs/archive/old-docs-2025-11-01/
move PRODUCTION-DEPLOYMENT-GUIDE.md docs/archive/old-docs-2025-11-01/
move QUICK-TEST-BUTTON-PRESS.md docs/archive/old-docs-2025-11-01/
move REFACTORING-BACKUP-INSTRUCTIONS.md docs/archive/old-docs-2025-11-01/
move REFACTORING-PLAN.md docs/archive/old-docs-2025-11-01/
move ROLES-PERMISSIONS.md docs/archive/old-docs-2025-11-01/
move SCRIPTS-README.md docs/archive/old-docs-2025-11-01/
move STATUS-AFTER-CLEANUP.md docs/archive/old-docs-2025-11-01/
move TEST-README.md docs/archive/old-docs-2025-11-01/
move TWATCH-DEVICE-MANAGER-FIX.md docs/archive/old-docs-2025-11-01/
move TWATCH-DISPLAY-ALTERNATIVE.md docs/archive/old-docs-2025-11-01/
move TWATCH-DISPLAY-FIRMWARE-READY.md docs/archive/old-docs-2025-11-01/
move UNDERSTOOD-YOUR-SYSTEM.md docs/archive/old-docs-2025-11-01/
move VERSIONS-LOG.md docs/archive/old-docs-2025-11-01/
move MD-FILES-TO-DELETE.txt docs/archive/old-docs-2025-11-01/
```

## 4. Premestiti nepotrebni OBEDIO-STREAMLINED-DOCUMENTATION.md
```bash
move OBEDIO-STREAMLINED-DOCUMENTATION.md docs/archive/old-docs-2025-11-01/
```

## 5. Obrisati ovaj fajl nakon izvršavanja
```bash
del CLEANUP-COMMANDS.md
```

## FINALNI REZULTAT - Samo ovih 5 fajlova ostaje u root:

✅ **OBEDIO-CONSOLIDATED-RULES-FOR-AI.md** - Nova konsolidovana pravila  
✅ **OBEDIO-IMPLEMENTATION-TODO-LIST.md** - Lista zadataka  
✅ **OBEDIO-TECHNICAL-SPECIFICATIONS.md** - Code patterns  
✅ **CLAUDE-CODE-START-INSTRUCTIONS.md** - Kako početi  
✅ **README.md** - Osnovne informacije

Plus standardni fajlovi:
- HOW-TO-RUN.md
- QUICK-START.md  
- DEPLOYMENT-GUIDE.md
- TESTING-GUIDE.md
- HARDWARE-MOBILE-SETUP-GUIDE.md
- MANDATORY-CHECKLIST-FOR-CLAUDE.md

## NAPOMENA:
Koristite `move` komandu na Windows ili `mv` na Linux/Mac.