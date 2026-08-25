const fs = require('fs');
let content = fs.readFileSync('src/lib/whatsapp.ts', 'utf8');

content = content.replace(
  'const ownerNumber = "254740909652";',
  'const ownerNumber = import.meta.env.VITE_WHATSAPP_NUMBER || "254740909652";'
);

fs.writeFileSync('src/lib/whatsapp.ts', content);
