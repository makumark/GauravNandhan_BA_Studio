const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'Gaurav Nandhan BA Studio', 'src', 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix setIsGenerating -> setIsProcessing
content = content.replace(
  /setIsGenerating\(false\);/,
  `setIsProcessing(false);`
);

fs.writeFileSync(filePath, content);
console.log('Successfully fixed state setter in page.tsx');
