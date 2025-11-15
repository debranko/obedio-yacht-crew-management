/**
 * Authentication Setup for E2E Tests
 * Creates authenticated sessions for different user roles
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/user.json');

setup('authenticate as admin', async ({ page }) => {
  // Navigate to login page
  await page.goto('http://localhost:8080');

  // Fill in credentials
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'admin123');

  // Click login button
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard');

  // Verify authentication
  await expect(page.getByText(/Admin/i)).toBeVisible();

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
