require('dotenv').config();
console.log(Object.keys(process.env).filter(k => k.toLowerCase().includes('supabase')));
