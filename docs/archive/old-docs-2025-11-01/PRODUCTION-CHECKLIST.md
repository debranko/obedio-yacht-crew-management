# OBEDIO Production Deployment Checklist ✅

Complete pre-launch checklist to ensure production readiness.

---

## 📋 Pre-Deployment Checklist

### Security Configuration

- [ ] **Change Default Passwords**
  - [ ] Admin user password changed from `admin123`
  - [ ] PostgreSQL password changed
  - [ ] MQTT broker password changed
  - [ ] All default credentials documented in secure location

- [ ] **JWT & Session Security**
  - [ ] JWT_SECRET generated (min 32 characters): `openssl rand -base64 32`
  - [ ] SESSION_SECRET generated
  - [ ] Token expiration configured (default: 7 days)
  - [ ] Refresh token strategy implemented

- [ ] **CORS Configuration**
  - [ ] CORS_ORIGIN set to production domain only
  - [ ] Remove `localhost` from allowed origins
  - [ ] Verify OPTIONS requests working

- [ ] **SSL/HTTPS**
  - [ ] SSL certificate obtained (Let's Encrypt or commercial)
  - [ ] HTTPS redirect configured
  - [ ] Mixed content warnings resolved
  - [ ] HSTS header enabled
  - [ ] SSL certificate auto-renewal configured

- [ ] **Environment Variables**
  - [ ] All `.env` files created from `.env.example`
  - [ ] No sensitive data committed to Git
  - [ ] Production DATABASE_URL configured
  - [ ] NODE_ENV set to `production`
  - [ ] API URLs updated to production domains

---

### Infrastructure Setup

- [ ] **Server Provisioning**
  - [ ] Server meets minimum requirements (2 CPU, 4GB RAM, 20GB storage)
  - [ ] OS updated and patched (Ubuntu 22.04 LTS recommended)
  - [ ] Firewall configured (ports 80, 443 open)
  - [ ] SSH key authentication enabled
  - [ ] Root login disabled

- [ ] **Docker Installation**
  - [ ] Docker 24.0+ installed
  - [ ] Docker Compose plugin installed
  - [ ] Docker service enabled and running
  - [ ] Non-root user added to docker group

- [ ] **Domain & DNS**
  - [ ] Domain name registered
  - [ ] DNS A records configured
  - [ ] Domain propagation verified (`nslookup yourdomain.com`)
  - [ ] Subdomain for API configured (optional)

- [ ] **Reverse Proxy (Nginx)**
  - [ ] Nginx installed and configured
  - [ ] Virtual host configuration created
  - [ ] Proxy headers configured correctly
  - [ ] Gzip compression enabled
  - [ ] Static file caching configured

---

### Database Setup

- [ ] **PostgreSQL Configuration**
  - [ ] Database created: `obedio`
  - [ ] Database user created with strong password
  - [ ] User permissions granted
  - [ ] Connection tested from backend

- [ ] **Migrations & Seeding**
  - [ ] Prisma migrations run: `npx prisma migrate deploy`
  - [ ] Database seeded: `npx prisma db seed`
  - [ ] Database schema validated
  - [ ] Foreign key constraints verified

- [ ] **Backup Strategy**
  - [ ] Daily automated backups configured
  - [ ] Backup retention policy defined (e.g., 30 days)
  - [ ] Backup storage location secured
  - [ ] Backup restoration tested successfully

- [ ] **Performance Optimization**
  - [ ] Database indexes created for frequently queried fields
  - [ ] `VACUUM ANALYZE` run
  - [ ] Connection pooling configured
  - [ ] Query performance analyzed

---

### Application Configuration

- [ ] **Backend Configuration**
  - [ ] All environment variables set
  - [ ] Port configured (default: 3001)
  - [ ] MQTT broker connection tested
  - [ ] WebSocket enabled and tested
  - [ ] File upload limits configured
  - [ ] SMTP settings configured (for email notifications)

- [ ] **Frontend Configuration**
  - [ ] `VITE_API_URL` set to production backend
  - [ ] `VITE_WS_URL` set to production WebSocket
  - [ ] PWA manifest configured with correct URLs
  - [ ] Service worker registered
  - [ ] App icons generated (192x192, 512x512)

- [ ] **MQTT Broker**
  - [ ] Eclipse Mosquitto running
  - [ ] Authentication enabled
  - [ ] Test device connection successful
  - [ ] Message logging configured

---

### Testing & Validation

- [ ] **Functional Testing**
  - [ ] User authentication (login/logout)
  - [ ] Dashboard loads correctly
  - [ ] Service requests creation/acceptance/completion
  - [ ] Guest management (CRUD operations)
  - [ ] Device manager functionality
  - [ ] Duty roster assignments
  - [ ] Settings page functionality

- [ ] **Real-Time Features**
  - [ ] WebSocket connection established
  - [ ] Real-time service request updates
  - [ ] Real-time device status updates
  - [ ] MQTT button simulation working

- [ ] **Role-Based Access Control**
  - [ ] Admin can access all features
  - [ ] Chief Stewardess has correct permissions
  - [ ] Stewardess has limited access
  - [ ] Crew has appropriate restrictions
  - [ ] Unauthorized access blocked

- [ ] **Cross-Browser Testing**
  - [ ] Chrome/Edge (latest)
  - [ ] Firefox (latest)
  - [ ] Safari (iOS/macOS)
  - [ ] Mobile browsers (Chrome, Safari)

- [ ] **Responsive Design**
  - [ ] Desktop (1920x1080, 1366x768)
  - [ ] Tablet (768x1024, 1024x768)
  - [ ] Mobile (375x667, 414x896)
  - [ ] Dashboard widgets responsive

- [ ] **Performance Testing**
  - [ ] Page load time < 3 seconds
  - [ ] API response time < 500ms
  - [ ] WebSocket latency < 100ms
  - [ ] Large lists render smoothly (virtual scrolling)

- [ ] **PWA Features**
  - [ ] App installable on mobile devices
  - [ ] Offline mode works
  - [ ] Service worker caching
  - [ ] Push notifications (if enabled)

---

### Monitoring & Logging

- [ ] **Application Monitoring**
  - [ ] Health check endpoint accessible: `/api/health`
  - [ ] Uptime monitoring configured (UptimeRobot, Pingdom)
  - [ ] Error tracking setup (Sentry or similar)
  - [ ] Performance monitoring enabled

- [ ] **Log Management**
  - [ ] Application logs centralized
  - [ ] Log rotation configured
  - [ ] Log levels appropriate for production
  - [ ] Error logs reviewed

- [ ] **Alerting**
  - [ ] Server down alerts configured
  - [ ] Database connection failure alerts
  - [ ] High memory/CPU usage alerts
  - [ ] Disk space alerts

---

### Backup & Recovery

- [ ] **Backup Verification**
  - [ ] Database backup script tested
  - [ ] File uploads backup configured
  - [ ] Environment configuration backed up
  - [ ] Backup restoration successfully tested

- [ ] **Disaster Recovery Plan**
  - [ ] Recovery procedures documented
  - [ ] RTO (Recovery Time Objective) defined
  - [ ] RPO (Recovery Point Objective) defined
  - [ ] Emergency contact list prepared

---

### Documentation

- [ ] **User Documentation**
  - [ ] User manual created
  - [ ] Role-specific guides prepared
  - [ ] FAQ document created
  - [ ] Video tutorials recorded (optional)

- [ ] **Technical Documentation**
  - [ ] API documentation accessible
  - [ ] Architecture diagram created
  - [ ] Deployment procedures documented
  - [ ] Troubleshooting guide available

- [ ] **Admin Documentation**
  - [ ] User management procedures
  - [ ] Backup/restore procedures
  - [ ] System maintenance tasks
  - [ ] Security incident response plan

---

### Compliance & Legal

- [ ] **Data Privacy**
  - [ ] GDPR compliance reviewed (if applicable)
  - [ ] Privacy policy created
  - [ ] Data retention policy defined
  - [ ] User consent mechanisms implemented

- [ ] **Security**
  - [ ] Security audit conducted
  - [ ] Vulnerability scan performed
  - [ ] Security headers configured
  - [ ] Rate limiting enabled

- [ ] **Licensing**
  - [ ] Third-party licenses reviewed
  - [ ] Open-source compliance verified
  - [ ] Terms of service created

---

## 🚀 Post-Deployment Checklist

### Immediate (0-24 hours)

- [ ] **Verify Deployment**
  - [ ] All services running (`docker-compose ps`)
  - [ ] No error logs in past hour
  - [ ] Health endpoints responding
  - [ ] SSL certificate valid

- [ ] **User Access**
  - [ ] Admin user can login
  - [ ] Test users created for each role
  - [ ] User accounts activated
  - [ ] Password reset flow tested

- [ ] **Monitoring Active**
  - [ ] Uptime monitoring confirmed
  - [ ] Error tracking receiving events
  - [ ] Log aggregation working
  - [ ] Alert notifications received

### First Week

- [ ] **User Training**
  - [ ] Admin users trained
  - [ ] Crew members trained
  - [ ] Support procedures established
  - [ ] Feedback mechanism in place

- [ ] **Performance Monitoring**
  - [ ] No performance degradation
  - [ ] Database query performance acceptable
  - [ ] Memory usage within limits
  - [ ] Disk space sufficient

- [ ] **Bug Fixes**
  - [ ] Critical bugs addressed immediately
  - [ ] User-reported issues triaged
  - [ ] Hotfix deployment process tested

### First Month

- [ ] **Optimization**
  - [ ] Database queries optimized based on usage
  - [ ] Caching strategies refined
  - [ ] Unused features disabled
  - [ ] Resource allocation adjusted

- [ ] **User Feedback**
  - [ ] User satisfaction survey conducted
  - [ ] Feature requests collected
  - [ ] Pain points identified
  - [ ] Roadmap updated

- [ ] **Security Review**
  - [ ] Access logs reviewed
  - [ ] Failed login attempts analyzed
  - [ ] Suspicious activity investigated
  - [ ] Security patches applied

---

## ⚠️ Common Issues & Solutions

### Issue: Database connection timeout
**Solution:**
```bash
# Increase connection pool size in DATABASE_URL
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10"

# Or configure in Prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connectionLimit = 10
}
```

### Issue: WebSocket disconnecting frequently
**Solution:**
```nginx
# Increase Nginx timeout
location /socket.io/ {
    proxy_read_timeout 86400;
    proxy_send_timeout 86400;
}
```

### Issue: High memory usage
**Solution:**
```bash
# Limit Docker container memory
docker-compose.yml:
  services:
    backend:
      deploy:
        resources:
          limits:
            memory: 2G
```

### Issue: Slow page loads
**Solution:**
```bash
# Enable Nginx caching
# Build with production optimizations
npm run build -- --mode production

# Enable gzip in Nginx
gzip on;
gzip_types text/plain text/css application/javascript application/json;
```

---

## 📊 Performance Benchmarks

### Expected Performance

| Metric | Target | Acceptable |
|--------|--------|------------|
| Page Load Time | < 2s | < 3s |
| API Response Time | < 200ms | < 500ms |
| WebSocket Latency | < 50ms | < 100ms |
| Database Query Time | < 50ms | < 200ms |
| Time to Interactive | < 3s | < 5s |
| Lighthouse Score | > 90 | > 80 |

### Load Testing Results

Test with:
```bash
# Install k6
curl https://github.com/grafana/k6/releases/download/v0.47.0/k6-v0.47.0-linux-amd64.tar.gz -L | tar xvz

# Run load test
k6 run load-test.js
```

Expected to handle:
- 100 concurrent users
- 1000 requests/minute
- < 1% error rate

---

## 🎯 Success Criteria

### Technical Success
✅ All services running without errors for 24 hours
✅ Zero critical bugs in production
✅ Uptime > 99.9%
✅ Response times within acceptable range
✅ Zero data loss incidents

### Business Success
✅ All crew members can login successfully
✅ Service requests flow working end-to-end
✅ Real-time updates functioning correctly
✅ User satisfaction > 80%
✅ Support tickets < 5 per week

---

## 📞 Emergency Contacts

```
System Administrator: _____________________
Database Administrator: ___________________
Network Administrator: ____________________
Security Team: ____________________________
On-Call Developer: ________________________
```

---

## 🔄 Maintenance Schedule

### Daily
- Check application logs
- Verify backups completed
- Monitor resource usage

### Weekly
- Review error rates
- Update security patches
- Check disk space

### Monthly
- Database optimization (VACUUM)
- Review access logs
- Test backup restoration
- Update dependencies

### Quarterly
- Security audit
- Performance review
- User feedback analysis
- Disaster recovery drill

---

**Production Checklist Version:** 1.0
**Last Updated:** 2025-01-24
**Next Review:** [Add 3 months from deployment]
