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

### guest-status-widget.ORIGINAL-BACKUP-2025-10-21.tsx
- **Original File:** `guest-status-widget.tsx`
- **Backup Date:** October 21, 2025, 1:01 AM
- **Reason:** Complete redesign to show guests by cabin
- **Changes Made:**
  - Was: Abstract status widget (Guests Onboard/No Guests)
  - Now: Shows list of guests with their cabin assignments
  - Displays "Name → Cabin" for each guest
  - Uses real data from AppDataContext (guests + locations)
  - Responsive layout that adapts to widget size
  - Sorts guests by cabin name
  - Empty state when no guests onboard

### How to Restore
If the new version has issues, simply:
```bash
# Duty Timer
cp src/components/__BACKUPS__/duty-timer-card.ORIGINAL-BACKUP-2025-10-21.tsx src/components/duty-timer-card.tsx

# Guest Status
cp src/components/__BACKUPS__/guest-status-widget.ORIGINAL-BACKUP-2025-10-21.tsx src/components/guest-status-widget.tsx
```

Or in PowerShell:
```powershell
# Duty Timer
Copy-Item "src\components\__BACKUPS__\duty-timer-card.ORIGINAL-BACKUP-2025-10-21.tsx" "src\components\duty-timer-card.tsx" -Force

# Guest Status
Copy-Item "src\components\__BACKUPS__\guest-status-widget.ORIGINAL-BACKUP-2025-10-21.tsx" "src\components\guest-status-widget.tsx" -Force
```

---

**Note:** Always create a backup before making major component changes!
