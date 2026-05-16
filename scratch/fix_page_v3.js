const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'Gaurav Nandhan BA Studio', 'src', 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix Flowchart parsing - scrub quotes from node labels
content = content.replace(
  /mermaidCode = mermaidCode\.replace\(\/\^\(graph\|flowchart\)\\s\+\(TD\|LR\|TB\|BT\)\\s\+\(graph\|flowchart\)\/i, '\$1 \$2'\);/,
  `mermaidCode = mermaidCode.replace(/^(graph|flowchart)\\s+(TD|LR|TB|BT)\\s+(graph|flowchart)/i, '$1 $2');
                                  // Scrub double quotes from Mermaid labels which cause parse errors
                                  mermaidCode = mermaidCode.replace(/([A-Z0-9_]+)\\[(.*?)\\]/gi, (m, id, label) => {
                                     return \`\${id}["\${label.replace(/"/g, "'") }"]\`;
                                  });`
);

fs.writeFileSync(filePath, content);
console.log('Successfully patched page.tsx');
