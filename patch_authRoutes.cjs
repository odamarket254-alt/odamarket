const fs = require('fs');
let code = fs.readFileSync('routes/authRoutes.ts', 'utf8');
code = code.replace(/process.env.VITE_SUPABASE_URL \|\| process.env.VITE_SUPABASE_URL \|\| process.env.SUPABASE_URL/g, 'process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL');
fs.writeFileSync('routes/authRoutes.ts', code);
