async function test() {
  const req = await fetch('http://localhost:3000/api/generate/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Generate a wireframe for a user profile page with a settings button and an email field.' }],
      documentRequested: 'Wireframes',
      domainDetected: 'General',
      functionalContext: 'User profile management'
    })
  });
  
  const text = await req.text();
  const fs = require('fs');
  fs.writeFileSync('test-wireframe.txt', text);
}
test();
