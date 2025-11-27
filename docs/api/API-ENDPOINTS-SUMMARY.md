# Backend API Endpoints Summary

## ✅ Completed Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Crew Management
- `GET /api/crew` - List all crew members
- `GET /api/crew/:id` - Get specific crew member
- `POST /api/crew` - Create crew member
- `PUT /api/crew/:id` - Update crew member
- `DELETE /api/crew/:id` - Delete crew member

### Guests
- `GET /api/guests` - List all guests
- `GET /api/guests/:id` - Get specific guest
- `POST /api/guests` - Create guest
- `PUT /api/guests/:id` - Update guest
- `DELETE /api/guests/:id` - Delete guest

### Locations
- `GET /api/locations` - List all locations
- `GET /api/locations/:id` - Get specific location
- `POST /api/locations` - Create location
- `PUT /api/locations/:id` - Update location
- `DELETE /api/locations/:id` - Delete location
- `PUT /api/locations/:id/dnd` - Toggle DND status

### Service Requests
- `GET /api/service-requests` - List all service requests
- `GET /api/service-requests/:id` - Get specific service request
- `POST /api/service-requests` - Create service request
- `PUT /api/service-requests/:id` - Update service request
- `DELETE /api/service-requests/:id` - Delete service request

### Devices
- `GET /api/devices` - List all devices
- `GET /api/devices/:id` - Get specific device
- `POST /api/devices` - Create device
- `PUT /api/devices/:id` - Update device
- `DELETE /api/devices/:id` - Delete device
- `POST /api/devices/:id/simulate-press` - Simulate button press

### User Preferences
- `GET /api/user-preferences` - Get user preferences
- `PUT /api/user-preferences` - Update user preferences

### Yacht Settings
- `GET /api/yacht-settings` - Get yacht settings
- `PUT /api/yacht-settings` - Update yacht settings

### Role Permissions (NEW)
- `GET /api/permissions/roles` - Get all role permissions
- `GET /api/permissions/roles/:role` - Get permissions for specific role
- `PUT /api/permissions/roles/:role` - Update permissions for role (admin only)
- `POST /api/permissions/roles/:role/reset` - Reset permissions to defaults (admin only)

### Notification Settings (NEW)
- `GET /api/notification-settings` - Get user's notification settings
- `PUT /api/notification-settings` - Update notification settings
- `POST /api/notification-settings/push-token` - Update push token
- `POST /api/notification-settings/test` - Send test notification

### Messages/Chat (NEW)
- `GET /api/messages` - Get messages (with pagination)
- `GET /api/messages/conversation/:otherUserId` - Get conversation
- `POST /api/messages` - Send a message
- `PUT /api/messages/:messageId/read` - Mark message as read
- `PUT /api/messages/mark-all-read` - Mark all messages as read
- `DELETE /api/messages/:messageId` - Delete a message
- `GET /api/messages/unread-count` - Get unread message count

## 🚧 Pending API Endpoints

### Service Request History
- Track all changes to service requests
- Who accepted, completed, or modified them

### Crew Change Logs
- Track status changes, assignments, shifts
- Audit trail for crew management

### Activity Logs
- Already has endpoints but needs to connect to real data

### Dashboard Layouts
- Save/load custom dashboard configurations per user

### Duty Roster Assignments
- Manage crew shift schedules

## 📝 Database Tables Created

1. ✅ User
2. ✅ UserPreferences 
3. ✅ CrewMember
4. ✅ Location
5. ✅ Guest
6. ✅ ServiceRequest
7. ✅ Device
8. ✅ DeviceLog
9. ✅ DeviceAssignment
10. ✅ ActivityLog
11. ✅ YachtSettings
12. ✅ Message (NEW)
13. ✅ NotificationSettings (NEW)
14. ✅ ServiceRequestHistory (NEW)
15. ✅ CrewChangeLog (NEW)
16. ✅ RolePermissions (NEW)

## 🔌 WebSocket Events

- `service-request:created`
- `service-request:updated`
- `service-request:completed`
- `emergency:alert`
- `crew:status-changed`
- `guest:created/updated/deleted`
- `new_message` (NEW)
- `broadcast_message` (NEW)

## 🔐 Authentication

All endpoints (except auth routes) require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## 🎯 Next Steps

1. Create remaining API endpoints
2. Add proper error handling and validation
3. Implement pagination on all list endpoints
4. Add rate limiting
5. Create API documentation (OpenAPI/Swagger)