const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env'});
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
// We can't run ALTER TABLE using the anon key via API! We need to use cloudsql-execute-sql if it's Cloud SQL, but it's Supabase.
// Is there a way? 
