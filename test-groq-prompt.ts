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

    const prompt = `TASK: Generate a professional and comprehensive Flowcharts.
INSTRUCTIONS: Generate professional Flowcharts using strictly standard Mermaid syntax.
MANDATORY STABILITY RULES:
1. You MUST output a standard Mermaid \`graph TD\` or \`graph LR\` block.
2. MERMAID SYNTAX SAFETY: You MUST wrap all node text in double quotes if it contains spaces, colons, or parentheses. Example: \`NodeID["This is safe text: (123)"]\` or \`DecisionID{"Is this valid?"}\`. NEVER use unquoted special characters inside node brackets, as this causes catastrophic parse errors.
3. Output ONLY the raw Mermaid code wrapped in triple-backtick mermaid fences (\`\`\`mermaid). NEVER output JSON, Markdown summaries, or explanations.
4. COMPREHENSIVENESS RULE: You MUST combine and model ALL steps.
DOMAIN: FinTech
CURRENT DATE: Sunday, June 14, 2026
CONVERSATION CONTEXT (INITIAL AND ADDITIONAL REQUIREMENTS):
USER: Hello

CRITICAL RULE: You MUST combine and synthesize ALL requirements provided across the entire conversation history.
CRITICAL RULE: Output ONLY the requested format. Start immediately. No preamble, no "Here is...". NEVER truncate. ALWAYS generate the FULL complete output.`;

    const { text, finishReason } = await generateText({
      model: primaryModel,
      prompt: prompt,
      maxTokens: 8000
    });
    console.log("Finish Reason:", finishReason);
    console.log("OUTPUT:", text);
  } catch (err) {
    console.error("ERROR:", err);
  }
}
test();
