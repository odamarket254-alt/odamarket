import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const supabaseKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: tickets, error: e1 } = await supabase.from('support_tickets').select('*').limit(1);
  console.log("support_tickets:", tickets ? "exists" : e1.message);

  const { data: addresses, error: e2 } = await supabase.from('delivery_addresses').select('*').limit(1);
  console.log("delivery_addresses:", addresses ? "exists" : e2.message);

  const { data: rewards, error: e3 } = await supabase.from('reward_points').select('*').limit(1);
  console.log("reward_points:", rewards ? "exists" : e3.message);
}
check();
