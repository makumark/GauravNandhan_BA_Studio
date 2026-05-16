const rawContent = `\`\`\`HTML\n<!DOCTYPE html>\n<html></html>\n\`\`\``;
const htmlMatch = rawContent.match(/```html\s+([\s\S]*?)(\s+```|$)/i);
let summary = "";
if (htmlMatch) {
  summary = rawContent.replace(/```html[\s\S]*?```/g, '').trim();
}
console.log({ htmlMatch: !!htmlMatch, summary });
