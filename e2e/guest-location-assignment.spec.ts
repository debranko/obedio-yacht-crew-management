/**
 * Guest-Location Assignment Bug Fix Testing
 * Tests the fix for guest-to-location assignments not saving properly
 */

import { test, expect } from '@playwright/test';

test.describe('Guest-Location Assignment Testing (Bug Fix Verification)', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('http://10.10.0.207:5173');
    await page.waitForTimeout(3000);

    // Check if login page or dashboard
    const url = page.url();
    if (!url.includes('dashboard')) {
      await page.fill('#email', 'admin');
      await page.fill('#password', 'admin123');
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(3000);
    }
  });

  test('Scenario 1: Assign guest from Location page', async ({ page }) => {
    // Navigate to Locations page
    await page.click('text=Device Manager');
    await page.waitForTimeout(500);
    await page.click('text=Locations');
    await page.waitForTimeout(2000);

    // Find a cabin-type location (e.g., Master Suite)
    const locationCards = page.locator('[class*="card"]').filter({ hasText: 'cabin' });
    const firstCabin = locationCards.first();

    // Get the location name
    const locationName = await firstCabin.locator('h3, h4, [class*="title"]').first().textContent();

    // Click Edit on this location
    await firstCabin.locator('button').filter({ hasText: /edit/i }).first().click();
    await page.waitForTimeout(1000);

    // In Guest Assignment section, select a guest
    const guestSelect = page.locator('select').filter({ has: page.locator('option:has-text("No guest")') }).first();
    await guestSelect.waitFor({ state: 'visible' });

    // Get all guest options (skip "No guest assigned")
    const guestOptions = await page.locator('select option').filter({ hasNotText: /no guest/i }).all();
    if (guestOptions.length > 0) {
      const guestValue = await guestOptions[0].getAttribute('value');
      const guestName = await guestOptions[0].textContent();

      await guestSelect.selectOption(guestValue!);
      await page.waitForTimeout(500);

      // Click Save Changes
      await page.click('button:has-text("Save Changes")');
      await page.waitForTimeout(2000);

      // VERIFY: Guest name appears in location card
      await expect(firstCabin).toContainText(guestName!);

      // Refresh page (F5)
      await page.reload();
      await page.waitForTimeout(2000);

      // VERIFY: Guest is still shown (persisted to database)
      await expect(page.locator('body')).toContainText(guestName!);
    }
  });

  test('Scenario 2: Reassign guest to different location', async ({ page }) => {
    // Navigate to Locations page
    await page.click('text=Device Manager');
    await page.waitForTimeout(500);
    await page.click('text=Locations');
    await page.waitForTimeout(2000);

    // Find two cabin-type locations
    const cabinCards = page.locator('[class*="card"]').filter({ hasText: /cabin/i });
    const cabin1 = cabinCards.nth(0);
    const cabin2 = cabinCards.nth(1);

    // Edit first cabin and assign a guest
    await cabin1.locator('button').filter({ hasText: /edit/i }).first().click();
    await page.waitForTimeout(1000);

    const guestSelect1 = page.locator('select').filter({ has: page.locator('option:has-text("No guest")') }).first();
    const guestOptions = await page.locator('select option').filter({ hasNotText: /no guest/i }).all();

    if (guestOptions.length >= 2) {
      const guest1Value = await guestOptions[0].getAttribute('value');
      const guest1Name = await guestOptions[0].textContent();
      const guest2Value = await guestOptions[1].getAttribute('value');
      const guest2Name = await guestOptions[1].textContent();

      // Assign first guest
      await guestSelect1.selectOption(guest1Value!);
      await page.click('button:has-text("Save Changes")');
      await page.waitForTimeout(2000);

      // Edit same cabin again and change to different guest
      await cabin1.locator('button').filter({ hasText: /edit/i }).first().click();
      await page.waitForTimeout(1000);

      const guestSelect2 = page.locator('select').filter({ has: page.locator('option') }).first();
      await guestSelect2.selectOption(guest2Value!);
      await page.click('button:has-text("Save Changes")');
      await page.waitForTimeout(2000);

      // VERIFY: New guest appears in this location
      await expect(cabin1).toContainText(guest2Name!);

      // VERIFY: First guest is NO LONGER shown (should not appear in any cabin if they were only in cabin1)
      const cabin1Text = await cabin1.textContent();
      expect(cabin1Text).not.toContain(guest1Name!);
    }
  });

  test('Scenario 3: Unassign guest (clear assignment)', async ({ page }) => {
    // Navigate to Locations page
    await page.click('text=Device Manager');
    await page.waitForTimeout(500);
    await page.click('text=Locations');
    await page.waitForTimeout(2000);

    // Find a cabin with a guest assigned
    const cabinCards = page.locator('[class*="card"]').filter({ hasText: /cabin/i });
    const cabin = cabinCards.first();

    // First, make sure a guest is assigned
    await cabin.locator('button').filter({ hasText: /edit/i }).first().click();
    await page.waitForTimeout(1000);

    const guestSelect = page.locator('select').filter({ has: page.locator('option:has-text("No guest")') }).first();
    const guestOptions = await page.locator('select option').filter({ hasNotText: /no guest/i }).all();

    if (guestOptions.length > 0) {
      const guestValue = await guestOptions[0].getAttribute('value');
      await guestSelect.selectOption(guestValue!);
      await page.click('button:has-text("Save Changes")');
      await page.waitForTimeout(2000);

      // Now unassign the guest
      await cabin.locator('button').filter({ hasText: /edit/i }).first().click();
      await page.waitForTimeout(1000);

      const guestSelectClear = page.locator('select').filter({ has: page.locator('option:has-text("No guest")') }).first();
      await guestSelectClear.selectOption('');
      await page.click('button:has-text("Save Changes")');
      await page.waitForTimeout(2000);

      // VERIFY: Guest no longer appears in location card
      // (Card should show "Unoccupied" or similar)

      // Refresh page
      await page.reload();
      await page.waitForTimeout(2000);

      // VERIFY: Still no guest shown
      const cabinAfterRefresh = cabinCards.first();
      const cabinText = await cabinAfterRefresh.textContent();
      expect(cabinText).toMatch(/unoccupied|no guest|not assigned/i);
    }
  });

  test('Scenario 4: Assign from Guest page (reverse direction)', async ({ page }) => {
    // Navigate to Guests page
    await page.click('text=Guests');
    await page.waitForTimeout(2000);

    // Find a guest
    const guestCards = page.locator('[class*="card"]').filter({ hasText: /guest|name/i });
    if (await guestCards.count() > 0) {
      const firstGuest = guestCards.first();
      const guestName = await firstGuest.locator('h3, h4, [class*="name"]').first().textContent();

      // Click Edit on guest (from actions menu or edit button)
      const editButton = firstGuest.locator('button').filter({ hasText: /edit/i }).or(
        firstGuest.locator('[class*="action"]').locator('button')
      ).first();

      await editButton.click();
      await page.waitForTimeout(1000);

      // Go to Accommodation tab if tabs exist
      const accommodationTab = page.locator('button, [role="tab"]').filter({ hasText: /accommodation|cabin/i });
      if (await accommodationTab.count() > 0) {
        await accommodationTab.first().click();
        await page.waitForTimeout(500);
      }

      // Select a cabin from dropdown
      const cabinSelect = page.locator('select').filter({ has: page.locator('option:has-text("cabin")') }).first();
      const cabinOptions = await page.locator('select option').filter({ hasText: /cabin/i }).all();

      if (cabinOptions.length > 0) {
        const cabinValue = await cabinOptions[0].getAttribute('value');
        const cabinName = await cabinOptions[0].textContent();

        await cabinSelect.selectOption(cabinValue!);

        // Click Update Guest or Save
        await page.locator('button').filter({ hasText: /update|save/i }).first().click();
        await page.waitForTimeout(2000);

        // Navigate to Locations page
        await page.click('text=Device Manager');
        await page.waitForTimeout(500);
        await page.click('text=Locations');
        await page.waitForTimeout(2000);

        // Find that cabin location
        const locationCards = page.locator('[class*="card"]').filter({ hasText: cabinName! });

        // VERIFY: Guest appears in that location's card
        await expect(locationCards.first()).toContainText(guestName!);
      }
    }
  });

  test('Scenario 5: Cross-check both directions', async ({ page }) => {
    // Assign Guest A to Location X from Locations page
    await page.click('text=Device Manager');
    await page.waitForTimeout(500);
    await page.click('text=Locations');
    await page.waitForTimeout(2000);

    const cabinCards = page.locator('[class*="card"]').filter({ hasText: /cabin/i });
    const locationX = cabinCards.nth(0);
    const locationY = cabinCards.nth(1);

    const locationXName = await locationX.locator('h3, h4, [class*="title"]').first().textContent();
    const locationYName = await locationY.locator('h3, h4, [class*="title"]').first().textContent();

    // Edit Location X
    await locationX.locator('button').filter({ hasText: /edit/i }).first().click();
    await page.waitForTimeout(1000);

    const guestSelect = page.locator('select').filter({ has: page.locator('option:has-text("No guest")') }).first();
    const guestOptions = await page.locator('select option').filter({ hasNotText: /no guest/i }).all();

    if (guestOptions.length > 0) {
      const guestAValue = await guestOptions[0].getAttribute('value');
      const guestAName = await guestOptions[0].textContent();

      await guestSelect.selectOption(guestAValue!);
      await page.click('button:has-text("Save Changes")');
      await page.waitForTimeout(2000);

      // Navigate to Guests page
      await page.click('text=Guests');
      await page.waitForTimeout(2000);

      // Find Guest A
      const guestCard = page.locator('[class*="card"]').filter({ hasText: guestAName! });

      // VERIFY: Cabin field shows Location X
      await expect(guestCard.first()).toContainText(locationXName!);

      // Edit Guest A
      await guestCard.first().locator('button').filter({ hasText: /edit/i }).first().click();
      await page.waitForTimeout(1000);

      // Change cabin to Location Y
      const cabinSelectOnGuest = page.locator('select').filter({ has: page.locator('option') }).first();

      // Find Location Y option
      const locationYOption = page.locator('select option').filter({ hasText: locationYName! }).first();
      const locationYValue = await locationYOption.getAttribute('value');

      if (locationYValue) {
        await cabinSelectOnGuest.selectOption(locationYValue);
        await page.locator('button').filter({ hasText: /update|save/i }).first().click();
        await page.waitForTimeout(2000);

        // Go to Locations page
        await page.click('text=Device Manager');
        await page.waitForTimeout(500);
        await page.click('text=Locations');
        await page.waitForTimeout(2000);

        // VERIFY: Guest A appears in Location Y card
        const locationYCard = page.locator('[class*="card"]').filter({ hasText: locationYName! });
        await expect(locationYCard.first()).toContainText(guestAName!);

        // VERIFY: Guest A does NOT appear in Location X card anymore
        const locationXCard = page.locator('[class*="card"]').filter({ hasText: locationXName! });
        const locationXText = await locationXCard.first().textContent();
        expect(locationXText).not.toContain(guestAName!);
      }
    }
  });
});
