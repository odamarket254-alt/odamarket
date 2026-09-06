const fs = require('fs');

let code = fs.readFileSync('src/components/home/DynamicHomepage.tsx', 'utf8');
code = code.replace(/    \/\/ Debounced realtime refresher[\s\S]*?supabase\.removeChannel\(channel3\);\s*\};\s*/, '');
fs.writeFileSync('src/components/home/DynamicHomepage.tsx', code);
