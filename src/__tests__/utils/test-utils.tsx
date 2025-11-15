/**
 * Test Utilities
 * Helper functions and wrappers for testing React components
 */

import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Test Query Client with disabled retries and shorter cache times
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });
}

// All the providers needed for testing
interface AllTheProvidersProps {
  children: ReactNode;
}

function AllTheProviders({ children }: AllTheProvidersProps) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
}

// Custom render function that includes all providers
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { renderWithProviders as render };

// Mock user data for testing
export const mockUsers = {
  admin: {
    id: 'user-1',
    username: 'admin',
    name: 'Admin User',
    role: 'admin' as const,
    email: 'admin@obedio.com',
  },
  chiefStewardess: {
    id: 'user-2',
    username: 'chief',
    name: 'Chief Stewardess',
    role: 'chief-stewardess' as const,
    email: 'chief@obedio.com',
  },
  stewardess: {
    id: 'user-3',
    username: 'stewardess1',
    name: 'Jane Stewardess',
    role: 'stewardess' as const,
    email: 'stewardess@obedio.com',
  },
  crew: {
    id: 'user-4',
    username: 'crew1',
    name: 'John Crew',
    role: 'crew' as const,
    email: 'crew@obedio.com',
  },
};

// Mock service request data
export const mockServiceRequest = {
  id: 'req-1',
  guestName: 'John Doe',
  guestCabin: 'Master Suite',
  cabinId: 'master-suite',
  requestType: 'call' as const,
  priority: 'normal' as const,
  timestamp: new Date('2025-01-24T10:00:00'),
  status: 'pending' as const,
};

// Mock guest data
export const mockGuest = {
  id: 'guest-1',
  firstName: 'John',
  lastName: 'Doe',
  type: 'owner' as const,
  status: 'checked-in' as const,
  locationId: 'master-suite',
  checkInDate: '2025-01-24',
  checkOutDate: '2025-01-31',
  allergies: ['Shellfish'],
  dietaryRestrictions: ['Gluten-free'],
  doNotDisturb: false,
  createdAt: '2025-01-24T09:00:00',
  updatedAt: '2025-01-24T09:00:00',
  createdBy: 'admin',
};

// Mock crew member data
export const mockCrewMember = {
  id: 'crew-1',
  name: 'Jane Smith',
  position: 'Stewardess',
  department: 'Interior',
  role: 'stewardess' as const,
  status: 'on-duty' as const,
  shift: '08:00 - 20:00',
  contact: '+1 555 0100',
  email: 'jane.smith@yacht.com',
  joinDate: '2023-01-15',
  nickname: 'Jane',
};

// Mock device data
export const mockDevice = {
  id: 'device-1',
  deviceId: 'BTN-001',
  name: 'Master Suite Button',
  locationId: 'master-suite',
  type: 'smart-button' as const,
  status: 'online' as const,
  batteryLevel: 85,
  signalStrength: -45,
  lastSeen: new Date('2025-01-24T10:00:00'),
};

// Helper to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Helper to create mock API response
export function createMockApiResponse<T>(data: T, delay = 0) {
  return new Promise<T>(resolve => {
    setTimeout(() => resolve(data), delay);
  });
}

// Helper to create mock API error
export function createMockApiError(message: string, statusCode = 500) {
  return Promise.reject({
    message,
    statusCode,
    response: {
      data: { message },
    },
  });
}
