# USER MANAGEMENT & PROVISIONING SPECIFICATION

## USER HIERARCHY & PERMISSIONS

### 1. Admin (Super User)
**Can create:**
- Other Admins
- ETO (Electro-Technical Officer)
- Chief Stewardess
- All other crew roles

**Permissions:**
- Full system access
- All settings configuration
- User management
- System provisioning

### 2. Chief Stewardess
**Can create:**
- Stewardess
- Butler
- Housekeeping
- Other service crew

**Permissions:**
- Service management
- Crew scheduling
- Guest management
- Limited user creation

### 3. ETO (Electro-Technical Officer)
**Can manage:**
- Device pairing
- Network settings
- Technical configurations
- System diagnostics

**Cannot create users**

### 4. Service Crew
**Roles:**
- Stewardess
- Butler
- Housekeeping
- Deck Crew

**Permissions:**
- Receive/manage service requests
- Update request status
- View assigned areas only

## USER CREATION FLOW

### Web Interface (Admin/Chief Stewardess):
```
1. Navigate to Settings → Crew Management
2. Click "Add New Crew Member"
3. Fill in:
   - Full Name
   - Role (dropdown)
   - Username (auto-generated or custom)
   - Temporary Password
   - Assigned Areas/Locations
4. System generates credentials
5. Show/Print/Email credentials to crew member
```

### API Endpoint:
```typescript
POST /api/users/create
{
  "fullName": "John Smith",
  "role": "stewardess", // admin, chief_stewardess, eto, stewardess, butler, housekeeping
  "username": "jsmith", // optional, auto-generate if not provided
  "password": "TempPass123!", // optional, auto-generate if not provided
  "assignedLocations": ["main-deck", "upper-deck"], // optional
  "createdBy": "admin_user_id"
}

Response:
{
  "userId": "usr_123456",
  "username": "jsmith",
  "tempPassword": "TempPass123!",
  "requirePasswordChange": true,
  "qrCode": "data:image/png;base64..." // QR code for easy app login
}
```

## CREW APP LOGIN FLOW

### 1. Initial Setup:
```
- Download OBEDIO Crew app (iOS/Android)
- Must be on yacht WiFi network
- App auto-discovers server via mDNS/Bonjour
```

**IMPORTANT: Native Apps Required**
- **iOS:** Native Swift/SwiftUI with WatchOS
- **Android:** Native Kotlin with Wear OS
- **NOT React Native** - Apple Watch must work standalone without iPhone

### 2. Login Methods:

**A. Manual Entry:**
- Enter username
- Enter temporary password
- Forced to change password on first login

**B. QR Code Scan:**
- Scan QR code from admin panel
- Auto-fills server URL + credentials
- Still requires password change

### 3. Network Security:
```javascript
// App checks if on correct network
if (!isOnYachtWiFi()) {
  showError("Please connect to yacht WiFi network");
  return;
}

// Server validates request origin
if (request.ip !== yachtNetworkRange) {
  return unauthorized();
}
```

## PROVISIONING FOR NEW YACHT INSTALLATION

### Phase 1: Initial System Setup
1. **Network Configuration**
   - Set yacht WiFi SSID/password
   - Configure static IP for server
   - Set up mDNS for auto-discovery

2. **Admin Account Creation**
   - First-run wizard on web interface
   - Create super admin account
   - Set yacht name and details

3. **Location Setup**
   - Define yacht layout (decks/rooms)
   - Assign location names
   - Configure service areas

### Phase 2: Crew Provisioning
1. **Bulk User Import**
   - CSV upload for multiple crew
   - Excel template provided
   - Auto-generate credentials

2. **Credential Distribution**
   - Print credential cards
   - Email to crew (if yacht email configured)
   - Generate QR codes for quick setup

### Phase 3: Device Provisioning
1. **Smart Buttons**
   - Pairing mode via admin panel
   - Assign to locations
   - Test connectivity

2. **Crew Devices**
   - Approve devices on first login
   - Device fingerprinting for security
   - Manage approved devices list

## SECURITY CONSIDERATIONS

### 1. Network Isolation
- Crew devices on separate VLAN
- Guest network isolated from crew network
- Server accessible only from crew VLAN

### 2. Authentication
- JWT tokens with 24h expiry
- Refresh tokens for mobile apps
- Device fingerprinting
- Optional 2FA for admin accounts

### 3. Password Policy
- Minimum 8 characters
- Must include uppercase, lowercase, number
- Force change on first login
- 90-day expiry for crew accounts

## DATABASE SCHEMA UPDATES NEEDED

```prisma
model User {
  id                String   @id @default(cuid())
  username          String   @unique
  password          String
  fullName          String
  role              UserRole
  requirePasswordChange Boolean @default(true)
  lastPasswordChange DateTime?
  createdBy         String?
  createdByUser     User?    @relation("CreatedBy", fields: [createdBy], references: [id])
  createdUsers      User[]   @relation("CreatedBy")
  assignedLocations String[] // Array of location IDs
  devices           Device[]
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  lastLogin         DateTime?
  isActive          Boolean  @default(true)
}

model Device {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  deviceName   String
  deviceType   String   // ios, android, watch
  deviceId     String   @unique // Device fingerprint
  lastSeen     DateTime
  isApproved   Boolean  @default(false)
  approvedBy   String?
  approvedAt   DateTime?
  createdAt    DateTime @default(now())
}

enum UserRole {
  admin
  chief_stewardess
  eto
  stewardess
  butler
  housekeeping
  deck_crew
}
```

## IMPLEMENTATION PRIORITIES

### For METSTRADE:
1. Basic user creation (admin only)
2. Simple username/password login
3. Role-based permissions
4. Must be on same WiFi

### Post-METSTRADE:
1. Chief Stewardess user creation
2. QR code login
3. Device management
4. Bulk import
5. Advanced provisioning tools
6. Native iOS app with standalone Apple Watch
7. Native Android app with Wear OS support

## NATIVE APP REQUIREMENTS

### Why Native Development:
- **Apple Watch Independence:** Must receive notifications without iPhone nearby
- **Better Performance:** Native APIs for notifications, background tasks
- **Platform Features:** Full access to watch complications, haptics
- **Battery Optimization:** Native power management

### iOS Development Stack:
- Swift/SwiftUI for iPhone app
- WatchOS app with standalone mode
- WatchConnectivity framework (when phone nearby)
- Direct WiFi connection from watch to server

### Android Development Stack:
- Kotlin for phone app
- Wear OS companion app
- Wearable Data Layer API
- Direct WiFi/Bluetooth for watch