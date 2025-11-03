# Testing Documentation 🧪

Quick start guide for running tests in the OBEDIO project.

---

## Quick Start

```bash
# Install all dependencies (including test dependencies)
npm install

# Install Playwright browsers (first time only)
npx playwright install

# Run all tests
npm run test:all
```

---

## Test Types

### 1. Unit Tests (Vitest)

Test individual components and functions in isolation.

```bash
# Run unit tests in watch mode
npm test

# Run tests once
npm run test:run

# Run with UI
npm run test:ui

# Run with coverage report
npm run test:coverage
```

**Example test file locations:**
- `src/components/__tests__/*.test.tsx` - Component tests
- `src/hooks/__tests__/*.test.ts` - Hook tests
- `src/utils/__tests__/*.test.ts` - Utility tests

### 2. E2E Tests (Playwright)

Test complete user workflows in real browser.

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (recommended for development)
npm run test:e2e:ui

# Run in debug mode
npm run test:e2e:debug

# Run specific test file
npx playwright test e2e/service-request-flow.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Run on specific browser
npx playwright test --project=chromium
```

**Test file locations:**
- `e2e/*.spec.ts` - End-to-end test scenarios

---

## Test Dependencies

### Required Packages

```bash
# Unit/Integration Testing
npm install --save-dev \
  vitest \
  @vitest/ui \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jsdom

# E2E Testing
npm install --save-dev \
  @playwright/test

# Install Playwright browsers
npx playwright install
```

---

## Writing Tests

### Unit Test Example

```typescript
// src/components/__tests__/my-component.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from '../my-component';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('handles button click', () => {
    const handleClick = vi.fn();
    render(<MyComponent onClick={handleClick} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalled();
  });
});
```

### E2E Test Example

```typescript
// e2e/my-feature.spec.ts
import { test, expect } from '@playwright/test';

test('user can complete workflow', async ({ page }) => {
  // Navigate
  await page.goto('/');

  // Login
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');

  // Verify
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByText('Welcome')).toBeVisible();
});
```

---

## Test Utilities

### Test Helpers

Located in `src/__tests__/utils/test-utils.tsx`:

```typescript
import { render, mockUsers, mockServiceRequest } from '../../__tests__/utils/test-utils';

// Render component with all providers
render(<MyComponent />);

// Use mock data
const request = mockServiceRequest;
const admin = mockUsers.admin;
```

---

## Running Specific Tests

### Unit Tests

```bash
# Run tests matching pattern
npm test -- service-request

# Run specific file
npm test -- src/components/__tests__/dashboard-grid.test.tsx

# Run in watch mode for specific file
npm test -- dashboard-grid --watch
```

### E2E Tests

```bash
# Run specific spec file
npx playwright test service-request-flow

# Run specific test by name
npx playwright test -g "complete service request"

# Run only failed tests
npx playwright test --last-failed
```

---

## Test Coverage

```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/index.html
```

**Coverage Goals:**
- Statements: > 70%
- Branches: > 70%
- Functions: > 70%
- Lines: > 70%

---

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - run: npm ci
      - run: npm run test:run
      - run: npm run test:coverage

      - uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e

      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Debugging Tests

### Unit Tests

```bash
# Run with debugging
npm test -- --inspect-brk

# Use console.log in tests
console.log(screen.debug());
```

### E2E Tests

```bash
# Debug mode (pause on error)
npm run test:e2e:debug

# Headed mode (see browser)
npx playwright test --headed

# Slow motion
npx playwright test --headed --slow-mo=1000

# Trace viewer
npx playwright show-trace trace.zip
```

---

## Best Practices

### Unit Tests

1. **Test behavior, not implementation**
   ```typescript
   // Good
   expect(button).toHaveTextContent('Submit');

   // Bad
   expect(component.state.buttonText).toBe('Submit');
   ```

2. **Use semantic queries**
   ```typescript
   // Good
   screen.getByRole('button', { name: /submit/i });

   // Bad
   screen.getByTestId('submit-btn');
   ```

3. **Test user interactions**
   ```typescript
   const user = userEvent.setup();
   await user.click(button);
   await user.type(input, 'text');
   ```

### E2E Tests

1. **Use realistic user flows**
   - Login → Navigate → Action → Verify

2. **Wait for elements properly**
   ```typescript
   await expect(page.getByText('Success')).toBeVisible();
   ```

3. **Avoid hard-coded waits**
   ```typescript
   // Bad
   await page.waitForTimeout(5000);

   // Good
   await page.waitForURL(/dashboard/);
   ```

4. **Use page object pattern for complex pages**

---

## Troubleshooting

### Common Issues

#### Tests fail with "Cannot find module"
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Playwright browsers not installed
```bash
npx playwright install
```

#### Tests timeout
```bash
# Increase timeout in config
timeout: 60000 // 60 seconds
```

#### Port already in use
```bash
# Kill process on port 8080
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8080 | xargs kill
```

---

## Test Reports

### Vitest HTML Report

```bash
npm run test:coverage
open coverage/index.html
```

### Playwright HTML Report

```bash
npm run test:e2e
npx playwright show-report
```

---

## Performance Testing

```bash
# Load testing with k6
k6 run load-test.js

# Lighthouse performance audit
npm run build
npx serve -s dist
npx lighthouse http://localhost:3000 --view
```

---

## Test Data

### Mock Users

```typescript
{
  admin: { username: 'admin', password: 'admin123', role: 'admin' },
  chief: { username: 'chief', password: 'chief123', role: 'chief-stewardess' },
  stewardess: { username: 'stewardess1', password: 'password', role: 'stewardess' },
  crew: { username: 'crew1', password: 'password', role: 'crew' }
}
```

### Test Database

For E2E tests, use separate test database:

```bash
# Set environment variable
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/obedio_test

# Reset test database before tests
npm run test:db:reset
```

---

## Further Reading

- **Vitest**: https://vitest.dev/
- **Testing Library**: https://testing-library.com/
- **Playwright**: https://playwright.dev/
- **Test Best Practices**: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library

---

**Happy Testing!** 🎉
