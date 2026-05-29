# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: full_test.spec.ts >> BA Studio Full Functional Test >> Generate all documents and verify
- Location: tests\e2e\full_test.spec.ts:8:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import fs from 'fs';
  3  | import path from 'path';
  4  | 
  5  | test.describe('BA Studio Full Functional Test', () => {
  6  |   test.setTimeout(400000); // 6+ minutes to allow for all generations
  7  | 
  8  |   test('Generate all documents and verify', async ({ page }) => {
  9  |     console.log('Navigating to http://localhost:3000');
> 10 |     await page.goto('http://localhost:3000');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
  11 |     
  12 |     const momText = fs.readFileSync('mom.txt', 'utf-8');
  13 |     
  14 |     console.log('Filling MOM text...');
  15 |     await page.fill('textarea', momText);
  16 |     await page.focus('textarea');
  17 |     await page.keyboard.press('Enter');
  18 |     
  19 |     console.log('Waiting for initial AI analysis (30s)...');
  20 |     await page.waitForTimeout(30000); // Wait 30s for the intake analysis
  21 | 
  22 |     // Ensure screenshots dir exists
  23 |     const screenshotsDir = path.join(process.cwd(), 'tests', 'e2e', 'screenshots');
  24 |     if (!fs.existsSync(screenshotsDir)) {
  25 |       fs.mkdirSync(screenshotsDir, { recursive: true });
  26 |     }
  27 | 
  28 |     const tabs = ["BRD", "FRD", "PRD", "SRD", "Executive Pitch", "Test Cases", "UML Diagrams", "Flowcharts", "Wireframes", "Prototypes"];
  29 |     const results: Record<string, string> = {};
  30 | 
  31 |     for (const tab of tabs) {
  32 |       console.log(`Testing tab: ${tab}...`);
  33 |       
  34 |       // Click the tab on the left sidebar
  35 |       const tabButton = page.locator(`button:has-text("${tab}")`).first();
  36 |       await tabButton.click();
  37 |       
  38 |       // Wait for the "Generating" loader to disappear or max 40 seconds
  39 |       console.log(`Waiting for ${tab} generation...`);
  40 |       await page.waitForTimeout(40000); // Wait 40 seconds for safety because streaming takes time
  41 |       
  42 |       const screenshotPath = path.join(screenshotsDir, `${tab.replace(/\s+/g, '_')}.png`);
  43 |       await page.screenshot({ path: screenshotPath, fullPage: true });
  44 |       
  45 |       // Extract the text content from the document content area
  46 |       const textContent = await page.evaluate(() => {
  47 |         const contentDiv = document.getElementById('document-content');
  48 |         return contentDiv ? contentDiv.innerText : 'NO CONTENT';
  49 |       });
  50 |       
  51 |       results[tab] = textContent.substring(0, 1500) + '...[TRUNCATED]'; // Keep a snapshot
  52 |     }
  53 | 
  54 |     fs.writeFileSync(path.join(screenshotsDir, 'test_results.json'), JSON.stringify(results, null, 2));
  55 |     console.log('E2E testing complete!');
  56 |   });
  57 | });
  58 | 
```