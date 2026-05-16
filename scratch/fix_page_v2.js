const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'Gaurav Nandhan BA Studio', 'src', 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix Flowchart parsing - strip redundant graph/flowchart headers
content = content.replace(
  /mermaidCode = content\.split\('\[CONFIDENCE:'\)\[0\]\.trim\(\);/,
  `mermaidCode = content.split('[CONFIDENCE:')[0].trim();
                                  // Clean up redundant headers (AI sometimes prepends graph TD---)
                                  mermaidCode = mermaidCode.replace(/^(graph|flowchart)\\s+(TD|LR|TB|BT)---/i, '');
                                  mermaidCode = mermaidCode.replace(/^(graph|flowchart)\\s+(TD|LR|TB|BT)\\s+(graph|flowchart)/i, '$1 $2');`
);

// Fix UML parsing - ensure it strips any leading text before @startuml
content = content.replace(
  /const plantumlMatch = content\.match\(\/@startuml\(\[\\s\\S\]\*?\)\@enduml\/\);/,
  `const plantumlMatch = content.match(/@startuml([\\s\\S]*?)@enduml/i);`
);

fs.writeFileSync(filePath, content);
console.log('Successfully patched page.tsx with robust diagram parsing');
