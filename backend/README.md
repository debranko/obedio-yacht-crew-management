# Obedio Yacht Crew Management System - Backend

Production-ready Node.js + Express + TypeScript + Prisma + PostgreSQL backend server.

## 🚀 Quick Start (Development)

### Prerequisites
- Node.js 18+ 
- npm 8+
- PostgreSQL 14+ (or use SQLite for quick start)

### Installation

1. **Install dependencies**
```bash
cd backend
npm install
```

2. **Setup environment**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. **Setup database**
```bash
# For SQLite (quick start)
npm run db:push
npm run db:seed

# For PostgreSQL
# 1. Create database: createdb obedio_yacht_crew
# 2. Update DATABASE_URL in .env
# 3. Run migrations
npm run db:migrate
npm run db:seed
```

4. **Start development server**
```bash
npm run dev
```

Server will be available at:
- **Local**: http://localhost:3001
- **Network**: http://YOUR_IP:3001 (for device access)

## 🛥️ Production Deployment (Windows Server)

### Windows Service Setup

1. **Install dependencies**
```bash
npm install --production
npm run build
```

2. **Install PM2 for Windows service**
```bash
npm install -g pm2
npm install -g pm2-windows-service
pm2-service-install
```

3. **Setup environment**
```bash
copy .env.example .env.production
# Edit .env.production with production values
```

4. **Setup PostgreSQL database**
```bash
# Create production database
createdb obedio_yacht_crew_prod

# Run migrations
npm run db:migrate
npm run db:seed
```

5. **Start as Windows service**
```bash
pm2 start ecosystem.config.js --env production
pm2 save
```

### Direct Windows Service (Alternative)

Use `windows-service-setup.bat` for direct Windows service installation.

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration  
- `GET /api/auth/me` - Get current user
- `POST /api/auth/verify` - Verify token

### Crew Management
- `GET /api/crew` - List crew members
- `POST /api/crew` - Create crew member
- `PUT /api/crew/:id` - Update crew member

### Guest Management  
- `GET /api/guests` - List guests (with filtering)
- `POST /api/guests` - Create guest
- `PUT /api/guests/:id` - Update guest
- `DELETE /api/guests/:id` - Delete guest

### Location Management
- `GET /api/locations` - List locations
- `POST /api/locations` - Create location
- `PUT /api/locations/:id` - Update location
- `DELETE /api/locations/:id` - Delete location
- `POST /api/locations/:id/toggle-dnd` - Toggle DND (atomic)

### Service Requests
- `GET /api/service-requests` - List service requests
- `POST /api/service-requests` - Create service request
- `PUT /api/service-requests/:id/accept` - Accept request
- `PUT /api/service-requests/:id/complete` - Complete request

### Smart Button Integration
- `POST /api/smart-buttons/press` - Handle button press

### System
- `GET /api/health` - Health check
- `GET /api/status` - System status (authenticated)

## 🔄 Real-time Events (WebSocket)

### Client Events (Frontend → Backend)
- `authenticate` - Authenticate WebSocket connection
- `service-request:accept` - Accept service request
- `dnd:toggle` - Toggle DND status
- `smart-button:press` - Smart button press
- `crew:status-update` - Update crew status

### Server Events (Backend → Frontend)
- `authenticated` - Authentication successful
- `service-request:new` - New service request
- `service-request:updated` - Service request updated
- `dnd:updated` - DND status changed
- `crew:status-changed` - Crew status changed
- `emergency:alert` - Emergency alert
- `device:updated` - Device status updated

## 🗄️ Database Schema

### Core Tables
- `users` - Authentication and user accounts
- `crew_members` - Crew information and status
- `guests` - Guest profiles and preferences
- `locations` - Yacht areas and rooms
- `service_requests` - Guest service requests
- `assignments` - Duty roster assignments
- `shift_configs` - Shift time configurations
- `devices` - Device registry and status
- `smart_buttons` - ESP32 smart button configuration
- `activity_logs` - System activity logging

### Key Features
- **Foreign Key Relationships**: Proper `guest.locationId → location.id`
- **Atomic DND Operations**: Prevents location/guest desync
- **Real-time Sync**: WebSocket updates across all clients
- **Activity Logging**: Full audit trail
- **Role-based Access Control**: Permission system

## 🔧 Development Tools

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:studio` - Open Prisma Studio
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with test data
- `npm run type-check` - TypeScript type checking
- `npm run lint` - ESLint code checking

## 🌐 Network Access

The server binds to `0.0.0.0:3001` by default, making it accessible from:
- **Local machine**: http://localhost:3001
- **Local network**: http://YOUR_IP:3001
- **ESP32 devices**: Can connect directly to server IP

## 🔒 Security Features

- JWT authentication with configurable expiration
- Role-based access control (RBAC)
- Request rate limiting
- Helmet security headers
- CORS protection
- Input validation
- SQL injection protection (Prisma ORM)

## 📁 Frontend Integration

Backend serves the built frontend from `/dist` directory:
1. Build frontend: `npm run build` (in root directory)
2. Frontend files are served at `/` 
3. API is available at `/api/*`
4. SPA routing handled automatically

## 🚨 ESP32 Smart Button Integration

The backend is ready for ESP32 device integration:
- WebSocket endpoint for real-time button presses
- Device registration and status tracking  
- Configurable button functions per location
- Battery monitoring and alerts
- Firmware update capabilities (planned)

## 📊 Monitoring & Logging

- Winston-based structured logging
- Request/response logging
- Error tracking and reporting
- Performance monitoring
- Database query logging (development)
- Real-time connection monitoring

## 🔄 Migration from Frontend

This backend maintains compatibility with frontend localStorage structure while adding:
- Proper relational database storage
- Real-time synchronization
- Multi-user access
- Audit trails
- Backup and recovery
- Production scalability