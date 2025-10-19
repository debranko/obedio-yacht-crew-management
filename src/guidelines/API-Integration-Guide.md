# API Integration Guide
**Obedio Yacht Crew Management System**

This document outlines how to migrate the current mock/localStorage implementation to a real backend API with database integration.

---

## Current Architecture

### Frontend State Management
Currently, all application data is managed through:
- **AppDataContext** (`/contexts/AppDataContext.tsx`) - Centralized state management
- **localStorage** - Client-side data persistence
- **Mock data generators** - Simulated device logs, call logs, and crew data

### Mock Data Locations
```
/contexts/AppDataContext.tsx
  - generateMockDeviceLogs()
  - generateMockCallLogs()
  - Mock crew data initialization

/components/duty-roster/mock-data.ts
  - mockCrewMembers
  - defaultShiftConfig
```

---

## Migration Strategy

### Phase 1: API Service Layer
Create a new service layer to handle all API calls.

**File to Create:** `/services/api.ts`

```typescript
// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// API client with authentication
export const apiClient = {
  get: async (endpoint: string) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
  },
  
  post: async (endpoint: string, data: any) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
  },
  
  put: async (endpoint: string, data: any) => { /* similar to post */ },
  delete: async (endpoint: string) => { /* similar to get */ },
};
```

---

## API Endpoints Required

### 1. Authentication & Users
```
POST   /api/auth/login              - User login
POST   /api/auth/logout             - User logout
GET    /api/auth/me                 - Get current user
POST   /api/auth/refresh-token      - Refresh JWT token
```

### 2. Crew Management
```
GET    /api/crew                    - Get all crew members
GET    /api/crew/:id                - Get specific crew member
POST   /api/crew                    - Add new crew member
PUT    /api/crew/:id                - Update crew member
DELETE /api/crew/:id                - Remove crew member
GET    /api/crew/departments        - Get list of departments
```

**Request/Response Example:**
```json
// GET /api/crew - Response
{
  "success": true,
  "data": [
    {
      "id": "crew-1",
      "name": "Maria Lopez",
      "position": "Chief Steward",
      "department": "Interior",
      "status": "on-duty",
      "shift": "08:00 - 20:00",
      "contact": "+1 555 0100",
      "email": "maria.lopez@yacht.com",
      "joinDate": "2023-01-15",
      "avatar": "https://..."
    }
  ],
  "count": 12
}
```

### 3. Duty Roster Management
```
GET    /api/roster/assignments              - Get all assignments
GET    /api/roster/assignments/:date        - Get assignments for specific date
POST   /api/roster/assignments              - Create new assignment
PUT    /api/roster/assignments/:id          - Update assignment
DELETE /api/roster/assignments/:id          - Delete assignment
POST   /api/roster/assignments/batch        - Bulk create/update assignments
GET    /api/roster/shifts                   - Get shift configurations
PUT    /api/roster/shifts                   - Update shift configurations
POST   /api/roster/save                     - Save entire roster (atomic operation)
```

**Request Example:**
```json
// POST /api/roster/assignments/batch
{
  "assignments": [
    {
      "id": "assign-1",
      "crewId": "crew-1",
      "shiftId": "shift-1",
      "date": "2025-01-15",
      "type": "primary"
    }
  ],
  "shifts": [
    {
      "id": "shift-1",
      "name": "Day Shift",
      "startTime": "08:00",
      "endTime": "20:00",
      "color": "#C8A96B"
    }
  ]
}
```

### 4. Activity Logs
```
GET    /api/logs/devices                    - Get device activity logs
GET    /api/logs/devices/:id                - Get specific device log
POST   /api/logs/devices                    - Create device log entry
GET    /api/logs/calls                      - Get call history logs
POST   /api/logs/calls                      - Create call log entry
GET    /api/logs/crew-changes               - Get crew change logs
POST   /api/logs/crew-changes               - Create crew change log
GET    /api/logs/all                        - Get all logs (paginated)
```

**Query Parameters for Logs:**
```
?page=1&limit=50&search=bridge&user=admin&startDate=2025-01-01&endDate=2025-01-31
```

### 5. Notifications
```
POST   /api/notifications/crew              - Send notifications to crew members
GET    /api/notifications/history           - Get notification history
PUT    /api/notifications/:id/status        - Update notification status
```

**Request Example:**
```json
// POST /api/notifications/crew
{
  "changes": [
    {
      "crewMember": "Maria Lopez",
      "crewId": "crew-1",
      "changeType": "added",
      "date": "2025-01-15",
      "shift": "Day Shift",
      "details": "Assigned to Day Shift (08:00 - 20:00)"
    }
  ],
  "performedBy": "admin-user-id",
  "timestamp": "2025-01-10T10:30:00Z"
}
```

### 6. Guests
```
GET    /api/guests                          - Get all guests
GET    /api/guests/:id                      - Get specific guest
POST   /api/guests                          - Add new guest
PUT    /api/guests/:id                      - Update guest
DELETE /api/guests/:id                      - Remove guest
```

### 7. Device Manager
```
GET    /api/devices                         - Get all devices
GET    /api/devices/:id                     - Get specific device
POST   /api/devices                         - Add new device
PUT    /api/devices/:id                     - Update device
DELETE /api/devices/:id                     - Remove device
PUT    /api/devices/:id/status              - Update device status
```

---

## Database Schema

### Recommended Tables

#### 1. `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'admin', 'captain', 'steward', etc.
  department VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. `crew_members`
```sql
CREATE TABLE crew_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  position VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'off-duty', -- 'on-duty', 'off-duty', 'on-leave'
  contact VARCHAR(50),
  email VARCHAR(255),
  join_date DATE,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. `shift_configs`
```sql
CREATE TABLE shift_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  color VARCHAR(7), -- hex color
  yacht_id UUID, -- if multi-yacht system
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. `roster_assignments`
```sql
CREATE TABLE roster_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crew_id UUID REFERENCES crew_members(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES shift_configs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'primary' or 'backup'
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(crew_id, shift_id, date) -- Prevent duplicate assignments
);

CREATE INDEX idx_roster_date ON roster_assignments(date);
CREATE INDEX idx_roster_crew ON roster_assignments(crew_id);
```

#### 5. `device_logs`
```sql
CREATE TABLE device_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'online', 'offline', 'alert', 'maintenance'
  message TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_device_logs_timestamp ON device_logs(timestamp DESC);
CREATE INDEX idx_device_logs_device ON device_logs(device_name);
```

#### 6. `call_logs`
```sql
CREATE TABLE call_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caller VARCHAR(255) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  duration INTEGER DEFAULT 0, -- in seconds
  type VARCHAR(50) NOT NULL, -- 'internal', 'external', 'emergency'
  status VARCHAR(50) NOT NULL, -- 'completed', 'missed', 'ongoing'
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_call_logs_timestamp ON call_logs(timestamp DESC);
```

#### 7. `crew_change_logs`
```sql
CREATE TABLE crew_change_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crew_member VARCHAR(255) NOT NULL,
  crew_id UUID REFERENCES crew_members(id),
  change_type VARCHAR(50) NOT NULL, -- 'added', 'removed', 'moved_to_backup', 'moved_to_primary'
  date DATE NOT NULL,
  shift VARCHAR(100) NOT NULL,
  performed_by UUID REFERENCES users(id) NOT NULL,
  notified BOOLEAN DEFAULT FALSE,
  details TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_crew_change_logs_timestamp ON crew_change_logs(timestamp DESC);
CREATE INDEX idx_crew_change_logs_crew ON crew_change_logs(crew_id);
```

#### 8. `guests`
```sql
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  cabin VARCHAR(50),
  arrival_date DATE,
  departure_date DATE,
  preferences TEXT,
  allergies TEXT,
  dietary_restrictions TEXT,
  special_requests TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 9. `devices`
```sql
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'offline',
  ip_address VARCHAR(45),
  last_seen TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Files to Modify

### 1. `/contexts/AppDataContext.tsx`

**Current:** Uses localStorage and mock data  
**Change to:** API calls

```typescript
// BEFORE:
const [crewMembers, setCrewMembers] = useState<CrewMemberExtended[]>(() => {
  const stored = localStorage.getItem('obedio-crew-members');
  if (stored) return JSON.parse(stored);
  return mockCrewMembers.map(/* ... */);
});

// AFTER:
const [crewMembers, setCrewMembers] = useState<CrewMemberExtended[]>([]);

useEffect(() => {
  // Fetch from API on mount
  apiClient.get('/crew')
    .then(response => setCrewMembers(response.data))
    .catch(error => console.error('Failed to fetch crew:', error));
}, []);
```

**Remove:**
- All `localStorage.setItem()` calls
- `generateMockDeviceLogs()` function
- `generateMockCallLogs()` function
- Mock data initialization

**Replace with:**
- API fetch on component mount
- API calls in setter functions
- Real-time updates via WebSocket (optional)

### 2. `/components/pages/duty-roster-tab.tsx`

**Current:** Simulated save with setTimeout  
**Change to:** Real API call

```typescript
// BEFORE:
const saveAssignments = async () => {
  setIsSaving(true);
  await new Promise(resolve => setTimeout(resolve, 800));
  // ...
};

// AFTER:
const saveAssignments = async () => {
  setIsSaving(true);
  try {
    await apiClient.post('/roster/save', {
      assignments,
      shifts,
    });
    setLastSaved(new Date());
    toast.success('Duty roster saved successfully');
  } catch (error) {
    toast.error('Failed to save roster');
    console.error(error);
  } finally {
    setIsSaving(false);
  }
};
```

### 3. `/components/duty-roster/mock-data.ts`

**Action:** Can be kept for development/testing, but not used in production

**Alternative:** Seed database with initial data instead

---

## Authentication Implementation

### Add Auth Context

**File to Create:** `/contexts/AuthContext.tsx`

```typescript
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  const login = async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    localStorage.setItem('auth_token', response.token);
    setUser(response.user);
  };
  
  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### Update App.tsx

Wrap application with AuthProvider and add login page routing.

---

## Environment Variables

**File to Create:** `.env`

```bash
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_WS_URL=ws://localhost:3001
REACT_APP_ENV=development
```

**File to Create:** `.env.production`

```bash
REACT_APP_API_URL=https://api.obedio.com/api
REACT_APP_WS_URL=wss://api.obedio.com
REACT_APP_ENV=production
```

---

## Real-time Updates (Optional)

### WebSocket Integration

For real-time crew roster updates and notifications:

```typescript
// /services/websocket.ts
export class WebSocketService {
  private ws: WebSocket | null = null;
  
  connect(token: string) {
    this.ws = new WebSocket(`${WS_URL}?token=${token}`);
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch(data.type) {
        case 'ROSTER_UPDATE':
          // Update roster in context
          break;
        case 'CREW_NOTIFICATION':
          // Show toast notification
          break;
        case 'DEVICE_STATUS':
          // Update device status
          break;
      }
    };
  }
  
  disconnect() {
    this.ws?.close();
  }
}
```

---

## Testing Strategy

### 1. Development Phase
- Keep mock data alongside API integration
- Use feature flags to switch between mock and real data
- Test all CRUD operations

### 2. Staging Phase
- Use staging database with test data
- Test authentication and authorization
- Verify data persistence

### 3. Production
- Remove all mock data dependencies
- Enable API-only mode
- Monitor error logs

---

## Error Handling

### Global Error Handler

```typescript
// /services/errorHandler.ts
export const handleApiError = (error: any) => {
  if (error.response?.status === 401) {
    // Redirect to login
    window.location.href = '/login';
  } else if (error.response?.status === 403) {
    toast.error('You do not have permission to perform this action');
  } else if (error.response?.status >= 500) {
    toast.error('Server error. Please try again later.');
  } else {
    toast.error(error.message || 'An unexpected error occurred');
  }
};
```

---

## Migration Checklist

- [ ] Set up backend API server (Node.js, Python, etc.)
- [ ] Create database and run migrations
- [ ] Seed database with initial data
- [ ] Create `/services/api.ts` service layer
- [ ] Add authentication context
- [ ] Replace localStorage with API calls in AppDataContext
- [ ] Update all components to use API instead of mock data
- [ ] Add error handling and loading states
- [ ] Implement WebSocket for real-time updates (optional)
- [ ] Add environment variables
- [ ] Test all features end-to-end
- [ ] Deploy to staging environment
- [ ] Perform security audit
- [ ] Deploy to production

---

## Recommended Backend Stack

### Option 1: Node.js + Express + PostgreSQL
```bash
Backend: Express.js or Nest.js
Database: PostgreSQL with Prisma ORM
Real-time: Socket.io
Authentication: JWT with bcrypt
```

### Option 2: Python + FastAPI + PostgreSQL
```bash
Backend: FastAPI
Database: PostgreSQL with SQLAlchemy
Real-time: WebSocket support built-in
Authentication: JWT with PassLib
```

### Option 3: Supabase (Managed Backend)
```bash
Backend: Supabase (PostgreSQL + REST API + Real-time)
Authentication: Supabase Auth
Storage: Supabase Storage for avatars
Real-time: Built-in Realtime subscriptions
```

**Supabase is recommended for fastest implementation!**

---

## Summary

This guide provides a complete roadmap for migrating from the current mock/localStorage implementation to a production-ready backend API. The key changes involve:

1. Creating an API service layer
2. Replacing all localStorage calls with API calls
3. Adding authentication and authorization
4. Setting up a proper database schema
5. Implementing error handling and loading states

Follow the checklist and modify files as indicated to complete the migration successfully.

---

**Document Version:** 1.0  
**Last Updated:** January 10, 2025  
**Maintained by:** Obedio Development Team
