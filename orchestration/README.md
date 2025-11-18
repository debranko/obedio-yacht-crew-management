# Orchestration & Deployment Scripts

This folder contains all deployment scripts, Docker configurations, and system orchestration tools.

## Docker & Container Configuration

- **docker-compose.yml** / **docker-compose.prod.yml** - Docker Compose configurations
- **Dockerfile** / **Dockerfile.frontend** - Container build files
- **nginx.conf** - Nginx web server configuration

## Windows Batch Scripts (.bat)

- START/STOP/RESTART-OBEDIO.bat - Main application control
- RESTART-FRONTEND.bat - Frontend restart
- DEBUG-MQTT.bat / TEST-MQTT.bat - MQTT debugging tools
- FORCE-STOP.bat / KILL-WINDOWS-MOSQUITTO.bat - Force stop utilities
- OBEDIO-MENU.bat - Main menu interface

## Shell Scripts (.sh)

- deploy-exhibition.sh - Exhibition deployment
- fix-and-deploy.sh - Fix and deploy workflow
- update-from-git.sh - Git update automation
- reseed-demo-data.sh - Demo data seeding

## PowerShell Scripts (.ps1)

- start.ps1 / stop.ps1 / restart.ps1 / reset.ps1 - PowerShell control scripts
