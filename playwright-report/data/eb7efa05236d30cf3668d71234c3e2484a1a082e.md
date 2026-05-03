# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: core-flow.spec.ts >> Gaurav Nandhan BA Studio - Core Flow >> should load prototype iframe correctly
- Location: tests\e2e\core-flow.spec.ts:36:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "https://gaurav-nandhan-ba-studio.vercel.app/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Gaurav Nandhan BA Studio - Core Flow', () => {
  4  |   test('should load landing page and show greeting', async ({ page }) => {
  5  |     await page.goto('/');
  6  |     await expect(page.locator('h1')).toContainText('Gaurav Nandhan');
  7  |     await expect(page.getByText('I am Gaurav Nandhan BA Studio')).toBeVisible();
  8  |   });
  9  | 
  10 |   test('should generate documents from MOM', async ({ page }) => {
  11 |     await page.goto('/');
  12 |     
  13 |     // Simulate pasting MOM
  14 |     const momText = "Requirement: Lead Status Automation for Salesforce. Trigger on Qualify.";
  15 |     await page.fill('textarea[placeholder*="Paste your MOM"]', momText);
  16 |     await page.click('button:has(svg.lucide-send), button:has(svg.lucide-arrow-up)');
  17 | 
  18 |     // Wait for AI response
  19 |     await page.waitForSelector('.prose-invert');
  20 |     
  21 |     // Check if tabs are enabled
  22 |     const brdTab = page.getByText('BRD');
  23 |     await expect(brdTab).toBeEnabled();
  24 |     
  25 |     // Click BRD and verify content
  26 |     await brdTab.click();
  27 |     await expect(page.getByText('Processing...')).toBeVisible();
  28 |     await page.waitForSelector('#document-content', { timeout: 30000 });
  29 |     
  30 |     // Verify Mermaid renders if UML is clicked
  31 |     const umlTab = page.getByText('UML Diagrams');
  32 |     await umlTab.click();
  33 |     await page.waitForSelector('.mermaid svg', { timeout: 30000 });
  34 |   });
  35 | 
  36 |   test('should load prototype iframe correctly', async ({ page }) => {
> 37 |     await page.goto('/');
     |                ^ Error: page.goto: Test timeout of 30000ms exceeded.
  38 |     // Assuming a project is already loaded or we just click a tab if state persists
  39 |     const protoTab = page.getByText('Prototypes');
  40 |     if (await protoTab.isVisible()) {
  41 |       await protoTab.click();
  42 |       const iframe = page.frameLocator('iframe[title="Prototype Preview"]');
  43 |       await expect(iframe.locator('body')).not.toBeEmpty();
  44 |     }
  45 |   });
  46 | });
  47 | 
```