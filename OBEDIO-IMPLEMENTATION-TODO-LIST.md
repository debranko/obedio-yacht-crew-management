# ✅ OBEDIO IMPLEMENTATION TODO LIST

**Početak:** 1. Novembar 2025  
**Rok:** METSTRADE 2025 (Januar 2025)  
**Tip:** Checklist za praćenje progresa

---

## 🔴 FAZA 1: KRITIČNI POPRAVCI ✅ **100% ZAVRŠENO** (3-5 dana)

### Backend API za Duty Roster ✅
- [x] Kreirati `backend/src/routes/assignments.ts` fajl
- [x] Implementirati GET `/api/assignments` endpoint
- [x] Implementirati GET `/api/assignments/by-date/:date` endpoint
- [x] Implementirati GET `/api/assignments/by-week/:startDate` endpoint
- [x] Implementirati GET `/api/assignments/crew/:crewMemberId` endpoint
- [x] Implementirati POST `/api/assignments` endpoint
- [x] Implementirati POST `/api/assignments/bulk` endpoint
- [x] Implementirati PUT `/api/assignments/:id` endpoint
- [x] Implementirati DELETE `/api/assignments/:id` endpoint
- [x] Implementirati DELETE `/api/assignments/by-date/:date` endpoint
- [x] Implementirati DELETE `/api/assignments/crew/:crewMemberId` endpoint
- [x] Dodati assignments rutu u `backend/src/server.ts`
- [x] Testirati sve endpoints sa Postman/curl

### React Query Hooks za Assignments ✅
- [x] Kreirati `src/hooks/useAssignments.ts`
- [x] Implementirati `useAssignments()` hook
- [x] Implementirati `useAssignmentsByDate()` hook
- [x] Implementirati `useAssignmentsByCrew()` hook
- [x] Implementirati `useCreateAssignment()` mutation
- [x] Implementirati `useCreateBulkAssignments()` mutation
- [x] Implementirati `useUpdateAssignment()` mutation
- [x] Implementirati `useDeleteAssignment()` mutation
- [x] Implementirati `useDeleteAssignmentsByDate()` mutation
- [x] Implementirati `useDeleteAssignmentsByCrew()` mutation

### Refaktorisanje DutyRosterTab komponente ✅
- [x] Ukloniti lokalni state za assignments (working copy pattern)
- [x] Zameniti localStorage sa React Query (nema localStorage)
- [x] Implementirati optimistic updates
- [x] Dodati error handling
- [x] Testirati sinhronizaciju između tabova

### Razbijanje AppDataContext ✅
- [x] Kreirati `src/contexts/GuestsContext.tsx`
- [x] Migrirati guests logiku iz AppDataContext
- [x] Kreirati `src/contexts/LocationsContext.tsx`
- [x] Migrirati locations i DND logiku
- [x] Kreirati `src/contexts/ServiceRequestsContext.tsx`
- [x] Migrirati service requests logiku
- [x] Kreirati `src/contexts/DutyRosterContext.tsx`
- [x] Migrirati shifts i assignments logiku
- [x] Ažurirati sve komponente da koriste nove contexts
- [x] ~~Obrisati stari AppDataContext~~ Refaktorisan kao wrapper

### WebSocket Real-time Updates ✅
- [x] Dodati WebSocket listener u GuestListPage
- [x] Dodati WebSocket listener u ServiceRequestsPage
- [x] Dodati WebSocket listener u DutyRosterTab
- [x] Dodati WebSocket listener u LocationsPage
- [x] Dodati WebSocket listener za DND toggle
- [x] Testirati real-time sinhronizaciju

---

## 🟡 FAZA 2: OPTIMIZACIJE (2-3 dana)

### Uklanjanje localStorage
- [ ] Pretražiti sve fajlove za `localStorage` calls
- [ ] Zameniti dashboard layouts sa API pozivima
- [ ] Zameniti duty roster data sa API pozivima
- [ ] Zameniti sve ostale localStorage pozive
- [ ] Verifikovati da samo auth-token ostaje

### Error Handling & Loading States
- [ ] Kreirati ErrorBoundary komponentu
- [ ] Wrap-ovati sve page komponente
- [ ] Dodati Suspense za lazy loading
- [ ] Implementirati skeleton loaders
- [ ] Dodati retry logiku za failed queries

### Performance Optimizacije
- [ ] Implementirati React.memo za CrewMemberItem
- [ ] Implementirati React.memo za ServiceRequestCard
- [ ] Dodati useMemo za skupe kalkulacije
- [ ] Implementirati virtual scrolling za velike liste
- [ ] Optimizovati re-renders sa React DevTools

### Offline Support
- [ ] Implementirati IndexedDB za offline queue
- [ ] Kreirati service worker za PWA
- [ ] Implementirati background sync
- [ ] Testirati offline/online transitions

---

## 🟢 FAZA 3: ZAVRŠNI DETALJI (2 dana)

### Device Manager Completion
- [ ] Implementirati Add Device dialog
- [ ] Dodati device configuration editor
- [ ] Kreirati battery monitoring widget
- [ ] Implementirati device assignment UI
- [ ] Dodati firmware update mechanism
- [ ] Implementirati device logs viewer

### Settings Page Completion
- [ ] Implementirati Users management tab
- [ ] Dodati Role permissions editor
- [ ] Kreirati Notification settings UI
- [ ] Implementirati System logs viewer
- [ ] Dodati Backup/Restore funkcionalnost
- [ ] Kreirati About/System info tab

### Testing & Bug Fixes
- [ ] End-to-end test: Guest check-in flow
- [ ] End-to-end test: Service request lifecycle
- [ ] End-to-end test: Duty roster assignments
- [ ] Load test: 50+ simultaneous service requests
- [ ] MQTT test: 10+ ESP32 devices
- [ ] Memory leak testing
- [ ] Cross-browser compatibility
- [ ] Mobile responsiveness check

---

## 📊 VALIDATION CHECKLIST

### Backend Validation
- [ ] Svi API endpoints vraćaju konzistentni format
- [ ] Svi endpoints imaju error handling
- [ ] Svi endpoints imaju input validation (Zod)
- [ ] Rate limiting implementiran
- [ ] CORS properly configured

### Frontend Validation
- [ ] Nema console.log statements u produkciji
- [ ] Nema hardcoded/mock data
- [ ] Sve komponente koriste React Query
- [ ] Nema localStorage za app data
- [ ] WebSocket reconnection radi

### Integration Testing
- [ ] ESP32 → MQTT → Backend → Database
- [ ] Frontend → API → Database → WebSocket → Frontend
- [ ] Multi-client synchronization
- [ ] Offline → Online sync
- [ ] Authentication flow

---

## 🎯 DEFINITION OF DONE

Za svaki zadatak mora biti ispunjeno:
1. ✅ Kod napisan i testiran lokalno
2. ✅ API endpoint dokumentovan u Swagger
3. ✅ Error handling implementiran
4. ✅ Loading states dodati
5. ✅ React Query DevTools pokazuje podatke
6. ✅ Nema TypeScript grešaka
7. ✅ Nema console error-a
8. ✅ Multi-tab sync radi
9. ✅ Radi na mobilnim uređajima
10. ✅ Code review completed

---

## 📈 PROGRESS TRACKING

**Započeto:** _________  
**Trenutni progres:** 0/95 zadataka (0%)  
**Poslednji update:** 1. Novembar 2025

### Dnevni progres:
- Dan 1: ____________
- Dan 2: ____________
- Dan 3: ____________
- Dan 4: ____________
- Dan 5: ____________

---

## 🚨 BLOKIRAJUĆI PROBLEMI

1. _________
2. _________
3. _________

---

## 📝 NAPOMENE

- Crew Management komponente su ZAVRŠENE - ne dirati!
- Uvek prvo backend, pa frontend
- Testiraj posle svakog zadatka
- Commit često sa jasnim porukama
- Dokumentuj sve API promene

---

**Poslednja izmena:** 1. Novembar 2025