# Next Tasks for Claude

## 🔴 Critical Priority (High Impact)

### 1. **Split AppDataContext into Multiple Contexts** (8-10 hours)
**Current**: 1,205-line monolith causing performance issues
**Goal**: Split into 7 focused contexts
- `GuestsContext.tsx`
- `CrewContext.tsx` 
- `ServiceRequestsContext.tsx`
- `LocationsContext.tsx`
- `DutyRosterContext.tsx`
- `DeviceContext.tsx`
- `MessagesContext.tsx`

**Impact**: Major performance improvement, better maintainability

### 2. **Move Duty Roster from localStorage to Database** (6-8 hours)
**Current**: Data stored in browser (will be lost if cleared!)
**Goal**: Create database models and API
- Create Assignment and Shift models in Prisma
- Create API endpoints (GET/POST/PUT/DELETE)
- Update frontend to use API instead of localStorage
- Migrate existing localStorage data

**Impact**: Prevents data loss, enables multi-device access

### 3. **Implement WebSocket Real-time Updates** (8-10 hours)
**Current**: Backend ready, frontend not using it
**Goal**: Add real-time updates for:
- Service requests (new/updated/completed)
- Device status changes
- DND toggles
- Crew status updates
- Guest check-ins/outs

**Impact**: Better UX, instant updates across all users

## 🟡 Medium Priority (Feature Completion)

### 4. **Create Device Manager Health Check Widget** (4-6 hours)
**Goal**: Dashboard widget showing:
- Device online/offline count
- Battery warnings
- Connection quality alerts
- Quick device status overview

**Impact**: Better device monitoring

### 5. **Complete Device Manager Page** (8-10 hours)
**Current**: 50% complete
**Goal**: Add missing features:
- Battery monitoring UI
- Device assignment interface
- Firmware update mechanism
- Device configuration editor

**Impact**: Full device management capability

### 6. **Complete Settings Page** (10-12 hours)
**Current**: 30% complete
**Goal**: Make all sections functional:
- Connect system status to real backend
- User management UI
- Backup/restore functionality
- Notification settings UI
- System logs viewer
- Data export functionality

**Impact**: Full admin control panel

### 7. **Implement Role-Based Dashboard** (4-6 hours)
**Goal**: Different default dashboards per role:
- Admin: All widgets
- Chief Stewardess: Service focus
- Stewardess: Limited widgets
- Crew: Basic widgets
- ETO: Device focus

**Impact**: Better UX per user type

## 🟢 Nice to Have (Polish & Enhancement)

### 8. **Add Drag-to-Reorder for Service Categories** (2-3 hours)
**Goal**: Let users reorder service categories
**Tech**: Use react-beautiful-dnd or similar

### 9. **Create Docker Configuration** (3-4 hours)
**Goal**: Production deployment setup
- Dockerfile for frontend
- Dockerfile for backend
- docker-compose.yml
- Environment configuration

### 10. **Add API Documentation** (4-6 hours)
**Goal**: Swagger/OpenAPI documentation
- Document all endpoints
- Request/response examples
- Authentication details
- Error codes

### 11. **Add Loading States & Skeleton Screens** (4-5 hours)
**Goal**: Better perceived performance
- Loading skeletons for lists
- Shimmer effects
- Proper loading indicators
- Error boundaries

### 12. **Add Security Enhancements** (2-3 hours)
- Request size limits
- XSS prevention headers
- SQL injection tests
- Security headers (HSTS, etc.)

## 📊 Task Prioritization Matrix

| Task | Impact | Effort | Priority | Ready? |
|------|--------|--------|----------|---------|
| Split AppDataContext | High | High | 🔴 Critical | Yes |
| Duty Roster to DB | High | Medium | 🔴 Critical | Yes |
| WebSocket Updates | High | High | 🔴 Critical | Yes |
| Device Health Widget | Medium | Low | 🟡 Medium | Yes |
| Complete Device Manager | Medium | High | 🟡 Medium | Yes |
| Complete Settings | Medium | High | 🟡 Medium | Yes |
| Role-Based Dashboard | Medium | Low | 🟡 Medium | Yes |
| Drag-to-Reorder | Low | Low | 🟢 Nice | Yes |
| Docker Config | Medium | Low | 🟢 Nice | Yes |
| API Documentation | Medium | Medium | 🟢 Nice | Yes |

## 🚀 Recommended Order

### Phase 4 (Next Critical Work)
1. **Split AppDataContext** - Biggest performance impact
2. **Move Duty Roster to Database** - Prevents data loss
3. **WebSocket Real-time Updates** - Major UX improvement

### Phase 5 (Feature Completion)
4. Device Manager Health Widget
5. Complete Device Manager Page
6. Complete Settings Page
7. Role-Based Dashboard

### Phase 6 (Polish)
8. Drag-to-Reorder
9. Docker Configuration
10. API Documentation
11. Loading States
12. Security Enhancements

## 💡 Quick Wins (Under 4 hours each)
If you want quick results:
1. Device Health Widget (4 hours)
2. Drag-to-Reorder (2-3 hours)
3. Security Headers (2 hours)
4. Role-Based Dashboard (4 hours)

## 🎯 Biggest Impact Tasks
For maximum improvement:
1. **Split AppDataContext** - Performance
2. **Duty Roster to DB** - Data safety
3. **WebSocket Updates** - User experience

These tasks will take OBEDIO from 92% to ~98% production ready!