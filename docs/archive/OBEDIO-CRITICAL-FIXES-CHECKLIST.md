# OBEDIO CRITICAL FIXES CHECKLIST

## 🔴 HIGH PRIORITY - Must Fix Before Production

### 1. Device Manager Completion
- [ ] Create device pairing UI wizard with proper UX
- [ ] Implement device discovery functionality in frontend
- [ ] Connect device configuration save to backend
- [ ] Add device assignment to crew/locations
- [ ] Implement device test functionality
- [ ] Add device health monitoring dashboard

### 2. Settings Page Backend Integration
- [ ] Connect Notifications tab to backend API
- [ ] Save role permissions to database (not just context)
- [ ] Connect System tab to real server configuration
- [ ] Implement backup/restore functionality
- [ ] Replace hardcoded system status with real data

### 3. Security Hardening
- [ ] Implement API rate limiting middleware
- [ ] Add input validation on all endpoints
- [ ] Configure CORS for production (restrict origins)
- [ ] Add request size limits globally
- [ ] Implement API key authentication for devices

### 4. Missing Core APIs
- [ ] Register device-discovery routes in server.ts
- [ ] Create user management CRUD endpoints
- [ ] Implement system settings persistence API
- [ ] Add backup/restore API endpoints
- [ ] Create audit logging endpoints

## 🟡 MEDIUM PRIORITY - Important Features

### 5. Dashboard Improvements
- [ ] Add role-based default dashboard layouts
- [ ] Verify layout saves work across different devices
- [ ] Add WebSocket connection status indicator
- [ ] Implement dashboard templates by role

### 6. Real-time Features
- [ ] Complete WebSocket service request updates
- [ ] Add presence tracking (who's online)
- [ ] Implement real-time device status updates
- [ ] Add notification system for urgent requests

### 7. Data Migration from Mock
- [ ] Remove all hardcoded device data
- [ ] Replace mock crew members in duty roster
- [ ] Remove hardcoded location images
- [ ] Clean up unused mock data files

## 🟢 LOW PRIORITY - Nice to Have

### 8. User Experience
- [ ] Add loading skeletons for better UX
- [ ] Implement offline mode with sync
- [ ] Add keyboard shortcuts
- [ ] Create onboarding wizard

### 9. Performance Optimization
- [ ] Add database indexes for common queries
- [ ] Implement Redis caching layer
- [ ] Optimize WebSocket message handling
- [ ] Add pagination to all list views

### 10. Documentation
- [ ] Create API documentation (Swagger/OpenAPI)
- [ ] Write user manual for crew
- [ ] Document ESP32 firmware requirements
- [ ] Create deployment guide

## 📋 IMPLEMENTATION NOTES

### Device Discovery Implementation Plan
1. Frontend: Create multi-step wizard in device pairing dialog
2. Backend: Use MQTT broadcast for device discovery
3. Protocol: ESP32 announces itself when in pairing mode
4. Security: Use temporary pairing codes

### Settings Persistence Architecture
1. Create settings service in backend
2. Store in PostgreSQL with JSON columns
3. Cache frequently accessed settings
4. Emit WebSocket events on changes

### Backup System Design
1. Export: PostgreSQL dump + uploaded files
2. Format: Encrypted ZIP archive
3. Storage: Local filesystem or S3
4. Restore: Validate then import

## 🚀 RECOMMENDED DEPLOYMENT ORDER

1. **Phase 1**: Fix all HIGH PRIORITY items
2. **Phase 2**: Test with limited crew members
3. **Phase 3**: Implement MEDIUM PRIORITY items
4. **Phase 4**: Full production deployment
5. **Phase 5**: Add LOW PRIORITY enhancements

## 🛡️ PRODUCTION CHECKLIST

Before going live:
- [ ] All HIGH PRIORITY items completed
- [ ] Security audit performed
- [ ] Load testing completed
- [ ] Backup system tested
- [ ] SSL certificates configured
- [ ] Monitoring alerts set up
- [ ] Error tracking enabled
- [ ] User training completed