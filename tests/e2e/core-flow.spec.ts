import { test, expect } from '@playwright/test';

test.describe('Gaurav Nandhan BA Studio - Core Flow', () => {
  test('should load landing page and show greeting', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Gaurav Nandhan');
    await expect(page.getByText('I am Gaurav Nandhan BA Studio')).toBeVisible();
  });

  test('should generate documents from MOM', async ({ page }) => {
    await page.goto('/');
    
    // Simulate pasting MOM
    const momText = "Requirement: Lead Status Automation for Salesforce. Trigger on Qualify.";
    await page.fill('textarea[placeholder*="Paste your MOM"]', momText);
    await page.click('button:has(svg.lucide-send), button:has(svg.lucide-arrow-up)');

    // Wait for AI response
    await page.waitForSelector('.prose-invert');
    
    // Check if tabs are enabled
    const brdTab = page.getByText('BRD');
    await expect(brdTab).toBeEnabled();
    
    // Click BRD and verify content
    await brdTab.click();
    await expect(page.getByText('Processing...')).toBeVisible();
    await page.waitForSelector('#document-content', { timeout: 30000 });
    
    // Verify Mermaid renders if UML is clicked
    const umlTab = page.getByText('UML Diagrams');
    await umlTab.click();
    await page.waitForSelector('.mermaid svg', { timeout: 30000 });
  });

  test('should load prototype iframe correctly', async ({ page }) => {
    await page.goto('/');
    // Assuming a project is already loaded or we just click a tab if state persists
    const protoTab = page.getByText('Prototypes');
    if (await protoTab.isVisible()) {
      await protoTab.click();
      const iframe = page.frameLocator('iframe[title="Prototype Preview"]');
      await expect(iframe.locator('body')).not.toBeEmpty();
    }
  });
});
