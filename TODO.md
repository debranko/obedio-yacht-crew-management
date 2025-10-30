# OBEDIO TODO List

**Version:** 1.0.0
**Last Updated:** October 26, 2024
**Status:** Post Faza 1-4 Fixes

---

## Table of Contents

1. [Critical Priority](#critical-priority)
2. [High Priority](#high-priority)
3. [Medium Priority](#medium-priority)
4. [Low Priority](#low-priority)
5. [Technical Debt](#technical-debt)
6. [Future Enhancements](#future-enhancements)
7. [Hardware Integration](#hardware-integration)
8. [Documentation](#documentation)
9. [Completed Items](#completed-items)

---

## Critical Priority

### Security

- [ ] **Implement Rate Limiting**
  - Add express-rate-limit middleware
  - Protect login endpoint (5 attempts per 15 minutes)
  - Protect API endpoints (100 requests per 15 minutes)
  - File: `backend/src/middleware/rate-limit.ts`

- [ ] **Enforce HTTPS in Production**
  - Configure SSL certificates
  - Redirect HTTP to HTTPS
  - Update CORS configuration for HTTPS
  - File: `backend/src/index.ts`

- [ ] **Add Security Headers (Helmet.js)**
  - Install helmet package
  - Configure CSP, X-Frame-Options, etc.
  - File: `backend/src/middleware/security.ts`

- [ ] **Environment Variable Validation**
  - Validate all required env vars on startup
  - Use Zod or dotenv-safe
  - Fail fast if critical vars missing
  - File: `backend/src/config/env.ts`

### Data Integrity

- [ ] **Add Database Constraints**
  - Unique constraint on Location.smartButtonId
  - Check constraint on Guest.checkOutDate > checkInDate
  - Foreign key on ServiceRequest.assignedToId → CrewMember.id
  - File: `backend/prisma/schema.prisma`

- [ ] **Implement Database Backups**
  - Automated daily backups
  - Backup retention policy (30 days)
  - Backup restoration procedure documentation
  - Tools: pg_dump, cron job

---

## High Priority

### Testing

- [ ] **Expand API Test Coverage**
  - Locations API tests (`locations.test.ts`)
  - Devices API tests (`devices.test.ts`)
  - Authentication tests (`auth.test.ts`)
  - Target: 80% code coverage

- [ ] **Add Frontend Unit Tests**
  - Test utility functions (getPriorityColor, getStatusBadge, etc.)
  - Test form validation logic
  - Framework: Vitest + React Testing Library
  - Target: 60% component coverage

- [ ] **Add Integration Tests**
  - Full user flows (create guest → create request → accept → complete)
  - WebSocket event propagation
  - MQTT message handling
  - Framework: Playwright or Cypress

- [ ] **Add Error Handling Tests**
  - Test all error scenarios (404, 400, 500)
  - Test validation failures
  - Test database connection failures

### Performance

- [ ] **Optimize Database Queries**
  - Review all Prisma queries for N+1 problems
  - Add indexes for frequently filtered fields:
    - `ServiceRequest.status`
    - `Guest.status`
    - `CrewMember.status`
  - Use `select` instead of `include` where possible

- [ ] **Implement Query Result Caching**
  - Redis cache for frequently accessed data
  - Cache locations, crew roster (5-minute TTL)
  - Cache invalidation on updates
  - Package: ioredis

- [ ] **Add Pagination to All Lists**
  - Service requests list (currently loads all)
  - Activity logs (currently loads all)
  - Implement cursor-based pagination
  - Add `limit` and `offset` query params

### Real-time Communication

- [ ] **Add WebSocket Reconnection Logic**
  - Exponential backoff on disconnect
  - Queue messages during disconnect
  - Replay missed events on reconnect
  - File: `src/services/websocket.ts`

- [ ] **Implement MQTT Device Management**
  - Device registration endpoint
  - Device heartbeat monitoring
  - Device status tracking (online/offline)
  - Alert on device disconnection

- [ ] **Add WebSocket Authentication**
  - Validate JWT token on WebSocket connection
  - Disconnect unauthorized clients
  - File: `backend/src/websocket/server.ts`

---

## Medium Priority

### Code Quality

- [ ] **Consolidate Duplicate Utility Functions**
  - **CRITICAL DUPLICATES FOUND:**
    - `getPriorityColor()` - Found in 10+ files
    - `getStatusBadge()` - Found in 8+ files
    - `getStatusColor()` - Found in 6+ files
  - Create centralized utility file: `src/utils/service-request-utils.ts`
  - Create centralized utility file: `src/utils/guest-utils.ts`
  - Update all components to import from centralized location
  - Remove duplicates

- [ ] **Implement Shared Types Package**
  - Create `shared/types` directory
  - Move common types (DTOs, enums) to shared package
  - Import in both frontend and backend
  - Ensures 100% type consistency

- [ ] **Add ESLint and Prettier**
  - Configure ESLint for TypeScript
  - Configure Prettier for code formatting
  - Add pre-commit hooks (husky + lint-staged)
  - Run on CI/CD pipeline

- [ ] **Refactor Large Components**
  - `AppDataContext.tsx` (600+ lines) - Split into multiple contexts
  - `service-requests.tsx` (400+ lines) - Extract sub-components
  - `guests-list.tsx` (350+ lines) - Extract filters and table

### User Experience

- [ ] **Add Loading States**
  - Skeleton loaders for all data tables
  - Spinner for form submissions
  - Loading overlay for page transitions
  - Package: shadcn/ui skeleton component

- [ ] **Improve Error Messages**
  - User-friendly error messages (not raw API errors)
  - Toast notifications for errors
  - Error boundary for React component errors
  - File: `src/components/error-boundary.tsx`

- [ ] **Add Optimistic Updates**
  - Update UI immediately on actions (accept request, complete, etc.)
  - Rollback on API failure
  - Use React Query's optimistic update feature

- [ ] **Implement Undo/Redo**
  - Undo accidental request cancellations
  - Undo guest deletions (soft delete)
  - Toast with "Undo" button

### Features

- [ ] **Service Request Categories**
  - Add category field (housekeeping, food-beverage, maintenance, etc.)
  - Category icons and colors
  - Filter by category
  - Database: Already has `categoryId` field (unused)

- [ ] **Voice Transcription Integration**
  - Integrate speech-to-text API (Google/AWS/Azure)
  - Store audio files in cloud storage (S3/Azure Blob)
  - Display transcription in request details
  - Database: Fields already exist (`voiceTranscript`, `voiceAudioUrl`)

- [ ] **Push Notifications**
  - Push notifications for crew devices
  - Service worker for web push
  - Notification preferences per user
  - Package: web-push

- [ ] **Advanced Filtering**
  - Multi-select filters (status, priority, assigned crew)
  - Date range filters (created today, this week, etc.)
  - Save filter presets
  - URL query params for shareable filters

---

## Low Priority

### Analytics & Reporting

- [ ] **Service Request Analytics**
  - Average response time
  - Completion rate by crew member
  - Request volume by location
  - Peak hours heatmap
  - Dashboard: `src/components/pages/analytics.tsx`

- [ ] **Guest Satisfaction Tracking**
  - Post-service rating system
  - Guest feedback collection
  - NPS score calculation
  - Database: New `Feedback` model needed

- [ ] **Crew Performance Metrics**
  - Requests handled per crew member
  - Average completion time
  - Guest ratings per crew member
  - Export reports to PDF/Excel

### Accessibility

- [ ] **WCAG 2.1 AA Compliance**
  - Add ARIA labels to all interactive elements
  - Keyboard navigation for all features
  - Screen reader testing
  - Color contrast audit (4.5:1 minimum)

- [ ] **Internationalization (i18n)**
  - Support multiple languages (English, French, Spanish, Italian)
  - Package: react-i18next
  - Translation files: `src/locales/en.json`, etc.
  - Language switcher in settings

### UI/UX Enhancements

- [ ] **Dark Mode**
  - Dark theme for all components
  - Theme toggle in settings
  - Persist theme preference
  - Use shadcn/ui dark mode support

- [ ] **Mobile Responsive Design**
  - Optimize layouts for tablet (768px-1024px)
  - Optimize layouts for mobile (320px-767px)
  - Touch-friendly buttons and gestures
  - Test on real devices

- [ ] **Customizable Dashboard**
  - Drag-and-drop widget arrangement
  - Widget visibility toggles
  - Save layout preferences per user
  - Package: react-grid-layout

---

## Technical Debt

### Database

- [ ] **Remove Legacy Fields**
  - `Guest.cabin` (string) - Replaced by `locationId` relation
  - Mark as deprecated in schema comments
  - Create migration to remove after data migration complete

- [ ] **Optimize Prisma Queries**
  - Review all `.findMany()` calls
  - Add `take` limit to prevent loading thousands of records
  - Use `.count()` for pagination metadata

- [ ] **Add Database Indexes**
  ```prisma
  @@index([status, priority]) // ServiceRequest
  @@index([status, type])     // Guest
  @@index([status, department]) // CrewMember
  ```

### Backend

- [ ] **Implement Request Validation Middleware**
  - Centralized Zod validation middleware
  - Validate all POST/PUT request bodies
  - Return 400 with detailed validation errors
  - File: `backend/src/middleware/validate.ts`

- [ ] **Add Request Logging**
  - Log all API requests (method, path, user, timestamp)
  - Log slow queries (>1s)
  - Log errors with stack traces
  - Package: winston or pino

- [ ] **Implement API Versioning**
  - Version all API endpoints (`/api/v1/guests`)
  - Deprecation warnings for old versions
  - Sunset policy documentation

### Frontend

- [ ] **Remove Unused Dependencies**
  - Audit package.json for unused packages
  - Remove if unused: date-fns, lodash, etc.
  - Run: `npx depcheck`

- [ ] **Optimize Bundle Size**
  - Code splitting for routes
  - Lazy load heavy components
  - Tree-shake unused imports
  - Target: <500KB initial bundle

- [ ] **Fix Type Safety Gaps**
  - Enable `strict: true` in tsconfig.json
  - Fix all `any` types
  - Enable `noImplicitAny`
  - Enable `strictNullChecks`

---

## Future Enhancements

### Advanced Features

- [ ] **Multi-Yacht Support**
  - Add `Yacht` model with name, location, capacity
  - Add `yachtId` to all relevant models
  - Yacht switcher in UI
  - Database: Major schema changes required

- [ ] **Crew Scheduling & Shifts**
  - Create `Shift` model (start, end, crew members)
  - Visual shift calendar
  - Automatic crew availability calculation
  - Shift swap requests

- [ ] **Inventory Management**
  - Track supplies (linens, toiletries, food, etc.)
  - Low stock alerts
  - Purchase order management
  - Database: New `Inventory` model

- [ ] **Guest Preferences Learning**
  - ML-based preference prediction
  - Suggest services based on past requests
  - Personalized recommendations
  - Integration: TensorFlow.js or AWS SageMaker

- [ ] **Offline Mode**
  - Service worker for offline functionality
  - IndexedDB for local data storage
  - Sync when connection restored
  - Package: Workbox

### Integrations

- [ ] **Calendar Integration**
  - Sync guest check-in/check-out with calendar (Google/Outlook)
  - Crew shift calendar export
  - Package: ical-generator

- [ ] **Email Notifications**
  - Email alerts for emergency requests
  - Daily summary email for chief stewardess
  - Guest welcome emails
  - Package: nodemailer

- [ ] **SMS Notifications**
  - SMS for urgent requests
  - Crew on-call notifications
  - Service: Twilio or AWS SNS

- [ ] **Cloud Storage Integration**
  - Store guest photos in S3/Azure Blob
  - Store voice recordings in cloud
  - CDN for fast image delivery
  - Package: aws-sdk or @azure/storage-blob

---

## Hardware Integration

### Smart Buttons (ESP32)

- [ ] **Implement Button Device Registration**
  - Web UI for pairing buttons with locations
  - QR code scanning for quick setup
  - Device firmware version tracking

- [ ] **Add Button Battery Monitoring**
  - MQTT battery level reports
  - Low battery alerts
  - Battery replacement tracking

- [ ] **Implement Button Diagnostics**
  - Test button press endpoint
  - Signal strength monitoring
  - Last seen timestamp
  - Dashboard: Device health page

### T-Watch S3 (Crew Wearables)

- [ ] **Implement Watch Firmware**
  - Display incoming requests
  - Accept/Complete buttons
  - Haptic feedback on new request
  - Repository: Separate hardware repo needed

- [ ] **Add Watch GPS Tracking**
  - Track crew location on yacht
  - Proximity-based request assignment
  - Privacy controls

- [ ] **Implement Watch Status Updates**
  - Crew can update status from watch
  - "On Break", "Available", "Busy"
  - MQTT status broadcast

### General IoT

- [ ] **Add Device Firmware OTA Updates**
  - Push firmware updates to devices
  - Rollback on failure
  - Update schedule (non-service hours)

- [ ] **Implement Device Security**
  - Encrypted MQTT messages (TLS)
  - Device authentication (client certificates)
  - Device access control

---

## Documentation

- [x] **Create ARCHITECTURE.md** - COMPLETED
- [x] **Create API Tests** - COMPLETED
- [x] **Create Swagger Documentation** - COMPLETED
- [ ] **Create API Documentation (Swagger UI)**
  - Host Swagger UI at `/api-docs`
  - Document all endpoints
  - Request/response examples
  - Package: swagger-ui-express

- [ ] **Create User Manual**
  - Crew user guide (how to use system)
  - Screenshots and tutorials
  - Common workflows
  - File: `docs/USER_MANUAL.md`

- [ ] **Create Developer Guide**
  - Setup instructions
  - Development workflow
  - Coding standards
  - File: `docs/DEVELOPER_GUIDE.md`

- [ ] **Create Deployment Guide**
  - Production deployment steps
  - Environment configuration
  - Monitoring setup
  - File: `docs/DEPLOYMENT.md`

- [ ] **Create Hardware Integration Guide**
  - ESP32 button setup
  - T-Watch firmware flashing
  - MQTT broker configuration
  - File: `docs/HARDWARE_SETUP.md`

---

## Completed Items

### Faza 1: ServiceRequest Status Consistency ✅
- [x] Added `ServiceRequestStatus` enum to Prisma schema
- [x] Created migration `20251026224630_service_request_status_enum`
- [x] Updated backend database service to use lowercase values
- [x] Updated frontend types and components
- [x] Fixed AppDataContext status handling

### Faza 2: ServiceRequest Priority & RequestType ✅
- [x] Added `ServiceRequestPriority` enum to Prisma schema
- [x] Added `ServiceRequestType` enum to Prisma schema
- [x] Created migration `20251026225408_service_request_priority_type_enums`
- [x] Added 'low' priority support
- [x] Fixed `requestType` derivation bug in AppDataContext (line 518)
- [x] Fixed 'low' priority conversion bug in AppDataContext (line 519)
- [x] Updated all frontend components

### Faza 3: Guest Status & Type Consistency ✅
- [x] Added `GuestStatus` enum to Prisma schema
- [x] Added `GuestType` enum to Prisma schema
- [x] Created migration `20251026225959_guest_status_type_enums`
- [x] Handled legacy 'charter' type conversion
- [x] Updated backend and frontend

### Faza 4: CrewMember Status Consistency ✅
- [x] Added `CrewMemberStatus` enum with @map directives
- [x] Created migration `20251026230456_crew_member_status_enum`
- [x] Updated backend to use dash-separated values
- [x] Updated frontend types

### Faza 5: Finalization ✅
- [x] Fixed 'charter' type in guest-form-dialog.tsx
- [x] Created comprehensive API tests (service-requests, guests, crew)
- [x] Created Swagger schema definitions
- [x] Created ARCHITECTURE.md
- [x] Created TODO.md (this file)
- [ ] Final report pending

---

## Priority Matrix

| Priority | Category | Estimated Effort | Impact |
|----------|----------|------------------|--------|
| Critical | Security (Rate Limiting, HTTPS, Helmet) | 1 week | High |
| Critical | Database Constraints | 3 days | High |
| High | Test Coverage Expansion | 2 weeks | Medium |
| High | Performance Optimization | 1 week | High |
| High | WebSocket Reconnection | 3 days | Medium |
| Medium | Duplicate Function Consolidation | 1 week | Medium |
| Medium | Error Handling Improvements | 1 week | Medium |
| Medium | Service Request Categories | 1 week | Medium |
| Low | Analytics Dashboard | 2 weeks | Low |
| Low | Dark Mode | 1 week | Low |

---

## Next Sprint Recommendations

**Sprint 1 (Week 1-2):**
1. Implement rate limiting and security headers
2. Add database constraints
3. Expand test coverage (API tests)

**Sprint 2 (Week 3-4):**
1. Consolidate duplicate utility functions
2. Optimize database queries and add indexes
3. Implement WebSocket reconnection logic

**Sprint 3 (Week 5-6):**
1. Add service request categories
2. Implement advanced filtering
3. Create analytics dashboard

---

**Document Version:** 1.0.0
**Last Updated:** October 26, 2024
**Next Review:** November 15, 2024
