# Caddy Reverse Proxy Setup for OBEDIO

## Overview

A Caddy reverse proxy has been added to the OBEDIO stack to provide:
- **HTTPS access** with self-signed certificates
- **Clean domain access** via `https://obedio` instead of `http://10.10.0.10:3000`
- **Microphone support** - Web APIs require HTTPS for microphone/camera access
- **Security headers** - Modern security headers for enhanced protection

## Architecture

```
User Browser → Caddy (Port 443/HTTPS) → Frontend (Port 80) → Backend (Port 3001)
               ↓ Self-signed cert
               ↓ Reverse proxy
               ↓ Security headers
```

## Quick Start

### 1. Start the Stack with Caddy

```bash
# Start all services including Caddy
docker compose -f docker-compose.prod.yml up -d

# Check Caddy logs
docker logs obedio-caddy -f

# Verify all services are running
docker compose -f docker-compose.prod.yml ps
```

### 2. Configure Your System

**Add to /etc/hosts (or C:\Windows\System32\drivers\etc\hosts on Windows):**

```
10.10.0.10    obedio obedio.local
```

Replace `10.10.0.10` with your actual server IP address.

### 3. Access the Application

- **HTTPS (recommended):** `https://obedio` or `https://obedio.local`
- **HTTP (redirects to HTTPS):** `http://obedio`
- **Direct access (legacy):** `http://10.10.0.10:3000` (still works)

### 4. Accept Self-Signed Certificate

When first accessing `https://obedio`, your browser will warn about the self-signed certificate:

- **Chrome/Edge:** Click "Advanced" → "Proceed to obedio (unsafe)"
- **Firefox:** Click "Advanced" → "Accept the Risk and Continue"
- **Safari:** Click "Show Details" → "visit this website"

**Note:** This is expected for self-signed certificates and is safe for local/exhibition use.

## Port Configuration

| Service  | Internal Port | External Port | Protocol |
|----------|---------------|---------------|----------|
| Caddy    | 80, 443, 2019 | 80, 443, 2019 | HTTP/HTTPS |
| Frontend | 80            | 3000          | HTTP (legacy) |
| Backend  | 3001          | 3001          | HTTP |
| MQTT     | 1883, 9001    | 1883, 9001    | MQTT/WS |
| Database | 5432          | 5432          | PostgreSQL |

## Features

### Security Headers

Caddy automatically adds the following security headers:

- `Strict-Transport-Security` - Force HTTPS
- `X-Frame-Options` - Prevent clickjacking
- `X-Content-Type-Options` - Prevent MIME sniffing
- `X-XSS-Protection` - XSS protection
- `Permissions-Policy` - Allow microphone/camera for Web Audio API

### Health Checks

Caddy includes health checking for the frontend service:
- Health check every 10 seconds
- 5-second timeout
- Automatic failover if frontend is unhealthy

### Compression

Gzip compression is enabled automatically for faster page loads.

## Troubleshooting

### Cannot Access https://obedio

1. **Check /etc/hosts entry:**
   ```bash
   cat /etc/hosts | grep obedio
   ```

2. **Check Caddy is running:**
   ```bash
   docker ps | grep caddy
   ```

3. **Check Caddy logs:**
   ```bash
   docker logs obedio-caddy
   ```

### Certificate Errors

The self-signed certificate is normal for local development. To avoid warnings:

1. **For production:** Replace with a real certificate from Let's Encrypt
2. **For local dev:** Add the certificate to your system's trusted certificates
3. **Quick fix:** Use the "proceed anyway" option in your browser

### Microphone Still Not Working

1. **Ensure HTTPS is being used** (check the lock icon in address bar)
2. **Grant microphone permissions** when prompted by browser
3. **Check browser console** for any permission errors
4. **Verify Permissions-Policy header:**
   ```bash
   curl -I https://obedio 2>/dev/null | grep -i permissions
   ```

### Port Conflicts

If port 80 or 443 is already in use:

1. **Stop conflicting services:**
   ```bash
   # Find process using port 80
   sudo lsof -i :80
   sudo lsof -i :443
   ```

2. **Or modify Caddy ports in docker-compose.prod.yml:**
   ```yaml
   ports:
     - "8080:80"    # Use port 8080 instead
     - "8443:443"   # Use port 8443 instead
   ```

## Configuration Files

- **Caddyfile:** `/Users/nicolas/vibecoding/obedio/obedio-yacht-crew-management/Caddyfile`
- **Docker Compose:** `docker-compose.prod.yml`
- **Caddy Data:** Docker volume `caddy-data`
- **Caddy Config:** Docker volume `caddy-config`

## Management Commands

```bash
# Restart Caddy only
docker compose -f docker-compose.prod.yml restart caddy

# View Caddy health status
curl http://localhost:2019/health

# Reload Caddy config (without restart)
docker exec obedio-caddy caddy reload --config /etc/caddy/Caddyfile

# Check Caddy config syntax
docker exec obedio-caddy caddy validate --config /etc/caddy/Caddyfile

# Stop Caddy
docker compose -f docker-compose.prod.yml stop caddy

# Remove Caddy completely
docker compose -f docker-compose.prod.yml rm -f caddy
```

## For Production Use

To use a real certificate instead of self-signed:

1. **Update Caddyfile** to use automatic HTTPS:
   ```caddyfile
   obedio.yourdomain.com {
       # Remove 'tls internal' line
       # Caddy will automatically get Let's Encrypt certificate
       reverse_proxy frontend:80
   }
   ```

2. **Ensure domain points to your server** (DNS A record)

3. **Open ports 80 and 443** on your firewall

4. **Restart Caddy:**
   ```bash
   docker compose -f docker-compose.prod.yml restart caddy
   ```

## Notes

- The frontend is still accessible on port 3000 for backward compatibility
- Caddy runs on Alpine Linux for minimal footprint
- Self-signed certificates are regenerated automatically if needed
- All traffic is logged to stdout (visible via `docker logs`)
