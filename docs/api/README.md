# API Documentation

Complete API reference for the Obedio backend.

---

## Quick Reference

| Resource | Endpoints | Description |
|----------|-----------|-------------|
| Auth | `/api/auth/*` | Login, logout, token refresh |
| Crew | `/api/crew/*` | Crew member CRUD |
| Guests | `/api/guests/*` | Guest management |
| Service Requests | `/api/service-requests/*` | Butler calls |
| Locations | `/api/locations/*` | Yacht locations |
| Devices | `/api/devices/*` | ESP32 buttons |

---

## Documentation Files

- [API-MASTER-REFERENCE.md](API-MASTER-REFERENCE.md) - Complete API reference (62KB)
- [API-ENDPOINTS-SUMMARY.md](API-ENDPOINTS-SUMMARY.md) - Quick endpoint lookup
- [API-DATABASE-MAP.md](API-DATABASE-MAP.md) - API to database cross-reference
- [DATABASE-INVENTORY.md](DATABASE-INVENTORY.md) - Database schema details
- [MASTER-API-DOCUMENTATION.md](MASTER-API-DOCUMENTATION.md) - Additional reference
- [API-COMPREHENSIVE-AUDIT.txt](API-COMPREHENSIVE-AUDIT.txt) - Audit checklist

---

## Base URL

```
Development: http://localhost:8080/api
Production: https://your-server:8080/api
```

## Authentication

All endpoints (except `/api/auth/login`) require JWT token:

```
Authorization: Bearer <token>
```
