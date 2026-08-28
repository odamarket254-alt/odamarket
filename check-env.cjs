require('dotenv').config();
console.log("VITE_SUPABASE_URL", process.env.VITE_SUPABASE_URL);
console.log("Has SERVICE_ROLE_KEY:", !!process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
