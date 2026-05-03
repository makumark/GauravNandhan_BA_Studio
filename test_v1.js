async function testV1() {
  const apiKey = "AIzaSyA4h5ys4oyyDAQDQ32FblLdVjRK9mmhocc";
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "test" }] }]
      })
    });
    const data = await response.json();
    if (response.ok) {
      console.log("✅ v1/gemini-1.5-flash is AVAILABLE");
      console.log(JSON.stringify(data).substring(0, 100));
    } else {
      console.log(`❌ v1 failed: ${response.status} - ${JSON.stringify(data)}`);
    }
  } catch (e) {
    console.log(`❌ fetch failed: ${e.message}`);
  }
}

testV1();
