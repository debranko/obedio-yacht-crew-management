# Obedio Version Log (Plain-Language)

This file is a simple list of changes explained in everyday language. Each change gets its own entry with what was changed, why, and how to undo it if needed.

## How to use this file
- Read from top to bottom: newest entries will be added at the top.
- If you ever want to go back, find the entry and follow its “How to undo” note.
- You can also search by date or change ID.

## Entry format
- ID: YYYY-MM-DD-### (unique per change)
- Date/Time: local time when we applied the change
- What changed: short, plain description
- Why: the reason we did it
- Files touched: file names (so you can find them)
- How to undo: simple steps to go back

## Baseline (before any new changes today)
- Frontend API target (default): http://localhost:3001/api as coded in the app settings.
- Backend server runs on: http://localhost:8080 (port 8080).
- Device Manager: there are two screens in the code — “Device Manager (full)” and an older “Device Manager”. We will switch to the full one.

## Next planned changes (approved)
1) Point the web app to the server on http://localhost:8080/api so the app and server talk to each other.
2) Fix Device Manager actions (Create / Save / Test) so they send requests correctly.
3) Show the complete Device Manager screen everywhere in the app (hide the old one).

Change entries will be added below as we apply them.
## ID: 2025-10-22-001 — Frontend API URL aligned to backend

- Date/Time: 2025-10-22 16:02 (CEST)
- What changed:
  - Set the web app to talk to the server on http://localhost:8080/api by adding VITE_API_URL in the `.env` file.
- Why:
  - Your server runs on port 8080, but the web app previously expected 3001. This change makes them match so all data loads correctly.
- Files touched:
  - .env → added line: `VITE_API_URL=http://localhost:8080/api`
  - The app already reads this value in src/services/api.ts (no code change needed).
- How to undo:
  - Open `.env` and either remove the VITE_API_URL line or change it back to `http://localhost:3001/api`, then restart the web app.

## ID: 2025-10-22-002 — Fixed Device Manager actions

- Date/Time: 2025-10-22 16:06 (CEST)
- What changed:
  - Fixed how Device Manager sends data to the server when creating, updating, or deleting devices.
- Why:
  - The code was trying to extract data twice (like opening a box inside a box), but there was only one box. This caused errors when trying to add or modify devices.
- Files touched:
  - src/hooks/useDevices.ts → changed `response.data.data` to just `response` in three places
- How to undo:
  - Open src/hooks/useDevices.ts and change back: `response` → `response.data.data` in createDevice, updateDevice, and deleteDevice functions.

## ID: 2025-10-22-003 — Removed old Device Manager screen

- Date/Time: 2025-10-22 16:16 (CEST)
- What changed:
  - Deleted the old Device Manager screen that had fake test data built into it.
- Why:
  - The app was already using the new Device Manager that connects to the real server. The old one with fake data was just taking up space and could confuse developers.
- Files touched:
  - src/components/pages/device-manager.tsx → deleted this file completely
- How to undo:
  - Restore the file from git history or backup. The old Device Manager had hardcoded mock devices for testing but wasn't connected to the real backend.

- Date/Time: 2025-10-22 16:13 (CEST)
- What changed:
  - Fixed Create, Update, Delete, and Test buttons in Device Manager so they work with the real server.
  - The code was expecting a different response format than what the server actually sends.
- Why:
  - Without this fix, clicking those buttons would cause errors and the actions wouldn't complete.
- Files touched:
  - src/hooks/useDevices.ts → removed extra ".data.data" from lines 155, 165, 185, 196 (simplified the response handling)
- How to undo:
  - Open src/hooks/useDevices.ts and add back ".data.data" to those same lines where "return response" appears.
