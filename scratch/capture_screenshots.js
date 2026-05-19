import { chromium } from '@playwright/test';
import path from 'path';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  const outDir = process.argv[2] || '.';

  try {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    
    // Screenshot 1: Login Page
    await page.screenshot({ path: path.join(outDir, '01_login_page.png') });

    // Fill login credentials
    await page.fill('input[type="email"]', 'admin@example.com'); // Replace with valid test creds if needed, or bypass
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);

    // Screenshot 2: Main Dashboard
    await page.screenshot({ path: path.join(outDir, '02_main_dashboard.png') });

    // Type a message to trigger Chat/Analysis
    await page.fill('textarea', 'Create a new healthcare CRM system.');
    await page.click('button:has-text("Analyze")'); // Adjust selector as needed based on UI
    await page.waitForTimeout(5000);

    // Screenshot 3: Chat Interface
    await page.screenshot({ path: path.join(outDir, '03_chat_interface.png') });

    // Click Document Tab
    await page.click('button:has-text("BRD")');
    await page.waitForTimeout(3000);

    // Screenshot 4: Document Generation (BRD)
    await page.screenshot({ path: path.join(outDir, '04_brd_document.png') });

  } catch (error) {
    console.error("Error during screenshot capture:", error);
  } finally {
    await browser.close();
  }
})();
