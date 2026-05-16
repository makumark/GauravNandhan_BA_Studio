
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");

async function listModels() {
  const apiKey = "AIzaSyDURo56Qo7tdxS1YmmTWl1pCSuDJmiRXW0";
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    let output = "";
    if (data.models) {
      output += "AVAILABLE MODELS FOR YOUR KEY:\n";
      data.models.forEach(m => {
        output += `- ${m.name}\n`;
      });
    } else {
      output += "No models returned. Error info: " + JSON.stringify(data, null, 2);
    }
    fs.writeFileSync("tests/models_v2.txt", output, "utf8");
    console.log("Results saved to tests/models_v2.txt");
  } catch (error) {
    console.error("Discovery failed:", error);
  }
}

listModels();
