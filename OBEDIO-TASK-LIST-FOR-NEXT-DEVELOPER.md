# OBEDIO Yacht Crew Management System - Task List & Instructions

## Overview
This document contains the comprehensive task list for continuing development on the OBEDIO system. A thorough code review has been completed, identifying 115 tasks across all system components.

## Current Status (as of 2025-01-23)
- **Completed**: 8 tasks
- **In Progress**: 1 task
- **Pending**: 106 tasks

## Recently Completed Work
1. ✅ Fixed JWT secret security vulnerability (moved to .env)
2. ✅ Added ServiceCategory model and CRUD endpoints
3. ✅ Created device manager page with smart button hardware specs
4. ✅ Implemented dashboard save/load functionality with manual save button
5. ✅ Fixed activity log devices tab with new /devices/logs endpoint
6. ✅ Applied Prisma migration for YachtSettings
7. ✅ Created service categories management UI in settings page
8. ✅ Performed comprehensive code review

## Instructions for Next Developer

### 1. Environment Setup
```bash
# Install dependencies
npm install
cd backend && npm install

# Setup database
cd backend
npx prisma migrate dev
npx prisma db seed

# Start development servers
npm run dev (frontend)
cd backend && npm run dev (backend)
```

### 2. Key Files to Review First
- `backend/.env` - Contains JWT_SECRET and database configuration
- `backend/prisma/schema.prisma` - Database schema with recent ServiceCategory additions
- `src/components/pages/settings.tsx` - Service categories UI (needs edit/reorder functionality)
- `src/components/pages/device-manager.tsx` - New device manager page
- `COMPREHENSIVE-SYSTEM-REVIEW-2025-01-22.md` - Detailed analysis of all issues

### 3. Priority Recommendations

#### 🔴 HIGH PRIORITY (Do First)
1. **Remove Mock Data Dependencies** (Tasks 17-20)
   - Replace simulateNewRequest in AppDataContext
   - Replace mockCrewMembers in duty roster
   - Replace activity log mock generators
   - Remove hardcoded image URLs

2. **Complete Settings Backend** (Tasks 9-13)
   - Add edit/reorder for service categories
   - Create notification settings persistence
   - Create system settings persistence
   - Fix hardcoded system status values

3. **Fix Critical Bugs** (Tasks 21, 42)
   - Service requests assignedTo field not saving
   - Locations image upload not working

#### 🟡 MEDIUM PRIORITY
4. **User Management** (Tasks 29-33)
   - Create /api/users CRUD endpoints
   - Build user management UI
   - Add role assignment

5. **Duty Roster** (Tasks 37-41)
   - Create API endpoints
   - Add database tables
   - Replace mock data

6. **WebSocket Improvements** (Tasks 46-49)
   - Add exponential backoff
   - Add connection status indicator

#### 🟢 LOWER PRIORITY (But Important)
7. **Security** (Tasks 58-62)
8. **Performance** (Tasks 63-67)
9. **Testing** (Tasks 72-75)

### 4. Hardware Integration Notes
- Custom PCB smart buttons with ESP32
- LoRa 868MHz for yacht-wide coverage
- MQTT for device communication
- Native mobile apps (not React Native) for Apple Watch support

## Complete Task List

### Frontend UI/UX Tasks
8. [-] Settings Page - Add Service Categories UI to settings page
9. [ ] Settings Page - Add edit/reorder functionality for categories
14. [ ] Guest Widget Redesign - Make thinner, full width, responsive layout
15. [ ] Guest Widget Redesign - Organize by deck plan
16. [ ] Guest Widget Redesign - 2x2 grid on large screens, 1 column on small
30. [ ] User Management - Create user management UI page
33. [ ] User Management - Add role assignment interface
35. [ ] Crew Management - Build shift assignment UI
40. [ ] Duty Roster - Add shift swap functionality
41. [ ] Duty Roster - Add leave/vacation management
44. [ ] Locations - Add location type filtering
45. [ ] Locations - Add capacity management
49. [ ] WebSocket - Add connection status indicator
51. [ ] Notification System - Build in-app notification center
53. [ ] Notification System - Add notification preferences per user
57. [ ] Authentication - Add "Remember Me" functionality
67. [ ] Performance - Add lazy loading for large lists
68. [ ] Error Handling - Add global error boundary
70. [ ] Error Handling - Add user-friendly error messages

### Backend API Tasks
10. [ ] Settings Page - Create Notification Settings persistence endpoints
11. [ ] Settings Page - Create System Settings persistence endpoints
12. [ ] Settings Page - Create Backup Settings endpoints and functionality
13. [ ] Settings Page - Fix hardcoded system status values (uptime, version, etc.)
17. [ ] Remove Mock Data - Replace simulateNewRequest in AppDataContext
18. [ ] Remove Mock Data - Replace mockCrewMembers in duty roster
19. [ ] Remove Mock Data - Replace generateMockDeviceLogs/CallLogs/RecentActivity
20. [ ] Remove Mock Data - Replace hardcoded image URLs with real uploads
21. [ ] Service Requests - Fix assignedTo field not saving to database
22. [ ] Service Requests - Connect to service categories from settings
23. [ ] Service Requests - Add real-time updates via WebSocket
24. [ ] Device Manager - Connect to real device API endpoints
25. [ ] Device Manager - Build device discovery/pairing UI
26. [ ] Device Manager - Implement real-time status monitoring
27. [ ] Device Manager - Create device configuration interface
28. [ ] Device Manager - Add battery and signal strength charts
29. [ ] User Management - Create /api/users CRUD endpoints
31. [ ] User Management - Implement password reset functionality
32. [ ] User Management - Add user invitation system
34. [ ] Crew Management - Create shift scheduling API endpoints
36. [ ] Crew Management - Add performance tracking features
37. [ ] Duty Roster - Create /api/duty-roster endpoints
38. [ ] Duty Roster - Create ShiftSchedules database table
39. [ ] Duty Roster - Replace mock crew data with real API calls
42. [ ] Locations - Fix image upload functionality
43. [ ] Locations - Add floor/deck assignment from yacht settings
46. [ ] WebSocket - Improve reconnection with exponential backoff
47. [ ] WebSocket - Add presence tracking for online users
48. [ ] WebSocket - Expand event types for all real-time updates
50. [ ] Notification System - Create push notification service
52. [ ] Notification System - Implement critical alerts with sound
54. [ ] Authentication - Add refresh token rotation
55. [ ] Authentication - Implement session management
56. [ ] Authentication - Add 2FA support
109. [ ] DevOps - Add health check endpoints

### Security & Performance Tasks
58. [ ] Security - Add API rate limiting middleware
59. [ ] Security - Implement input validation on all endpoints
60. [ ] Security - Add request sanitization
61. [ ] Security - Add CORS configuration
62. [ ] Security - Implement API key authentication for devices
63. [ ] Performance - Add Redis caching for frequently accessed data
64. [ ] Performance - Optimize database queries with indexes
65. [ ] Performance - Implement proper pagination on all list endpoints
66. [ ] Performance - Add request/response compression
69. [ ] Error Handling - Implement proper error logging
71. [ ] Error Handling - Add error reporting service
101. [ ] Database - Add indexes for performance optimization
102. [ ] Database - Create backup/restore procedures
103. [ ] Database - Add data retention policies
104. [ ] Database - Implement audit logging

### Hardware/IoT Tasks
76. [ ] ESP32 Firmware - Create custom PCB button firmware with LED ring
77. [ ] ESP32 Firmware - Implement microphone for voice commands
78. [ ] ESP32 Firmware - Add speaker for audio feedback
79. [ ] ESP32 Firmware - Implement accelerometer shake detection
80. [ ] ESP32 Firmware - Configure 4 aux buttons + main touch button
81. [ ] ESP32 Firmware - Optimize for 800mAh+ battery life
82. [ ] ESP32 Firmware - Create LilyGo T-Watch S3 notification app
83. [ ] ESP32 Firmware - Implement OTA update mechanism
84. [ ] ESP32 Firmware - Add deep sleep modes
85. [ ] ESP32 Firmware - Use Heltec LoRa V3 for development
86. [ ] LoRa Integration - Implement LoRa 868MHz communication protocol
87. [ ] LoRa Integration - Create mesh networking capability
88. [ ] LoRa Integration - Add range testing tools
96. [ ] MQTT Integration - Set up MQTT broker (Mosquitto)
97. [ ] MQTT Integration - Design topic structure
98. [ ] MQTT Integration - Implement device telemetry
99. [ ] MQTT Integration - Add command/response patterns
100. [ ] MQTT Integration - Create device provisioning flow

### Mobile App Tasks
89. [ ] Native iOS App - Create Swift project structure
90. [ ] Native iOS App - Build Apple Watch standalone app
91. [ ] Native iOS App - Implement background notifications
92. [ ] Native iOS App - Add biometric authentication
93. [ ] Native Android App - Create Kotlin project structure
94. [ ] Native Android App - Add Wear OS support
95. [ ] Native Android App - Implement material design

### DevOps & Testing Tasks
72. [ ] Testing - Set up Jest for unit tests
73. [ ] Testing - Create integration tests for API endpoints
74. [ ] Testing - Add E2E tests with Playwright
75. [ ] Testing - Add performance testing
105. [ ] DevOps - Create Docker containers
106. [ ] DevOps - Set up CI/CD pipeline
107. [ ] DevOps - Add monitoring with Prometheus/Grafana
108. [ ] DevOps - Implement automated backups

### Documentation Tasks
110. [ ] Documentation - Create API documentation with Swagger
111. [ ] Documentation - Write hardware integration guide
112. [ ] Documentation - Create deployment guide
113. [ ] Documentation - Add user manual
114. [ ] Documentation - Document custom PCB smart button specs
115. [ ] Documentation - Create developer onboarding guide

## Important Context
1. **This is a production server system**, not just a demo app
2. **Hardware integration is critical** - ESP32, LoRa, MQTT
3. **Security is paramount** - JWT secret issue was just fixed
4. **Real-time is essential** - WebSocket for instant updates
5. **Native mobile apps required** - For Apple Watch support

## Contact & Repository
- Repository: https://github.com/debranko/obedio-yacht-crew-management
- Latest commit: 8f3a71a (includes all recent changes)

## Next Steps
1. Pull latest changes from Git
2. Review the completed work
3. Start with HIGH PRIORITY tasks
4. Check `COMPREHENSIVE-SYSTEM-REVIEW-2025-01-22.md` for detailed analysis
5. Use the existing documentation files for guidance

Good luck! The foundation is solid, but there's significant work ahead to make this a production-ready system.