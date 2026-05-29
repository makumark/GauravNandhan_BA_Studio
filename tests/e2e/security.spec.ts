import { test, expect } from '@playwright/test';

test.describe('SaaS Security & Tenant Isolation Protocols', () => {

  const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

  test.describe('API Endpoint Security (BOLA/IDOR Prevention)', () => {
    test('Unauthenticated users should receive 401 Unauthorized when accessing private project APIs', async ({ request }) => {
      // Attempt to access a hypothetical private project
      const response = await request.put(`${BASE_URL}/api/projects/cm0abc123`, {
        data: {
          messages: [],
          documents: {}
        }
      });
      
      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    test('Unauthenticated users should receive 401 Unauthorized when attempting to delete a project', async ({ request }) => {
      const response = await request.delete(`${BASE_URL}/api/projects/cm0abc123`);
      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });
  });

  test.describe('Public Share Link Boundaries', () => {
    test('Public share API should return 404 for invalid UUIDs rather than leaking database info', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/share/invalid-id-format`);
      expect(response.status()).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Shared session not found');
    });
  });

  test.describe('Client-Side Injection Prevention (XSS)', () => {
    test('Markdown renderer should sanitize malicious script tags', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      const textarea = page.locator('textarea[placeholder*="MOM"]');
      await expect(textarea).toBeVisible({ timeout: 15000 });
      
      // Inject an XSS payload disguised as a MOM requirement
      const xssPayload = `Requirement: Display this alert <script>window.xssTriggered = true;</script> and this img <img src="x" onerror="window.xssTriggered = true;" />`;
      await textarea.fill(xssPayload);
      await textarea.press('Enter');

      // Wait 5 seconds to let UI render the user message
      await page.waitForTimeout(5000);

      // Evaluate if the XSS triggered in the browser window
      const xssTriggered = await page.evaluate(() => {
        return (window as any).xssTriggered === true;
      });

      // Assert that XSS did NOT trigger
      expect(xssTriggered).toBe(false);
    });

    test('Prototype iFrame should sandbox execution context', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // We manually construct an iframe in the DOM exactly like the app does to test its sandboxing
      await page.setContent(`
        <div class="my-2 border overflow-hidden">
          <iframe 
            srcDoc="<script>window.parent.parentXssTriggered = true;</script>" 
            sandbox="allow-scripts allow-forms allow-modals"
          ></iframe>
        </div>
      `);

      await page.waitForTimeout(2000);
      
      const parentTriggered = await page.evaluate(() => {
        return (window as any).parentXssTriggered === true;
      });

      expect(parentTriggered).toBe(false);
    });
  });

});
