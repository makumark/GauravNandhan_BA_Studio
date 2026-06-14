fetch('http://localhost:3000/api/generate/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'I want a wireframe for a user profile page.' }],
    documentRequested: 'Wireframes',
    domainDetected: 'General'
  })
})
.then(async (res) => {
  console.log('Status:', res.status);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let result = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value);
  }
  const fs = require('fs');
  fs.writeFileSync('test-out.txt', result, 'utf8');
  console.log('Wrote to test-out.txt');
})
.catch(console.error);
