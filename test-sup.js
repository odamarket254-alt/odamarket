import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://placeholder-project.supabase.co", "placeholder-anon-key", {
  global: {
    fetch: async (url, init) => {
      console.log("Mocking fetch:", url);
      return new Response(JSON.stringify({ user: null, session: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});
supabase.auth.signInWithPassword({ email: "test@test.com", password: "test" }).then(console.log).catch(console.error);
