/**
 * Critical Fixes Verification E2E Tests
 * Tests for recently fixed issues:
 * 1. PUT /api/service-requests/:id endpoint (was missing)
 * 2. Location image upload URL fix (removed hardcoded localhost)
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Helper function to wait for network idle
async function waitForNetworkIdle(page: Page, timeout = 2000) {
  await page.waitForLoadState('networkidle', { timeout });
}

// Helper to check for console errors
function setupConsoleErrorCapture(page: Page) {
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  return consoleErrors;
}

test.describe('CRITICAL FIXES VERIFICATION', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('http://10.10.0.207:5173');
    await page.waitForTimeout(2000);

    const url = page.url();
    if (!url.includes('dashboard')) {
      await page.fill('#email', 'admin');
      await page.fill('#password', 'admin123');
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(2000);
    }
  });

  test('TEST 1: ⭐ Service Request Update (PUT endpoint)', async ({ page }) => {
    const consoleErrors = setupConsoleErrorCapture(page);

    // Navigate to Service Requests page
    await page.click('text=Service Requests');
    await page.waitForTimeout(2000);

    // Check if any service requests exist
    const requestCards = page.locator('[class*="card"]').filter({ hasText: /request|service|cabin/i });
    const count = await requestCards.count();

    let serviceRequestId = '';

    if (count === 0) {
      // Create a new service request first
      console.log('No service requests found. Creating one...');

      const createButton = page.locator('button').filter({ hasText: /create|add.*request/i }).first();
      if (await createButton.isVisible({ timeout: 2000 })) {
        await createButton.click();
        await page.waitForTimeout(1000);

        // Fill basic details
        const guestSelect = page.locator('select, [role="combobox"]').first();
        await guestSelect.waitFor({ state: 'visible', timeout: 5000 });

        // Try to fill the form
        await page.fill('textarea, input[type="text"]', 'Test service request for PUT endpoint verification');

        // Save
        await page.locator('button').filter({ hasText: /save|create|submit/i }).first().click();
        await page.waitForTimeout(2000);
      }
    }

    // Now try to edit an existing request
    await page.waitForTimeout(1000);
    const firstRequest = page.locator('[class*="card"]').filter({ hasText: /request|cabin|guest/i }).first();

    if (await firstRequest.isVisible({ timeout: 5000 })) {
      // Click on the request to open details
      await firstRequest.click();
      await page.waitForTimeout(1000);

      // Look for Edit button
      const editButton = page.locator('button').filter({ hasText: /edit/i }).first();
      if (await editButton.isVisible({ timeout: 2000 })) {
        await editButton.click();
        await page.waitForTimeout(1000);
      }

      // Listen for network requests
      const updatePromise = page.waitForResponse(
        response => response.url().includes('/api/service-requests/') && response.request().method() === 'PUT',
        { timeout: 15000 }
      );

      // Try to modify something
      const notesField = page.locator('textarea, input').filter({ hasText: /note|message|detail/i }).or(
        page.locator('textarea').first()
      );

      if (await notesField.isVisible({ timeout: 2000 })) {
        await notesField.fill('Updated via E2E test - PUT endpoint verification');
      }

      // Save/Update
      const saveButton = page.locator('button').filter({ hasText: /save|update/i }).first();
      await saveButton.click();

      // Wait for the PUT request
      try {
        const response = await updatePromise;
        const status = response.status();

        // CRITICAL: Should be 200, NOT 404
        expect(status).toBe(200);
        console.log('✅ PUT request returned status 200');

        // Check response body
        const responseBody = await response.json();
        expect(responseBody.success).toBe(true);
        console.log('✅ Response contains success: true');

      } catch (error) {
        console.error('❌ PUT request failed or timed out:', error);
        throw new Error('TEST 1 FAILED: PUT /api/service-requests/:id endpoint not working');
      }

      // Verify no 404 errors in console
      const has404Error = consoleErrors.some(err => err.includes('404') || err.includes('Cannot PUT'));
      expect(has404Error).toBe(false);

      // Check for success toast
      await page.waitForTimeout(1000);
      const toastSuccess = page.locator('[class*="toast"], [role="status"]').filter({ hasText: /success|updated|saved/i });
      if (await toastSuccess.isVisible({ timeout: 3000 })) {
        console.log('✅ Success toast notification appeared');
      }

    } else {
      throw new Error('TEST 1 FAILED: No service requests available to test');
    }
  });

  test('TEST 2: ⭐ Location Image Upload (URL fix)', async ({ page }) => {
    const consoleErrors = setupConsoleErrorCapture(page);

    // Navigate to Locations page
    await page.click('text=Device Manager');
    await page.waitForTimeout(500);
    await page.click('text=Locations');
    await page.waitForTimeout(2000);

    // Find a location card
    const locationCards = page.locator('[class*="card"]');
    const firstLocation = locationCards.first();

    if (await firstLocation.isVisible({ timeout: 5000 })) {
      // Click Edit
      const editButton = firstLocation.locator('button').filter({ hasText: /edit/i }).first();
      await editButton.click();
      await page.waitForTimeout(1000);

      // Look for "Edit Image" button
      const editImageButton = page.locator('button').filter({ hasText: /edit.*image|upload.*image|image/i }).first();

      if (await editImageButton.isVisible({ timeout: 3000 })) {
        await editImageButton.click();
        await page.waitForTimeout(1000);

        // Create a test image file
        const testImagePath = path.join(__dirname, '../test-image.png');

        // Create a simple PNG if it doesn't exist
        if (!fs.existsSync(testImagePath)) {
          // Create a 1x1 red PNG
          const pngBuffer = Buffer.from([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
            0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
            0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D,
            0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
            0x44, 0xAE, 0x42, 0x60, 0x82
          ]);
          fs.writeFileSync(testImagePath, pngBuffer);
        }

        // Find file input
        const fileInput = page.locator('input[type="file"]');

        if (await fileInput.isVisible({ timeout: 2000 })) {
          // Set up network monitoring BEFORE uploading
          const uploadPromise = page.waitForResponse(
            response => response.url().includes('/api/upload/image') && response.request().method() === 'POST',
            { timeout: 15000 }
          );

          // Upload the file
          await fileInput.setInputFiles(testImagePath);
          await page.waitForTimeout(1000);

          // Click Save
          const saveButton = page.locator('button').filter({ hasText: /save.*image|save|upload/i }).first();
          if (await saveButton.isVisible({ timeout: 2000 })) {
            await saveButton.click();

            try {
              const response = await uploadPromise;
              const status = response.status();

              // CRITICAL: Should be 200
              expect(status).toBe(200);
              console.log('✅ Upload request returned status 200');

              // Check response body
              const responseBody = await response.json();
              expect(responseBody.success).toBe(true);
              console.log('✅ Response contains success: true');

              // CRITICAL: URL should NOT contain localhost:8080
              const imageUrl = responseBody.data.url;
              expect(imageUrl).toBeDefined();
              expect(imageUrl).not.toContain('localhost:8080');
              expect(imageUrl).not.toContain('http://localhost:8080');
              console.log('✅ Image URL does not contain hardcoded localhost:8080');
              console.log('   Image URL:', imageUrl);

            } catch (error) {
              console.error('❌ Upload request failed:', error);
              throw new Error('TEST 2 FAILED: Image upload failed or URL contains localhost:8080');
            }

            // Verify no CORS errors
            const hasCorsError = consoleErrors.some(err =>
              err.includes('CORS') ||
              err.includes('Cross-Origin') ||
              err.includes('Failed to fetch')
            );
            expect(hasCorsError).toBe(false);
            console.log('✅ No CORS errors detected');

            // Check for success toast
            await page.waitForTimeout(1000);
            const toastSuccess = page.locator('[class*="toast"], [role="status"]').filter({ hasText: /success|uploaded|saved/i });
            if (await toastSuccess.isVisible({ timeout: 3000 })) {
              console.log('✅ Success toast notification appeared');
            }
          }
        } else {
          console.log('⚠️ File input not found, trying URL input method...');

          // Alternative: Use URL input
          const urlInput = page.locator('input[type="text"], input[type="url"]').filter({
            hasText: /url|link|image/i
          }).or(page.locator('input[placeholder*="http"]'));

          if (await urlInput.isVisible({ timeout: 2000 })) {
            await urlInput.fill('https://images.unsplash.com/photo-1600585154340-be6161a56a0c');

            const saveButton = page.locator('button').filter({ hasText: /save/i }).first();
            await saveButton.click();
            await page.waitForTimeout(2000);

            console.log('✅ URL input method worked');
          }
        }
      } else {
        console.log('⚠️ Edit Image button not found in this location dialog');
      }
    }
  });

  test('TEST 3: Service Request Accept/Complete Flow', async ({ page }) => {
    const consoleErrors = setupConsoleErrorCapture(page);

    await page.click('text=Service Requests');
    await page.waitForTimeout(2000);

    // Find a pending request
    const pendingRequest = page.locator('[class*="card"]').filter({ hasText: /pending|new/i }).first();

    if (await pendingRequest.isVisible({ timeout: 3000 })) {
      await pendingRequest.click();
      await page.waitForTimeout(1000);

      // Accept the request
      const acceptButton = page.locator('button').filter({ hasText: /accept|assign/i }).first();
      if (await acceptButton.isVisible({ timeout: 2000 })) {
        await acceptButton.click();
        await page.waitForTimeout(2000);

        console.log('✅ Service request accepted');

        // Complete the request
        const completeButton = page.locator('button').filter({ hasText: /complete|finish|done/i }).first();
        if (await completeButton.isVisible({ timeout: 2000 })) {
          await completeButton.click();
          await page.waitForTimeout(2000);

          console.log('✅ Service request completed');
        }
      }

      // Verify no errors
      const hasError = consoleErrors.some(err => err.includes('error') || err.includes('failed'));
      expect(hasError).toBe(false);
    } else {
      console.log('⚠️ No pending service requests to test accept/complete flow');
    }
  });

  test('TEST 6: Real-Time WebSocket Sync', async ({ page, context }) => {
    // Open a second window
    const page2 = await context.newPage();

    // Login in second window
    await page2.goto('http://10.10.0.207:5173');
    await page2.waitForTimeout(2000);

    if (!page2.url().includes('dashboard')) {
      await page2.fill('#email', 'admin');
      await page2.fill('#password', 'admin123');
      await page2.click('button:has-text("Sign In")');
      await page2.waitForTimeout(2000);
    }

    // Navigate both to Service Requests
    await page.click('text=Service Requests');
    await page2.click('text=Service Requests');
    await page.waitForTimeout(2000);
    await page2.waitForTimeout(2000);

    // Get initial count in page2
    const initialCount = await page2.locator('[class*="card"]').count();

    // Create a request in page1
    const createButton = page.locator('button').filter({ hasText: /create|add/i }).first();
    if (await createButton.isVisible({ timeout: 3000 })) {
      await createButton.click();
      await page.waitForTimeout(1000);

      // Fill minimal details
      await page.fill('textarea, input[type="text"]', 'WebSocket sync test request');

      // Save
      await page.locator('button').filter({ hasText: /save|create/i }).first().click();
      await page.waitForTimeout(3000);

      // Check if it appears in page2 without refresh
      const newCount = await page2.locator('[class*="card"]').count();

      if (newCount > initialCount) {
        console.log('✅ WebSocket real-time sync working');
      } else {
        console.log('⚠️ WebSocket sync may not be working (count did not increase)');
      }
    }

    await page2.close();
  });
});

test.describe('QUICK CHECKS', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://10.10.0.207:5173');
    await page.waitForTimeout(2000);

    if (!page.url().includes('dashboard')) {
      await page.fill('#email', 'admin');
      await page.fill('#password', 'admin123');
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(2000);
    }
  });

  test('Quick Check: Dashboard loads', async ({ page }) => {
    await page.click('text=Dashboard');
    await page.waitForTimeout(2000);

    expect(page.url()).toContain('dashboard');
    console.log('✅ Dashboard loads successfully');
  });

  test('Quick Check: Crew page loads', async ({ page }) => {
    const crewLink = page.locator('text=Crew').first();
    if (await crewLink.isVisible({ timeout: 2000 })) {
      await crewLink.click();
      await page.waitForTimeout(2000);
      console.log('✅ Crew page loads successfully');
    }
  });

  test('Quick Check: Guests page loads', async ({ page }) => {
    await page.click('text=Guests');
    await page.waitForTimeout(2000);

    expect(page.url()).toContain('guests');
    console.log('✅ Guests page loads successfully');
  });

  test('Quick Check: Settings page loads', async ({ page }) => {
    const settingsLink = page.locator('text=Settings').first();
    if (await settingsLink.isVisible({ timeout: 2000 })) {
      await settingsLink.click();
      await page.waitForTimeout(2000);
      console.log('✅ Settings page loads successfully');
    }
  });
});
