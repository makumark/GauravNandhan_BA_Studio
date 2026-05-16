const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy');
try {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  console.log('Model loaded');
} catch (e) {
  console.error(e);
}
