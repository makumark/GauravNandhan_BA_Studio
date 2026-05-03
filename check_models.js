const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
  const genAI = new GoogleGenerativeAI("AIzaSyA4h5ys4oyyDAQDQ32FblLdVjRK9mmhocc");
  try {
    // There is no direct listModels in the standard SDK easily accessible without raw fetch
    // But we can try to hit a known model and see the error or use the discovery API
    console.log("Checking model availability...");
    
    // Let's try the most common ones
    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-1.5-flash-latest", "gemini-2.0-flash-exp"];
    
    for (const m of models) {
      try {
        const model = genAI.getGenerativeModel({ model: m });
        await model.generateContent("test");
        console.log(`✅ ${m} is AVAILABLE`);
      } catch (e) {
        console.log(`❌ ${m} failed: ${e.message}`);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

listModels();
