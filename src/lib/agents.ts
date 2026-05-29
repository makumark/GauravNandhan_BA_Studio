export const GOLD_STANDARD_EXAMPLES: Record<string, string> = {
  'JSON UI Component': `
### GOLD STANDARD: JSON UI COMPONENT SCHEMA
Example: "Application Dashboard"
\`\`\`json
{
  "screens": [
    {
      "id": "dashboard",
      "title": "Main Dashboard",
      "layout": "sidebar-main",
      "components": [
        { "type": "nav", "links": ["Dashboard", "Settings"] },
        { "type": "card", "title": "Total Revenue", "value": "$50,000", "theme": "primary" },
        { "type": "table", "columns": ["Name", "Status"], "rows": [["Initial Corp", "Approved"]] }
      ]
    }
  ]
}
\`\`\`
`,
  'HTML Template': `
### GOLD STANDARD: HTML TEMPLATE
Example: "Application Dashboard"
\`\`\`html
<div class="min-h-screen bg-slate-900 text-white p-8" x-data="{ open: false }">
  <nav class="flex justify-between items-center mb-8">
    <h1 class="text-2xl font-bold">Dashboard</h1>
    <button @click="open = !open" class="px-4 py-2 bg-blue-600 rounded">Menu</button>
  </nav>
  <div x-show="open" class="p-4 bg-slate-800 rounded mb-4">
     <p>Menu is open!</p>
  </div>
  <div class="grid grid-cols-2 gap-4">
    <div class="p-6 bg-slate-800 rounded shadow">
      <h2 class="text-xl">Revenue</h2>
      <p class="text-3xl font-bold">$50,000</p>
    </div>
  </div>
</div>
\`\`\`
`,
  'Mermaid': `
### GOLD STANDARD: FLOWCHART (MERMAID)
Example: "Order Fulfillment Logic"
\`\`\`mermaid
graph TD
  A["Customer Order"] --> B{"Stock Check"}
  B -- "In Stock" --> C["Reserve Items"]
  B -- "OOS" --> D["Trigger Restock"]
  C --> E["Payment Processing"]
  E --> F["Ship Order"]
\`\`\`
`,
  'PlantUML': `
### GOLD STANDARD: UML (PLANTUML) - CORRECT SYNTAX
\`\`\`plantuml
@startuml
left to right direction
actor "Doctor" as D
actor "Admin" as A
package "Hospital System" {
  usecase "View Records" as UC1
  usecase "Update Meds" as UC2
}
D --> UC1
D --> UC2
A --> UC1
@enduml
\`\`\`
`
};

// ── Global Decision Partner Rules ──────────────────────────────
export const DECISION_PARTNER_INSTRUCTION = `
MANDATORY DECISION PARTNER PROTOCOL:
As the absolute FINAL line of your response (after all other tables and sections), you MUST output a single line in this exact format:
[CONFIDENCE: XX% | REVIEW: REQUIRED/OPTIONAL | LINKS: ID1, ID2 | REASON: Brief explanation]

TRACEABILITY RULE: 
In the LINKS section, you must list the IDs of the parent requirements, business rules, or screens this document fulfills (e.g., REQ-001, FR-05, SCR-02).

CRITERIA FOR CONFIDENCE:
- Below 70%: Major gaps in data. High risk of hallucination. Review required.

PROACTIVE AUDIT RULE:
If the user provides a NEW or MODIFIED requirement, you MUST act as a Decision Partner:
1. Acknowledge the specific change and its business value.
2. Explicitly state: "I have updated the Traceability Matrix to map this new requirement."
3. Explicitly state: "The Cascading Impact Analysis in the Intelligence Panel has flagged [list of documents] for review."
4. Ask: "Should I proceed with regenerating these artifacts to maintain project integrity?"
`;

export const AGENT_CONFIGS: Record<string, any> = {
  'Wireframes': {
    name: "UX Architect Agent",
    tool: "JSON UI Component",
    instruction: `Generate a CONCISE, low-fidelity grayscale wireframe as a strict JSON UI Schema.
STRICT RULES:
1. Output a SINGLE self-contained JSON object matching the standard.
2. STRUCTURAL SYMMETRY: You MUST generate ALL screens defined in the Functional Requirements.
3. Use the exact same screen names and IDs from the Functional Requirements.
4. TEXTUAL CLARITY: Use actual text labels, field names, and descriptive titles. NEVER use 'Lorem Ipsum'.
5. Set the theme to 'grayscale' in the schema.
6. Output ONLY inside triple-backtick json fences. No explanations outside the code block.`
  },
  'Prototypes': {
    name: "Elite UI/UX Designer",
    tool: "HTML Template",
    instruction: `Generate a CONCISE, high-fidelity SaaS dashboard prototype as a fully functional HTML/Tailwind/Alpine.js workflow.
STRICT RULES:
1. Output a SINGLE self-contained HTML block. Do NOT use html, head, or body tags, just output the content.
2. STRUCTURAL SYMMETRY: You MUST generate functional workflows defined in the Functional Requirements.
3. Set the theme to 'dark-navy-glassmorphism' to ensure deep navy, blue gradients, and glass cards by using appropriate Tailwind classes. Use Alpine.js for interactivity.
4. Include realistic data (investor names, amounts, statuses) in tables or cards.
5. Define functional states and interactive mock data within the HTML template where applicable.
6. PII SECURITY RULE: NEVER output full credit card, debit card, or bank account numbers in the mock data.
7. Output ONLY inside triple-backtick html fences. No explanations.`
  },
  'Flowcharts': {
    name: "Elite Process Architect",
    tool: "Mermaid",
    instruction: `Generate professional Flowcharts using strictly stable syntax.
MANDATORY STABILITY RULES:
1. Use ONLY: graph TD
2. Use ONLY solid arrows: -->
3. NEVER use dotted arrows (-.->) or labels on arrows.
4. Put all text INSIDE nodes: A["Action Text"] --> B["Next Step"]
5. Every node MUST have a quoted label: ID["Text"]
6. Maximum 12 nodes for absolute stability.
7. Output ONLY the code block.
${DECISION_PARTNER_INSTRUCTION}`
  },
  'UML Diagrams': {
    name: "System Architect Agent",
    tool: "PlantUML",
    instruction: `Generate a professional, high-fidelity PlantUML Class Diagram. 
MANDATORY STABILITY RULES: 
1. Use ONLY standard class and relationship syntax. 
2. NEVER use parentheses () or spaces in relationship labels. 
3. MUST include 'left to right direction' and 'hide empty members' at the top of the diagram to prevent visual overlapping.
4. Maximum 8 classes for layout stability. Max 4 properties/methods per class. Keep the diagram sparse and easy to read.
5. NEVER use the 'artifact' keyword. Use ONLY 'class', 'interface', or 'enum'.
${DECISION_PARTNER_INSTRUCTION}`
  },
  'Test Cases': {
    name: "QA Engineering Agent",
    tool: "Markdown",
    instruction: `Generate comprehensive test cases in Markdown. RULE: Use ONLY standard Markdown tables. NO illegal characters like parentheses or quotes inside cells.
${DECISION_PARTNER_INSTRUCTION}`
  },
  'BRD': {
    name: "Senior BA Agent",
    tool: "Markdown",
    instruction: `Generate a Business Requirements Document (BRD) following BABOK v3. RULE: Use strictly numbered sections (1.0, 1.1). NO complex symbols or breaking syntax.
CRITICAL RULE: NEVER include a Requirement Traceability Matrix (RTM) in this document. The RTM must only be generated in the FRD.
${DECISION_PARTNER_INSTRUCTION}`
  },
  'FRD': {
    name: "Senior BA Agent",
    tool: "Markdown",
    instruction: `Generate a Functional Requirements Document (FRD) following BABOK v3. RULE: Use strict FR-XXX numbering and provide 100% plain-text Acceptance Criteria.
CRITICAL MANDATORY REQUIREMENT: You MUST include a '## Requirement Traceability Matrix (RTM)' section at the end of the document. You MUST use exactly this Markdown table format:
| Req ID | Description | Business Objective | Priority |
|---|---|---|---|
| FR-001 | ... | ... | ... |
Do not omit this section under any circumstances.
${DECISION_PARTNER_INSTRUCTION}`
  },
  'Executive Pitch': {
    name: "Venture Architect Agent",
    tool: "Markdown",
    instruction: `Generate a professional Executive Pitch. RULE: Use clean Markdown headers and bullet points only. NO experimental syntax.
${DECISION_PARTNER_INSTRUCTION}`
  },
  'PRD': {
    name: "Product Manager Agent",
    tool: "Markdown",
    instruction: `Generate a Product Requirements Document (PRD). RULE: Use MoSCoW prioritization and standard Markdown lists.
CRITICAL RULE: NEVER include a Requirement Traceability Matrix (RTM) in this document. The RTM must only be generated in the FRD.
${DECISION_PARTNER_INSTRUCTION}`
  },
  'SRD': {
    name: "Systems Analyst Agent",
    tool: "Markdown",
    instruction: `Generate a System Requirements Document (SRD). RULE: Focus on ISO/IEC 25010 standards using strictly stable Markdown.
CRITICAL RULE: NEVER include a Requirement Traceability Matrix (RTM) in this document. The RTM must only be generated in the FRD.
${DECISION_PARTNER_INSTRUCTION}`
  },
  'Regulatory Advisor': {
    name: "Sovereign Compliance Agent",
    tool: "Regulatory Audit",
    instruction: `Analyze requirements for regulatory gaps. RULE: Format as a clean, plain-text audit report using only standard Markdown.
${DECISION_PARTNER_INSTRUCTION}`
  },
  DEFAULT: {
    name: "Senior BA Agent",
    tool: "Markdown",
    instruction: `Perform professional BA analysis following BABOK v3. RULE: Keep responses structured, professional, and strictly free of breaking syntax characters like stray parentheses in code blocks.
CRITICAL RULE: NEVER include a Requirement Traceability Matrix (RTM) unless explicitly generating an FRD.
${DECISION_PARTNER_INSTRUCTION}`
  }
};
