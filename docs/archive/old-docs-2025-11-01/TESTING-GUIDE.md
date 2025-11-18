# OBEDIO Testing Guide 🧪

Comprehensive testing scenarios and test cases for OBEDIO yacht crew management system.

---

## Table of Contents

1. [Manual Testing Scenarios](#manual-testing-scenarios)
2. [Automated Testing](#automated-testing)
3. [Performance Testing](#performance-testing)
4. [Security Testing](#security-testing)
5. [Test Data](#test-data)

---

## Manual Testing Scenarios

### 1. User Authentication & Authorization

#### Test Case 1.1: Admin Login
**Preconditions:** Admin user exists in database
**Steps:**
1. Navigate to application URL
2. Enter username: `admin`
3. Enter password: `admin123` (or updated password)
4. Click "Login" button

**Expected Results:**
- ✅ User is redirected to Dashboard
- ✅ User role displayed: "Admin"
- ✅ All menu items visible
- ✅ JWT token stored in localStorage

**Test Data:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

#### Test Case 1.2: Invalid Login
**Steps:**
1. Navigate to login page
2. Enter username: `admin`
3. Enter password: `wrongpassword`
4. Click "Login"

**Expected Results:**
- ❌ Error message displayed: "Invalid credentials"
- ❌ User remains on login page
- ❌ No token stored

#### Test Case 1.3: Role-Based Access Control
**Steps:**
1. Login as `stewardess` user
2. Try to access Device Manager
3. Try to access Settings page

**Expected Results:**
- ✅ Stewardess can view Service Requests
- ✅ Stewardess can view Guests
- ❌ Stewardess CANNOT access Device Manager
- ❌ Stewardess CANNOT modify Settings

---

### 2. Service Request Flow

#### Test Case 2.1: Create Service Request
**Preconditions:**
- User logged in as Admin or Chief Stewardess
- Guest exists with assigned cabin

**Steps:**
1. Navigate to Service Requests page
2. Click "Simulate Button Press" in Button Simulator widget
3. Select a cabin (e.g., "Master Suite")
4. Click "Send Call Button Press"

**Expected Results:**
- ✅ New service request appears in "Pending" section
- ✅ Request shows correct guest name and cabin
- ✅ Timestamp is current
- ✅ Audio notification plays (if enabled)
- ✅ Real-time update via WebSocket

**Test Data:**
```json
{
  "locationId": "master-suite",
  "guestId": "guest-1",
  "priority": "normal",
  "type": "call"
}
```

#### Test Case 2.2: Accept Service Request
**Preconditions:** Pending service request exists

**Steps:**
1. Click on pending request card
2. In dialog, click "Accept" button
3. Verify request moves to "Serving Now"

**Expected Results:**
- ✅ Request status changes to "accepted"
- ✅ Request shows assigned crew member name
- ✅ Request moves to "Serving Now" section
- ✅ Timer starts counting
- ✅ Other users see real-time update

#### Test Case 2.3: Delegate Service Request
**Preconditions:** Accepted service request exists

**Steps:**
1. Click on accepted request
2. Click "Delegate" button
3. Select different crew member from dropdown
4. Confirm delegation

**Expected Results:**
- ✅ Request status changes to "delegated"
- ✅ Assigned crew member updated
- ✅ Delegated crew member receives notification

#### Test Case 2.4: Complete Service Request
**Preconditions:** Accepted service request exists

**Steps:**
1. Click on accepted request
2. Click "Complete" button
3. Optionally add notes
4. Confirm completion

**Expected Results:**
- ✅ Request status changes to "completed"
- ✅ Completion timestamp recorded
- ✅ Request appears in "Recently Completed" for configured timeout
- ✅ Request added to history
- ✅ Service duration calculated

#### Test Case 2.5: Emergency Request Priority
**Steps:**
1. Simulate emergency button press
2. Verify priority handling

**Expected Results:**
- ✅ Emergency request appears at top of list
- ✅ Red/urgent styling applied
- ✅ Urgent audio notification plays
- ✅ All crew members notified

---

### 3. Guest Management

#### Test Case 3.1: Add New Guest
**Preconditions:** User has guest management permissions

**Steps:**
1. Navigate to Guests page
2. Click "Add Guest" button
3. Fill in guest details:
   - First Name: John
   - Last Name: Doe
   - Cabin: Master Suite
   - Check-in: Today
   - Check-out: +7 days
4. Click "Save"

**Expected Results:**
- ✅ Guest appears in guest list
- ✅ Guest assigned to correct cabin
- ✅ Guest card shows all details
- ✅ Database record created

**Test Data:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "type": "owner",
  "status": "checked-in",
  "locationId": "master-suite",
  "checkInDate": "2025-01-24",
  "checkOutDate": "2025-01-31",
  "nationality": "USA",
  "allergies": ["Shellfish"],
  "dietaryRestrictions": ["Gluten-free"]
}
```

#### Test Case 3.2: Edit Guest Information
**Steps:**
1. Click on existing guest card
2. Click "Edit" button
3. Modify dietary restrictions
4. Add medical condition
5. Click "Save"

**Expected Results:**
- ✅ Guest information updated
- ✅ Changes reflected in guest card
- ✅ `updatedAt` timestamp updated
- ✅ Changes synced across all users

#### Test Case 3.3: Enable Do Not Disturb
**Steps:**
1. Click on guest card
2. Toggle "Do Not Disturb" switch
3. Verify DND status

**Expected Results:**
- ✅ DND badge appears on guest card
- ✅ Location marked as DND
- ✅ Service requests from this cabin show DND warning

#### Test Case 3.4: Delete Guest
**Steps:**
1. Click on guest card
2. Click "Delete" button
3. Confirm deletion

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ Guest removed from list
- ✅ Cabin becomes unoccupied
- ✅ Database record soft-deleted or removed

---

### 4. Duty Roster Management

#### Test Case 4.1: View Current Shift
**Preconditions:** Shifts and assignments configured

**Steps:**
1. Navigate to Dashboard
2. View "Duty Timer" widget
3. Verify current on-duty crew

**Expected Results:**
- ✅ Current shift displayed (Morning/Afternoon/Night)
- ✅ Shift time range shown
- ✅ Time until shift end displayed
- ✅ On-duty crew members listed
- ✅ Backup crew listed

#### Test Case 4.2: Assign Crew to Shift
**Preconditions:** User is Admin or Chief Stewardess

**Steps:**
1. Navigate to Duty Roster (if page exists)
2. Select date and shift
3. Assign crew members to primary positions
4. Assign backup crew
5. Click "Save"

**Expected Results:**
- ✅ Assignments saved to database
- ✅ Crew members notified of assignment
- ✅ Calendar updated
- ✅ Conflicts detected (if any)

#### Test Case 4.3: Crew Status Change
**Steps:**
1. View current on-duty crew
2. Manually change crew status to "on-leave"
3. Verify roster updates

**Expected Results:**
- ✅ Crew removed from current shift
- ✅ Backup crew promoted (if configured)
- ✅ Status reflected in all views

---

### 5. Device Manager

#### Test Case 5.1: View Device List
**Preconditions:** User is Admin or ETO

**Steps:**
1. Navigate to Device Manager
2. View all registered devices

**Expected Results:**
- ✅ All smart buttons listed
- ✅ Device status shown (online/offline)
- ✅ Battery level displayed
- ✅ Signal strength shown
- ✅ Last seen timestamp

#### Test Case 5.2: Assign Device to Location
**Steps:**
1. Click "Add Device" button
2. Enter device details:
   - Device ID: BTN-001
   - Location: Master Suite
   - Type: Smart Button
3. Click "Save"

**Expected Results:**
- ✅ Device appears in device list
- ✅ Device linked to location
- ✅ Device status: "offline" (until first connection)

**Test Data:**
```json
{
  "deviceId": "BTN-001",
  "name": "Master Suite Button",
  "locationId": "master-suite",
  "type": "smart-button",
  "manufacturer": "Custom",
  "model": "v1.0"
}
```

#### Test Case 5.3: Device Status Update via MQTT
**Preconditions:** MQTT broker running

**Steps:**
1. Simulate MQTT message:
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "obedio/devices/BTN-001/status" \
  -m '{"status":"online","battery":85,"signal":-45}'
```
2. View device in Device Manager

**Expected Results:**
- ✅ Device status changes to "online"
- ✅ Battery level updated to 85%
- ✅ Signal strength updated
- ✅ Real-time update via WebSocket

#### Test Case 5.4: View Device Logs
**Steps:**
1. Click on device card
2. View activity logs tab
3. Check recent events

**Expected Results:**
- ✅ Connection events logged
- ✅ Button press events logged
- ✅ Battery low warnings logged
- ✅ Timestamps accurate

---

### 6. Dashboard Widgets

#### Test Case 6.1: Customize Dashboard
**Steps:**
1. Click "Manage Widgets" button
2. Uncheck "Device Health" widget
3. Check "Service Request Stats" widget
4. Click "Save"

**Expected Results:**
- ✅ Device Health widget removed
- ✅ Service Request Stats widget added
- ✅ Preferences saved to backend
- ✅ Layout persists after page reload

#### Test Case 6.2: Drag and Drop Widget
**Steps:**
1. Click and drag "Serving Now" widget
2. Drop in different position
3. Verify layout saved

**Expected Results:**
- ✅ Widget moves to new position
- ✅ Other widgets adjust layout
- ✅ New layout persists after reload

#### Test Case 6.3: Role-Based Widget Visibility
**Preconditions:** Logged in as Stewardess

**Steps:**
1. Click "Manage Widgets"
2. View available widgets

**Expected Results:**
- ✅ Only permitted widgets shown
- ✅ Device Manager widget NOT available
- ✅ Settings widget NOT available
- ✅ Service Request widgets available

---

### 7. Real-Time Updates (WebSocket)

#### Test Case 7.1: WebSocket Connection
**Steps:**
1. Login to application
2. Open browser DevTools > Network > WS
3. Verify WebSocket connection

**Expected Results:**
- ✅ WebSocket connection established
- ✅ Connection status: "Connected"
- ✅ Heartbeat messages every 30s

#### Test Case 7.2: Multi-User Real-Time Sync
**Preconditions:** Two browsers open with different users

**Steps:**
1. Browser A: Create service request
2. Browser B: Observe updates

**Expected Results:**
- ✅ Browser B sees new request instantly
- ✅ No page reload required
- ✅ Update smooth and immediate

#### Test Case 7.3: Reconnection After Network Failure
**Steps:**
1. Disconnect network
2. Wait 10 seconds
3. Reconnect network

**Expected Results:**
- ✅ App detects disconnection
- ✅ "Offline" indicator shown
- ✅ Auto-reconnect on network restore
- ✅ Data synced after reconnection

---

### 8. PWA Features

#### Test Case 8.1: Install as App
**Preconditions:** HTTPS enabled, manifest configured

**Steps:**
1. Open app in Chrome/Edge
2. Click browser "Install" prompt
3. Or click "Install App" in menu

**Expected Results:**
- ✅ Install prompt appears
- ✅ App installed to home screen
- ✅ Opens in standalone mode
- ✅ App icon shown correctly

#### Test Case 8.2: Offline Mode
**Steps:**
1. Open app while online
2. Navigate through pages
3. Go offline (disable network)
4. Try navigating to cached pages

**Expected Results:**
- ✅ Previously visited pages load from cache
- ✅ "Offline" message shown
- ✅ Offline fallback page shown for new pages
- ✅ Service worker serving cached assets

#### Test Case 8.3: Background Sync
**Steps:**
1. Go offline
2. Create service request
3. Go back online

**Expected Results:**
- ✅ Request queued while offline
- ✅ Auto-synced when online
- ✅ User notified of sync status

---

### 9. Performance & Load Testing

#### Test Case 9.1: Page Load Performance
**Tools:** Lighthouse, WebPageTest

**Steps:**
1. Open Chrome DevTools
2. Run Lighthouse audit
3. Check performance score

**Expected Results:**
- ✅ Performance score > 90
- ✅ First Contentful Paint < 1.5s
- ✅ Largest Contentful Paint < 2.5s
- ✅ Cumulative Layout Shift < 0.1
- ✅ Time to Interactive < 3s

#### Test Case 9.2: Virtual Scrolling with 1000 Items
**Steps:**
1. Navigate to page with large list
2. Scroll rapidly up and down
3. Monitor performance

**Expected Results:**
- ✅ Smooth 60fps scrolling
- ✅ Only ~20 items rendered at once
- ✅ Memory usage stable
- ✅ No lag or stuttering

#### Test Case 9.3: Concurrent Users
**Tools:** k6, JMeter

**Steps:**
1. Simulate 100 concurrent users
2. Each user performs standard workflow
3. Monitor server metrics

**Expected Results:**
- ✅ Response times < 500ms
- ✅ Error rate < 1%
- ✅ CPU usage < 80%
- ✅ Memory usage stable

---

### 10. Error Handling

#### Test Case 10.1: Network Error During Request
**Steps:**
1. Open DevTools > Network
2. Set to "Offline"
3. Try to create service request

**Expected Results:**
- ✅ Error message displayed
- ✅ Request queued for retry
- ✅ User notified of offline status

#### Test Case 10.2: Component Error Boundary
**Steps:**
1. Trigger intentional error in widget
2. Observe error boundary

**Expected Results:**
- ✅ Error boundary catches error
- ✅ Error UI shown for affected widget only
- ✅ Other widgets continue working
- ✅ "Try Again" button available

#### Test Case 10.3: API Error Response
**Steps:**
1. Send invalid data to API
2. Check error handling

**Expected Results:**
- ✅ Validation error message shown
- ✅ Field-level error indicators
- ✅ User can correct and resubmit

---

## Automated Testing

### Setup Testing Environment

```bash
# Install testing dependencies
npm install --save-dev \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  vitest \
  @vitest/ui \
  jsdom
```

### Unit Test Example

```typescript
// src/components/__tests__/ServiceRequestCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ServiceRequestCard } from '../ServiceRequestCard';

describe('ServiceRequestCard', () => {
  const mockRequest = {
    id: 'req-1',
    guestName: 'John Doe',
    guestCabin: 'Master Suite',
    status: 'pending',
    timestamp: new Date(),
    priority: 'normal',
  };

  it('renders service request details', () => {
    render(<ServiceRequestCard request={mockRequest} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Master Suite')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('calls onAccept when Accept button clicked', () => {
    const mockOnAccept = vi.fn();
    render(
      <ServiceRequestCard
        request={mockRequest}
        onAccept={mockOnAccept}
      />
    );

    const acceptButton = screen.getByRole('button', { name: /accept/i });
    fireEvent.click(acceptButton);

    expect(mockOnAccept).toHaveBeenCalledWith('req-1');
  });

  it('shows completion time for completed requests', () => {
    const completedRequest = {
      ...mockRequest,
      status: 'completed',
      completedAt: new Date(),
    };

    render(<ServiceRequestCard request={completedRequest} />);

    expect(screen.getByText(/completed/i)).toBeInTheDocument();
  });
});
```

### Integration Test Example

```typescript
// src/__tests__/integration/service-request-flow.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ServiceRequestsPage } from '../pages/service-requests';

describe('Service Request Flow', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it('completes full service request lifecycle', async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <ServiceRequestsPage />
      </QueryClientProvider>
    );

    // 1. Create request
    await user.click(screen.getByRole('button', { name: /simulate/i }));
    await user.selectOptions(screen.getByLabelText(/cabin/i), 'master-suite');
    await user.click(screen.getByRole('button', { name: /send/i }));

    // 2. Verify request appears
    await waitFor(() => {
      expect(screen.getByText(/master suite/i)).toBeInTheDocument();
    });

    // 3. Accept request
    await user.click(screen.getByRole('button', { name: /accept/i }));

    // 4. Verify status change
    await waitFor(() => {
      expect(screen.getByText(/accepted/i)).toBeInTheDocument();
    });

    // 5. Complete request
    await user.click(screen.getByRole('button', { name: /complete/i }));

    // 6. Verify completion
    await waitFor(() => {
      expect(screen.getByText(/completed/i)).toBeInTheDocument();
    });
  });
});
```

### E2E Test Example (Playwright)

```typescript
// e2e/service-request.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Service Request Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:8080');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should create and complete service request', async ({ page }) => {
    // Navigate to Service Requests
    await page.click('text=Service Requests');
    await expect(page).toHaveURL('**/service-requests');

    // Simulate button press
    await page.click('text=Simulate Button Press');
    await page.selectOption('select[name="cabin"]', 'master-suite');
    await page.click('button:has-text("Send")');

    // Wait for request to appear
    await expect(page.locator('text=Master Suite')).toBeVisible();

    // Accept request
    await page.click('button:has-text("Accept")');
    await expect(page.locator('text=Accepted')).toBeVisible();

    // Complete request
    await page.click('button:has-text("Complete")');
    await expect(page.locator('text=Completed')).toBeVisible();
  });

  test('should handle real-time updates', async ({ page, context }) => {
    // Open second tab
    const page2 = await context.newPage();
    await page2.goto('http://localhost:8080');
    await page2.fill('input[name="username"]', 'stewardess1');
    await page2.fill('input[name="password"]', 'password');
    await page2.click('button[type="submit"]');
    await page2.click('text=Service Requests');

    // Create request in first tab
    await page.click('text=Simulate Button Press');
    await page.selectOption('select[name="cabin"]', 'master-suite');
    await page.click('button:has-text("Send")');

    // Verify second tab sees update
    await expect(page2.locator('text=Master Suite')).toBeVisible({ timeout: 3000 });
  });
});
```

---

## Performance Testing

### Load Test Script (k6)

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },  // Ramp up to 50 users
    { duration: '5m', target: 50 },  // Stay at 50 users
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],   // Error rate < 1%
  },
};

const BASE_URL = 'http://localhost:3001';

export default function () {
  // Login
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, {
    username: 'admin',
    password: 'admin123',
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'has auth token': (r) => r.json('token') !== '',
  });

  const token = loginRes.json('token');
  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  // Get service requests
  const requestsRes = http.get(`${BASE_URL}/api/service-requests`, params);
  check(requestsRes, {
    'requests loaded': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 500,
  });

  // Get guests
  const guestsRes = http.get(`${BASE_URL}/api/guests`, params);
  check(guestsRes, {
    'guests loaded': (r) => r.status === 200,
  });

  sleep(1);
}
```

Run with:
```bash
k6 run load-test.js
```

---

## Security Testing

### Security Test Checklist

- [ ] **SQL Injection**
  ```bash
  # Test with malicious input
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin'\'' OR 1=1--","password":"anything"}'

  # Expected: Error, not authenticated
  ```

- [ ] **XSS (Cross-Site Scripting)**
  ```javascript
  // Try injecting script in guest name field
  firstName: '<script>alert("XSS")</script>'

  // Expected: Script tags escaped/sanitized
  ```

- [ ] **CSRF (Cross-Site Request Forgery)**
  ```bash
  # Try making request without proper headers
  curl -X POST http://localhost:3001/api/service-requests \
    -H "Authorization: Bearer [token]" \
    -d '{"locationId":"test"}'

  # Expected: Request validated
  ```

- [ ] **JWT Token Expiration**
  ```bash
  # Use expired token
  # Expected: 401 Unauthorized
  ```

- [ ] **Rate Limiting**
  ```bash
  # Send 100 requests in 1 second
  for i in {1..100}; do
    curl http://localhost:3001/api/health &
  done

  # Expected: 429 Too Many Requests after threshold
  ```

---

## Test Data

### Sample Users

```json
[
  {
    "username": "admin",
    "password": "admin123",
    "role": "admin"
  },
  {
    "username": "chief",
    "password": "chief123",
    "role": "chief-stewardess"
  },
  {
    "username": "stewardess1",
    "password": "password",
    "role": "stewardess"
  },
  {
    "username": "crew1",
    "password": "password",
    "role": "crew"
  }
]
```

### Sample Guests

```json
[
  {
    "firstName": "John",
    "lastName": "Doe",
    "type": "owner",
    "status": "checked-in",
    "locationId": "master-suite",
    "allergies": ["Shellfish", "Peanuts"],
    "dietaryRestrictions": ["Gluten-free"]
  },
  {
    "firstName": "Jane",
    "lastName": "Smith",
    "type": "charter",
    "status": "checked-in",
    "locationId": "vip-cabin-1",
    "preferences": "Vegetarian, prefers white wine"
  }
]
```

### Sample Service Requests

```json
[
  {
    "guestId": "guest-1",
    "locationId": "master-suite",
    "priority": "normal",
    "type": "call",
    "status": "pending"
  },
  {
    "guestId": "guest-2",
    "locationId": "vip-cabin-1",
    "priority": "high",
    "type": "emergency",
    "status": "pending"
  }
]
```

---

## Test Reporting

### Generate Test Report

```bash
# Run tests with coverage
npm run test -- --coverage

# Generate HTML report
npm run test -- --coverage --reporter=html

# View report
open coverage/index.html
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm test

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

**Testing is essential for production readiness!** 🎯

Make sure to run through all test scenarios before deploying to production.
