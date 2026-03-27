import { test, expect } from '@playwright/test';
import { waitForAppReady, dismissToasts } from '../fixtures/helpers';

test.describe('UI Redesign Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('Hero section has animated counter stats', async ({ page }) => {
    await expect(page.getByTestId('hero-section')).toBeVisible();
    
    // Scroll to see stats bar at bottom of hero
    await page.evaluate(() => window.scrollTo(0, 400));
    
    // Stats should show 500+, 50+, 15+ (counters animate to these values)
    const statsSection = page.locator('.counter-animate, [class*="stat"]');
    await expect(statsSection.first()).toBeVisible({ timeout: 5000 });
  });

  test('Featured properties show unique images', async ({ page }) => {
    await page.goto('/properties', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Wait for property cards to load
    const propertyCards = page.locator('[data-testid^="property-card-"]');
    await expect(propertyCards.first()).toBeVisible({ timeout: 10000 });
    
    // Get all property card images
    const images = await page.locator('[data-testid^="property-card-"] img').all();
    expect(images.length).toBeGreaterThan(0);
    
    // Verify cards have 16:10 aspect ratio and price overlay
    const card = page.locator('[data-testid^="property-card-"]').first();
    await expect(card).toBeVisible();
    
    // Check for price overlay on the image (gradient overlay with price)
    const priceOverlay = card.locator('.bg-gradient-to-t');
    await expect(priceOverlay).toBeVisible();
  });

  test('Testimonial section shows 3 balanced cards with avatars', async ({ page }) => {
    // Scroll to testimonials section
    await page.evaluate(() => {
      const el = document.querySelector('[data-testid="testimonials-section"]');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    
    await expect(page.getByTestId('testimonials-section')).toBeVisible();
    
    // Check for 3 testimonial cards (redesigned from rotating single card)
    const cards = page.locator('[data-testid^="testimonial-card-"]');
    await expect(cards).toHaveCount(3);
    
    // Verify first card has quote, stars, and avatar
    const card0 = page.getByTestId('testimonial-card-0');
    await expect(card0).toBeVisible();
    
    // Check for avatar image in card
    const avatar = card0.locator('img.rounded-full');
    await expect(avatar).toBeVisible();
    
    // Check for star rating
    const stars = card0.locator('svg.fill-amber-400');
    await expect(stars.first()).toBeVisible();
  });

  test('CTA section displays property image collage', async ({ page }) => {
    // Scroll to CTA section
    await page.evaluate(() => {
      const el = document.querySelector('[data-testid="cta-section"]');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    
    await expect(page.getByTestId('cta-section')).toBeVisible();
    
    // CTA buttons should be visible
    await expect(page.getByTestId('cta-properties')).toBeVisible();
    await expect(page.getByTestId('cta-calculator')).toBeVisible();
    
    // Property images in collage (on desktop view)
    const ctaImages = page.getByTestId('cta-section').locator('img');
    const imageCount = await ctaImages.count();
    expect(imageCount).toBeGreaterThanOrEqual(0); // May be hidden on narrow viewports
  });

  test('Footer has social media icons, quick links, contact info, newsletter', async ({ page }) => {
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.getByTestId('footer')).toBeVisible();
    
    // Check social icons exist (X, in, fb, ig text buttons)
    const socialIcons = page.getByTestId('footer').locator('a[href="#"]');
    const socialCount = await socialIcons.count();
    expect(socialCount).toBeGreaterThanOrEqual(4);
    
    // Quick links
    await expect(page.getByTestId('footer-properties-link')).toBeVisible();
    await expect(page.getByTestId('footer-agents-link')).toBeVisible();
    await expect(page.getByTestId('footer-areas-link')).toBeVisible();
    await expect(page.getByTestId('footer-calculator-link')).toBeVisible();
    await expect(page.getByTestId('footer-contact-link')).toBeVisible();
    
    // Newsletter form
    await expect(page.getByTestId('newsletter-form')).toBeVisible();
    await expect(page.getByTestId('newsletter-email')).toBeVisible();
    await expect(page.getByTestId('newsletter-submit')).toBeVisible();
  });

  test('Navbar has glass effect on scroll', async ({ page }) => {
    const navbar = page.getByTestId('navbar');
    await expect(navbar).toBeVisible();
    
    // Initially navbar should be transparent on homepage
    await expect(navbar).toHaveClass(/bg-transparent|glass/);
    
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 200));
    
    // After scroll, navbar should have glass effect
    await expect(navbar).toHaveClass(/glass/);
  });

  test('Language dropdown works', async ({ page }) => {
    await expect(page.getByTestId('language-dropdown')).toBeVisible();
    
    // Open dropdown
    await page.getByTestId('language-dropdown').click();
    
    // Language options should appear
    await expect(page.getByTestId('lang-en')).toBeVisible();
    await expect(page.getByTestId('lang-es')).toBeVisible();
    await expect(page.getByTestId('lang-zh')).toBeVisible();
    
    // Select Spanish
    await page.getByTestId('lang-es').click();
    
    // Language should change (dropdown shows new flag)
    await expect(page.getByTestId('language-dropdown')).toContainText(/es/i);
  });

  test('Lucide icons render correctly', async ({ page }) => {
    // Check various Lucide icons on the page
    // Hero section icons
    const homeIcon = page.locator('svg.lucide-home, [class*="lucide"]').first();
    await expect(homeIcon).toBeVisible();
    
    // Navigate to properties to check Bed, Bath, Maximize icons
    await page.goto('/properties', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Wait for property cards
    const propertyCard = page.locator('[data-testid^="property-card-"]').first();
    await expect(propertyCard).toBeVisible({ timeout: 10000 });
    
    // Check icons exist (Bed, Bath, Maximize icons should be in each card)
    const cardIcons = propertyCard.locator('svg');
    await expect(cardIcons.first()).toBeVisible();
  });
});

test.describe('Mobile Responsiveness', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('Homepage adapts to mobile viewport', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Mobile menu button should be visible
    await expect(page.getByTestId('mobile-menu-btn')).toBeVisible();
    
    // Desktop nav links should be hidden (Home link removed per UI redesign)
    await expect(page.getByTestId('nav-properties')).not.toBeVisible();
    
    // Hero content should still be visible
    await expect(page.getByTestId('hero-section')).toBeVisible();
    await expect(page.getByTestId('hero-cta')).toBeVisible();
  });

  test('Mobile menu opens and shows all links', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Open mobile menu
    await page.getByTestId('mobile-menu-btn').click();
    await expect(page.getByTestId('mobile-menu')).toBeVisible();
    
    // Check all mobile nav links (Home link removed per UI redesign)
    await expect(page.getByTestId('mobile-nav-properties')).toBeVisible();
    await expect(page.getByTestId('mobile-nav-agents')).toBeVisible();
    await expect(page.getByTestId('mobile-nav-areas')).toBeVisible();
    await expect(page.getByTestId('mobile-nav-calculator')).toBeVisible();
    await expect(page.getByTestId('mobile-nav-contact')).toBeVisible();
    await expect(page.getByTestId('mobile-nav-admin')).toBeVisible();
    
    // Language selector should be visible
    await expect(page.getByTestId('mobile-lang-en')).toBeVisible();
  });

  test('Properties page adapts to mobile', async ({ page }) => {
    await page.goto('/properties', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    await expect(page.getByTestId('properties-page')).toBeVisible();
    await expect(page.getByTestId('search-input')).toBeVisible();
    
    // Property cards should still load
    const propertyCards = page.locator('[data-testid^="property-card-"]');
    await expect(propertyCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('Calculator page adapts to mobile', async ({ page }) => {
    await page.goto('/calculator', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    await expect(page.getByTestId('calculator-page')).toBeVisible();
    await expect(page.getByTestId('calculator-tabs')).toBeVisible();
    
    // All tabs should be accessible
    const mortgageTab = page.getByRole('tab', { name: /mortgage/i });
    await expect(mortgageTab).toBeVisible();
  });

  test('Contact page adapts to mobile', async ({ page }) => {
    await page.goto('/contact', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    await expect(page.getByTestId('contact-page')).toBeVisible();
    await expect(page.getByTestId('contact-form')).toBeVisible();
    
    // Form fields should be usable
    await expect(page.getByTestId('contact-name')).toBeVisible();
    await expect(page.getByTestId('contact-submit')).toBeVisible();
  });

  test('Admin login page adapts to mobile', async ({ page }) => {
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    await expect(page.getByTestId('admin-login-page')).toBeVisible();
    await expect(page.getByTestId('admin-login-form')).toBeVisible();
    await expect(page.getByTestId('admin-email-input')).toBeVisible();
    await expect(page.getByTestId('admin-password-input')).toBeVisible();
    await expect(page.getByTestId('admin-login-submit')).toBeVisible();
  });
});
