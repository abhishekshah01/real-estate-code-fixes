import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../fixtures/helpers';

test.describe('UI Fixes Verification - Redesign Changes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('Navbar has no Home link - only Properties, Agents, Areas, Calculator, Contact', async ({ page }) => {
    // Verify Home link is NOT in the navbar
    const navHome = page.getByTestId('nav-home');
    await expect(navHome).not.toBeVisible();
    
    // Verify all other nav links are visible
    await expect(page.getByTestId('nav-properties')).toBeVisible();
    await expect(page.getByTestId('nav-agents')).toBeVisible();
    await expect(page.getByTestId('nav-areas')).toBeVisible();
    await expect(page.getByTestId('nav-calculator')).toBeVisible();
    await expect(page.getByTestId('nav-contact')).toBeVisible();
    
    // Verify Admin button is visible
    await expect(page.getByTestId('login-btn')).toBeVisible();
  });

  test('Search bar on homepage has max-width 640px', async ({ page }) => {
    // Scroll to search section
    const searchSection = page.getByTestId('search-section');
    await searchSection.scrollIntoViewIfNeeded();
    await expect(searchSection).toBeVisible();
    
    // The search bar container should have max-w-[640px] class
    const searchBar = page.getByTestId('search-bar');
    await expect(searchBar).toBeVisible();
    
    // Parent container should constrain width
    const searchContainer = searchSection.locator('.max-w-\\[640px\\]');
    await expect(searchContainer).toBeVisible();
  });

  test('Property cards have 16:10 aspect ratio images with price overlay', async ({ page }) => {
    await page.goto('/properties', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Wait for property cards
    const card = page.locator('[data-testid^="property-card-"]').first();
    await expect(card).toBeVisible({ timeout: 10000 });
    
    // Check for aspect-[16/10] class on image container
    const imageContainer = card.locator('.aspect-\\[16\\/10\\]');
    await expect(imageContainer).toBeVisible();
    
    // Check for price overlay (gradient) on image
    const priceOverlay = card.locator('.bg-gradient-to-t');
    await expect(priceOverlay).toBeVisible();
    
    // Verify price text is displayed on the image
    const priceText = priceOverlay.locator('p');
    await expect(priceText).toContainText('$');
  });

  test('Testimonials section shows 3 balanced cards', async ({ page }) => {
    // Scroll to testimonials
    const testimonialSection = page.getByTestId('testimonials-section');
    await testimonialSection.scrollIntoViewIfNeeded();
    await expect(testimonialSection).toBeVisible();
    
    // Check for 3 testimonial cards
    const cards = testimonialSection.locator('[data-testid^="testimonial-card-"]');
    await expect(cards).toHaveCount(3);
    
    // Verify grid layout
    const gridContainer = testimonialSection.locator('.grid.grid-cols-1.md\\:grid-cols-3');
    await expect(gridContainer).toBeVisible();
  });
});

test.describe('Agent Page Redesign', () => {
  test('Agent cards have side-by-side layout with Call/Email buttons', async ({ page }) => {
    await page.goto('/agents', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Check first agent profile
    const agentCard = page.getByTestId('agent-profile-1');
    await expect(agentCard).toBeVisible();
    
    // Check for Call button
    const callBtn = page.getByTestId('agent-call-1');
    await expect(callBtn).toBeVisible();
    await expect(callBtn).toContainText('Call');
    
    // Check for Email button
    const emailBtn = page.getByTestId('agent-email-1');
    await expect(emailBtn).toBeVisible();
    await expect(emailBtn).toContainText('Email');
    
    // Verify side-by-side layout (flex container within card)
    const flexContainer = agentCard.locator('.flex.flex-col.sm\\:flex-row');
    await expect(flexContainer).toBeVisible();
    
    // Verify stats are shown (sales, experience, rating)
    await expect(agentCard).toContainText(/sales/i);
    await expect(agentCard).toContainText(/experience/i);
    await expect(agentCard).toContainText(/rating/i);
  });
});

test.describe('Areas Page Enhancements', () => {
  test('Areas page has livability scores (Walk, Transit, Bike)', async ({ page }) => {
    await page.goto('/areas', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    // Scroll to first area details
    const area1 = page.getByTestId('area-1');
    await area1.scrollIntoViewIfNeeded();
    await expect(area1).toBeVisible();
    
    // Check for Livability Scores section
    await expect(area1).toContainText('Livability Scores');
    
    // Check for Walk Score
    await expect(area1).toContainText('Walk Score');
    await expect(area1).toContainText('/100');
    
    // Check for Transit Score  
    await expect(area1).toContainText('Transit Score');
    
    // Check for Bike Score
    await expect(area1).toContainText('Bike Score');
  });

  test('Areas page has community ratings (Schools, Safety, Lifestyle)', async ({ page }) => {
    await page.goto('/areas', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    const area1 = page.getByTestId('area-1');
    await area1.scrollIntoViewIfNeeded();
    await expect(area1).toBeVisible();
    
    // Check for community ratings
    await expect(area1).toContainText('Schools');
    await expect(area1).toContainText('Safety');
    await expect(area1).toContainText('Lifestyle');
    
    // Ratings should have numeric values (e.g., "9.2", "9.5", "9.8")
    await expect(area1).toContainText(/\d+\.\d+/);
  });

  test('Areas page has local amenities tags', async ({ page }) => {
    await page.goto('/areas', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    const area1 = page.getByTestId('area-1');
    await area1.scrollIntoViewIfNeeded();
    
    // Malibu should have amenities like Private Beaches, World-Class Dining
    await expect(area1).toContainText('Private Beaches');
    await expect(area1).toContainText('World-Class Dining');
  });
});

test.describe('Footer Redesign', () => {
  test('Footer has CTA bar with Get In Touch button', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    const footer = page.getByTestId('footer');
    await expect(footer).toBeVisible();
    
    // Check CTA section in footer
    await expect(footer).toContainText('Ready to find your dream home?');
    
    // Check Get In Touch button
    const ctaBtn = page.getByTestId('footer-cta-btn');
    await expect(ctaBtn).toBeVisible();
    await expect(ctaBtn).toContainText('Get in Touch');
  });

  test('Footer has newsletter form', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Check newsletter form elements
    await expect(page.getByTestId('newsletter-form')).toBeVisible();
    await expect(page.getByTestId('newsletter-email')).toBeVisible();
    await expect(page.getByTestId('newsletter-submit')).toBeVisible();
    await expect(page.getByTestId('newsletter-submit')).toContainText(/subscribe/i);
  });

  test('Footer has stats (500+ Properties, 20+ Agents, 15+ Areas)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    const footer = page.getByTestId('footer');
    await expect(footer).toBeVisible();
    
    // Check for stats
    await expect(footer).toContainText('500+');
    await expect(footer).toContainText(/properties/i);
    await expect(footer).toContainText('20+');
    await expect(footer).toContainText(/agents/i);
    await expect(footer).toContainText('15+');
    await expect(footer).toContainText(/areas/i);
  });
});
