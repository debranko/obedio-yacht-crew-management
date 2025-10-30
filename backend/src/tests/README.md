# OBEDIO API Tests

Critical endpoint tests for the OBEDIO yacht management system.

## Setup

### 1. Install Dependencies

```bash
npm install --save-dev jest @jest/globals ts-jest supertest @types/supertest
```

### 2. Configure Jest

Create `jest.config.js` in the backend root:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/tests/**',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
};
```

### 3. Add Test Scripts to package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npm test service-requests.test.ts
npm test guests.test.ts
npm test crew.test.ts
```

### Run with Coverage
```bash
npm test:coverage
```

### Watch Mode (Development)
```bash
npm test:watch
```

## Test Files

### service-requests.test.ts
Tests for service request management:
- ✅ Creating service requests
- ✅ Status enum validation (pending, accepted, completed, cancelled)
- ✅ Priority enum validation (low, normal, urgent, emergency)
- ✅ RequestType enum validation (call, service, emergency)
- ✅ Accepting requests
- ✅ Completing requests
- ✅ Cancelling requests
- ✅ History record creation
- ✅ Authorization checks

### guests.test.ts
Tests for guest management:
- ✅ Creating guests
- ✅ GuestStatus enum validation (expected, onboard, ashore, departed)
- ✅ GuestType enum validation (owner, vip, guest, partner, family)
- ✅ Filtering by status and type
- ✅ Searching guests
- ✅ Updating guest information
- ✅ Deleting guests

### crew.test.ts
Tests for crew member management:
- ✅ Retrieving crew members
- ✅ CrewMemberStatus enum validation (active, on-duty, off-duty, on-leave)
- ✅ Updating crew status
- ✅ Activity log creation on status change
- ✅ Uppercase format rejection
- ✅ Underscore format rejection
- ✅ Authorization checks

## Critical Enum Validations

All tests ensure that enum values are:
1. **Lowercase** (not UPPERCASE)
2. **Dash-separated** (not underscore_separated)
3. **Exact matches** (case-sensitive)
4. **Database-consistent** (match Prisma schema)

### Example: ServiceRequest Status

✅ **Valid:** `'pending'`, `'accepted'`, `'completed'`, `'cancelled'`

❌ **Invalid:** `'PENDING'`, `'IN_PROGRESS'`, `'Pending'`, `'in_progress'`

### Example: CrewMember Status

✅ **Valid:** `'on-duty'`, `'off-duty'`, `'on-leave'`, `'active'`

❌ **Invalid:** `'ON_DUTY'`, `'on_duty'`, `'working'`, `'OnDuty'`

## Database Setup for Tests

Tests use the same database as development. Ensure:

1. **Database is running:**
   ```bash
   docker-compose up -d
   ```

2. **Migrations are applied:**
   ```bash
   npx prisma migrate deploy
   ```

3. **Test user exists:**
   ```bash
   npx prisma db seed
   ```

Default test credentials:
- Username: `admin`
- Password: `admin123`

## Test Data Cleanup

Tests automatically clean up created data in `afterAll()` hooks. If tests fail mid-execution, you may need to manually clean up:

```bash
# Reset database (CAUTION: Deletes all data)
npx prisma migrate reset

# Or manually delete test data
npx prisma studio
```

## Coverage Goals

Target coverage:
- **Lines:** > 80%
- **Functions:** > 80%
- **Branches:** > 70%

Critical paths should have 100% coverage:
- Enum validation
- Status transitions
- Authorization checks

## CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/test.yml
name: API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: docker-compose up -d
      - run: npx prisma migrate deploy
      - run: npm test
```

## Troubleshooting

### "Cannot find module '@jest/globals'"
```bash
npm install --save-dev @jest/globals
```

### "Database not connected"
Ensure Docker is running and migrations are applied:
```bash
docker-compose up -d
npx prisma migrate deploy
```

### "Authentication failed"
Ensure seed data has been loaded:
```bash
npx prisma db seed
```

### "Port already in use"
Stop any running backend server:
```bash
lsof -ti:8080 | xargs kill
```

## Writing New Tests

Follow the existing test structure:

```typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../server';
import { DatabaseService } from '../services/database';

describe('Feature Name', () => {
  let authToken: string;

  beforeAll(async () => {
    // Setup
  });

  afterAll(async () => {
    // Cleanup
  });

  describe('Endpoint Name', () => {
    it('should do something', async () => {
      const response = await request(app)
        .get('/api/endpoint')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });
  });
});
```

## Best Practices

1. **Always clean up test data** in `afterAll()`
2. **Use descriptive test names** that explain what is being tested
3. **Test both success and failure cases**
4. **Validate enum values explicitly**
5. **Check authorization on protected endpoints**
6. **Verify side effects** (e.g., activity logs, history records)
7. **Use beforeAll for expensive setup** (database connections, auth)
8. **Isolate tests** - each test should be independent

## Contributing

When adding new features:
1. Write tests FIRST (TDD approach)
2. Ensure all enum values are tested
3. Add both positive and negative test cases
4. Update this README if adding new test files
