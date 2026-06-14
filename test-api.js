fetch('http://localhost:3000/api/generate/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'I want a banking app for retail users.' }],
    documentRequested: 'BRD',
    domainDetected: 'Banking',
    projectId: 'test-project-123'
  })
})
.then(async (res) => {
  console.log('Status:', res.status);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    process.stdout.write(decoder.decode(value));
  }
  console.log('\n\n--- Done ---');
})
.catch(console.error);
