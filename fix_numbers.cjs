const fs = require('fs');

// Fix utils/whatsapp.ts
let utils = fs.readFileSync('src/utils/whatsapp.ts', 'utf8');
utils = utils.replace(
  'const number = import.meta.env.VITE_WHATSAPP_NUMBER || "254700000000"; // Default or configured number',
  'const number = import.meta.env.VITE_WHATSAPP_NUMBER || "";'
);
fs.writeFileSync('src/utils/whatsapp.ts', utils);

// Fix lib/whatsapp.ts
let lib = fs.readFileSync('src/lib/whatsapp.ts', 'utf8');
lib = lib.replace(
  'const ownerNumber = import.meta.env.VITE_WHATSAPP_NUMBER || "254740909652";',
  'const ownerNumber = import.meta.env.VITE_WHATSAPP_NUMBER || "";'
);
fs.writeFileSync('src/lib/whatsapp.ts', lib);

// Fix .env.example
let env = fs.readFileSync('.env.example', 'utf8');
env = env.replace(
  'VITE_WHATSAPP_NUMBER="254700000000"',
  'VITE_WHATSAPP_NUMBER="254..." # Enter the correct official ODA Market WhatsApp number here'
);
fs.writeFileSync('.env.example', env);
