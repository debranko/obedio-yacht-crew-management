#!/bin/bash
# Install Caddy Reverse Proxy on NUC
# Run this script on the NUC directly

set -e  # Exit on error

echo "=== Installing Caddy Reverse Proxy on OBEDIO NUC ==="
echo ""

# Navigate to project directory
cd /opt/obedio-yacht-crew-management

# Backup current docker-compose
echo "1. Backing up docker-compose.prod.yml..."
cp docker-compose.prod.yml docker-compose.prod.yml.backup.$(date +%Y%m%d_%H%M%S)

# Create Caddyfile
echo "2. Creating Caddyfile..."
cat > Caddyfile << 'CADDYFILE_EOF'
# Caddyfile for OBEDIO Reverse Proxy
# Provides HTTPS access to frontend with self-signed certificate

# Main domain configuration
obedio, obedio.local {
    # Use self-signed certificate for local development
    tls internal

    # Reverse proxy to frontend service
    reverse_proxy frontend:80 {
        # Pass original host header
        header_up Host {host}
        header_up X-Real-IP {remote}
        header_up X-Forwarded-For {remote}
        header_up X-Forwarded-Proto {scheme}

        # Health check
        health_uri /
        health_interval 10s
        health_timeout 5s
    }

    # Logging
    log {
        output stdout
        format console
        level INFO
    }

    # Enable gzip compression
    encode gzip

    # Security headers
    header {
        # Enable HTTPS Strict Transport Security
        Strict-Transport-Security "max-age=31536000; includeSubDomains"

        # Prevent clickjacking
        X-Frame-Options "SAMEORIGIN"

        # XSS protection
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"

        # Referrer policy
        Referrer-Policy "strict-origin-when-cross-origin"

        # Allow microphone and camera access (needed for Web Audio API)
        Permissions-Policy "microphone=(self), camera=(self)"
    }
}

# Health check endpoint for Caddy itself
:2019 {
    respond /health 200
}
CADDYFILE_EOF

echo "   ✓ Caddyfile created"

# Update docker-compose.prod.yml with Caddy service
echo "3. Updating docker-compose.prod.yml..."

# Check if Caddy service already exists
if grep -q "obedio-caddy" docker-compose.prod.yml; then
    echo "   ⚠ Caddy service already exists in docker-compose.prod.yml"
    echo "   Skipping update. Remove manually if you want to recreate."
else
    # Add Caddy service before the volumes section
    sed -i '/^volumes:/i\
  # Caddy Reverse Proxy (HTTPS with self-signed certificate)\
  caddy:\
    image: caddy:2-alpine\
    container_name: obedio-caddy\
    restart: unless-stopped\
    depends_on:\
      - frontend\
    ports:\
      - "80:80"\
      - "443:443"\
      - "2019:2019"\
    volumes:\
      - ./Caddyfile:/etc/caddy/Caddyfile:ro\
      - caddy-data:/data\
      - caddy-config:/config\
    networks:\
      - obedio-network\
    healthcheck:\
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:2019/health"]\
      interval: 10s\
      timeout: 5s\
      retries: 3\
\
' docker-compose.prod.yml

    # Add Caddy volumes
    sed -i '/^volumes:/a\  caddy-data:\n    driver: local\n  caddy-config:\n    driver: local' docker-compose.prod.yml

    echo "   ✓ docker-compose.prod.yml updated"
fi

# Validate docker-compose configuration
echo "4. Validating docker-compose configuration..."
docker compose -f docker-compose.prod.yml config --services > /dev/null 2>&1
echo "   ✓ Configuration valid"

# Start Caddy container
echo "5. Starting Caddy container..."
docker compose -f docker-compose.prod.yml up -d caddy

# Wait for Caddy to be ready
echo "6. Waiting for Caddy to be ready..."
sleep 3

# Test Caddy
echo "7. Testing Caddy..."
echo ""

echo "   Testing health endpoint..."
if curl -s http://localhost:2019/health > /dev/null; then
    echo "   ✓ Caddy health check: OK"
else
    echo "   ✗ Caddy health check: FAILED"
fi

echo ""
echo "   Testing HTTPS with Host header..."
if curl -k -s -H "Host: obedio" https://localhost/ | grep -q "<!DOCTYPE html>"; then
    echo "   ✓ HTTPS proxy to frontend: OK"
else
    echo "   ✗ HTTPS proxy to frontend: FAILED"
fi

echo ""
echo "=== Installation Complete! ==="
echo ""
echo "Caddy is now running and proxying to your frontend."
echo ""
echo "Access URLs:"
echo "  - HTTPS (recommended): https://obedio"
echo "  - HTTP (redirects):    http://obedio"
echo "  - Legacy:              http://10.10.0.10:3000"
echo ""
echo "Note: Add '10.10.0.10  obedio obedio.local' to your /etc/hosts file"
echo "      to access via domain name from other devices."
echo ""
echo "Commands:"
echo "  - View logs:     docker logs obedio-caddy -f"
echo "  - Restart:       docker compose -f docker-compose.prod.yml restart caddy"
echo "  - Stop:          docker compose -f docker-compose.prod.yml stop caddy"
echo ""
echo "Test with: curl -k -v -H 'Host: obedio' https://localhost/"
echo ""
