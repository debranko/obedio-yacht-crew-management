# Obedio Scripts

Utility scripts for development, deployment, and maintenance.

---

## Essential Scripts (at project root)

| Script | Description |
|--------|-------------|
| `START.bat` | Start all services (frontend + backend) |
| `STOP.bat` | Stop all services |
| `RESTART.bat` | Restart all services |
| `OBEDIO-MENU.bat` | Interactive menu |

---

## Development Scripts (`scripts/development/`)

| Script | Description |
|--------|-------------|
| `DEBUG-MQTT.bat` | Debug MQTT connection |
| `TEST-MQTT.bat` | Test MQTT messaging |
| `TEST-MQTT-CLI.bat` | Test MQTT via CLI |
| `RESTART-FRONTEND.bat` | Restart frontend only |
| `FORCE-FRONTEND-RESTART.bat` | Force restart frontend |
| `KILL-WINDOWS-MOSQUITTO.bat` | Kill MQTT broker process |

---

## Deployment Scripts (`scripts/deployment/`)

| Script | Description |
|--------|-------------|
| `deploy-exhibition.sh` | Deploy for exhibition |
| `fix-and-deploy.sh` | Fix and deploy |
| `update-from-git.sh` | Pull updates from Git |
| `reseed-demo-data.sh` | Reseed database with demo data |

---

## Maintenance Scripts (`scripts/maintenance/`)

| Script | Description |
|--------|-------------|
| `FORCE-STOP.bat` | Force stop all processes |
| `RESET.bat` | Reset to clean state |
| `git-push-to-github.bat` | Push changes to GitHub |
| `ARCHIVE-OLD-DOCS.bat` | Archive old documentation |
