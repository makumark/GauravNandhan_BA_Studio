fetch('https://gaurav-nandhan-ba-studio.vercel.app/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Create a banking system with login and dashboard.' }],
    documentRequested: 'Prototypes'
  })
})
.then(async res => {
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response:', text);
})
.catch(err => console.error(err));
