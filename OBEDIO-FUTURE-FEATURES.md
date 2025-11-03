# OBEDIO Future Features

This document outlines planned features for future development of the OBEDIO luxury yacht management system.

## GPS Tracking za Crew Members

> **NAPOMENA: WearOS aplikacija VEĆ POSTOJI u ObedioWear folderu!**
> - Aplikacija trenutno prikazuje konekciju na server
> - Potrebno je samo dodati funkcionalnost primanja poziva
> - NE TREBA kodirati od početka!

- **Wear OS integracija (već postoji osnovna aplikacija)**
  - ObedioWear aplikacija je spremna
  - Potrebno samo dodati call receiving funkcionalnost
  
- **Real-time GPS koordinate crew member-a**
  - Kontinuirano praćenje pozicije
  - Interval slanja podataka: 5-10 sekundi
  
- **MQTT streaming lokacije na server**
  - Topic pattern: `crew/{crewId}/location`
  - JSON payload format:
    ```json
    {
      "crewId": "string",
      "latitude": 44.123456,
      "longitude": 15.234567,
      "accuracy": 5.2,
      "timestamp": "2025-11-01T21:40:00Z",
      "batteryLevel": 85
    }
    ```
  
- **Potrebno dodati u CrewMember model:**
  - `latitude` (float) - Trenutna geografska širina
  - `longitude` (float) - Trenutna geografska dužina
  - `lastLocationUpdate` (timestamp) - Vreme poslednjeg ažuriranja lokacije
  - `locationAccuracy` (float) - Tačnost GPS signala u metrima
  
- **API endpoint:** `PUT /api/crew/:id/location`
  - Request body:
    ```json
    {
      "latitude": 44.123456,
      "longitude": 15.234567,
      "accuracy": 5.2
    }
    ```
  - Automatski update `lastLocationUpdate` timestamp
  
- **MQTT topic:** `crew/{crewId}/location`
  - Real-time streaming GPS podataka
  - WebSocket broadcast na frontend
  
- **UI: Mapa sa real-time pozicijama posade**
  - Leaflet ili Mapbox integracija
  - Real-time markeri za svaki crew member
  - Color coding prema duty status
  - Cluster view za preklapajuće pozicije
  
- **Use case: Man overboard situacije, praćenje na duty crew**
  - Instant alert sistem za MOB situacije
  - Geofencing za kontrolu kretanja
  - Historical tracking za analizu
  - Integration sa emergency systems

## Additional Future Features

### Mobile Applications
- Native iOS app (Swift)
- Native Android app (Kotlin)
- Push notifications
- Offline mode sa sinhronizacijom

### Advanced Analytics
- Dashboard sa KPI metrikama
- Predictive maintenance
- Crew performance analytics
- Guest satisfaction metrics

### Integration Features
- PMS (Property Management System) integracija
- Marina booking systems
- Weather API integracija
- AIS vessel tracking

### Security Enhancements
- Biometric authentication
- 2FA implementation
- Role-based access control expansion
- Audit logging

### Communication Features
- In-app messaging
- Video calling capabilities
- Crew scheduling optimization
- Multi-yacht fleet management

### IoT Expansion
- Engine room monitoring
- Fuel consumption tracking
- Water/waste tank levels
- Climate control integration

## EXISTING COMPONENTS - DO NOT REBUILD

> **VAŽNO: Ove komponente VEĆ POSTOJE i funkcionišu!**

1. **ObedioWear** - WearOS aplikacija
   - Lokacija: `/ObedioWear` folder
   - Status: Funkcioniše, prikazuje konekciju na server
   - TODO: Samo dodati primanje poziva

2. **Crew Management** - 95% završeno
   - Ne menjati postojeću funkcionalnost
   - Radi sa WebSocket real-time sync

3. **Service Requests** - Potpuno funkcionalan
   - MQTT button press → notification flow radi

4. **Duty Roster** - Refaktorisan i spreman
   - WebSocket sync implementiran
   - Multi-tab conflict detection radi

## Implementation Priority

1. **⚡ URGENT - METSTRADE Show (November 18-19-20) - MORA BITI ZAVRŠENO DO 3. NOVEMBRA! ⚡**
   - Device Manager (za ESP32 smart buttons) - HITNO!
   - Basic Settings finalizacija - HITNO!
   - WearOS call receiving (samo update postojeće ObedioWear app)
   - Testing & bug fixes
   - Demo scenario preparation

2. **Medium Priority (After Show - 2-6 months)**
   - GPS tracking preko WearOS
   - Mobile Applications (iOS/Android native)
   - Integration Features (PMS, Marina systems)
   - Security Enhancements
   - Advanced Analytics

3. **Long Term (6+ months)**
   - Man overboard alert sistem
   - Advanced crew location tracking
   - IoT Expansion
   - Full fleet management
   - AI-powered predictive features