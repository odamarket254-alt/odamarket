import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase
        .from("products")
        .select('*')
        .eq("id", "2f0688a2-d7f4-4d10-84e2-df17629f8502")
        .single();
  console.log("No Joins - Data:", data ? "Found" : "Null", "Error:", error);

  const { data: d2, error: e2 } = await supabase
        .from("products")
        .select('*, category:categories!left(name), brands(name)')
        .eq("id", "2f0688a2-d7f4-4d10-84e2-df17629f8502")
        .single();
  console.log("With Joins - Data:", d2 ? "Found" : "Null", "Error:", e2);
}
test();
