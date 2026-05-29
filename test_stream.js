const http = require('http');

const postData = JSON.stringify({
  projectId: "test_project",
  documentRequested: "Wireframes",
  messages: [{role: "user", content: "I want a simple login screen"}],
  domainDetected: "General",
  functionalContext: "Login Screen Requirement"
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/generate/stream',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
