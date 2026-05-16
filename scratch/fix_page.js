const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'Gaurav Nandhan BA Studio', 'src', 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix HTML/Wireframe parsing
content = content.replace(
  /let htmlContent = htmlMatch \? htmlMatch\[1\]\.trim\(\) : "";/,
  `let htmlContent = htmlMatch ? htmlMatch[1].trim() : "";
                               if (!htmlContent && (content.includes('<!DOCTYPE html>') || content.includes('<html') || content.includes('<div'))) {
                                 htmlContent = content.split('[CONFIDENCE:')[0].trim();
                               }`
);

// Fix Flowchart parsing
content = content.replace(
  /mermaidCode = content;/,
  `mermaidCode = content.split('[CONFIDENCE:')[0].trim();`
);

fs.writeFileSync(filePath, content);
console.log('Successfully patched page.tsx');
