fetch("http://localhost:3000/api/checkout", {
  method: "POST",
  headers: { "Authorization": "Bearer bad_token_here", "Content-Type": "application/json" },
  body: JSON.stringify({ items: [] })
}).then(res => res.json()).then(console.log);
