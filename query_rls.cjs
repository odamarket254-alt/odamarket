const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  // Let's just try to fetch the order anonymously
  const supabaseAnon = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  
  // By UUID
  const { data: byUuid, error: uuidErr } = await supabaseAnon.from('orders').select('*').eq('id', 'bc5d996f-f541-4b1d-82dc-29abcf77b6aa').single();
  console.log("Anon fetch by UUID:", { byUuid, uuidErr });
  
  // By orderNumber inside notes JSON
  const { data: byJson, error: jsonErr } = await supabaseAnon.from('orders').select('*').textSearch('notes', 'ORD-1787672619619-754');
  console.log("Anon fetch by notes textSearch:", { byJson, jsonErr });
}
run();
