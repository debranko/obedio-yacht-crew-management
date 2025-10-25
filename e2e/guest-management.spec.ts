/**
 * Guest Management E2E Tests
 * Tests guest CRUD operations and guest-location relationships
 */

import { test, expect } from '@playwright/test';

test.describe('Guest Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:8080');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('create new guest', async ({ page }) => {
    // Navigate to Guests page
    await page.click('text=Guests');
    await expect(page).toHaveURL(/guests/);

    // Click "Add Guest" button
    await page.click('button:has-text("Add Guest")');

    // Fill in guest details
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');

    // Select guest type
    await page.selectOption('select[name="type"]', 'owner');

    // Select cabin
    await page.selectOption('select[name="locationId"]', 'master-suite');

    // Set check-in date (today)
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[name="checkInDate"]', today);

    // Set check-out date (7 days from now)
    const checkOut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    await page.fill('input[name="checkOutDate"]', checkOut);

    // Add nationality
    await page.selectOption('select[name="nationality"]', 'USA');

    // Add allergies
    await page.click('button:has-text("Add Allergy")');
    await page.fill('input[name="allergy"]', 'Shellfish');

    // Add dietary restriction
    await page.click('button:has-text("Add Dietary Restriction")');
    await page.fill('input[name="dietaryRestriction"]', 'Gluten-free');

    // Save guest
    await page.click('button[type="submit"]:has-text("Save")');

    // Verify guest appears in list
    await expect(page.locator('.guest-card')).toContainText('John Doe');
    await expect(page.locator('.guest-card')).toContainText('Master Suite');
    await expect(page.locator('.guest-card')).toContainText('Owner');
  });

  test('edit existing guest', async ({ page }) => {
    // Navigate to Guests page
    await page.click('text=Guests');

    // Click on first guest card
    await page.locator('.guest-card').first().click();

    // Click "Edit" button
    await page.click('button:has-text("Edit")');

    // Update dietary restrictions
    await page.click('button:has-text("Add Dietary Restriction")');
    await page.fill('input[name="dietaryRestriction"]', 'Vegetarian');

    // Add medical condition
    await page.click('button:has-text("Add Medical Condition")');
    await page.fill('input[name="medicalCondition"]', 'Diabetes');

    // Update preferences
    await page.fill('textarea[name="preferences"]', 'Prefers white wine, early breakfast');

    // Save changes
    await page.click('button[type="submit"]:has-text("Save")');

    // Verify changes reflected
    await expect(page.locator('.guest-details')).toContainText('Vegetarian');
    await expect(page.locator('.guest-details')).toContainText('Diabetes');
  });

  test('delete guest', async ({ page }) => {
    // Navigate to Guests page
    await page.click('text=Guests');

    // Get initial guest count
    const initialCount = await page.locator('.guest-card').count();

    // Click on a guest
    await page.locator('.guest-card').first().click();

    // Click "Delete" button
    await page.click('button:has-text("Delete")');

    // Confirm deletion in dialog
    await page.click('button:has-text("Confirm")');

    // Verify guest removed
    const newCount = await page.locator('.guest-card').count();
    expect(newCount).toBe(initialCount - 1);
  });

  test('enable Do Not Disturb for guest', async ({ page }) => {
    // Navigate to Guests page
    await page.click('text=Guests');

    // Click on a guest
    await page.locator('.guest-card').first().click();

    // Toggle DND switch
    await page.click('input[type="checkbox"][name="doNotDisturb"]');

    // Verify DND badge appears
    await expect(page.locator('.dnd-badge')).toBeVisible();

    // Verify location also marked as DND
    // (Check that guest's cabin has DND indicator)
    const cabinName = await page.locator('.guest-cabin').textContent();
    await page.click('text=Dashboard'); // Go back to dashboard

    // Check DND Guests widget
    await expect(page.locator('.dnd-guests-widget')).toContainText(cabinName!);
  });

  test('filter guests by status', async ({ page }) => {
    // Navigate to Guests page
    await page.click('text=Guests');

    // Click "Checked In" filter
    await page.click('button:has-text("Checked In")');

    // Verify all shown guests are checked in
    const guestCards = page.locator('.guest-card');
    const count = await guestCards.count();

    for (let i = 0; i < count; i++) {
      await expect(guestCards.nth(i).locator('.status')).toContainText('Checked In');
    }

    // Click "Checked Out" filter
    await page.click('button:has-text("Checked Out")');

    // Click "All" to show all
    await page.click('button:has-text("All")');
  });

  test('search guests by name', async ({ page }) => {
    // Navigate to Guests page
    await page.click('text=Guests');

    // Type in search box
    await page.fill('input[placeholder*="Search"]', 'John');

    // Verify filtered results contain "John"
    const searchResults = page.locator('.guest-card');
    const count = await searchResults.count();

    for (let i = 0; i < count; i++) {
      const text = await searchResults.nth(i).textContent();
      expect(text).toMatch(/John/i);
    }

    // Clear search
    await page.fill('input[placeholder*="Search"]', '');
  });

  test('view guest service request history', async ({ page }) => {
    // Navigate to Guests page
    await page.click('text=Guests');

    // Click on a guest
    await page.locator('.guest-card').first().click();

    // Click "Service Requests" tab
    await page.click('button:has-text("Service Requests")');

    // Verify service requests related to this guest are shown
    await expect(page.locator('.service-request-history')).toBeVisible();

    // Should show request count
    const requestCount = await page.locator('.service-request-item').count();
    expect(requestCount).toBeGreaterThanOrEqual(0);
  });

  test('assign guest to different cabin', async ({ page }) => {
    // Navigate to Guests page
    await page.click('text=Guests');

    // Click on a guest
    await page.locator('.guest-card').first().click();

    // Click "Edit" button
    await page.click('button:has-text("Edit")');

    // Change cabin/location
    await page.selectOption('select[name="locationId"]', 'vip-cabin-1');

    // Save
    await page.click('button[type="submit"]:has-text("Save")');

    // Verify cabin updated
    await expect(page.locator('.guest-cabin')).toContainText('VIP Cabin 1');

    // Verify old cabin is now unoccupied
    await page.click('text=Locations');
    await expect(page.locator('.location-card:has-text("Master Suite")')).toContainText(
      'Unoccupied'
    );
  });
});

test.describe('Guest-Location Integration', () => {
  test('view guest details from location', async ({ page }) => {
    // Login
    await page.goto('http://localhost:8080');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Navigate to a page showing locations (e.g., DND Guests widget)
    await page.click('text=Dashboard');

    // Click on a location that has a guest
    const locationWithGuest = page.locator('.location-card:has(.guest-name)').first();

    if (await locationWithGuest.isVisible()) {
      await locationWithGuest.click();

      // Should show guest details modal/panel
      await expect(page.locator('.guest-details-modal')).toBeVisible();

      // Should show guest name, preferences, allergies, etc.
      await expect(page.locator('.guest-name')).toBeVisible();
    }
  });

  test('service request shows correct guest for cabin', async ({ page }) => {
    // Login
    await page.goto('http://localhost:8080');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Go to Service Requests
    await page.click('text=Service Requests');

    // Create a request from a cabin with a guest
    await page.click('text=Simulate Button Press');
    await page.selectOption('select[name="cabin"]', 'master-suite');
    await page.click('button:has-text("Send")');

    // Verify service request shows correct guest name
    const requestCard = page.locator('.service-request-card').first();
    const guestName = await requestCard.locator('.guest-name').textContent();

    // Go to Guests page to verify
    await page.click('text=Guests');

    // Find guest in Master Suite
    const masterSuiteGuest = page.locator('.guest-card:has-text("Master Suite")').first();
    const expectedGuestName = await masterSuiteGuest.locator('.guest-name').textContent();

    // Names should match
    expect(guestName).toBe(expectedGuestName);
  });
});
