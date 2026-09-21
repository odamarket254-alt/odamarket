import { createClient } from "@supabase/supabase-js";

// These should be set in .env or .env.local
// Because this is a preview environment, we fallback to dummy values if not provided,
// but acknowledge that the app won't fully function without REAL keys.
const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL || "https://placeholder-project.supabase.co").trim().replace(/^["']|["']$/g, '');
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-anon-key").trim().replace(/^["']|["']$/g, '');

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


const customFetch = async (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const urlStr = url.toString();
  if (urlStr.includes("placeholder-project.supabase.co") || supabaseAnonKey === "placeholder-anon-key") {
    console.warn("Mocking Supabase fetch because VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing.");
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

  const res = await fetch(url, init);

  // Development-only diagnostic logging and GoTrue response normalization for /auth/v1/signup
  if (urlStr.includes('/auth/v1/signup')) {
    try {
      const clone = res.clone();
      const payload = await clone.json();

      if (import.meta.env.DEV) {
        console.groupCollapsed('[Supabase Auth Network Audit] /auth/v1/signup');
        console.log('HTTP Status:', res.status, res.statusText);
        console.log('Raw GoTrue Payload:', payload);
        console.log('confirmation_sent_at:', payload?.confirmation_sent_at || '(none)');
        console.log('email_confirmed_at:', payload?.email_confirmed_at || '(null - confirmation required)');
        console.log('User ID:', payload?.id || payload?.user?.id);
        console.groupEnd();
      }

      // If GoTrue returned user at root without 'user' wrapper (standard when email confirmation is pending)
      if (res.ok && payload && payload.id && !payload.user) {
        const normalized = {
          user: payload,
          session: null,
          ...payload,
        };
        return new Response(JSON.stringify(normalized), {
          status: res.status,
          statusText: res.statusText,
          headers: res.headers,
        });
      }
    } catch {
      // Fallback to original response on any parse error
    }
  }

  return res;
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

