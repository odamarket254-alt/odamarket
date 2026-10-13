import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language, translations } from '../locales/translations';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string, fallback?: string, params?: Record<string, string | number>) => string;
  isKiswahili: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'oda_language';
const COOKIE_LANG_KEY = 'oda_cookie_language';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(COOKIE_LANG_KEY);
      if (stored === 'sw' || stored === 'en') {
        return stored;
      }
    }
    return 'en';
  });

  // Sync HTML document lang attribute
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  // When user logs in or profile loads, honor preferred language from database or metadata
  useEffect(() => {
    if (!user) return;

    const syncUserLanguage = async () => {
      try {
        // 1. Check buyer_preferences table first for most up-to-date preference
        const { data, error } = await supabase
          .from('buyer_preferences')
          .select('language')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error && data?.language && (data.language === 'sw' || data.language === 'en')) {
          setLanguageState(data.language as Language);
          localStorage.setItem(STORAGE_KEY, data.language);
          localStorage.setItem(COOKIE_LANG_KEY, data.language);
          return;
        }

        // 2. Check user metadata if not in buyer_preferences
        const metaLang = user.user_metadata?.buyer_preferences?.language;
        if (metaLang === 'sw' || metaLang === 'en') {
          setLanguageState(metaLang as Language);
          localStorage.setItem(STORAGE_KEY, metaLang);
          localStorage.setItem(COOKIE_LANG_KEY, metaLang);
        }
      } catch (err) {
        console.warn('Failed to sync user language preference:', err);
      }
    };

    syncUserLanguage();
  }, [user]);

  // Listen to window storage and custom events for multi-tab or cross-component sync
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if ((e.key === STORAGE_KEY || e.key === COOKIE_LANG_KEY) && e.newValue) {
        if (e.newValue === 'sw' || e.newValue === 'en') {
          setLanguageState(e.newValue);
        }
      }
    };

    const handleCustomLang = (e: any) => {
      const newLang = e?.detail?.language;
      if (newLang === 'sw' || newLang === 'en') {
        setLanguageState(newLang);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('oda_language_change', handleCustomLang);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('oda_language_change', handleCustomLang);
    };
  }, []);

  const setLanguage = useCallback(async (newLang: Language) => {
    // 1. Update state immediately so UI changes without delay or reload
    setLanguageState(newLang);

    // 2. Persist in local storage
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      localStorage.setItem(COOKIE_LANG_KEY, newLang);
      window.dispatchEvent(new CustomEvent('oda_language_change', { detail: { language: newLang } }));
    } catch (e) {
      console.warn('Failed to save language in localStorage:', e);
    }

    // 3. Persist to user settings in database if logged in
    if (user?.id) {
      try {
        // Update database table
        await supabase
          .from('buyer_preferences')
          .upsert({
            user_id: user.id,
            language: newLang,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

        // Update user metadata in auth
        const existingPrefs = user.user_metadata?.buyer_preferences || {};
        await supabase.auth.updateUser({
          data: {
            buyer_preferences: {
              ...existingPrefs,
              language: newLang
            }
          }
        });
      } catch (err) {
        console.warn('Could not persist language to user profile:', err);
      }
    }
  }, [user]);

  const t = useCallback((key: string, fallback?: string, params?: Record<string, string | number>): string => {
    const dict = translations[language] || translations.en;
    let text = dict[key];

    // Fallback to English if missing in selected language
    if (!text && language !== 'en') {
      text = translations.en[key];
    }

    // Fallback to provided fallback or key
    if (!text) {
      text = fallback !== undefined ? fallback : key;
    }

    // Interpolate params e.g. {amount} or {count}
    if (params) {
      Object.entries(params).forEach(([paramKey, val]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
      });
    }

    return text;
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isKiswahili: language === 'sw'
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function useTranslation() {
  return useLanguage();
}
