import { createClient } from "@supabase/supabase-js";

// These should be set in .env or .env.local
// Because this is a preview environment, we fallback to dummy values if not provided,
// but acknowledge that the app won't fully function without REAL keys.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://placeholder-project.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-anon-key";

if (!import.meta.env.VITE_SUPABASE_URL) {
  console.warn(
    "VITE_SUPABASE_URL is missing. Please add it to your environment variables for real database access.",
  );
}

// Custom storage adapter that falls back to memory if localStorage is blocked (e.g. in iframe)
const memoryStorage = new Map<string, string>();
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return memoryStorage.get(key) || null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      memoryStorage.set(key, value);
    }
  },
  removeItem: (key: string): void => {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      memoryStorage.delete(key);
    }
  },
};


const customFetch = async (url, init) => {
  const urlStr = url.toString();
  if (urlStr.includes("placeholder-project.supabase.co")) {
    console.warn("Mocking Supabase fetch because VITE_SUPABASE_URL is missing.");
    if (urlStr.includes('/auth/v1')) {
      return new Response(JSON.stringify({ user: null, session: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (init && init.method === 'GET') {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return fetch(url, init);
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: safeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: { fetch: customFetch },
});

