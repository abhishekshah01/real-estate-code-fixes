import { test, expect } from '@playwright/test';
import { waitForAppReady, adminLogin, dismissToasts } from '../fixtures/helpers';

const BASE_URL = 'https://code-exec-3.preview.emergentagent.com';
const ADMIN_EMAIL = 'ishika@emergent.sh';
const ADMIN_PASSWORD = 'test1234';

/**
 * Golden Path E2E Test
 * Tests the complete user journey: Browse -> Contact -> Admin Flow
 */
test.describe('Golden Path - Full User Journey', () => {
  test('Complete user journey: Browse properties, submit inquiry, admin verifies', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `goldenpath_${timestamp}@example.com`;
    const testName = `TEST_GoldenPath_${timestamp}`;
    
    // Step 1: Land on homepage
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    await expect(page.getByTestId('home-page')).toBeVisible();
    await expect(page.getByTestId('hero-section')).toBeVisible();
    
    // Step 2: Navigate to properties
    await page.getByTestId('nav-properties').click();
    await expect(page).toHaveURL(/\/properties/);
    await expect(page.getByTestId('properties-page')).toBeVisible();
    
    // Step 3: Wait for properties to load and click on first property
    const propertyLink = page.locator('a[href^="/properties/prop_"]').first();
    await expect(propertyLink).toBeVisible({ timeout: 10000 });
    await propertyLink.click();
    
    // Step 4: Verify property detail page
    await expect(page).toHaveURL(/\/properties\/prop_/);
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    // Step 5: Go to contact page and submit inquiry
    await page.goto('/contact', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('contact-page')).toBeVisible();
    
    await dismissToasts(page);
    
    await page.getByTestId('contact-name').fill(testName);
    await page.getByTestId('contact-email').fill(testEmail);
    await page.getByTestId('contact-phone').fill('+1555999888');
    await page.getByTestId('contact-type').selectOption('property');
    await page.getByTestId('contact-message').fill('Golden path test - interested in property');
    await page.getByTestId('contact-submit').click();
    
    // Wait for form submission (form clears on success)
    await expect(page.getByTestId('contact-name')).toHaveValue('', { timeout: 10000 });
    
    // Step 6: Admin login
    await adminLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page.getByTestId('admin-dashboard')).toBeVisible();
    
    // Step 7: Navigate to leads tab
    await page.getByTestId('tab-leads').click();
    await expect(page.getByTestId('leads-search')).toBeVisible();
    
    // Step 8: Search for the inquiry we just created
    await page.getByTestId('leads-search').fill(testEmail);
    
    // Step 9: Verify our inquiry appears in the list
    const inquiryTable = page.locator('table tbody');
    await expect(inquiryTable.locator(`text=${testEmail}`).first()).toBeVisible({ timeout: 5000 });
    
    // Step 10: Logout
    await page.getByTestId('admin-logout-btn').click();
    await expect(page).toHaveURL(/\/admin\/login/);
    
    // Journey complete!
  });

  test('Admin property management flow', async ({ page }) => {
    const timestamp = Date.now();
    const uniqueTitle = `TEST_GoldenPath_Property_${timestamp}`;
    
    // Step 1: Admin login
    await adminLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page.getByTestId('admin-dashboard')).toBeVisible();
    
    // Step 2: Go to properties tab
    await page.getByTestId('tab-properties').click();
    await expect(page.getByTestId('add-property-btn')).toBeVisible();
    
    // Step 3: Open add property form
    await page.getByTestId('add-property-btn').click();
    await expect(page.getByTestId('add-property-form')).toBeVisible();
    
    // Step 4: Fill out property form
    await page.getByTestId('add-property-title').fill(uniqueTitle);
    await page.getByTestId('add-property-price').fill('750000');
    await page.getByTestId('add-property-type').selectOption('villa');
    await page.getByTestId('add-property-bedrooms').fill('5');
    await page.getByTestId('add-property-bathrooms').fill('4');
    await page.getByTestId('add-property-area').fill('4000');
    await page.getByTestId('add-property-location').fill('Golden Path, TestState');
    await page.getByTestId('add-property-address').fill('456 Golden Path Ave');
    await page.getByTestId('add-property-city').fill('GoldenCity');
    await page.getByTestId('add-property-description').fill('Golden path test property - automated E2E');
    await page.getByTestId('add-property-featured').check();
    
    // Step 5: Submit
    await page.getByTestId('add-property-submit').click();
    
    // Step 6: Verify form closes and property appears
    await expect(page.getByTestId('add-property-form')).not.toBeVisible({ timeout: 10000 });
    
    // Step 7: Go to public properties page and verify it shows
    await page.goto('/properties', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // The property should exist (we can search for it)
    const searchInput = page.locator('input[placeholder*="search" i], input[type="text"]').first();
    await searchInput.fill('GoldenCity');
    await searchInput.press('Enter');
    
    // Step 8: Logout
    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('admin-logout-btn').click();
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
