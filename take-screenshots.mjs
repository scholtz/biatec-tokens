import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Screenshot 1: Homepage
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('domcontentloaded');
  await page.screenshot({ path: 'screenshot-homepage.png', fullPage: false });
  console.log('✅ Screenshot 1: Homepage saved');

  // Screenshot 2: Sign In Modal with Email/Password Form
  const signInButton = page.locator('button:has-text("Sign In")').first();
  const isVisible = await signInButton.isVisible().catch(() => false);
  
  if (isVisible) {
    await signInButton.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshot-signin-modal.png', fullPage: false });
    console.log('✅ Screenshot 2: Sign In Modal saved');

    // Screenshot 3: Email/Password Form Close-up
    const emailInput = page.locator('input[type="email"]');
    const formVisible = await emailInput.isVisible().catch(() => false);
    
    if (formVisible) {
      // Fill the form to show validation state
      await emailInput.fill('test@example.com');
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.screenshot({ path: 'screenshot-form-filled.png', fullPage: false });
      console.log('✅ Screenshot 3: Form Filled saved');
    }
  }

  // Screenshot 4: Network Selection (set network first)
  await page.evaluate(() => {
    localStorage.setItem('selected_network', 'algorand-testnet');
  });
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  await page.screenshot({ path: 'screenshot-network-persisted.png', fullPage: false });
  console.log('✅ Screenshot 4: Network Persisted saved');

  await browser.close();
  console.log('\n✅ All screenshots captured successfully!');
})();
