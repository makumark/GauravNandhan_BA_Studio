const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'Gaurav Nandhan BA Studio', 'src', 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Update handleSend to show specific API error messages
content = content.replace(
  /if \(!response\.ok\) \{[\s\S]*?throw new Error\(errorData\.error \|\| 'Failed to communicate with AI'\);[\s\S]*?\}/,
  `if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = 'Failed to communicate with AI';
        try {
          const errorData = JSON.parse(errorText);
          errorMsg = errorData.error || errorText;
        } catch(e) {
          errorMsg = errorText;
        }
        throw new Error(errorMsg);
      }`
);

// Also fix the Brain 1 runAnalysis to not spin forever on error
content = content.replace(
  /if \(!res\.ok\) \{[\s\S]*?console\.error\('Brain 1 analysis failed:', err\.error\);[\s\S]*?return;[\s\S]*?\}/,
  `if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Brain 1 analysis failed:', err.error);
        setIsAnalyzing(false);
        setSmeInsight("⚠️ ANALYSIS FAILED: Please check your API Quota/Billing status.");
        return;
      }`
);

fs.writeFileSync(filePath, content);
console.log('Successfully hardened handleSend and runAnalysis error handling');
