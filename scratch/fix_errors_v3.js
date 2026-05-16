const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'Gaurav Nandhan BA Studio', 'src', 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix the fetch response handling to catch the new ERROR strings
content = content.replace(
  /const reader = response\.body\?\.getReader\(\);/,
  `const contentType = response.headers.get('content-type');
        if (!response.ok && !contentType?.includes('event-stream')) {
          const errorText = await response.text();
          setDocuments(prev => ({
            ...prev,
            [docType]: {
              ...prev[docType],
              content: \`# ⚠️ SYSTEM ALERT\\n\\n\${errorText}\\n\\nPlease check your Google AI Studio Billing or Quota settings.\`,
              status: 'error'
            }
          }));
          setIsGenerating(false);
          return;
        }
        const reader = response.body?.getReader();`
);

fs.writeFileSync(filePath, content);
console.log('Successfully patched page.tsx with error visualization');
