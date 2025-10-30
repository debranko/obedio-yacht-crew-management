# Komande za testiranje nakon PostgreSQL setup-a

## Kada je PostgreSQL spreman:

1. **Generiši Prisma client**:
```bash
cd backend
npx prisma generate
```

2. **Kreiraj database schema**:
```bash
npx prisma db push
```

3. **Popuni bazu sa test podatcima**:
```bash
npm run db:seed
```

4. **Pokreni backend server**:
```bash
npm run dev
```

5. **U drugom terminalu, pokreni frontend**:
```bash
npm run dev
```

6. **Testiraj full-stack aplikaciju**:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api
- Zdravlje servera: http://localhost:3001/api/health

## Očekivani rezultat:
✅ Backend server radi na portu 3001
✅ Frontend aplikacija radi na portu 5173
✅ WebSocket komunikacija funkcioniše
✅ API pozivi rade umesto localStorage fallback
✅ Real-time notifikacije se prikazuju

## Ako nešto ne radi:
- Proveri PostgreSQL konekciju
- Proveri da li su portovi 3001 i 5173 slobodni
- Pogledaj greške u konzoli