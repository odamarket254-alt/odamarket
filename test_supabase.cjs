const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.example', 'utf-8');
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1];
const supabaseKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1];

if (!supabaseUrl || !supabaseKey) {
  console.log("Could not parse supabase credentials from .env.example");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
        .from("products")
        .select('*, profiles(business_name, verified), category:categories(name), brand:brands(name)')
        .limit(1);
  console.log("Error:", error);
  console.log("Data:", data);
}

test();
