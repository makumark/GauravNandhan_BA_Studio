const { chromium } = require('playwright');
const path = require('path');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log("Navigating to http://localhost:3000...");
  await page.goto('http://localhost:3000');
  
  // Wait for the app to load
  await page.waitForTimeout(2000);

  const outDir = 'C:\\Users\\pavan\\.gemini\\antigravity\\brain\\271f03ef-a885-4338-98d7-915637a21c04';

  console.log("Taking full page screenshot...");
  await page.screenshot({ path: path.join(outDir, 'dashboard.png') });

  console.log("Switching to Traceability Matrix tab...");
  // Click the Traceability Matrix tab
  try {
    await page.getByRole('button', { name: /Traceability Matrix/i }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, 'traceability_tab.png') });
  } catch(e) {
    console.log("Could not find Traceability Matrix tab:", e.message);
  }

  console.log("Taking screenshot of the right sidebar...");
  try {
    const sidebar = await page.locator('aside').nth(1); // Right sidebar
    await sidebar.screenshot({ path: path.join(outDir, 'sidebar_features.png') });
  } catch(e) {
    console.log("Could not find sidebar:", e.message);
  }

  await browser.close();
  console.log("Done.");
}

run().catch(console.error);
