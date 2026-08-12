const { createClient } = require('@supabase/supabase-js');
const url = "https://vjzgqhsvgknmnjpaefvy.supabase.co";
const key = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqemdxaHN2Z2tubW5qcGFlZnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMTg3NDIsImV4cCI6MjA5NDc5NDc0Mn0.8ReqQFgQf8OzOuV-ijs_x9gbQnLJw0alQpRmoJ3_nag";
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.rpc('is_admin');
  console.log(error ? error : data);
}
run();
