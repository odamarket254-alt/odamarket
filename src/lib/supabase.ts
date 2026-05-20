import { createClient } from '@supabase/supabase-js';

// These should be set in .env or .env.local
// Because this is a preview environment, we fallback to dummy values if not provided,
// but acknowledge that the app won't fully function without REAL keys.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!import.meta.env.VITE_SUPABASE_URL) {
  console.warn('VITE_SUPABASE_URL is missing. Please add it to your environment variables for real database access.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
