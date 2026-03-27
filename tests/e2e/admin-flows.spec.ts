import { test, expect } from '@playwright/test';
import { waitForAppReady, adminLogin, removeEmergentBadge } from '../fixtures/helpers';

const BASE_URL = 'https://code-exec-3.preview.emergentagent.com';
const ADMIN_EMAIL = 'ishika@emergent.sh';
const ADMIN_PASSWORD = 'test1234';

test.describe('Admin Login', () => {
  test('Admin login page renders correctly', async ({ page }) => {
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    await expect(page.getByTestId('admin-login-page')).toBeVisible();
    await expect(page.getByTestId('admin-login-form')).toBeVisible();
    await expect(page.getByTestId('admin-email-input')).toBeVisible();
    await expect(page.getByTestId('admin-password-input')).toBeVisible();
    await expect(page.getByTestId('admin-login-submit')).toBeVisible();
  });

  test('Admin login with valid credentials redirects to dashboard', async ({ page }) => {
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Fill in credentials
    await page.getByTestId('admin-email-input').fill(ADMIN_EMAIL);
    await page.getByTestId('admin-password-input').fill(ADMIN_PASSWORD);
    
    // Submit
    await page.getByTestId('admin-login-submit').click();
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 10000 });
    await expect(page.getByTestId('admin-dashboard')).toBeVisible();
  });

  test('Admin login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Fill in wrong credentials
    await page.getByTestId('admin-email-input').fill(ADMIN_EMAIL);
    await page.getByTestId('admin-password-input').fill('wrongpassword');
    
    // Submit
    await page.getByTestId('admin-login-submit').click();
    
    // Verify error message appears
    await expect(page.getByTestId('login-error')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await adminLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await waitForAppReady(page);
  });

  test('Dashboard shows overview tab with analytics', async ({ page }) => {
    await expect(page.getByTestId('admin-dashboard')).toBeVisible();
    
    // Check tabs are visible
    await expect(page.getByTestId('tab-overview')).toBeVisible();
    await expect(page.getByTestId('tab-leads')).toBeVisible();
    await expect(page.getByTestId('tab-properties')).toBeVisible();
    
    // Overview tab should be active by default - check stat cards
    await expect(page.getByTestId('stat-card-0')).toBeVisible();
    await expect(page.getByTestId('stat-card-1')).toBeVisible();
  });

  test('Dashboard leads tab shows inquiries table', async ({ page }) => {
    // Click on leads tab
    await page.getByTestId('tab-leads').click();
    
    // Verify leads content is visible
    await expect(page.getByTestId('leads-search')).toBeVisible();
    await expect(page.getByTestId('leads-filter')).toBeVisible();
    await expect(page.getByTestId('export-csv-btn')).toBeVisible();
    
    // Check table exists
    await expect(page.locator('table')).toBeVisible();
  });

  test('Dashboard properties tab shows property grid', async ({ page }) => {
    // Click on properties tab
    await page.getByTestId('tab-properties').click();
    
    // Verify add property button is visible
    await expect(page.getByTestId('add-property-btn')).toBeVisible();
    
    // Check property cards exist
    const propertyCards = page.locator('[data-testid^="admin-property-"]');
    await expect(propertyCards.first()).toBeVisible({ timeout: 5000 });
  });

  test('Admin can open add property form', async ({ page }) => {
    // Click on properties tab
    await page.getByTestId('tab-properties').click();
    
    // Click add property button
    await page.getByTestId('add-property-btn').click();
    
    // Verify form appears
    await expect(page.getByTestId('add-property-form')).toBeVisible();
    
    // Check form fields
    await expect(page.getByTestId('add-property-title')).toBeVisible();
    await expect(page.getByTestId('add-property-price')).toBeVisible();
    await expect(page.getByTestId('add-property-type')).toBeVisible();
    await expect(page.getByTestId('add-property-bedrooms')).toBeVisible();
    await expect(page.getByTestId('add-property-bathrooms')).toBeVisible();
    await expect(page.getByTestId('add-property-area')).toBeVisible();
    await expect(page.getByTestId('add-property-location')).toBeVisible();
    await expect(page.getByTestId('add-property-address')).toBeVisible();
    await expect(page.getByTestId('add-property-city')).toBeVisible();
    await expect(page.getByTestId('add-property-description')).toBeVisible();
    await expect(page.getByTestId('add-property-submit')).toBeVisible();
  });

  test('Admin can add and verify new property', async ({ page }) => {
    const timestamp = Date.now();
    const uniqueTitle = `TEST_Property_${timestamp}`;
    
    // Go to properties tab
    await page.getByTestId('tab-properties').click();
    
    // Get initial property count
    const initialCards = page.locator('[data-testid^="admin-property-"]');
    const initialCount = await initialCards.count();
    
    // Click add property
    await page.getByTestId('add-property-btn').click();
    await expect(page.getByTestId('add-property-form')).toBeVisible();
    
    // Fill required fields
    await page.getByTestId('add-property-title').fill(uniqueTitle);
    await page.getByTestId('add-property-price').fill('500000');
    await page.getByTestId('add-property-type').selectOption('house');
    await page.getByTestId('add-property-bedrooms').fill('4');
    await page.getByTestId('add-property-bathrooms').fill('3');
    await page.getByTestId('add-property-area').fill('2500');
    await page.getByTestId('add-property-location').fill('Test City, TestState');
    await page.getByTestId('add-property-address').fill('123 Test Street');
    await page.getByTestId('add-property-city').fill('TestCity');
    await page.getByTestId('add-property-description').fill('Automated test property for E2E testing');
    
    // Submit
    await page.getByTestId('add-property-submit').click();
    
    // Wait for form to close
    await expect(page.getByTestId('add-property-form')).not.toBeVisible({ timeout: 10000 });
    
    // Verify property appears in the grid (count increased)
    const updatedCards = page.locator('[data-testid^="admin-property-"]');
    await expect(updatedCards).toHaveCount(initialCount + 1, { timeout: 10000 });
  });

  test('Admin logout works correctly', async ({ page }) => {
    // Click logout
    await page.getByTestId('admin-logout-btn').click();
    
    // Verify redirect to login page
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 5000 });
    await expect(page.getByTestId('admin-login-page')).toBeVisible();
  });
});
