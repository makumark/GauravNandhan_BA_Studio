# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: extract.spec.ts >> BA Studio Data Extraction >> Extract document contents
- Location: tests\e2e\extract.spec.ts:8:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

```

# Test source

```ts
  1  | import { test } from '@playwright/test';
  2  | import fs from 'fs';
  3  | import path from 'path';
  4  | 
  5  | test.describe('BA Studio Data Extraction', () => {
  6  |   test.setTimeout(300000); 
  7  | 
  8  |   test('Extract document contents', async ({ page }) => {
> 9  |     await page.goto('http://localhost:3000');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
  10 |     const momText = fs.readFileSync('mom.txt', 'utf-8');
  11 |     await page.fill('textarea', momText);
  12 |     await page.focus('textarea');
  13 |     await page.keyboard.press('Enter');
  14 |     await page.waitForTimeout(20000); 
  15 | 
  16 |     const tabs = ["BRD", "UML Diagrams", "Flowcharts", "Wireframes", "Prototypes"];
  17 |     const results: Record<string, string> = {};
  18 | 
  19 |     for (const tab of tabs) {
  20 |       await page.locator(`button:has-text("${tab}")`).first().click();
  21 |       
  22 |       // Wait for "Generating..." to disappear
  23 |       // Wait up to 30 seconds
  24 |       await page.waitForTimeout(30000);
  25 |       
  26 |       const content = await page.evaluate(() => {
  27 |         const div = document.getElementById('document-content');
  28 |         if (!div) return 'NO CONTENT DIV';
  29 |         
  30 |         // For diagrams, extract raw SVG or specific class
  31 |         const svg = div.querySelector('svg');
  32 |         if (svg) return 'SVG RENDERED: ' + svg.outerHTML.substring(0, 500);
  33 |         
  34 |         // Check for error fallback
  35 |         if (div.innerText.includes('Visual Engine Fallback')) return 'ERROR: Visual Engine Fallback';
  36 |         
  37 |         // For wireframes/prototypes, check for iframe or HTML blocks
  38 |         const rawHTML = div.innerHTML;
  39 |         if (rawHTML.includes('iframe')) return 'IFRAME RENDERED';
  40 |         
  41 |         return div.innerText.substring(0, 2000);
  42 |       });
  43 |       
  44 |       results[tab] = content;
  45 |       fs.writeFileSync('tests/e2e/extraction.json', JSON.stringify(results, null, 2));
  46 |     }
  47 |   });
  48 | });
  49 | 
```