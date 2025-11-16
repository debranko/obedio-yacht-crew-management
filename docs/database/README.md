# Database Documentation

PostgreSQL database schema and reference documentation for OBEDIO.

## Key Documents

- **[DATABASE-INVENTORY.md](DATABASE-INVENTORY.md)** - Complete database schema with all tables, fields, and relationships

## Database Overview

**Database**: `obedio_yacht_db`
**Type**: PostgreSQL
**ORM**: Prisma

## Main Tables

### Core Entities
- **User** - System users (admin, crew authentication)
- **Crew** - Crew member profiles and roles
- **Guest** - Yacht guest information
- **Location** - Yacht locations (cabins, deck areas)

### Service Management
- **ServiceRequest** - Guest service requests
- **ServiceRequestHistory** - Request status change log
- **Assignment** - Crew task assignments
- **Shift** - Crew shift scheduling

### Devices
- **Device** - ESP32 buttons and Wear OS watches
- **DeviceLog** - Device activity logging

### System
- **ActivityLog** - System-wide activity audit trail
- **CrewChangeLog** - Crew profile change history
- **YachtSettings** - System configuration
- **UserPreferences** - User settings

## Connection

Development:
```
postgresql://postgres:obediobranko@localhost:5432/obedio_yacht_db
```

## Migrations

Managed via Prisma:
```bash
cd backend
npm run migrate
```

## Related Documentation

- [Backend Architecture](../BACKEND-ARCHITECTURE.md) - How database integrates with API
- [API Reference](../api-reference/) - Database-backed endpoints
