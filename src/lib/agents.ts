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
  'Logic Sandbox JSON': `
### GOLD STANDARD: LOGIC SANDBOX JSON SCHEMA
Example: "Discount Rule Logic"
\`\`\`json
{
  "summary": "This sandbox executes the checkout discount business logic.",
  "code": {
    "title": "Checkout Discount Logic",
    "inputs": [
      { "name": "cartTotal", "label": "Cart Total ($)", "type": "number", "defaultValue": 100 },
      { "name": "userTier", "label": "User Tier", "type": "select", "options": ["Silver", "Gold", "Platinum"], "defaultValue": "Silver" },
      { "name": "hasPromoCode", "label": "Promo Code Applied", "type": "boolean", "defaultValue": false }
    ],
    "logic": "if (hasPromoCode) { return 'Outcome: 5% Discount Applied. Final Price: $' + (cartTotal * 0.95).toFixed(2); }\nif (cartTotal > 100 && (userTier === 'Gold' || userTier === 'Platinum')) { return 'Outcome: 15% Discount Applied. Final Price: $' + (cartTotal * 0.85).toFixed(2); }\nreturn 'Outcome: No Discount. Final Price: $' + cartTotal;"
  }
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
6. Output ONLY the raw JSON code wrapped in triple-backtick json fences (\`\`\`json). NEVER output Markdown summaries or explanations before or after the code block.
7. ANTI-HALLUCINATION RULE: NEVER hallucinate features, screens, or components that are not explicitly requested. You MUST strictly follow the user requirements.`
  },
  'Prototypes': {
    name: "Elite UI/UX Designer",
    tool: "HTML Template",
    instruction: `Generate a CONCISE, high-fidelity prototype as a fully functional HTML/Tailwind/Alpine.js workflow based on the provided requirements and wireframes.
STRICT RULES:
1. Output a SINGLE self-contained HTML block. Do NOT use html, head, or body tags, just output the content.
2. STRICT REQUIREMENT ADHERENCE: You MUST thoroughly read the provided "FUNCTIONAL REQUIREMENTS (SOURCE OF TRUTH)" section. Your UI MUST explicitly implement every specific field, input, button, and data structure mentioned in those requirements. DO NOT generate generic template filler.
3. WIREFRAME SYNCHRONIZATION: If Wireframe JSON Schema is provided in the Functional Requirements or Context, you MUST EXACTLY mirror the layout, components, blocks, and structure of the wireframes. DO NOT hallucinate different screen designs (like "AetherCommerce") or random device mockups if the wireframes dictate otherwise. Your prototype MUST be a 1:1 high-fidelity CSS translation of the low-fidelity wireframes.
4. FULLY FUNCTIONAL STATE & VALIDATION: You MUST use Alpine.js (via x-data) to create a fully working prototype. Form submissions must validate inputs (e.g., required fields, email format) and show error messages if invalid.
5. MULTI-SCREEN NAVIGATION: The prototype MUST simulate moving between screens dynamically based on Alpine state. Hide/show sections using x-show. Data entered on one screen MUST flow into the next screen.
6. Set the theme to 'dark-navy-glassmorphism' to ensure deep navy, blue gradients, and glass cards by using appropriate Tailwind classes. Use Alpine.js for interactivity.
6. Include realistic mock data relevant to the specific screens being generated in tables or cards, mapped precisely to the data fields described in the requirements.
7. NEVER use template engine placeholders like {{ }} or [Placeholder]. You MUST inject realistic hardcoded mock data directly into the HTML.
8. PII SECURITY RULE: NEVER output full credit card, debit card, or bank account numbers in the mock data.
9. EXTREME BREVITY REQUIRED: Limit the output strictly to the necessary screens to convey the core UI workflow.
10. Output ONLY the raw HTML code wrapped in triple-backtick html fences (\`\`\`html). NEVER output Markdown summaries, JSON schemas, or "Here is the code..." before or after the code block.
11. NEVER output JSON or Markdown INSIDE the HTML screens. Every screen MUST be pure HTML/Tailwind/Alpine.js.
12. PROTOTYPE LOGIN RULE: For any login or authentication screens, you MUST NOT hardcode specific dummy credentials (e.g. 'admin/admin') that block the user. You MUST accept ANY credentials that pass basic format validation (e.g. valid email syntax) and allow the user to successfully log in and proceed to the next screen.`
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
7. Output ONLY the raw Mermaid code wrapped in triple-backtick mermaid fences (\`\`\`mermaid). NEVER output Markdown summaries or explanations before or after the code block.
8. ANTI-HALLUCINATION RULE: NEVER hallucinate processes or steps that are not explicitly requested. You MUST strictly model only the user requirements.
${DECISION_PARTNER_INSTRUCTION}`
  },
  'Logic Sandbox': {
    name: "Business Logic Architect",
    tool: "Logic Sandbox JSON",
    instruction: `Generate a CONCISE Executable Logic Sandbox as a strict JSON UI Schema.
STRICT RULES:
1. Output a SINGLE self-contained JSON object matching the standard.
2. STRUCTURAL SYMMETRY: You MUST extract the most complex business rule or calculation from the Functional Requirements.
3. INLINE JAVASCRIPT: The \`logic\` field must contain a raw JavaScript string that takes the variables defined in \`inputs\` (by their exact \`name\`) and returns a string Outcome. The logic must use standard JS syntax (if/else, math, etc.).
4. Do NOT output a markdown block inside the JSON string. The \`code\` field should be a nested JSON object containing \`title\`, \`inputs\`, and \`logic\`.
5. Output ONLY the raw JSON code wrapped in triple-backtick json fences (\`\`\`json). NEVER output Markdown summaries or explanations before or after the code block.`
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
6. Output ONLY the raw PlantUML code wrapped in triple-backtick plantuml fences (\`\`\`plantuml). NEVER output Markdown summaries or explanations.
7. ANTI-HALLUCINATION RULE: NEVER hallucinate classes, fields, or relationships that are not explicitly requested. You MUST strictly follow the user requirements.
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
ANTI-HALLUCINATION RULE: NEVER hallucinate business objectives, scope, or requirements that are not explicitly provided by the user. You MUST strictly base your document ONLY on the provided context.
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
ANTI-HALLUCINATION RULE: NEVER hallucinate functional requirements, UI elements, or acceptance criteria that are not explicitly provided by the user. You MUST strictly base your document ONLY on the provided context.
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
ANTI-HALLUCINATION RULE: NEVER hallucinate features, user stories, or requirements that are not explicitly provided by the user. You MUST strictly base your document ONLY on the provided context.
${DECISION_PARTNER_INSTRUCTION}`
  },
  'SRD': {
    name: "Systems Analyst Agent",
    tool: "Markdown",
    instruction: `Generate a System Requirements Document (SRD). RULE: Focus on ISO/IEC 25010 standards using strictly stable Markdown.
CRITICAL RULE: NEVER include a Requirement Traceability Matrix (RTM) in this document. The RTM must only be generated in the FRD.
ANTI-HALLUCINATION RULE: NEVER hallucinate system architectures, APIs, or requirements that are not explicitly provided by the user. You MUST strictly base your document ONLY on the provided context.
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
