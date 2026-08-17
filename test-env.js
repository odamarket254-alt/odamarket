process.env.SUPABASE_ANON_KEY = 'real-anon-key';
if (process.env.SUPABASE_ANON_KEY && !process.env.VITE_SUPABASE_ANON_KEY) {
  process.env.VITE_SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
}
const vite = require('vite');
console.log(vite.loadEnv('production', process.cwd(), '').VITE_SUPABASE_ANON_KEY);
