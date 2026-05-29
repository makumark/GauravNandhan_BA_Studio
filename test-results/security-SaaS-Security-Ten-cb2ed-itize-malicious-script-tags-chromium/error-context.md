# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: security.spec.ts >> SaaS Security & Tenant Isolation Protocols >> Client-Side Injection Prevention (XSS) >> Markdown renderer should sanitize malicious script tags
- Location: tests\e2e\security.spec.ts:40:9

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('SaaS Security & Tenant Isolation Protocols', () => {
  4  | 
  5  |   const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
  6  | 
  7  |   test.describe('API Endpoint Security (BOLA/IDOR Prevention)', () => {
  8  |     test('Unauthenticated users should receive 401 Unauthorized when accessing private project APIs', async ({ request }) => {
  9  |       // Attempt to access a hypothetical private project
  10 |       const response = await request.put(`${BASE_URL}/api/projects/cm0abc123`, {
  11 |         data: {
  12 |           messages: [],
  13 |           documents: {}
  14 |         }
  15 |       });
  16 |       
  17 |       expect(response.status()).toBe(401);
  18 |       const data = await response.json();
  19 |       expect(data.error).toBe('Unauthorized');
  20 |     });
  21 | 
  22 |     test('Unauthenticated users should receive 401 Unauthorized when attempting to delete a project', async ({ request }) => {
  23 |       const response = await request.delete(`${BASE_URL}/api/projects/cm0abc123`);
  24 |       expect(response.status()).toBe(401);
  25 |       const data = await response.json();
  26 |       expect(data.error).toBe('Unauthorized');
  27 |     });
  28 |   });
  29 | 
  30 |   test.describe('Public Share Link Boundaries', () => {
  31 |     test('Public share API should return 404 for invalid UUIDs rather than leaking database info', async ({ request }) => {
  32 |       const response = await request.get(`${BASE_URL}/api/share/invalid-id-format`);
  33 |       expect(response.status()).toBe(404);
  34 |       const data = await response.json();
  35 |       expect(data.error).toBe('Shared session not found');
  36 |     });
  37 |   });
  38 | 
  39 |   test.describe('Client-Side Injection Prevention (XSS)', () => {
  40 |     test('Markdown renderer should sanitize malicious script tags', async ({ page }) => {
> 41 |       await page.goto(BASE_URL);
     |                  ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
  42 |       await page.waitForLoadState('networkidle');
  43 | 
  44 |       const textarea = page.locator('textarea[placeholder*="MOM"]');
  45 |       await expect(textarea).toBeVisible({ timeout: 15000 });
  46 |       
  47 |       // Inject an XSS payload disguised as a MOM requirement
  48 |       const xssPayload = `Requirement: Display this alert <script>window.xssTriggered = true;</script> and this img <img src="x" onerror="window.xssTriggered = true;" />`;
  49 |       await textarea.fill(xssPayload);
  50 |       await textarea.press('Enter');
  51 | 
  52 |       // Wait 5 seconds to let UI render the user message
  53 |       await page.waitForTimeout(5000);
  54 | 
  55 |       // Evaluate if the XSS triggered in the browser window
  56 |       const xssTriggered = await page.evaluate(() => {
  57 |         return (window as any).xssTriggered === true;
  58 |       });
  59 | 
  60 |       // Assert that XSS did NOT trigger
  61 |       expect(xssTriggered).toBe(false);
  62 |     });
  63 | 
  64 |     test('Prototype iFrame should sandbox execution context', async ({ page }) => {
  65 |       await page.goto(BASE_URL);
  66 |       
  67 |       // We manually construct an iframe in the DOM exactly like the app does to test its sandboxing
  68 |       await page.setContent(`
  69 |         <div class="my-2 border overflow-hidden">
  70 |           <iframe 
  71 |             srcDoc="<script>window.parent.parentXssTriggered = true;</script>" 
  72 |             sandbox="allow-scripts allow-forms allow-modals"
  73 |           ></iframe>
  74 |         </div>
  75 |       `);
  76 | 
  77 |       await page.waitForTimeout(2000);
  78 |       
  79 |       const parentTriggered = await page.evaluate(() => {
  80 |         return (window as any).parentXssTriggered === true;
  81 |       });
  82 | 
  83 |       expect(parentTriggered).toBe(false);
  84 |     });
  85 |   });
  86 | 
  87 | });
  88 | 
```