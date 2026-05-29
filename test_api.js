async function test() {
  try {
    const response = await fetch('https://gaurav-nandhan-ba-studio.vercel.app/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        messages: [{role: "user", content: "test"}], 
        documentRequested: "FRD", 
        readinessScore: 8, 
        feasibilityIssues: [],
        functionalContext: btoa(encodeURIComponent("test context"))
      })
    });
    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text);
  } catch (e) {
    console.error(e);
  }
}
test();
