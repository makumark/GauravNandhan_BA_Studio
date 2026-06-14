import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import * as fs from 'fs';

async function test() {
  try {
    const env = fs.readFileSync('.env.local', 'utf8');
    const groqKey = env.split('\n').find(l => l.startsWith('GROQ_API_KEY=')).split('=')[1].trim();

    const groq = createOpenAI({
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: groqKey
    });
    const primaryModel = groq('llama-3.3-70b-versatile');
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
