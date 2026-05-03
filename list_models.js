async function listAllModels() {
  const apiKey = "AIzaSyA4h5ys4oyyDAQDQ32FblLdVjRK9mmhocc";
  const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (response.ok) {
      console.log("Available Models:");
      data.models.forEach(m => console.log(`- ${m.name}`));
    } else {
      console.log(`❌ Failed to list models: ${response.status} - ${JSON.stringify(data)}`);
    }
  } catch (e) {
    console.log(`❌ fetch failed: ${e.message}`);
  }
}

listAllModels();
