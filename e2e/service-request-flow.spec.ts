/**
 * Service Request Flow E2E Tests
 * Tests complete service request lifecycle from creation to completion
 */

import { test, expect } from '@playwright/test';

test.describe('Service Request Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:8080');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('complete service request lifecycle', async ({ page }) => {
    // Navigate to Service Requests page
    await page.click('text=Service Requests');
    await expect(page).toHaveURL(/service-requests/);

    // Step 1: Create a new service request via button simulator
    await page.click('text=Simulate Button Press');

    // Select a cabin from dropdown
    await page.selectOption('select[name="cabin"]', 'master-suite');

    // Click to send the request
    await page.click('button:has-text("Send Call Button Press")');

    // Step 2: Verify request appears in Pending section
    await expect(page.locator('.pending-requests')).toContainText('Master Suite');

    // Verify timestamp is recent
    const timestampText = await page.locator('.pending-requests .timestamp').first().textContent();
    expect(timestampText).toMatch(/just now|seconds ago|minute ago/i);

    // Step 3: Accept the service request
    await page.click('.pending-requests .service-request-card button:has-text("Accept")');

    // Verify request moved to "Serving Now" section
    await expect(page.locator('.serving-now')).toContainText('Master Suite');

    // Verify assigned crew member is shown
    await expect(page.locator('.serving-now .assigned-crew')).toContainText('Admin');

    // Verify timer started
    await expect(page.locator('.serving-now .timer')).toBeVisible();

    // Step 4: Complete the service request
    await page.click('.serving-now .service-request-card button:has-text("Complete")');

    // Optional: Add completion notes
    const notesTextarea = page.locator('textarea[name="notes"]');
    if (await notesTextarea.isVisible()) {
      await notesTextarea.fill('Guest was happy with the service');
      await page.click('button:has-text("Confirm")');
    }

    // Step 5: Verify request moved to "Recently Completed"
    await expect(page.locator('.recently-completed')).toContainText('Master Suite');

    // Verify completion status
    await expect(page.locator('.recently-completed .status')).toContainText('Completed');

    // Verify service duration is calculated
    await expect(page.locator('.recently-completed .duration')).toMatch(/\d+:\d+ minutes?/);
  });

  test('delegate service request to another crew member', async ({ page }) => {
    // Navigate to Service Requests
    await page.click('text=Service Requests');

    // Create a request
    await page.click('text=Simulate Button Press');
    await page.selectOption('select[name="cabin"]', 'vip-cabin-1');
    await page.click('button:has-text("Send")');

    // Accept the request
    await page.click('.pending-requests .service-request-card button:has-text("Accept")');

    // Delegate to another crew member
    await page.click('.serving-now .service-request-card button:has-text("Delegate")');

    // Select crew member from dropdown
    await page.selectOption('select[name="crewMember"]', 'Jane Smith');
    await page.click('button:has-text("Confirm Delegation")');

    // Verify assigned crew member updated
    await expect(page.locator('.serving-now .assigned-crew')).toContainText('Jane Smith');

    // Verify status shows "Delegated"
    await expect(page.locator('.serving-now .status')).toContainText('Delegated');
  });

  test('handle emergency priority requests', async ({ page }) => {
    // Navigate to Service Requests
    await page.click('text=Service Requests');

    // Create emergency request
    await page.click('text=Simulate Button Press');
    await page.selectOption('select[name="cabin"]', 'master-suite');
    await page.selectOption('select[name="priority"]', 'emergency');
    await page.click('button:has-text("Send")');

    // Verify emergency styling (red border/background)
    const emergencyCard = page.locator('.pending-requests .service-request-card').first();
    await expect(emergencyCard).toHaveClass(/border-red|bg-red/);

    // Verify emergency badge
    await expect(emergencyCard.locator('.priority-badge')).toContainText('Emergency');

    // Verify emergency requests appear at top of list
    const firstCard = page.locator('.pending-requests .service-request-card').first();
    await expect(firstCard.locator('.priority-badge')).toContainText('Emergency');
  });

  test('filter service requests by status', async ({ page }) => {
    // Navigate to Service Requests
    await page.click('text=Service Requests');

    // Create multiple requests with different statuses
    // (Assuming some requests already exist from previous tests)

    // Click "Pending" filter
    await page.click('button:has-text("Pending")');

    // Verify only pending requests shown
    const pendingCards = page.locator('.service-request-card');
    await expect(pendingCards.first()).toContainText(/Pending/i);

    // Click "Accepted" filter
    await page.click('button:has-text("Accepted")');

    // Verify only accepted requests shown
    const acceptedCards = page.locator('.service-request-card');
    const count = await acceptedCards.count();
    if (count > 0) {
      await expect(acceptedCards.first()).toContainText(/Accepted|Serving/i);
    }

    // Click "All" to show all requests
    await page.click('button:has-text("All")');
  });

  test('search service requests by guest or cabin', async ({ page }) => {
    // Navigate to Service Requests
    await page.click('text=Service Requests');

    // Type in search box
    await page.fill('input[placeholder*="Search"]', 'Master Suite');

    // Verify filtered results
    const searchResults = page.locator('.service-request-card');
    const count = await searchResults.count();

    for (let i = 0; i < count; i++) {
      await expect(searchResults.nth(i)).toContainText(/Master Suite/i);
    }

    // Clear search
    await page.fill('input[placeholder*="Search"]', '');
  });

  test('auto-remove completed requests after timeout', async ({ page }) => {
    // Navigate to Service Requests
    await page.click('text=Service Requests');

    // Create and complete a request
    await page.click('text=Simulate Button Press');
    await page.selectOption('select[name="cabin"]', 'master-suite');
    await page.click('button:has-text("Send")');

    await page.click('.pending-requests button:has-text("Accept")');
    await page.click('.serving-now button:has-text("Complete")');

    // Verify request in "Recently Completed"
    await expect(page.locator('.recently-completed')).toContainText('Master Suite');

    // Wait for configured timeout (default: 5 seconds)
    await page.waitForTimeout(6000);

    // Verify request removed from "Recently Completed"
    await expect(page.locator('.recently-completed')).not.toContainText('Master Suite');
  });
});

test.describe('Real-Time Updates', () => {
  test('see service requests from other users in real-time', async ({ browser }) => {
    // Create two browser contexts (two users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Login both users
    await page1.goto('http://localhost:8080');
    await page1.fill('input[name="username"]', 'admin');
    await page1.fill('input[name="password"]', 'admin123');
    await page1.click('button[type="submit"]');
    await page1.waitForURL('**/dashboard');

    await page2.goto('http://localhost:8080');
    await page2.fill('input[name="username"]', 'stewardess1');
    await page2.fill('input[name="password"]', 'password');
    await page2.click('button[type="submit"]');
    await page2.waitForURL('**/dashboard');

    // Both navigate to Service Requests
    await page1.click('text=Service Requests');
    await page2.click('text=Service Requests');

    // User 1 creates a request
    await page1.click('text=Simulate Button Press');
    await page1.selectOption('select[name="cabin"]', 'master-suite');
    await page1.click('button:has-text("Send")');

    // User 2 should see the request appear immediately (via WebSocket)
    await expect(page2.locator('.pending-requests')).toContainText('Master Suite', {
      timeout: 3000,
    });

    // User 2 accepts the request
    await page2.click('.pending-requests button:has-text("Accept")');

    // User 1 should see the status update immediately
    await expect(page1.locator('.serving-now')).toContainText('Master Suite', {
      timeout: 3000,
    });
    await expect(page1.locator('.serving-now .assigned-crew')).toContainText('stewardess1', {
      timeout: 3000,
    });

    // Cleanup
    await context1.close();
    await context2.close();
  });
});

test.describe('Voice Transcript', () => {
  test('display voice transcript when available', async ({ page }) => {
    // Navigate to Service Requests
    await page.goto('http://localhost:8080');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.click('text=Service Requests');

    // Find request with voice transcript (if any)
    const voiceIcon = page.locator('.voice-icon').first();

    if (await voiceIcon.isVisible()) {
      // Click to expand and see transcript
      await voiceIcon.click();

      // Verify transcript is displayed
      await expect(page.locator('.voice-transcript')).toBeVisible();

      // Verify audio player is visible (if audio URL exists)
      const audioPlayer = page.locator('audio');
      if (await audioPlayer.isVisible()) {
        expect(await audioPlayer.getAttribute('src')).toBeTruthy();
      }
    }
  });
});
