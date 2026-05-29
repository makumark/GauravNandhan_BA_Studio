import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const result = await model.generateContent("Hello");
    console.log(result.response.text());
  } catch (e) {
    console.error("ERROR:", e.message);
  }
}
run();
