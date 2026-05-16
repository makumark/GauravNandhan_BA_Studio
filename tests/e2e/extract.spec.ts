import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('BA Studio Data Extraction', () => {
  test.setTimeout(300000); 

  test('Extract document contents', async ({ page }) => {
    await page.goto('http://localhost:3000');
    const momText = fs.readFileSync('mom.txt', 'utf-8');
    await page.fill('textarea', momText);
    await page.focus('textarea');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(20000); 

    const tabs = ["BRD", "UML Diagrams", "Flowcharts", "Wireframes", "Prototypes"];
    const results: Record<string, string> = {};

    for (const tab of tabs) {
      await page.locator(`button:has-text("${tab}")`).first().click();
      
      // Wait for "Generating..." to disappear
      // Wait up to 30 seconds
      await page.waitForTimeout(30000);
      
      const content = await page.evaluate(() => {
        const div = document.getElementById('document-content');
        if (!div) return 'NO CONTENT DIV';
        
        // For diagrams, extract raw SVG or specific class
        const svg = div.querySelector('svg');
        if (svg) return 'SVG RENDERED: ' + svg.outerHTML.substring(0, 500);
        
        // Check for error fallback
        if (div.innerText.includes('Visual Engine Fallback')) return 'ERROR: Visual Engine Fallback';
        
        // For wireframes/prototypes, check for iframe or HTML blocks
        const rawHTML = div.innerHTML;
        if (rawHTML.includes('iframe')) return 'IFRAME RENDERED';
        
        return div.innerText.substring(0, 2000);
      });
      
      results[tab] = content;
      fs.writeFileSync('tests/e2e/extraction.json', JSON.stringify(results, null, 2));
    }
  });
});
