# ⚙️ Backend Architecture

**Technology:** Node.js + Express + TypeScript + Prisma + PostgreSQL  
**Location:** `/backend` folder  
**Port:** 3001

---

## 📋 Overview

The backend is a RESTful API server with WebSocket support for real-time updates. It handles authentication, business logic, and data persistence.

**Responsibilities:**
- JWT authentication
- CRUD operations
- Business logic
- Real-time events (WebSocket)
- Database management
- File uploads (voice messages)

---

## 🏗️ Architecture Layers

```
HTTP/WebSocket Requests
        ↓
Routes (Endpoints)
        ↓
Middleware (Auth, Validation)
        ↓
Services (Business Logic)
        ↓
Prisma Client (ORM)
        ↓
PostgreSQL Database
```

---

## 📁 Folder Structure

```
backend/
├── src/
│   ├── server.ts           # Express app + WebSocket
│   ├── routes/             # API endpoints
│   │   ├── auth.ts         # Login, register, verify
│   │   ├── crew.ts         # Crew CRUD
│   │   ├── guests.ts       # Guest CRUD
│   │   ├── locations.ts    # Location CRUD + DND
│   │   ├── service-requests.ts
│   │   ├── devices.ts      # Device registry
│   │   └── smart-buttons.ts
│   ├── services/           # Business logic
│   │   ├── crew.service.ts
│   │   ├── guest.service.ts
│   │   ├── location.service.ts
│   │   └── service-request.service.ts
│   ├── middleware/         # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── logging.middleware.ts
│   └── utils/              # Helpers
│       ├── logger.ts
│       └── password-generator.ts
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Test data
└── uploads/                # File storage
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/login       # Login with username/password
POST   /api/auth/register    # Create new user
GET    /api/auth/me          # Get current user
POST   /api/auth/verify      # Verify JWT token
```

### Crew Management
```
GET    /api/crew             # List all crew
POST   /api/crew             # Create crew member
GET    /api/crew/:id         # Get crew details
PUT    /api/crew/:id         # Update crew member
DELETE /api/crew/:id         # Delete crew member
```

### Guest Management
```
GET    /api/guests           # List guests (with filters)
POST   /api/guests           # Create guest
GET    /api/guests/:id       # Get guest details
PUT    /api/guests/:id       # Update guest
DELETE /api/guests/:id       # Delete guest
```

### Location Management
```
GET    /api/locations        # List locations
POST   /api/locations        # Create location
PUT    /api/locations/:id    # Update location
DELETE /api/locations/:id    # Delete location
POST   /api/locations/:id/toggle-dnd  # Atomic DND toggle
```

### Service Requests
```
GET    /api/service-requests              # List requests
POST   /api/service-requests              # Create request
PUT    /api/service-requests/:id/accept   # Accept
PUT    /api/service-requests/:id/complete # Complete
```

### Smart Buttons
```
POST   /api/smart-buttons/press  # Button press handler
```

### System
```
GET    /api/health           # Health check
GET    /api/status           # System status (auth required)
```

---

## 🔐 Authentication Middleware

### JWT Verification
```typescript
// src/middleware/auth.middleware.ts
export function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }
  
  const decoded = jwt.verify(token, JWT_SECRET);
  req.user = decoded;
  next();
}
```

### Permission Checking
```typescript
export function requirePermission(permission: string) {
  return (req, res, next) => {
    if (hasPermission(req.user.role, permission)) {
      next();
    } else {
      res.status(403).json({ error: 'Forbidden' });
    }
  };
}
```

**Usage:**
```typescript
router.post('/crew',
  authenticate,
  requirePermission('crew:create'),
  createCrewMember
);
```

---

## 📊 Service Layer Pattern

### Example: Guest Service
```typescript
// src/services/guest.service.ts
export async function createGuest(data) {
  // 1. Validate data
  const validated = createGuestSchema.parse(data);
  
  // 2. Check location exists
  const location = await prisma.location.findUnique({
    where: { id: validated.locationId }
  });
  
  if (!location) {
    throw new Error('Location not found');
  }
  
  // 3. Create guest
  const guest = await prisma.guest.create({
    data: validated,
    include: { location: true }
  });
  
  // 4. Log activity
  await createActivityLog({
    action: 'guest_created',
    entityId: guest.id
  });
  
  // 5. Broadcast WebSocket event
  io.emit('guest:created', guest);
  
  return guest;
}
```

**Benefits:**
- Reusable business logic
- Easy to test
- Centralized validation
- Activity logging
- WebSocket events

---

## 🔄 WebSocket Events

### Server Setup
```typescript
// src/server.ts
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('authenticate', async (token) => {
    const user = await verifyToken(token);
    socket.data.user = user;
    socket.emit('authenticated');
  });
});
```

### Event Types

**Server → Client:**
- `service-request:new` - New service request
- `service-request:updated` - Status changed
- `dnd:updated` - DND toggled
- `crew:status-changed` - Crew status update
- `emergency:alert` - Emergency situation
- `device:updated` - Device status change

**Client → Server:**
- `authenticate` - Authenticate connection
- `service-request:accept` - Accept request
- `dnd:toggle` - Toggle DND

---

## 🗄️ Database Access (Prisma)

### Type-Safe Queries
```typescript
// Find guests with filters
const guests = await prisma.guest.findMany({
  where: {
    firstName: { contains: search, mode: 'insensitive' },
    locationId: locationId || undefined
  },
  include: {
    location: true,
    serviceRequests: {
      where: { status: 'open' }
    }
  },
  orderBy: { createdAt: 'desc' }
});
```

### Transactions
```typescript
// Atomic DND toggle
await prisma.$transaction(async (tx) => {
  await tx.location.update({
    where: { id },
    data: { doNotDisturb: !current }
  });
  
  await tx.guest.updateMany({
    where: { locationId: id },
    data: { doNotDisturb: !current }
  });
});
```

---

## 🛡️ Security Features

### Password Hashing
```typescript
import bcrypt from 'bcrypt';

// Hash password
const hashedPassword = await bcrypt.hash(password, 10);

// Verify password
const isValid = await bcrypt.compare(password, hashedPassword);
```

### Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // 100 requests per window
});

app.use('/api/', limiter);
```

### Input Validation
```typescript
import { z } from 'zod';

const createGuestSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  locationId: z.string().uuid()
});

const validated = createGuestSchema.parse(req.body);
```

---

## 📝 Logging

### Winston Logger
```typescript
// src/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Usage
```typescript
logger.info('User logged in', { userId: user.id });
logger.error('Database connection failed', { error });
```

---

## 🚀 Deployment (Windows Server)

### PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'obedio-backend',
    script: './dist/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
```

### Start Commands
```bash
# Development
npm run dev

# Production build
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
```

---

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database
npm run db:seed

# Start dev server
npm run dev

# Build for production
npm run build

# Run migrations
npx prisma migrate deploy
```

---

**Next:** See DATABASE-ARCHITECTURE.md for schema details.
