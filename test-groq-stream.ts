import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

async function test() {
  try {
    const groq = createOpenAI({
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: 'gsk_fakekey'
    });
    const primaryModel = groq('llama-3.3-70b-versatile');
    const result = await streamText({
      model: primaryModel,
      prompt: 'Hello, world!',
      maxTokens: 10
    });
    console.log("Result obtained:", !!result);
    for await (const chunk of result.textStream) {
       console.log("Chunk:", chunk);
    }
  } catch (err) {
    console.error("ERROR CAUGHT OUTSIDE:", err);
  }
}
test();
