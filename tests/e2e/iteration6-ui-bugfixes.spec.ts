import { test, expect } from '@playwright/test';
import { waitForAppReady, dismissToasts } from '../fixtures/helpers';

/**
 * Iteration 6 UI Bug Fixes Verification
 * Tests specific fixes requested by user:
 * 1. Property card image alignment and styling (rounded-2xl, shadow, no gap)
 * 2. Testimonials section - 3 balanced cards instead of 1 large rotating
 * 3. Footer contact icons visible (orange icons)
 * 4. Contact page Get in Touch icons visible (w-12 h-12 containers)
 * 5. Calculator slider draggable with orange styling
 */

test.describe('Property Card Styling Fixes', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await page.goto('/properties', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('Property cards have rounded-2xl corners and shadow styling', async ({ page }) => {
    // Wait for property cards to load
    const card = page.locator('[data-testid^="property-card-"]').first();
    await expect(card).toBeVisible({ timeout: 10000 });
    
    // Check for rounded-2xl class on card
    await expect(card).toHaveClass(/rounded-2xl/);
    
    // Check card has shadow (via inline style)
    const boxShadow = await card.evaluate((el) => {
      return window.getComputedStyle(el).boxShadow;
    });
    expect(boxShadow).not.toBe('none');
  });

  test('Property card images fill flush to card edges', async ({ page }) => {
    const card = page.locator('[data-testid^="property-card-"]').first();
    await expect(card).toBeVisible({ timeout: 10000 });
    
    // Card should have overflow-hidden for image to fill flush
    await expect(card).toHaveClass(/overflow-hidden/);
    
    // Image container should exist with proper aspect ratio
    const imageContainer = card.locator('.aspect-\\[16\\/10\\]');
    await expect(imageContainer).toBeVisible();
    
    // Image should have w-full h-full object-cover
    const image = imageContainer.locator('img');
    await expect(image).toHaveClass(/w-full/);
    await expect(image).toHaveClass(/h-full/);
    await expect(image).toHaveClass(/object-cover/);
  });

  test('Property cards have hover lift effect', async ({ page }) => {
    const card = page.locator('[data-testid^="property-card-"]').first();
    await expect(card).toBeVisible({ timeout: 10000 });
    
    // Check card has transition styling (duration-500 for smooth hover)
    await expect(card).toHaveClass(/duration-500/);
    
    // Check card has transition-all class
    await expect(card).toHaveClass(/transition-all/);
    
    // Verify hover handlers are set (card uses onMouseEnter/onMouseLeave)
    const hasHoverBehavior = await card.evaluate((el) => {
      return typeof el.onmouseenter === 'function' || el.getAttribute('style') !== null;
    });
    // The card should support hover via framer-motion or inline handlers
    expect(hasHoverBehavior).toBeTruthy();
  });
});

test.describe('Testimonials Section - 3 Balanced Cards', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('Testimonials section shows 3 equal-sized cards in grid', async ({ page }) => {
    // Scroll to testimonials section
    const section = page.getByTestId('testimonials-section');
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible();
    
    // Check for 3 testimonial cards
    const cards = section.locator('[data-testid^="testimonial-card-"]');
    await expect(cards).toHaveCount(3);
    
    // Verify all 3 cards are visible
    await expect(page.getByTestId('testimonial-card-0')).toBeVisible();
    await expect(page.getByTestId('testimonial-card-1')).toBeVisible();
    await expect(page.getByTestId('testimonial-card-2')).toBeVisible();
  });

  test('Each testimonial card has quote, stars, and author with avatar', async ({ page }) => {
    const section = page.getByTestId('testimonials-section');
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible();
    
    const card = page.getByTestId('testimonial-card-0');
    await expect(card).toBeVisible();
    
    // Check for quote icon (Quote from lucide-react)
    const quoteIcon = card.locator('svg').first();
    await expect(quoteIcon).toBeVisible();
    
    // Check for quote text
    const quoteText = card.locator('p').first();
    await expect(quoteText).toContainText(/EstateX/i);
    
    // Check for star rating
    const stars = card.locator('svg.fill-amber-400');
    await expect(stars.first()).toBeVisible();
    
    // Check for author avatar image
    const avatar = card.locator('img.rounded-full');
    await expect(avatar).toBeVisible();
    
    // Check for author name
    await expect(card).toContainText(/Jennifer|Robert|Amanda/);
  });

  test('Testimonials grid layout is responsive (md:grid-cols-3)', async ({ page }) => {
    const section = page.getByTestId('testimonials-section');
    await section.scrollIntoViewIfNeeded();
    
    // Check for grid container with md:grid-cols-3
    const gridContainer = section.locator('.grid.grid-cols-1.md\\:grid-cols-3');
    await expect(gridContainer).toBeVisible();
  });
});

test.describe('Footer Contact Icons Visibility', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('Footer contact icons are visible with orange color', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    const footer = page.getByTestId('footer');
    await expect(footer).toBeVisible();
    
    // Find the Contact Info section (case-insensitive)
    await expect(footer).toContainText(/Contact Info/i);
    
    // Check for icon containers with orange background (bg-[#C2410C]/15)
    const iconContainers = footer.locator('.bg-\\[\\#C2410C\\]\\/15');
    await expect(iconContainers).toHaveCount(3); // MapPin, Phone, Mail
    
    // Check that icons inside have orange color (text-[#EA580C])
    const orangeIcons = footer.locator('.text-\\[\\#EA580C\\]');
    expect(await orangeIcons.count()).toBeGreaterThanOrEqual(3);
  });

  test('Footer contact info displays correctly', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    const footer = page.getByTestId('footer');
    await expect(footer).toBeVisible();
    
    // Verify contact details
    await expect(footer).toContainText('123 Real Estate Blvd');
    await expect(footer).toContainText('New York, NY 10001');
    await expect(footer).toContainText('+1 (555) 123-4567');
    await expect(footer).toContainText('contact@estatex.com');
  });
});

test.describe('Contact Page Icons Visibility', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await page.goto('/contact', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('Contact page Get in Touch icons are visible and correctly sized', async ({ page }) => {
    await expect(page.getByTestId('contact-page')).toBeVisible();
    
    // Check for contact info sections with icons
    const contactInfos = page.locator('[data-testid^="contact-info-"]');
    await expect(contactInfos).toHaveCount(4); // Visit Us, Call Us, Email Us, Office Hours
    
    // Check first icon container is w-12 h-12
    const iconContainer = page.getByTestId('contact-info-0').locator('.w-12.h-12');
    await expect(iconContainer).toBeVisible();
    
    // Check icon is w-5 h-5 and orange colored
    const icon = iconContainer.locator('svg.w-5.h-5.text-\\[\\#C2410C\\]');
    await expect(icon).toBeVisible();
  });

  test('All 4 contact info sections render with icons', async ({ page }) => {
    // Visit Us
    const visitUs = page.getByTestId('contact-info-0');
    await expect(visitUs).toBeVisible();
    await expect(visitUs).toContainText('Visit Us');
    
    // Call Us
    const callUs = page.getByTestId('contact-info-1');
    await expect(callUs).toBeVisible();
    await expect(callUs).toContainText('Call Us');
    
    // Email Us
    const emailUs = page.getByTestId('contact-info-2');
    await expect(emailUs).toBeVisible();
    await expect(emailUs).toContainText('Email Us');
    
    // Office Hours
    const hours = page.getByTestId('contact-info-3');
    await expect(hours).toBeVisible();
    await expect(hours).toContainText('Office Hours');
  });
});

test.describe('Calculator Slider Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await page.goto('/calculator', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('Calculator slider is draggable and interactive', async ({ page }) => {
    await expect(page.getByTestId('calculator-page')).toBeVisible();
    await expect(page.getByTestId('mortgage-calculator')).toBeVisible();
    
    // Get the property price slider
    const slider = page.getByTestId('property-price-slider');
    await expect(slider).toBeVisible();
    
    // Get the slider thumb
    const thumb = slider.locator('[role="slider"]');
    await expect(thumb).toBeVisible();
    
    // Check slider has cursor-pointer for draggability
    await expect(slider).toHaveClass(/cursor-pointer/);
    
    // Get initial value
    const input = page.getByTestId('property-price-input');
    const initialValue = await input.inputValue();
    
    // Click on slider track to change value
    const sliderBox = await slider.boundingBox();
    if (sliderBox) {
      // Click at 75% of slider width
      await page.mouse.click(
        sliderBox.x + sliderBox.width * 0.75,
        sliderBox.y + sliderBox.height / 2
      );
    }
    
    // Value should have changed
    const newValue = await input.inputValue();
    expect(parseInt(newValue)).toBeGreaterThan(parseInt(initialValue));
  });

  test('Slider thumb has orange border and cursor styling', async ({ page }) => {
    await expect(page.getByTestId('mortgage-calculator')).toBeVisible();
    
    const slider = page.getByTestId('property-price-slider');
    await expect(slider).toBeVisible();
    
    const thumb = slider.locator('[role="slider"]');
    await expect(thumb).toBeVisible();
    
    // Check thumb has orange border (border-[#C2410C])
    await expect(thumb).toHaveClass(/border-\[#C2410C\]/);
    
    // Check thumb has cursor-grab
    await expect(thumb).toHaveClass(/cursor-grab/);
    
    // Check thumb size is h-5 w-5
    await expect(thumb).toHaveClass(/h-5/);
    await expect(thumb).toHaveClass(/w-5/);
  });

  test('Slider track shows orange filled portion', async ({ page }) => {
    await expect(page.getByTestId('mortgage-calculator')).toBeVisible();
    
    const slider = page.getByTestId('property-price-slider');
    await expect(slider).toBeVisible();
    
    // Check for orange range indicator (bg-[#C2410C])
    const range = slider.locator('.bg-\\[\\#C2410C\\]');
    await expect(range).toBeVisible();
  });

  test('Multiple sliders work on mortgage calculator', async ({ page }) => {
    await expect(page.getByTestId('mortgage-calculator')).toBeVisible();
    
    // Property Price slider
    await expect(page.getByTestId('property-price-slider')).toBeVisible();
    
    // Down Payment slider
    await expect(page.getByTestId('down-payment-slider')).toBeVisible();
    
    // Loan Term slider
    await expect(page.getByTestId('loan-term-slider')).toBeVisible();
    
    // Interest Rate slider
    await expect(page.getByTestId('interest-rate-slider')).toBeVisible();
    
    // Calculate button works
    const calcBtn = page.getByTestId('calculate-btn');
    await expect(calcBtn).toBeVisible();
    await calcBtn.click();
    
    // Result should appear
    await expect(page.getByTestId('mortgage-result')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('monthly-payment')).toContainText('$');
  });
});

test.describe('Lucide Icons Render Across Site', () => {
  test('Property cards show Bed, Bath, Maximize icons', async ({ page }) => {
    await page.goto('/properties', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    const card = page.locator('[data-testid^="property-card-"]').first();
    await expect(card).toBeVisible({ timeout: 10000 });
    
    // Check for bed/bath/area icons (all SVGs in the details section)
    const detailsSection = card.locator('.border-t.border-stone-100');
    await expect(detailsSection).toBeVisible();
    
    const icons = detailsSection.locator('svg');
    // Should have at least 3 icons: Bed, Bath, Maximize
    expect(await icons.count()).toBeGreaterThanOrEqual(3);
  });

  test('Homepage hero has icons for stats', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    const heroSection = page.getByTestId('hero-section');
    await expect(heroSection).toBeVisible();
    
    // Stats bar should have Home, Building, MapPin icons
    const statsBar = heroSection.locator('.grid.grid-cols-3');
    await expect(statsBar).toBeVisible();
    
    const icons = statsBar.locator('svg');
    await expect(icons).toHaveCount(3);
  });
});

test.describe('Admin Login Still Works', () => {
  test('Admin login with ishika@emergent.sh / test1234', async ({ page }) => {
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    await expect(page.getByTestId('admin-login-page')).toBeVisible();
    
    // Fill credentials
    await page.getByTestId('admin-email-input').fill('ishika@emergent.sh');
    await page.getByTestId('admin-password-input').fill('test1234');
    await page.getByTestId('admin-login-submit').click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 10000 });
    
    // Dashboard content is visible - check for Overview tab or dashboard elements
    await expect(page.locator('text=Overview')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Welcome')).toBeVisible();
  });
});

test.describe('Mobile Responsiveness', () => {
  test('Homepage is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    await expect(page.getByTestId('home-page')).toBeVisible();
    await expect(page.getByTestId('hero-section')).toBeVisible();
    
    // Mobile menu button should be visible
    await expect(page.getByTestId('mobile-menu-btn')).toBeVisible();
  });

  test('Testimonials stack vertically on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    
    const section = page.getByTestId('testimonials-section');
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible();
    
    // Grid should be grid-cols-1 on mobile
    const gridContainer = section.locator('.grid.grid-cols-1');
    await expect(gridContainer).toBeVisible();
  });
});
