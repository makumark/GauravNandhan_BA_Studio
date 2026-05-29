# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: core-flow.spec.ts >> Gaurav Nandhan BA Studio - Core Flow >> should generate documents from MOM
- Location: tests\e2e\core-flow.spec.ts:10:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForSelector: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('.prose-invert') to be visible

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
          - generic [ref=e40]:
            - heading "SME Readiness" [level=2] [ref=e41]:
              - img [ref=e42]
              - text: SME Readiness
            - generic [ref=e45]: 1/7
          - generic [ref=e48]:
            - generic "domain Feasibility" [ref=e49]
            - generic "stakeholder Clarity" [ref=e50]
            - generic "core Process" [ref=e51]
            - generic "success Criteria" [ref=e52]
            - generic "scope Boundary" [ref=e53]
            - generic "integration Points" [ref=e54]
            - generic "non Functional Needs" [ref=e55]
          - generic [ref=e56]:
            - img [ref=e57]
            - generic [ref=e65]: CRM
        - generic [ref=e66]:
          - heading "Generated Documents" [level=2] [ref=e67]
          - navigation [ref=e68]:
            - button "BRD" [ref=e69]:
              - generic [ref=e70]:
                - img [ref=e71]
                - generic [ref=e74]: BRD
            - button "FRD" [ref=e76]:
              - generic [ref=e77]:
                - img [ref=e78]
                - generic [ref=e81]: FRD
            - button "PRD" [ref=e83]:
              - generic [ref=e84]:
                - img [ref=e85]
                - generic [ref=e88]: PRD
            - button "SRD" [ref=e90]:
              - generic [ref=e91]:
                - img [ref=e92]
                - generic [ref=e95]: SRD
            - button "Regulatory Advisor" [ref=e97]:
              - generic [ref=e98]:
                - img [ref=e99]
                - generic [ref=e101]: Regulatory Advisor
            - button "Executive Pitch" [ref=e103]:
              - generic [ref=e104]:
                - img [ref=e105]
                - generic [ref=e110]: Executive Pitch
            - button "Test Cases" [ref=e112]:
              - generic [ref=e113]:
                - img [ref=e114]
                - generic [ref=e116]: Test Cases
            - button "UML Diagrams" [ref=e118]:
              - generic [ref=e119]:
                - img [ref=e120]
                - generic [ref=e123]: UML Diagrams
            - button "Flowcharts" [ref=e125]:
              - generic [ref=e126]:
                - img [ref=e127]
                - generic [ref=e131]: Flowcharts
            - button "Wireframes" [ref=e133]:
              - generic [ref=e134]:
                - img [ref=e135]
                - generic [ref=e136]: Wireframes
            - button "Prototypes" [ref=e138]:
              - generic [ref=e139]:
                - img [ref=e140]
                - generic [ref=e145]: Prototypes
      - button "Sign In to Save Work" [ref=e148]:
        - img [ref=e149]
        - text: Sign In to Save Work
    - main [ref=e152]:
      - generic [ref=e153]:
        - heading "Chat" [level=2] [ref=e154]:
          - img [ref=e155]
          - text: Chat
        - generic [ref=e158]:
          - button "Save Session" [ref=e159]:
            - img [ref=e160]
            - text: Save Session
          - button "Export All (PDF)" [ref=e164]:
            - img [ref=e165]
            - text: Export All (PDF)
          - generic [ref=e168]: Intelligence Online
      - generic [ref=e170]:
        - generic [ref=e171]:
          - generic [ref=e172]:
            - generic [ref=e173]:
              - img [ref=e175]
              - paragraph [ref=e184]: Hello! I am Gaurav Nandhan BA Studio. I can help you create BRD, FRD, PRD, SRD, Wireframes, UML Diagrams, and Test Cases. Please paste your Minutes of Meeting (MOM) to begin, and let me know the domain you're targeting.
            - generic [ref=e185]:
              - img [ref=e187]
              - paragraph [ref=e191]: "Requirement: Lead Status Automation for Salesforce. Trigger on Qualify."
            - generic [ref=e192]:
              - img [ref=e194]
              - generic [ref=e202]:
                - paragraph [ref=e203]: "Thank you for providing the requirement: \"Lead Status Automation for Salesforce. Trigger on Qualify.\" This is a great starting point."
                - paragraph [ref=e204]: "To ensure we fully understand the scope and business value of this automation, let's clarify a few points:"
                - list [ref=e205]:
                  - listitem [ref=e206]:
                    - strong [ref=e207]: "Defining \"Qualify\":"
                    - text: What specific actions, criteria, or field updates in Salesforce signify that a lead has been "Qualified"? For example, is it a change in a specific picklist value, the completion of a task, or meeting certain data criteria?
                  - listitem [ref=e208]:
                    - strong [ref=e209]: "Desired Automation Outcome:"
                    - text: Once a lead is "Qualified," what specific lead status (or sequence of statuses) should be automatically applied? Are there any other automated actions expected, such as assigning the lead, creating a task, or updating other related fields?
                  - listitem [ref=e210]:
                    - strong [ref=e211]: "Current Process:"
                    - text: Could you describe the current process for managing lead statuses, particularly around the "Qualify" stage? What are the pain points or inefficiencies this automation aims to resolve?
                  - listitem [ref=e212]:
                    - strong [ref=e213]: "Business Objective:"
                    - text: What is the primary business objective behind automating this process? For instance, is it to improve sales efficiency, ensure data consistency, or enhance reporting accuracy?
          - generic [ref=e217]:
            - button [ref=e218]:
              - img [ref=e219]
            - button [ref=e221]:
              - img [ref=e222]
            - textbox "Paste your MOM or requirements here..." [ref=e225]
            - button [disabled] [ref=e226]:
              - img [ref=e227]
        - complementary [ref=e230]:
          - heading "Intelligence Panel" [level=3] [ref=e232]:
            - img [ref=e233]
            - text: Intelligence Panel
          - generic [ref=e241]:
            - generic [ref=e242]:
              - img [ref=e244]
              - heading "Executive Impact Score" [level=4] [ref=e246]:
                - img [ref=e247]
                - text: Executive Impact Score
              - generic [ref=e249]:
                - generic [ref=e251]:
                  - generic [ref=e252]: Business Value
                  - generic [ref=e253]: 5/10
                - generic [ref=e257]:
                  - generic [ref=e258]: Feasibility
                  - generic [ref=e259]: 8/10
                - generic [ref=e263]:
                  - generic [ref=e264]: Alignment
                  - generic [ref=e265]: 5/10
            - generic [ref=e268]:
              - img [ref=e270]
              - heading "Strategic Moat Audit" [level=4] [ref=e272]:
                - img [ref=e273]
                - text: Strategic Moat Audit
              - paragraph [ref=e275]: No strategic moats identified yet.
            - generic [ref=e276]:
              - heading "Conflict Detector" [level=4] [ref=e277]:
                - img [ref=e278]
                - text: Conflict Detector
              - paragraph [ref=e280]: No conflicts detected.
            - generic [ref=e281]:
              - generic [ref=e282]:
                - img [ref=e283]
                - heading "Regulatory" [level=4] [ref=e285]
              - paragraph [ref=e286]: No regulatory flags detected.
            - generic [ref=e287]:
              - img [ref=e289]
              - heading "Logic Debugger" [level=4] [ref=e294]:
                - img [ref=e295]
                - text: Logic Debugger
              - paragraph [ref=e300]: No logic issues detected.
            - generic [ref=e301]:
              - img [ref=e303]
              - heading "Gap Analysis" [level=4] [ref=e306]:
                - img [ref=e307]
                - text: Gap Analysis
              - generic [ref=e310]:
                - generic [ref=e311]:
                  - generic [ref=e312]: Core Process Gap
                  - paragraph [ref=e314]: "\"Detailed 'To-Be' workflow for lead status changes.\""
                - generic [ref=e315]:
                  - generic [ref=e316]: Data Gap
                  - paragraph [ref=e318]: "\"Specific lead status values and their definitions.\""
                - generic [ref=e319]:
                  - generic [ref=e320]: UX Gap
                  - paragraph [ref=e322]: "\"How users will interact with or be notified of this automation.\""
              - button "Auto-Fill Gap Prompts" [ref=e323]
            - generic [ref=e324]:
              - generic [ref=e325]:
                - img [ref=e326]
                - heading "Billion Dollar Opportunities" [level=3] [ref=e329]
              - paragraph [ref=e330]: No opportunities identified yet.
            - generic [ref=e331]:
              - generic [ref=e332]:
                - img [ref=e333]
                - heading "SME Insight" [level=4] [ref=e336]
              - paragraph [ref=e337]: Automating lead status transitions can significantly improve sales process efficiency and data hygiene, but requires clear definitions of qualification criteria to avoid miscategorization.
              - button "Explore deeper" [ref=e338]
            - generic [ref=e339]:
              - img [ref=e341]
              - heading "Cascading Impact Alert" [level=4] [ref=e343]:
                - img [ref=e344]
                - text: Cascading Impact Alert
              - paragraph [ref=e346]: No cascading impacts detected.
            - generic [ref=e347]:
              - generic [ref=e348]:
                - img [ref=e349]
                - heading "Impact Analysis" [level=4] [ref=e353]
              - paragraph [ref=e354]: No scope changes tracked yet.
            - generic [ref=e355]:
              - img [ref=e357]
              - heading "Knowledge Graph" [level=4] [ref=e362]:
                - img [ref=e363]
                - text: Knowledge Graph
              - generic [ref=e369]:
                - generic [ref=e370]: REQUIREMENT
                - generic [ref=e371]: 1 node
              - generic [ref=e372]: 0 relationships mapped
  - alert [ref=e373]
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
> 19 |     await page.waitForSelector('.prose-invert');
     |                ^ Error: page.waitForSelector: Test timeout of 30000ms exceeded.
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
  43 |       await expect(iframe.locator('body')).not.toBeEmpty();
  44 |     }
  45 |   });
  46 | });
  47 | 
```