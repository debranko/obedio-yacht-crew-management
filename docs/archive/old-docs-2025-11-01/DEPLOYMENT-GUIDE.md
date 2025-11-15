# OBEDIO Deployment Guide 🚀

Complete step-by-step guide for deploying OBEDIO yacht crew management system to production.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (Docker)](#quick-start-docker)
3. [Production Deployment](#production-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [SSL/HTTPS Setup](#sslhttps-setup)
7. [Monitoring & Logging](#monitoring--logging)
8. [Troubleshooting](#troubleshooting)
9. [Backup & Recovery](#backup--recovery)

---

## Prerequisites

### Required Software
- **Docker** 24.0+ & **Docker Compose** 2.20+
- **Node.js** 20+ (for local development)
- **PostgreSQL** 15+ (if not using Docker)
- **Git** (for version control)

### Recommended Infrastructure
- **Server**: 2 CPU cores, 4GB RAM minimum (8GB recommended)
- **Storage**: 20GB+ SSD
- **OS**: Ubuntu 22.04 LTS or similar Linux distribution
- **Network**: Static IP or domain name

---

## Quick Start (Docker)

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd "Luxury Minimal Web App Design"
```

### 2. Create Environment File

```bash
# Copy Docker example
cp .env.docker.example .env

# Edit with your values
nano .env
```

**Required Environment Variables:**

```env
# Database
DATABASE_URL=postgresql://postgres:YOUR_SECURE_PASSWORD@postgres:5432/obedio

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=YOUR_RANDOM_SECRET_HERE

# MQTT Broker
MQTT_BROKER_URL=mqtt://mqtt:1883
MQTT_USERNAME=admin
MQTT_PASSWORD=YOUR_MQTT_PASSWORD

# Backend Port
BACKEND_PORT=3001

# Frontend Port
FRONTEND_PORT=8080

# Node Environment
NODE_ENV=production
```

### 3. Build and Start

```bash
# Build all services
docker-compose build

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Initialize Database

```bash
# Run Prisma migrations
docker-compose exec backend npx prisma migrate deploy

# Seed initial data (creates default admin user)
docker-compose exec backend npx prisma db seed
```

### 5. Access Application

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api-docs

**Default Admin Credentials:**
- Username: `admin`
- Password: `admin123` (CHANGE IMMEDIATELY!)

---

## Production Deployment

### Option 1: VPS/Cloud Server (Recommended)

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin

# Create deployment user
sudo useradd -m -s /bin/bash obedio
sudo usermod -aG docker obedio
```

#### 2. Upload Application

```bash
# Option A: Git clone (recommended)
su - obedio
git clone <your-repo-url> /home/obedio/app
cd /home/obedio/app

# Option B: SCP upload
scp -r ./* user@server:/home/obedio/app/
```

#### 3. Configure Production Environment

```bash
cd /home/obedio/app

# Create production .env
cat > .env << 'EOF'
DATABASE_URL=postgresql://postgres:SECURE_PASSWORD@postgres:5432/obedio
JWT_SECRET=$(openssl rand -base64 32)
MQTT_BROKER_URL=mqtt://mqtt:1883
MQTT_USERNAME=admin
MQTT_PASSWORD=$(openssl rand -base64 16)
BACKEND_PORT=3001
FRONTEND_PORT=8080
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
EOF
```

#### 4. Deploy with Docker

```bash
# Build and start
docker-compose up -d

# Initialize database
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma db seed

# Verify all services are running
docker-compose ps
```

#### 5. Configure Firewall

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow SSH (if needed)
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable
```

### Option 2: Separate Services (Advanced)

#### Backend Deployment

```bash
cd backend

# Install dependencies
npm ci --only=production

# Build TypeScript
npm run build

# Run migrations
npx prisma migrate deploy

# Start with PM2
npm install -g pm2
pm2 start dist/server.js --name obedio-backend
pm2 save
pm2 startup
```

#### Frontend Deployment

```bash
cd ../

# Install dependencies
npm ci

# Build production bundle
npm run build

# Serve with Nginx (see SSL setup below)
sudo cp -r dist/* /var/www/obedio/
```

---

## Environment Configuration

### Backend Environment Variables

```env
# === REQUIRED ===

# Database connection string
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE

# JWT secret for authentication (generate random: openssl rand -base64 32)
JWT_SECRET=your-random-secret-minimum-32-characters

# MQTT broker for smart button communication
MQTT_BROKER_URL=mqtt://localhost:1883

# === OPTIONAL ===

# Server port (default: 3001)
PORT=3001

# CORS allowed origins (comma-separated)
CORS_ORIGIN=https://app.yourdomain.com,https://yourdomain.com

# MQTT authentication
MQTT_USERNAME=admin
MQTT_PASSWORD=secure-password

# Node environment
NODE_ENV=production

# Log level (error, warn, info, debug)
LOG_LEVEL=info

# Session settings
SESSION_SECRET=another-random-secret
SESSION_MAX_AGE=86400000

# File upload limits
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Email settings (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Push notification settings (optional)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

### Frontend Environment Variables

```env
# API base URL
VITE_API_URL=https://api.yourdomain.com

# WebSocket URL
VITE_WS_URL=wss://api.yourdomain.com

# Environment
VITE_ENV=production

# Feature flags
VITE_ENABLE_PWA=true
VITE_ENABLE_VOICE=true
```

---

## Database Setup

### PostgreSQL Configuration (Production)

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
```

```sql
-- Create database
CREATE DATABASE obedio;

-- Create user with strong password
CREATE USER obedio_user WITH PASSWORD 'YOUR_SECURE_PASSWORD';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE obedio TO obedio_user;

-- Exit
\q
```

### Database Backups

```bash
# Manual backup
docker-compose exec postgres pg_dump -U postgres obedio > backup-$(date +%Y%m%d).sql

# Automated daily backups (cron job)
crontab -e

# Add this line (runs at 2 AM daily)
0 2 * * * cd /home/obedio/app && docker-compose exec -T postgres pg_dump -U postgres obedio > /home/obedio/backups/backup-$(date +\%Y\%m\%d).sql
```

### Restore Database

```bash
# From backup file
docker-compose exec -T postgres psql -U postgres obedio < backup-20250124.sql

# Or using docker cp
docker cp backup-20250124.sql obedio_postgres:/tmp/
docker-compose exec postgres psql -U postgres obedio -f /tmp/backup-20250124.sql
```

---

## SSL/HTTPS Setup

### Using Nginx Reverse Proxy (Recommended)

#### 1. Install Nginx

```bash
sudo apt install nginx certbot python3-certbot-nginx
```

#### 2. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/obedio
```

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (will be added by certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Increase timeout for long-running requests
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # WebSocket endpoint
    location /socket.io/ {
        proxy_pass http://localhost:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeout
        proxy_read_timeout 86400;
    }
}
```

#### 3. Enable Site and Get SSL Certificate

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/obedio /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Restart Nginx
sudo systemctl restart nginx

# Auto-renewal (certbot adds cron job automatically)
sudo certbot renew --dry-run
```

---

## Monitoring & Logging

### Container Health Monitoring

```bash
# Check all containers
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Check resource usage
docker stats
```

### Application Monitoring

```bash
# Install PM2 (if not using Docker)
npm install -g pm2

# Monitor processes
pm2 monit

# View logs
pm2 logs

# Setup log rotation
pm2 install pm2-logrotate
```

### Health Check Endpoints

- **Backend**: `GET /api/health`
- **Database**: Check via backend health endpoint
- **MQTT**: Check connection status in Device Manager

### Recommended Monitoring Tools

1. **Uptime Monitoring**: UptimeRobot, Pingdom
2. **Error Tracking**: Sentry (add to backend)
3. **Logs**: Papertrail, Loggly
4. **Server Metrics**: Netdata, Grafana + Prometheus

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check connection string
docker-compose exec backend env | grep DATABASE_URL

# Test connection manually
docker-compose exec postgres psql -U postgres obedio -c "SELECT 1"

# Check logs
docker-compose logs postgres
```

#### 2. Frontend Can't Connect to Backend

```bash
# Check CORS configuration
docker-compose exec backend env | grep CORS_ORIGIN

# Verify backend is running
curl http://localhost:3001/api/health

# Check network connectivity
docker-compose exec frontend ping backend
```

#### 3. MQTT Connection Issues

```bash
# Check MQTT broker
docker-compose logs mqtt

# Test MQTT connection
docker-compose exec backend node -e "
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://mqtt:1883');
client.on('connect', () => console.log('Connected!'));
"
```

#### 4. High Memory Usage

```bash
# Check container stats
docker stats

# Restart specific service
docker-compose restart backend

# Increase container limits in docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
```

#### 5. Slow Performance

```bash
# Check database indexes
docker-compose exec postgres psql -U postgres obedio -c "
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
"

# Analyze query performance
docker-compose exec backend npx prisma studio

# Clear React Query cache (frontend)
# Open DevTools > Application > Clear Storage
```

### Debug Mode

```bash
# Enable debug logging
echo "LOG_LEVEL=debug" >> .env

# Restart services
docker-compose restart backend

# View detailed logs
docker-compose logs -f backend | grep DEBUG
```

---

## Backup & Recovery

### Full System Backup

```bash
#!/bin/bash
# backup.sh - Full system backup script

BACKUP_DIR="/home/obedio/backups"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/home/obedio/app"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec -T postgres pg_dump -U postgres obedio > $BACKUP_DIR/db_$DATE.sql

# Backup uploaded files
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz $APP_DIR/backend/uploads

# Backup environment files
cp $APP_DIR/.env $BACKUP_DIR/env_$DATE

# Backup Prisma migrations
tar -czf $BACKUP_DIR/migrations_$DATE.tar.gz $APP_DIR/backend/prisma

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

### Recovery Steps

```bash
# 1. Stop services
docker-compose down

# 2. Restore database
docker-compose up -d postgres
sleep 10
docker-compose exec -T postgres psql -U postgres obedio < db_20250124_120000.sql

# 3. Restore files
cd /home/obedio/app/backend
tar -xzf /home/obedio/backups/uploads_20250124_120000.tar.gz

# 4. Start all services
docker-compose up -d

# 5. Verify
curl http://localhost:3001/api/health
```

---

## Production Checklist

### Pre-Deployment

- [ ] Change all default passwords
- [ ] Generate strong JWT_SECRET
- [ ] Configure CORS origins
- [ ] Set NODE_ENV=production
- [ ] Enable SSL/HTTPS
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Configure email notifications
- [ ] Test all critical features
- [ ] Review security headers

### Post-Deployment

- [ ] Verify all services are running
- [ ] Test user authentication
- [ ] Test WebSocket connections
- [ ] Test service request flow
- [ ] Test MQTT button simulation
- [ ] Configure monitoring alerts
- [ ] Set up log rotation
- [ ] Document admin procedures
- [ ] Train end users
- [ ] Schedule regular backups

### Security Hardening

- [ ] Disable root SSH login
- [ ] Use SSH keys instead of passwords
- [ ] Install fail2ban
- [ ] Enable automatic security updates
- [ ] Set up intrusion detection
- [ ] Review file permissions
- [ ] Enable audit logging
- [ ] Configure rate limiting
- [ ] Set up WAF (Web Application Firewall)

---

## Performance Optimization

### Docker Optimization

```yaml
# docker-compose.yml - Production optimizations
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 1G
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Database Optimization

```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_service_requests_status ON "ServiceRequest"(status);
CREATE INDEX idx_service_requests_created ON "ServiceRequest"("createdAt");
CREATE INDEX idx_guests_location ON "Guest"("locationId");

-- Analyze tables
ANALYZE;

-- Vacuum database
VACUUM ANALYZE;
```

### Nginx Caching

```nginx
# Add to nginx config
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;

location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_bypass $http_cache_control;
    add_header X-Cache-Status $upstream_cache_status;

    # ... rest of proxy config
}
```

---

## Support & Maintenance

### Regular Maintenance Tasks

**Daily:**
- Check application logs
- Monitor system resources
- Verify backups completed

**Weekly:**
- Review error logs
- Check disk space
- Update security patches

**Monthly:**
- Database optimization (VACUUM)
- Review access logs
- Test backup restoration
- Update dependencies

### Getting Help

- **Documentation**: See README.md and CLAUDE-*.md files
- **API Docs**: http://your-domain.com/api-docs
- **Logs**: `docker-compose logs -f`
- **Health Check**: `curl http://localhost:3001/api/health`

---

## Next Steps

1. **Set up monitoring** - Configure Sentry, UptimeRobot, or similar
2. **Enable auto-backups** - Set up automated daily backups
3. **User training** - Train crew on using the system
4. **Mobile testing** - Test on actual tablets/phones used on yacht
5. **Load testing** - Test with multiple simultaneous users
6. **Disaster recovery plan** - Document recovery procedures

---

**Deployment Completed!** 🎉

Your OBEDIO system is now running in production. Monitor the logs and health endpoints to ensure everything is working correctly.
