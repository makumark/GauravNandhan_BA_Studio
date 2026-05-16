const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'Gaurav Nandhan BA Studio', 'src', 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix the typo docType -> activeTab
content = content.replace(
  /\[docType\]: \{/,
  `[activeTab]: {`
);
content = content.replace(
  /\.\.\.prev\[docType\],/,
  `...prev[activeTab],`
);

fs.writeFileSync(filePath, content);
console.log('Successfully fixed typo in page.tsx');
