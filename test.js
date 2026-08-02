import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('orders').insert([{}]).select('*');
  if (data) {
    console.log(Object.keys(data[0]));
    await supabase.from('orders').delete().eq('id', data[0].id);
  } else {
    console.log(error);
  }
}
run();
