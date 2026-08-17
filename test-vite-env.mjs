import { build } from 'vite';
process.env.SUPABASE_ANON_KEY = "my-test-key";
if (process.env.SUPABASE_ANON_KEY && !process.env.VITE_SUPABASE_ANON_KEY) {
  process.env.VITE_SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
}
console.log("process.env.VITE_SUPABASE_ANON_KEY:", process.env.VITE_SUPABASE_ANON_KEY);
