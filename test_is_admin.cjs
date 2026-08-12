const { createClient } = require('@supabase/supabase-js');
const url = "https://vjzgqhsvgknmnjpaefvy.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqemdxaHN2Z2tubW5qcGFlZnZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTIxODc0MiwiZXhwIjoyMDk0Nzk0NzQyfQ.2Ck8Q1Ja6yzmonBuu2LcqPGCM601JPPgiKNpm2e0RjI";
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.from('profiles').select('id, role').eq('email', 'odamarket254@gmail.com');
  console.log(data);
}
run();
