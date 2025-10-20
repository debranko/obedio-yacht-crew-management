# Component Backups

This folder contains original backup copies of components before significant changes.

## Backups

### duty-timer-card.ORIGINAL-BACKUP-2025-10-21.tsx
- **Original File:** `duty-timer-card.tsx`
- **Backup Date:** October 21, 2025, 12:47 AM
- **Reason:** Major redesign to make timer more compact
- **Changes Made:**
  - Reduced size from 320px to 240px (~25% smaller)
  - Countdown numbers positioned inside the circle
  - Text "HOURS BETWEEN SHIFTS" made more visible
  - Font sizes adjusted for compact layout
  - Ring radii scaled proportionally (innerR: 104→78, outerR: 122→92)

### How to Restore
If the new version has issues, simply:
```bash
cp src/components/__BACKUPS__/duty-timer-card.ORIGINAL-BACKUP-2025-10-21.tsx src/components/duty-timer-card.tsx
```

Or in PowerShell:
```powershell
Copy-Item "src\components\__BACKUPS__\duty-timer-card.ORIGINAL-BACKUP-2025-10-21.tsx" "src\components\duty-timer-card.tsx" -Force
```

---

**Note:** Always create a backup before making major component changes!
