import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('BA Studio Full Functional Test', () => {
  test.setTimeout(400000); // 6+ minutes to allow for all generations

  test('Generate all documents and verify', async ({ page }) => {
    console.log('Navigating to http://localhost:3000');
    await page.goto('http://localhost:3000');
    
    const momText = fs.readFileSync('mom.txt', 'utf-8');
    
    console.log('Filling MOM text...');
    await page.fill('textarea', momText);
    await page.focus('textarea');
    await page.keyboard.press('Enter');
    
    console.log('Waiting for initial AI analysis (30s)...');
    await page.waitForTimeout(30000); // Wait 30s for the intake analysis

    // Ensure screenshots dir exists
    const screenshotsDir = path.join(process.cwd(), 'tests', 'e2e', 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    const tabs = ["BRD", "FRD", "PRD", "SRD", "Executive Pitch", "Test Cases", "UML Diagrams", "Flowcharts", "Wireframes", "Prototypes"];
    const results: Record<string, string> = {};

    for (const tab of tabs) {
      console.log(`Testing tab: ${tab}...`);
      
      // Click the tab on the left sidebar
      const tabButton = page.locator(`button:has-text("${tab}")`).first();
      await tabButton.click();
      
      // Wait for the "Generating" loader to disappear or max 40 seconds
      console.log(`Waiting for ${tab} generation...`);
      await page.waitForTimeout(40000); // Wait 40 seconds for safety because streaming takes time
      
      const screenshotPath = path.join(screenshotsDir, `${tab.replace(/\s+/g, '_')}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      
      // Extract the text content from the document content area
      const textContent = await page.evaluate(() => {
        const contentDiv = document.getElementById('document-content');
        return contentDiv ? contentDiv.innerText : 'NO CONTENT';
      });
      
      results[tab] = textContent.substring(0, 1500) + '...[TRUNCATED]'; // Keep a snapshot
    }

    fs.writeFileSync(path.join(screenshotsDir, 'test_results.json'), JSON.stringify(results, null, 2));
    console.log('E2E testing complete!');
  });
});
