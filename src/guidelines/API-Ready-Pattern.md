# API-Ready Pattern Guidelines

Ovaj dokument pokazuje kako refaktorisati postojeće mock data komponente u production-ready API integration.

## 📋 Pattern Overview

```
┌─────────────────────────────────────────────────────┐
│                 Component Layer                      │
│  - Pure UI logic                                     │
│  - Uses custom hooks                                 │
│  - No direct API calls                               │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│                  Hooks Layer                         │
│  - Custom hooks (useLocations, useGuests, etc.)     │
│  - TanStack Query (useQuery, useMutation)           │
│  - Cache management                                  │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│                 Service Layer                        │
│  - API calls via lib/api.ts                         │
│  - Zod validation                                    │
│  - Error handling                                    │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│                 Domain Layer                         │
│  - Zod schemas                                       │
│  - TypeScript types                                  │
│  - Business logic                                    │
└─────────────────────────────────────────────────────┘
```

---

## 🏗️ File Structure

```
src/
├── domain/
│   ├── crew.ts           # Zod schemas + types
│   ├── guests.ts
│   ├── locations.ts
│   ├── devices.ts
│   └── service-requests.ts
│
├── services/
│   ├── crew.ts           # API calls + validation
│   ├── guests.ts
│   ├── locations.ts
│   ├── devices.ts
│   └── service-requests.ts
│
├── hooks/
│   ├── useCrew.ts        # TanStack Query hooks
│   ├── useGuests.ts
│   ├── useLocations.ts
│   ├── useDevices.ts
│   └── useServiceRequests.ts
│
├── lib/
│   └── api.ts            # Base fetch wrapper
│
├── mocks/
│   ├── browser.ts        # MSW setup
│   └── handlers/
│       ├── crew.ts
│       ├── guests.ts
│       └── locations.ts
│
└── components/
    └── pages/
        └── locations.tsx  # Clean component using hooks
```

---

## 📝 Example Implementation

### 1. Domain Layer - Zod Schemas

**src/domain/service-requests.ts**
```typescript
import { z } from "zod";

export const ServiceRequestSchema = z.object({
  id: z.string(),
  guestName: z.string(),
  guestCabin: z.string(),
  cabinId: z.string(),
  requestType: z.enum(['call', 'service', 'emergency', 'voice', 'dnd', 'lights', 'prepare_food', 'bring_drinks']),
  priority: z.enum(['normal', 'urgent', 'emergency']),
  timestamp: z.string().datetime(),
  voiceTranscript: z.string().optional(),
  voiceAudioUrl: z.string().url().optional(),
  cabinImage: z.string().url().optional(),
  status: z.enum(['pending', 'accepted', 'completed', 'delegated', 'forwarded']),
  assignedTo: z.string().optional(),
  forwardedToTeam: z.string().optional(),
  acceptedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  forwardedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export type ServiceRequest = z.infer<typeof ServiceRequestSchema>;

export const ServiceRequestListResponseSchema = z.object({
  items: z.array(ServiceRequestSchema),
  total: z.number().int().nonnegative(),
});

export type ServiceRequestListResponse = z.infer<typeof ServiceRequestListResponseSchema>;
```

---

### 2. Service Layer - API Calls

**src/services/service-requests.ts**
```typescript
import { api } from "../lib/api";
import {
  ServiceRequestListResponseSchema,
  ServiceRequestSchema,
} from "../domain/service-requests";

export interface ServiceRequestsQuery {
  status?: 'pending' | 'accepted' | 'all';
  priority?: 'normal' | 'urgent' | 'emergency' | 'all';
  limit?: number;
  offset?: number;
}

function qs(params: Record<string, unknown>) {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "" && v !== "all"
  );
  return entries.length 
    ? "?" + new URLSearchParams(entries as any).toString() 
    : "";
}

export const ServiceRequestsService = {
  list: async (params: ServiceRequestsQuery) => {
    const res = await api.get<unknown>(`/service-requests${qs(params)}`);
    const parsed = ServiceRequestListResponseSchema.safeParse(res);
    if (!parsed.success) {
      throw new Error("Invalid /service-requests response");
    }
    return parsed.data;
  },

  accept: async (requestId: string, crewMemberName: string) => {
    const res = await api.post<unknown>(`/service-requests/${requestId}/accept`, {
      crewMemberName,
    });
    const parsed = ServiceRequestSchema.safeParse(res);
    if (!parsed.success) {
      throw new Error("Invalid accept response");
    }
    return parsed.data;
  },

  forward: async (requestId: string, toTeam: string) => {
    const res = await api.post<unknown>(`/service-requests/${requestId}/forward`, {
      toTeam,
    });
    const parsed = ServiceRequestSchema.safeParse(res);
    if (!parsed.success) {
      throw new Error("Invalid forward response");
    }
    return parsed.data;
  },

  complete: async (requestId: string) => {
    const res = await api.post<unknown>(`/service-requests/${requestId}/complete`, {});
    const parsed = ServiceRequestSchema.safeParse(res);
    if (!parsed.success) {
      throw new Error("Invalid complete response");
    }
    return parsed.data;
  },
};
```

---

### 3. Hooks Layer - TanStack Query

**src/hooks/useServiceRequests.ts**
```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ServiceRequestsService } from "../services/service-requests";
import type { ServiceRequestsQuery } from "../services/service-requests";
import { toast } from "sonner";

export function useServiceRequests(params: ServiceRequestsQuery) {
  return useQuery({
    queryKey: ["service-requests", params],
    queryFn: () => ServiceRequestsService.list(params),
    refetchInterval: 5000, // Auto-refresh every 5s
    keepPreviousData: true,
  });
}

export function useAcceptServiceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, crewMemberName }: { 
      requestId: string; 
      crewMemberName: string;
    }) => ServiceRequestsService.accept(requestId, crewMemberName),
    onSuccess: (data) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      toast.success(`Request from ${data.guestName} accepted`);
    },
    onError: (error) => {
      toast.error(`Failed to accept request: ${error}`);
    },
  });
}

export function useForwardServiceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, toTeam }: { 
      requestId: string; 
      toTeam: string;
    }) => ServiceRequestsService.forward(requestId, toTeam),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      toast.success(`Request forwarded to ${data.forwardedToTeam}`);
    },
    onError: (error) => {
      toast.error(`Failed to forward request: ${error}`);
    },
  });
}

export function useCompleteServiceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => 
      ServiceRequestsService.complete(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      toast.success("Request marked as completed");
    },
    onError: (error) => {
      toast.error(`Failed to complete request: ${error}`);
    },
  });
}
```

---

### 4. Component Layer - Clean UI

**src/components/pages/service-requests.tsx**
```typescript
import { useServiceRequests, useAcceptServiceRequest } from "../../hooks/useServiceRequests";

export function ServiceRequestsPage() {
  const [statusFilter, setStatusFilter] = useState<'pending' | 'accepted' | 'all'>('pending');
  const [priorityFilter, setPriorityFilter] = useState<'normal' | 'urgent' | 'emergency' | 'all'>('all');

  // Use hooks instead of context
  const { 
    data, 
    isLoading, 
    error 
  } = useServiceRequests({ 
    status: statusFilter, 
    priority: priorityFilter 
  });

  const acceptMutation = useAcceptServiceRequest();

  const handleAccept = (requestId: string) => {
    acceptMutation.mutate({ 
      requestId, 
      crewMemberName: 'Maria Lopez' // From auth context in production
    });
  };

  if (error) return <div>Error: {error.message}</div>;

  const requests = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div>
      {/* UI using `requests` array */}
      {requests.map(request => (
        <ServiceRequestCard 
          key={request.id} 
          request={request}
          onAccept={() => handleAccept(request.id)}
          isAccepting={acceptMutation.isLoading}
        />
      ))}
    </div>
  );
}
```

---

### 5. MSW Mock Handlers (Development)

**src/mocks/handlers/service-requests.ts**
```typescript
import { http, HttpResponse } from "msw";

const MOCK_REQUESTS = [
  {
    id: "req-1",
    guestName: "Mr. Anderson",
    guestCabin: "Master Suite",
    cabinId: "M01",
    requestType: "call",
    priority: "normal",
    timestamp: new Date().toISOString(),
    voiceTranscript: "Champagne to sun deck please",
    status: "pending",
  },
  // ... more mock data
];

export const serviceRequestHandlers = [
  // List requests
  http.get("/api/service-requests", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const priority = url.searchParams.get("priority");

    let filtered = MOCK_REQUESTS;
    if (status && status !== "all") {
      filtered = filtered.filter(r => r.status === status);
    }
    if (priority && priority !== "all") {
      filtered = filtered.filter(r => r.priority === priority);
    }

    return HttpResponse.json({
      items: filtered,
      total: filtered.length,
    });
  }),

  // Accept request
  http.post("/api/service-requests/:id/accept", async ({ params, request }) => {
    const id = String(params.id);
    const body = await request.json();
    
    const req = MOCK_REQUESTS.find(r => r.id === id);
    if (!req) {
      return HttpResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Update mock data
    Object.assign(req, {
      status: "accepted",
      assignedTo: body.crewMemberName,
      acceptedAt: new Date().toISOString(),
    });

    return HttpResponse.json(req);
  }),

  // Forward request
  http.post("/api/service-requests/:id/forward", async ({ params, request }) => {
    const id = String(params.id);
    const body = await request.json();
    
    const req = MOCK_REQUESTS.find(r => r.id === id);
    if (!req) {
      return HttpResponse.json({ error: "Not found" }, { status: 404 });
    }

    Object.assign(req, {
      status: "forwarded",
      forwardedToTeam: body.toTeam,
      forwardedAt: new Date().toISOString(),
    });

    return HttpResponse.json(req);
  }),
];
```

---

## 🚀 Migration Steps

### Current State (Context-based)
```typescript
// ❌ OLD - All in context
const { serviceRequests } = useAppData();
```

### Future State (API-ready)
```typescript
// ✅ NEW - Hooks with real API
const { data } = useServiceRequests({ status: 'pending' });
```

---

## 📦 Required Dependencies

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.x",
    "zod": "^3.x"
  },
  "devDependencies": {
    "msw": "^2.x"
  }
}
```

---

## 🔧 Setup TanStack Query

**src/main.tsx**
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
```

---

## 🎯 Benefits

### ✅ Separation of Concerns
- **Components**: Only UI logic
- **Hooks**: Data fetching & mutations
- **Services**: API communication
- **Domain**: Type definitions

### ✅ Type Safety
- Zod validates API responses at runtime
- TypeScript catches errors at compile time
- No silent failures

### ✅ Caching & Performance
- TanStack Query handles caching
- Automatic background refetching
- Optimistic updates

### ✅ Developer Experience
- MSW mocks for development
- No backend needed during UI development
- Easy to test

### ✅ Production Ready
- Clean API layer
- Error handling built-in
- Easy to add authentication
- Scalable architecture

---

## 🔄 Gradual Migration

You can migrate gradually:

1. **Phase 1**: Add Zod schemas to `domain/`
2. **Phase 2**: Create service layer with API calls
3. **Phase 3**: Add TanStack Query hooks
4. **Phase 4**: Refactor components to use hooks
5. **Phase 5**: Remove AppDataContext (optional)

Current `AppDataContext` can coexist with API hooks during migration!

---

## 📚 Resources

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Zod Documentation](https://zod.dev/)
- [MSW Documentation](https://mswjs.io/)
- [API Pattern Best Practices](https://kentcdodds.com/blog/application-state-management-with-react)

---

**NOTE**: Trenutno koristimo `AppDataContext` sa mock data generatorima. Ovaj pattern je spreman za kada backend bude ready! 🚀
