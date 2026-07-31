import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://placeholder-project.supabase.co", "placeholder-anon-key", {
  global: {
    fetch: async (url, init) => {
      return new Response("", {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});
supabase.auth.signInWithPassword({ email: "test@test.com", password: "test" }).then(console.log).catch(console.error);
