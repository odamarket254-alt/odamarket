import { createClient } from "@supabase/supabase-js";
const supabaseAdmin = createClient("https://placeholder-project.supabase.co", "placeholder-service-key");
supabaseAdmin.auth.admin.createUser({ email: "test@test.com", password: "test" })
  .then(console.log)
  .catch(console.error);
