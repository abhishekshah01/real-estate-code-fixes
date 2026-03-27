import { test, expect } from '@playwright/test';
import { waitForAppReady, removeEmergentBadge } from '../fixtures/helpers';

const BASE_URL = 'https://code-exec-3.preview.emergentagent.com';

test.describe('Core Navigation and Pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('Homepage loads with hero section and main elements', async ({ page }) => {
    await expect(page.getByTestId('home-page')).toBeVisible();
    await expect(page.getByTestId('hero-section')).toBeVisible();
    await expect(page.getByTestId('navbar')).toBeVisible();
    await expect(page.getByTestId('footer')).toBeVisible();
    
    // Check hero content - use testid for hero CTA
    await expect(page.getByTestId('hero-section').getByRole('heading').first()).toBeVisible();
    await expect(page.getByTestId('hero-cta')).toBeVisible();
  });

  test('Navigation bar links work correctly', async ({ page }) => {
    await expect(page.getByTestId('navbar')).toBeVisible();
    
    // Check logo link
    await expect(page.getByTestId('logo-link')).toBeVisible();
    
    // Check nav links are visible (Home link removed per UI redesign)
    await expect(page.getByTestId('nav-properties')).toBeVisible();
    await expect(page.getByTestId('nav-agents')).toBeVisible();
    await expect(page.getByTestId('nav-areas')).toBeVisible();
    await expect(page.getByTestId('nav-calculator')).toBeVisible();
    await expect(page.getByTestId('nav-contact')).toBeVisible();
    
    // Navigate to Properties
    await page.getByTestId('nav-properties').click();
    await expect(page).toHaveURL(/\/properties/);
    await expect(page.getByTestId('properties-page')).toBeVisible();
    
    // Navigate to Agents
    await page.getByTestId('nav-agents').click();
    await expect(page).toHaveURL(/\/agents/);
    await expect(page.getByTestId('agents-page')).toBeVisible();
    
    // Navigate to Areas
    await page.getByTestId('nav-areas').click();
    await expect(page).toHaveURL(/\/areas/);
    await expect(page.getByTestId('areas-page')).toBeVisible();
  });

  test('Language dropdown is visible and interactive', async ({ page }) => {
    await expect(page.getByTestId('language-dropdown')).toBeVisible();
    await page.getByTestId('language-dropdown').click();
    // Check that language menu appears
    await expect(page.getByRole('menuitem').first()).toBeVisible();
  });

  test('WhatsApp floating button is visible', async ({ page }) => {
    // Scroll down to ensure WhatsApp button is visible
    await page.evaluate(() => window.scrollTo(0, 500));
    const whatsappBtn = page.locator('[data-testid="whatsapp-button"], a[href*="wa.me"]');
    await expect(whatsappBtn.first()).toBeVisible();
  });

  test('Footer renders with all sections', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.getByTestId('footer')).toBeVisible();
    
    // Check footer has newsletter form
    await expect(page.getByTestId('newsletter-email')).toBeVisible();
    await expect(page.getByTestId('newsletter-submit')).toBeVisible();
    
    // Check footer links
    await expect(page.getByTestId('footer-properties-link')).toBeVisible();
    await expect(page.getByTestId('footer-calculator-link')).toBeVisible();
    await expect(page.getByTestId('footer-contact-link')).toBeVisible();
  });
});

test.describe('Agents Page', () => {
  test('Agents page renders all agent cards', async ({ page }) => {
    await page.goto('/agents', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    await expect(page.getByTestId('agents-page')).toBeVisible();
    
    // Check for agent profiles (6 agents)
    await expect(page.getByTestId('agent-profile-1')).toBeVisible();
    await expect(page.getByTestId('agent-profile-2')).toBeVisible();
    await expect(page.getByTestId('agent-profile-3')).toBeVisible();
    await expect(page.getByTestId('agent-profile-4')).toBeVisible();
    await expect(page.getByTestId('agent-profile-5')).toBeVisible();
    await expect(page.getByTestId('agent-profile-6')).toBeVisible();
  });
});

test.describe('Areas Page', () => {
  test('Areas page renders all area sections', async ({ page }) => {
    await page.goto('/areas', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    await expect(page.getByTestId('areas-page')).toBeVisible();
    
    // Check for area sections (6 areas)
    await expect(page.getByTestId('area-1')).toBeVisible();
    await expect(page.getByTestId('area-2')).toBeVisible();
    await expect(page.getByTestId('area-3')).toBeVisible();
    // More areas are below viewport, scroll to check
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.getByTestId('area-6')).toBeVisible();
  });
});
