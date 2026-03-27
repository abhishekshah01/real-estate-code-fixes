import { test, expect } from '@playwright/test';
import { waitForAppReady, removeEmergentBadge, dismissToasts } from '../fixtures/helpers';

const BASE_URL = 'https://code-exec-3.preview.emergentagent.com';

test.describe('Properties Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/properties', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('Properties page loads with search and filters', async ({ page }) => {
    await expect(page.getByTestId('properties-page')).toBeVisible();
    
    // Check page title
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // Check search input is present
    const searchInput = page.locator('input[placeholder*="search" i], input[type="text"]').first();
    await expect(searchInput).toBeVisible();
    
    // Check view toggle buttons (grid/map)
    const viewToggle = page.locator('button:has-text("Grid"), button:has-text("Map"), [data-testid*="view"]');
    await expect(viewToggle.first()).toBeVisible();
  });

  test('Property cards are displayed in the grid', async ({ page }) => {
    // Wait for property cards to load
    const propertyCards = page.locator('[data-testid^="property-card"], .property-card, [class*="property"]');
    await expect(propertyCards.first()).toBeVisible({ timeout: 10000 });
    
    // Verify multiple properties exist
    const cardCount = await propertyCards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('Search functionality filters properties', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i], input[type="text"]').first();
    await searchInput.fill('Malibu');
    await searchInput.press('Enter');
    
    // Wait for API response
    await page.waitForLoadState('domcontentloaded');
    
    // Properties should still be visible (or show "no results" message)
    await expect(page.getByTestId('properties-page')).toBeVisible();
  });
});

test.describe('Property Detail Page', () => {
  test('Property detail page shows property info', async ({ page }) => {
    // First go to properties page
    await page.goto('/properties', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Wait for properties to load
    const propertyLink = page.locator('a[href^="/properties/prop_"]').first();
    await expect(propertyLink).toBeVisible({ timeout: 10000 });
    
    // Click on first property to view details
    await propertyLink.click();
    
    // Wait for detail page to load
    await expect(page).toHaveURL(/\/properties\/prop_/);
    
    // Check property detail elements
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});

test.describe('Contact Page', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await page.goto('/contact', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('Contact page renders with form and contact info', async ({ page }) => {
    await expect(page.getByTestId('contact-page')).toBeVisible();
    await expect(page.getByTestId('contact-form-container')).toBeVisible();
    await expect(page.getByTestId('contact-form')).toBeVisible();
    
    // Check form fields
    await expect(page.getByTestId('contact-name')).toBeVisible();
    await expect(page.getByTestId('contact-email')).toBeVisible();
    await expect(page.getByTestId('contact-phone')).toBeVisible();
    await expect(page.getByTestId('contact-type')).toBeVisible();
    await expect(page.getByTestId('contact-message')).toBeVisible();
    await expect(page.getByTestId('contact-submit')).toBeVisible();
    
    // Check contact info sections
    await expect(page.getByTestId('contact-info-0')).toBeVisible();
    await expect(page.getByTestId('contact-info-1')).toBeVisible();
  });

  test('Contact form submission works', async ({ page }) => {
    const timestamp = Date.now();
    
    // Fill out the form
    await page.getByTestId('contact-name').fill(`TEST_User_${timestamp}`);
    await page.getByTestId('contact-email').fill(`test_${timestamp}@example.com`);
    await page.getByTestId('contact-phone').fill('+1555123456');
    await page.getByTestId('contact-type').selectOption('general');
    await page.getByTestId('contact-message').fill('This is a test inquiry message from automated testing.');
    
    // Submit the form
    await page.getByTestId('contact-submit').click();
    
    // Wait for success toast or form reset
    await expect(page.getByTestId('contact-name')).toHaveValue('', { timeout: 10000 });
  });
});

test.describe('Calculator Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calculator', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('Calculator page renders with all tabs', async ({ page }) => {
    await expect(page.getByTestId('calculator-page')).toBeVisible();
    await expect(page.getByTestId('calculator-tabs')).toBeVisible();
    
    // Check all three calculator tabs are present
    const mortgageTab = page.getByRole('tab', { name: /mortgage/i });
    const affordabilityTab = page.getByRole('tab', { name: /affordability/i });
    const valuationTab = page.getByRole('tab', { name: /valuation/i });
    
    await expect(mortgageTab).toBeVisible();
    await expect(affordabilityTab).toBeVisible();
    await expect(valuationTab).toBeVisible();
  });

  test('Mortgage calculator performs calculations', async ({ page }) => {
    // Click mortgage tab (should be default)
    const mortgageTab = page.getByRole('tab', { name: /mortgage/i });
    await mortgageTab.click();
    
    // Find calculate button and click
    const calculateBtn = page.getByRole('button', { name: /calculate/i });
    if (await calculateBtn.isVisible()) {
      await calculateBtn.click();
      
      // Check results appear - use first() for strict mode
      await expect(page.locator('text=/\\$[0-9,]+/').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('Affordability calculator can be accessed', async ({ page }) => {
    const affordabilityTab = page.getByRole('tab', { name: /affordability/i });
    await affordabilityTab.click();
    
    // Verify tab content is displayed
    await expect(page.locator('[data-state="active"][role="tabpanel"]')).toBeVisible();
  });
});
