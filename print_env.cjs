require('dotenv').config();
console.log(Object.keys(process.env).filter(k => k.includes('DB') || k.includes('URL') || k.includes('SUPABASE')));
