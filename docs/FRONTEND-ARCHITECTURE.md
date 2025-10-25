# 🎨 Frontend Architecture

**Technology:** React 18 + TypeScript + Vite + Tailwind CSS  
**Location:** `/src` folder

---

## 📋 Overview

The frontend is an **admin-only web application** for yacht crew management. It's built with modern React patterns and designed for desktop browsers.

**Key Users:**
- Captain (full admin access)
- Chief Stewardess (crew + guest management)
- ETO (device management)

---

## 🏗️ Architecture Pattern

```
Components (UI Layer)
    ↓
Hooks (Data Layer)
    ↓
Services (API Layer)
    ↓
Backend API
```

### Component Layer
- React components with TypeScript
- Radix UI primitives + shadcn/ui patterns
- Tailwind CSS for styling

### Data Layer
- **React Query** for server state
- **React Context** for auth + global UI state
- Custom hooks for business logic

### API Layer
- Axios HTTP client
- JWT token injection
- Error handling

---

## 📁 Folder Structure

```
src/
├── components/
│   ├── pages/              # Full page components
│   │   ├── dashboard.tsx
│   │   ├── crew-management.tsx
│   │   ├── guests-list.tsx
│   │   ├── locations.tsx
│   │   └── device-manager.tsx
│   ├── ui/                 # Reusable UI components
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── card.tsx
│   │   └── ...
│   └── *.tsx               # Feature components
│
├── hooks/                  # Custom React hooks
│   ├── useCrewMembers.ts   # Crew data
│   ├── useGuests.ts        # Guest data
│   ├── useLocations.ts     # Locations
│   └── useServiceRequestsApi.ts
│
├── services/               # API clients
│   ├── api.ts              # Axios instance
│   ├── crew.ts             # Crew API
│   ├── guests.ts           # Guest API
│   └── locations.ts        # Location API
│
├── contexts/               # React contexts
│   ├── AuthContext.tsx     # Authentication state
│   └── AppDataContext.tsx  # Global app state
│
├── types/                  # TypeScript definitions
│   ├── crew.ts
│   ├── guest.ts
│   ├── location.ts
│   └── service-request.ts
│
├── config/                 # Configuration
│   └── permissions.ts      # Role permissions
│
└── App.tsx                 # Root component
```

---

## 🔐 Authentication Flow

### Login Process
1. User enters username/password
2. Frontend calls `POST /api/auth/login`
3. Backend returns JWT token + user data
4. Frontend stores token in localStorage
5. Frontend redirects to dashboard

### Protected Routes
```typescript
// src/components/ProtectedRoute.tsx
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

Checks:
- Is token present?
- Is token valid?
- Does user have required permission?

---

## 🎣 Data Fetching Pattern

### React Query Hooks

```typescript
// src/hooks/useGuests.ts
export function useGuests(filters) {
  return useQuery({
    queryKey: ['guests', filters],
    queryFn: () => guestsService.getAll(filters),
    staleTime: 60000,
    refetchOnWindowFocus: false
  });
}
```

**Benefits:**
- Automatic caching
- Background refetching
- Loading/error states
- Optimistic updates

---

## 🔄 Real-Time Updates

### WebSocket Integration

```typescript
// src/services/api.ts
const socket = io('http://localhost:3001');

socket.on('service-request:new', (data) => {
  queryClient.invalidateQueries(['service-requests']);
});
```

**Events:**
- `service-request:new` → New request created
- `service-request:updated` → Status changed
- `dnd:updated` → DND status toggled
- `crew:status-changed` → Crew status updated

---

## 🎯 Key Pages

### 1. Dashboard (`dashboard.tsx`)
- Real-time KPIs
- Service request feed
- Weather widget
- Draggable widget grid

### 2. Crew Management (`crew-management.tsx`)
- Crew list with avatars
- Duty roster
- Status indicators
- Create/edit crew members

### 3. Guests (`guests-list.tsx`)
- Guest profiles
- Location assignment
- DND status
- Service request history

### 4. Locations (`locations.tsx`)
- Yacht areas/cabins
- DND toggle
- Guest-to-location mapping
- Smart button assignments

### 5. Device Manager (`device-manager.tsx`)
- ESP32 button registry
- Battery monitoring
- Signal strength (RSSI)
- Firmware versions

---

## 🎨 UI Component Library

### Base: Radix UI
Accessible primitives for:
- Dialog, Dropdown, Popover
- Switch, Checkbox, Radio
- Tabs, Accordion, Tooltip

### Styling: Tailwind CSS v4
- Utility-first CSS
- Custom design system
- Dark mode ready

### Icons: Lucide React
- 1000+ icons
- Tree-shakeable
- Consistent style

---

## 📊 State Management

### Server State (React Query)
- Crew members
- Guests
- Locations
- Service requests
- Devices

### Local State (React Context)
- Authentication (user, token)
- Dashboard layout
- UI preferences
- Theme

### Component State (useState)
- Form inputs
- Modals open/closed
- Selected items

---

## 🔧 Development Tools

### Dev Server
```bash
npm run dev
# Runs on http://localhost:3000
```

### Build
```bash
npm run build
# Output: /dist folder
```

### Type Checking
TypeScript strict mode enabled for:
- Type safety
- Autocomplete
- Refactoring confidence

---

## 📝 Code Conventions

### Component Pattern
```typescript
export function MyComponent({ prop }: Props) {
  const { data, isLoading } = useMyData();
  
  if (isLoading) return <Skeleton />;
  
  return <div>{data.map(...)}</div>;
}
```

### Hook Pattern
```typescript
export function useMyHook() {
  const query = useQuery(...);
  const mutation = useMutation(...);
  
  return { ...query, mutate: mutation.mutate };
}
```

---

**Next:** See BACKEND-ARCHITECTURE.md for API server details.
