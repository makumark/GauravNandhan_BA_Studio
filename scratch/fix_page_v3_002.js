const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'Gaurav Nandhan BA Studio', 'src', 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix Flowchart parsing - scrub illegal characters and redundant headers
content = content.replace(
  /mermaidCode = mermaidCode\.replace\(\/\^\(graph\|flowchart\)\\s\+\(TD\|LR\|TB\|BT\)\\s\+\(graph\|flowchart\)\/i, '\$1 \$2'\);/,
  `mermaidCode = mermaidCode.replace(/^(graph|flowchart)\\s+(TD|LR|TB|BT)\\s+(graph|flowchart)/i, '$1 $2');
                                  // Scrub illegal characters from Mermaid labels that cause parse errors
                                  mermaidCode = mermaidCode.replace(/[\\[\\(](.*?)[\\)\\]]/g, (m, label) => {
                                     // Remove colons, parentheses, and brackets from inside labels
                                     const cleanLabel = label.replace(/[:()[\\]]/g, ' ').trim();
                                     return m.startsWith('[') ? \`[\${cleanLabel}]\` : \`(\${cleanLabel})\`;
                                  });`
);

// Fix UML parsing - strip Mermaid keywords if AI hallucinated them into PlantUML
content = content.replace(
  /plantumlCode = plantumlMatch\[0\]\.trim\(\);/,
  `plantumlCode = plantumlMatch[0].trim().replace(/sequenceDiagram/gi, '');`
);

fs.writeFileSync(filePath, content);
console.log('Successfully patched page.tsx with engine isolation filters');
