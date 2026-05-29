# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: core-flow.spec.ts >> Gaurav Nandhan BA Studio - Core Flow >> should load prototype iframe correctly
- Location: tests\e2e\core-flow.spec.ts:36:7

# Error details

```
Error: expect(locator).not.toBeEmpty() failed

Locator: locator('iframe[title="Prototype Preview"]').contentFrame().locator('body')
Expected: not empty
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "not toBeEmpty" with timeout 5000ms
  - waiting for locator('iframe[title="Prototype Preview"]').contentFrame().locator('body')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - generic [ref=e4]:
        - img [ref=e6]
        - generic [ref=e14]:
          - heading "Gaurav Nandhan" [level=1] [ref=e15]
          - paragraph [ref=e17]: BA Studio
      - generic [ref=e18]:
        - generic [ref=e19]:
          - generic [ref=e20]:
            - heading "Workspace" [level=2] [ref=e21]
            - button "New Project" [ref=e22]:
              - img [ref=e23]
              - generic: New Project
          - navigation [ref=e24]:
            - button "BA Agent Chat" [ref=e25]:
              - img [ref=e26]
              - text: BA Agent Chat
            - button "Requirement Timeline" [ref=e28]:
              - img [ref=e29]
              - text: Requirement Timeline
            - button "Traceability Matrix" [ref=e33]:
              - img [ref=e34]
              - text: Traceability Matrix
        - generic [ref=e39]:
          - heading "Generated Documents" [level=2] [ref=e40]
          - navigation [ref=e41]:
            - button "BRD" [ref=e42]:
              - generic [ref=e43]:
                - img [ref=e44]
                - generic [ref=e47]: BRD
            - button "FRD" [ref=e49]:
              - generic [ref=e50]:
                - img [ref=e51]
                - generic [ref=e54]: FRD
            - button "PRD" [ref=e56]:
              - generic [ref=e57]:
                - img [ref=e58]
                - generic [ref=e61]: PRD
            - button "SRD" [ref=e63]:
              - generic [ref=e64]:
                - img [ref=e65]
                - generic [ref=e68]: SRD
            - button "Regulatory Advisor" [ref=e70]:
              - generic [ref=e71]:
                - img [ref=e72]
                - generic [ref=e74]: Regulatory Advisor
            - button "Executive Pitch" [ref=e76]:
              - generic [ref=e77]:
                - img [ref=e78]
                - generic [ref=e83]: Executive Pitch
            - button "Test Cases" [ref=e85]:
              - generic [ref=e86]:
                - img [ref=e87]
                - generic [ref=e89]: Test Cases
            - button "UML Diagrams" [ref=e91]:
              - generic [ref=e92]:
                - img [ref=e93]
                - generic [ref=e96]: UML Diagrams
            - button "Flowcharts" [ref=e98]:
              - generic [ref=e99]:
                - img [ref=e100]
                - generic [ref=e104]: Flowcharts
            - button "Wireframes" [ref=e106]:
              - generic [ref=e107]:
                - img [ref=e108]
                - generic [ref=e109]: Wireframes
            - button "Prototypes" [active] [ref=e111]:
              - generic [ref=e112]:
                - img [ref=e113]
                - generic [ref=e118]: Prototypes
      - button "Sign In to Save Work" [ref=e121]:
        - img [ref=e122]
        - text: Sign In to Save Work
    - main [ref=e125]:
      - generic [ref=e126]:
        - heading "Chat" [level=2] [ref=e127]:
          - img [ref=e128]
          - text: Chat
        - generic [ref=e131]:
          - button "Save Session" [ref=e132]:
            - img [ref=e133]
            - text: Save Session
          - button "Export All (PDF)" [ref=e137]:
            - img [ref=e138]
            - text: Export All (PDF)
          - generic [ref=e141]: Intelligence Online
      - generic [ref=e143]:
        - generic [ref=e144]:
          - generic [ref=e146]:
            - img [ref=e148]
            - paragraph [ref=e157]: Hello! I am Gaurav Nandhan BA Studio. I can help you create BRD, FRD, PRD, SRD, Wireframes, UML Diagrams, and Test Cases. Please paste your Minutes of Meeting (MOM) to begin, and let me know the domain you're targeting.
          - generic [ref=e161]:
            - button [ref=e162]:
              - img [ref=e163]
            - button [ref=e165]:
              - img [ref=e166]
            - textbox "Paste your MOM or requirements here..." [ref=e169]
            - button [disabled] [ref=e170]:
              - img [ref=e171]
        - complementary [ref=e174]:
          - heading "Intelligence Panel" [level=3] [ref=e176]:
            - img [ref=e177]
            - text: Intelligence Panel
          - generic [ref=e185]:
            - generic [ref=e186]:
              - img [ref=e188]
              - heading "Executive Impact Score" [level=4] [ref=e190]:
                - img [ref=e191]
                - text: Executive Impact Score
              - paragraph [ref=e193]: Awaiting analysis data.
            - generic [ref=e194]:
              - img [ref=e196]
              - heading "Strategic Moat Audit" [level=4] [ref=e198]:
                - img [ref=e199]
                - text: Strategic Moat Audit
              - paragraph [ref=e201]: No strategic moats identified yet.
            - generic [ref=e202]:
              - heading "Conflict Detector" [level=4] [ref=e203]:
                - img [ref=e204]
                - text: Conflict Detector
              - paragraph [ref=e206]: No conflicts detected.
            - generic [ref=e207]:
              - generic [ref=e208]:
                - img [ref=e209]
                - heading "Regulatory" [level=4] [ref=e211]
              - paragraph [ref=e212]: No regulatory flags detected.
            - generic [ref=e213]:
              - img [ref=e215]
              - heading "Logic Debugger" [level=4] [ref=e220]:
                - img [ref=e221]
                - text: Logic Debugger
              - paragraph [ref=e226]: No logic issues detected.
            - generic [ref=e227]:
              - img [ref=e229]
              - heading "Gap Analysis" [level=4] [ref=e232]:
                - img [ref=e233]
                - text: Gap Analysis
              - paragraph [ref=e236]: No requirement gaps identified.
            - generic [ref=e237]:
              - generic [ref=e238]:
                - img [ref=e239]
                - heading "Billion Dollar Opportunities" [level=3] [ref=e242]
              - paragraph [ref=e243]: No opportunities identified yet.
            - generic [ref=e244]:
              - generic [ref=e245]:
                - img [ref=e246]
                - heading "SME Insight" [level=4] [ref=e249]
              - paragraph [ref=e250]: No SME insights yet.
            - generic [ref=e251]:
              - img [ref=e253]
              - heading "Cascading Impact Alert" [level=4] [ref=e255]:
                - img [ref=e256]
                - text: Cascading Impact Alert
              - paragraph [ref=e258]: No cascading impacts detected.
            - generic [ref=e259]:
              - generic [ref=e260]:
                - img [ref=e261]
                - heading "Impact Analysis" [level=4] [ref=e265]
              - paragraph [ref=e266]: No scope changes tracked yet.
            - generic [ref=e267]:
              - img [ref=e269]
              - heading "Knowledge Graph" [level=4] [ref=e274]:
                - img [ref=e275]
                - text: Knowledge Graph
              - paragraph [ref=e280]: No graph nodes mapped yet.
  - alert [ref=e281]
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
  37 |     await page.goto('/');
  38 |     // Assuming a project is already loaded or we just click a tab if state persists
  39 |     const protoTab = page.getByText('Prototypes');
  40 |     if (await protoTab.isVisible()) {
  41 |       await protoTab.click();
  42 |       const iframe = page.frameLocator('iframe[title="Prototype Preview"]');
> 43 |       await expect(iframe.locator('body')).not.toBeEmpty();
     |                                                ^ Error: expect(locator).not.toBeEmpty() failed
  44 |     }
  45 |   });
  46 | });
  47 | 
```