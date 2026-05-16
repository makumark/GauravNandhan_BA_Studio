const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Navigating to Live Studio...');
    await page.goto('https://gaurav-nandhan-ba-studio.vercel.app/');
    
    // 1. Check if landing page is up
    const title = await page.title();
    console.log(`Page Title: ${title}`);

    // 2. Load MOM
    const mom = fs.readFileSync('tests/mom_test.txt', 'utf-8');
    
    // 3. Find Input and Send
    console.log('Injecting Insurance MOM...');
    await page.fill('textarea[placeholder*="paste your Minutes of Meeting"]', mom);
    await page.click('button:has(svg.lucide-send)');
    
    // 4. Wait for AI response
    console.log('Waiting for AI Analysis...');
    await page.waitForTimeout(15000); // Wait for initial analysis
    
    // 5. Verify Documents Sidebar
    console.log('Verifying Sidebar Documents...');
    const brdVisible = await page.isVisible('button:has-text("BRD")');
    const regVisible = await page.isVisible('button:has-text("Regulatory Advisor")');
    
    console.log(`BRD Tab Present: ${brdVisible}`);
    console.log(`Regulatory Advisor Tab Present: ${regVisible}`);

    if (brdVisible && regVisible) {
      console.log('VERIFICATION SUCCESSFUL: Pipeline is stable.');
    } else {
      console.log('VERIFICATION FAILED: Documents not appearing.');
    }

  } catch (err) {
    console.error('VERIFICATION ERROR:', err.message);
  } finally {
    await browser.close();
  }
})();
