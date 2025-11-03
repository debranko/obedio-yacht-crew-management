# 🔧 OBEDIO TECHNICAL SPECIFICATIONS

**Verzija:** 1.0  
**Datum:** 1. Novembar 2025  
**Namena:** Detaljne tehničke specifikacije za svaki segment implementacije

---

## 📌 SEGMENT 1: DUTY ROSTER BACKEND API

### Prisma Schema (već postoji, ne menjati!)
```prisma
model Assignment {
  id           String   @id @default(cuid())
  date         String   // ISO date format: "2025-01-15"
  shiftId      String
  crewMemberId String
  type         String   // "primary" | "backup"
  notes        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  shift        Shift      @relation(fields: [shiftId], references: [id])
  crewMember   CrewMember @relation(fields: [crewMemberId], references: [id])

  @@unique([date, shiftId, crewMemberId])
  @@index([date])
  @@index([crewMemberId])
  @@index([shiftId])
}
```

### API Endpoints Specifikacija

#### 1. GET /api/assignments
```typescript
// Query parametri:
interface QueryParams {
  date?: string;         // ISO date
  shiftId?: string;     
  crewMemberId?: string;
  type?: 'primary' | 'backup';
  startDate?: string;    // Za range queries
  endDate?: string;
  includeShift?: boolean; // Include shift relation
}

// Response:
{
  success: true,
  data: Assignment[]
}
```

#### 2. POST /api/assignments/bulk
```typescript
// Request body:
{
  assignments: Array<{
    date: string;
    shiftId: string;
    crewMemberId: string;
    type: 'primary' | 'backup';
    notes?: string;
  }>
}

// Response:
{
  success: true,
  data: {
    created: Assignment[],
    skipped: Array<{assignment: any, reason: string}>
  }
}

// Logika:
- Proveriti da crew nije na odmoru (status === 'on-leave')
- Proveriti da ne postoji duplikat
- Bulk insert sa transaction
```

#### 3. DELETE /api/assignments/crew/:crewMemberId
```typescript
// Query parametri:
interface QueryParams {
  startDate?: string;
  endDate?: string;
}

// Briše sve assignments za crew member u datom periodu
// Ako nema parametara, briše SVE assignments za tog crew member
```

### Backend implementacija template:
```typescript
// backend/src/routes/assignments.ts
import { Router } from 'express';
import { prisma } from '../services/db';
import { asyncHandler, validate } from '../middleware/error-handler';
import { z } from 'zod';

const router = Router();

// Validation schemas
const CreateAssignmentSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  shiftId: z.string().cuid(),
  crewMemberId: z.string().cuid(),
  type: z.enum(['primary', 'backup']),
  notes: z.string().optional()
});

// GET all assignments with filters
router.get('/', asyncHandler(async (req, res) => {
  const {
    date,
    shiftId,
    crewMemberId,
    type,
    startDate,
    endDate,
    includeShift
  } = req.query;

  const where: any = {};
  
  // Build where clause...
  
  const assignments = await prisma.assignment.findMany({
    where,
    include: {
      shift: includeShift === 'true',
      crewMember: true
    },
    orderBy: [
      { date: 'asc' },
      { shift: { startTime: 'asc' } }
    ]
  });
  
  res.json({ success: true, data: assignments });
}));

export default router;
```

---

## 📌 SEGMENT 2: REACT QUERY HOOKS

### Hook struktura:
```typescript
// src/hooks/useAssignments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

const QUERY_KEY = ['assignments'];

export function useAssignments(params?: AssignmentQueryParams) {
  return useQuery({
    queryKey: [...QUERY_KEY, params],
    queryFn: () => api.assignments.getAll(params),
    staleTime: 1000 * 60 * 5, // 5 minuta
  });
}

export function useCreateBulkAssignments() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (assignments: CreateAssignmentDTO[]) => 
      api.assignments.createBulk(assignments),
    onSuccess: (data) => {
      // Invalidate sve relevantne queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      
      // Optimistic update za duty roster
      const uniqueDates = [...new Set(data.created.map(a => a.date))];
      uniqueDates.forEach(date => {
        queryClient.invalidateQueries({ 
          queryKey: [...QUERY_KEY, { date }] 
        });
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save assignments');
    }
  });
}
```

### Optimistic Updates Pattern:
```typescript
export function useUpdateAssignment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => api.assignments.update(id, data),
    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      
      // Snapshot previous value
      const previousAssignments = queryClient.getQueryData(QUERY_KEY);
      
      // Optimistically update
      queryClient.setQueryData(QUERY_KEY, (old: any) => {
        return old?.map(item => 
          item.id === id ? { ...item, ...data } : item
        );
      });
      
      return { previousAssignments };
    },
    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previousAssignments) {
        queryClient.setQueryData(QUERY_KEY, context.previousAssignments);
      }
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    }
  });
}
```

---

## 📌 SEGMENT 3: WEBSOCKET INTEGRATION

### WebSocket Events:
```typescript
// Backend events (već implementirani):
websocketService.emitAssignmentCreated(assignment);
websocketService.emitAssignmentUpdated(assignment);
websocketService.emitAssignmentDeleted(assignmentId);

// Frontend listeners:
useEffect(() => {
  const ws = websocketService.connect();
  
  ws.on('assignment:created', (assignment) => {
    // Invalidate samo relevantni datum
    queryClient.invalidateQueries({
      queryKey: ['assignments', { date: assignment.date }]
    });
  });
  
  ws.on('assignment:updated', (assignment) => {
    // Direktni update u cache
    queryClient.setQueryData(['assignments'], (old: any) => {
      if (!old) return old;
      return old.map(item => 
        item.id === assignment.id ? assignment : item
      );
    });
  });
  
  ws.on('assignment:deleted', (assignmentId) => {
    // Ukloni iz cache
    queryClient.setQueryData(['assignments'], (old: any) => {
      if (!old) return old;
      return old.filter(item => item.id !== assignmentId);
    });
  });
  
  return () => ws.disconnect();
}, [queryClient]);
```

---

## 📌 SEGMENT 4: CONTEXT SPLITTING

### GuestsContext.tsx struktura:
```typescript
// src/contexts/GuestsContext.tsx
import React, { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { websocketService } from '../services/websocket';

interface GuestsContextType {
  guests: Guest[];
  isLoading: boolean;
  error: Error | null;
  createGuest: (data: CreateGuestDTO) => Promise<void>;
  updateGuest: (id: string, data: UpdateGuestDTO) => Promise<void>;
  deleteGuest: (id: string) => Promise<void>;
}

const GuestsContext = createContext<GuestsContextType | null>(null);

export function GuestsProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  
  // Query
  const { data: guests = [], isLoading, error } = useQuery({
    queryKey: ['guests'],
    queryFn: api.guests.getAll,
  });
  
  // Mutations
  const createMutation = useMutation({
    mutationFn: api.guests.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    }
  });
  
  // WebSocket
  useEffect(() => {
    const ws = websocketService.connect();
    
    ws.on('guest:created', () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    });
    
    ws.on('guest:updated', (guest) => {
      queryClient.setQueryData(['guests'], (old: any) => {
        if (!old) return old;
        return old.map(item => 
          item.id === guest.id ? guest : item
        );
      });
    });
    
    return () => ws.disconnect();
  }, [queryClient]);
  
  const value: GuestsContextType = {
    guests,
    isLoading,
    error,
    createGuest: createMutation.mutateAsync,
    updateGuest: updateMutation.mutateAsync,
    deleteGuest: deleteMutation.mutateAsync,
  };
  
  return (
    <GuestsContext.Provider value={value}>
      {children}
    </GuestsContext.Provider>
  );
}

export function useGuests() {
  const context = useContext(GuestsContext);
  if (!context) {
    throw new Error('useGuests must be used within GuestsProvider');
  }
  return context;
}
```

---

## 📌 SEGMENT 5: MIGRACIJA KOMPONENTI

### Pre migracije - provera:
```typescript
// PROVERI PRE MENJANJA:
// 1. Da li komponenta već koristi React Query?
grep -n "useQuery\|useMutation" src/components/pages/guest-list.tsx

// 2. Da li koristi AppDataContext?
grep -n "useAppData" src/components/pages/guest-list.tsx

// 3. Da li ima localStorage?
grep -n "localStorage" src/components/pages/guest-list.tsx
```

### Migracija pattern:
```typescript
// STARO (AppDataContext):
const { guests, addGuest, updateGuest } = useAppData();

// NOVO (React Query):
const { data: guests = [], isLoading } = useGuests();
const createGuestMutation = useCreateGuest();
const updateGuestMutation = useUpdateGuest();

// Handler funkcije:
const handleAddGuest = async (formData) => {
  try {
    await createGuestMutation.mutateAsync(formData);
    // Success toast je u mutation hook
  } catch (error) {
    // Error toast je u mutation hook
  }
};
```

---

## 📌 SEGMENT 6: ERROR HANDLING

### Error Boundary:
```typescript
// src/components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';
import { Button } from './ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
          >
            Reload page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Korišćenje:
<ErrorBoundary>
  <CrewManagementPage />
</ErrorBoundary>
```

---

## 📌 VALIDACIJA I TESTIRANJE

### Test checklist za svaki segment:

1. **API Test (Postman/curl):**
```bash
# Primer za assignments
curl -X GET "http://localhost:8080/api/assignments?date=2025-01-15&includeShift=true" \
  -H "Authorization: Bearer $TOKEN" \
  | jq .
```

2. **React Query DevTools provera:**
- Otvoriti DevTools (floating ikonica)
- Proveriti da query ima status "fresh" nakon fetch
- Proveriti da mutation triggeruje invalidation

3. **Multi-tab sync test:**
- Otvoriti aplikaciju u 2 taba
- Napraviti promenu u jednom
- Drugi tab treba automatski da se ažurira

4. **WebSocket reconnection test:**
- Ugasiti backend
- Pokrenuti ponovo
- Frontend treba automatski da se reconnect

5. **Error handling test:**
- Simulirati network grešku (offline mode)
- Proveriti da se prikaže error state
- Proveriti da retry radi

---

## ⚠️ OBAVEZNA PRAVILA

1. **NE MENJAJ ŠTO RADI:**
   - crew-list.tsx ✅
   - crew-management.tsx ✅
   - useCrewMembers.ts ✅

2. **PRVO BACKEND, PA FRONTEND:**
   - API endpoint mora da radi pre UI implementacije
   - Testiraj sa Postman pre pisanja hook-a

3. **JEDAN PO JEDAN:**
   - Ne refaktoriši ceo AppDataContext odjednom
   - Migriraj komponentu po komponentu

4. **TESTIRAJ POSLE SVAKE PROMENE:**
   - npm run dev (oba projekta)
   - Proveri console za greške
   - Proveri Network tab za API pozive

---

**Poslednja izmena:** 1. Novembar 2025