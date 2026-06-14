import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

async function test() {
  try {
    const primaryModel = google('gemini-2.5-flash');
    const { text } = await generateText({
      model: primaryModel,
      prompt: 'Generate a High-Fidelity Component Schema as strict JSON.\nSTRICT RULES:\n1. Output a SINGLE self-contained JSON object matching the exact structure below.\n2. REQUIRED ROOT: You MUST wrap everything in a {"screens": [{"components": [...]}]} object.\n3. SUPPORTED COMPONENTS: "grid", "flex", "nav", "card", "section", "table", "input", "button", "typography", "badge"\n\n{"screens": [{"components": [{"type": "nav", "links": ["Dashboard", "Users"]}]}]}',
      maxTokens: 1000
    });
    console.log("OUTPUT:", text);
  } catch (err) {
    console.error("ERROR:", err);
  }
}
test();
