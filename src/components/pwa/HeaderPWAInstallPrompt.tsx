import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Download, X, Share, PlusSquare, Smartphone, Check, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { LOGO_PATH } from '../../lib/constants';

const SESSION_DISMISSED_KEY = 'oda_pwa_header_dismissed';
const COOLDOWN_KEY = 'oda_pwa_header_cooldown_until';
const INSTALLED_KEY = 'oda_pwa_installed';
const COOLDOWN_DAYS = 14;

// Sensitive routes where installation prompt should never appear
const SENSITIVE_ROUTES = [
  '/checkout',
  '/payment',
  '/order-confirmation',
  '/login',
  '/signup',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/admin',
  '/seller',
];

export const HeaderPWAInstallPrompt: React.FC = () => {
  const { isInstalled, isStandalone, isIOS, hasNativePrompt, install } = usePWAInstall();
  const location = useLocation();

  const [isVisible, setIsVisible] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // Check if current route is sensitive
  const isSensitive = useCallback((pathname: string) => {
    const lower = pathname.toLowerCase();
    return SENSITIVE_ROUTES.some((route) => lower.startsWith(route));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Never show if already installed or running as standalone app
    if (isInstalled || isStandalone || localStorage.getItem(INSTALLED_KEY) === 'true') {
      setIsVisible(false);
      return;
    }

    // 2. Never show on sensitive checkout/payment/auth routes
    if (isSensitive(location.pathname)) {
      setIsVisible(false);
      return;
    }

    // 3. Never show if dismissed during current browser session
    try {
      if (sessionStorage.getItem(SESSION_DISMISSED_KEY) === 'true') {
        setIsVisible(false);
        return;
      }
    } catch {
      // Storage restricted
    }

    // 4. Respect multi-day cooldown after dismissal
    try {
      const cooldownUntil = localStorage.getItem(COOLDOWN_KEY);
      if (cooldownUntil && Number(cooldownUntil) > Date.now()) {
        setIsVisible(false);
        return;
      }
    } catch {
      // Storage restricted
    }

    // 5. Short natural delay (600ms) before appearing neatly in the header
    const timer = setTimeout(() => {
      if (
        !isSensitive(window.location.pathname) &&
        !isStandalone &&
        !isInstalled &&
        localStorage.getItem(INSTALLED_KEY) !== 'true'
      ) {
        setIsVisible(true);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [location.pathname, isInstalled, isStandalone, isSensitive]);

  // Handle dismissal with session storage and cooldown
  const handleDismiss = () => {
    setIsVisible(false);
    setShowIOSGuide(false);
    try {
      sessionStorage.setItem(SESSION_DISMISSED_KEY, 'true');
      const cooldownExpiry = Date.now() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem(COOLDOWN_KEY, String(cooldownExpiry));
    } catch {
      // ignore
    }
  };

  // Handle Install Action
  const handleInstallClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isIOS) {
      // On iPhones, toggle the compact inline Safari instructions drawer
      setShowIOSGuide((prev) => !prev);
      return;
    }

    if (hasNativePrompt) {
      setIsInstalling(true);
      try {
        const outcome = await install();
        if (outcome === 'accepted') {
          setInstallSuccess(true);
          try {
            localStorage.setItem(INSTALLED_KEY, 'true');
          } catch {}
          setTimeout(() => {
            setIsVisible(false);
          }, 2000);
        } else {
          // User dismissed prompt, respect decision
          handleDismiss();
        }
      } catch (err) {
        console.error('[PWA Header] Install error:', err);
      } finally {
        setIsInstalling(false);
      }
    } else {
      // Other platforms: toggle helpful instruction
      setShowIOSGuide((prev) => !prev);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="w-full bg-gradient-to-r from-[#FAF5EC] via-[#FFFDF8] to-[#FAF5EC] dark:from-[#251B14] dark:via-[#1E1510] dark:to-[#251B14] border-b border-[#E8DCC9]/80 dark:border-border transition-all duration-300 relative z-40">
      {/* Compact Header Bar */}
      <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-6 py-1.5 sm:py-2 flex items-center justify-between gap-2 sm:gap-4 text-xs">
        
        {/* Left: App Logo + Title + Description */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white dark:bg-card border border-[#E8DCC9] dark:border-border p-0.5 flex items-center justify-center shrink-0 shadow-2xs">
            <img
              src="/pwa-192x192.png"
              alt="ODA Market"
              className="w-full h-full object-contain rounded-md"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = LOGO_PATH;
              }}
            />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 truncate min-w-0">
            <span className="font-bold text-[#3A2418] dark:text-[#FAF5EC] text-[12px] sm:text-[13px] tracking-tight shrink-0">
              Install ODA Market
            </span>
            <span className="hidden min-[480px]:inline text-[11px] text-[#736357] dark:text-[#B5AFA7] truncate">
              — Faster grocery shopping &amp; 1-tap orders
            </span>
          </div>
        </div>

        {/* Right: Install CTA + Close Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {installSuccess ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#3E7D44] bg-[#3E7D44]/10 px-2.5 py-1 rounded-full">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Installed!</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="inline-flex items-center gap-1.5 px-3 py-1 sm:py-1.5 rounded-full bg-[#C65A28] hover:bg-[#A84A1E] active:scale-95 text-white font-semibold text-[11px] sm:text-xs shadow-2xs transition-all cursor-pointer disabled:opacity-75"
              aria-label="Install ODA Market App"
            >
              <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
              <span>
                {isInstalling
                  ? 'Installing...'
                  : isIOS
                  ? showIOSGuide
                    ? 'Hide Guide'
                    : 'Install'
                  : 'Install'}
              </span>
            </button>
          )}

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full text-[#8B857D] hover:text-[#3A2418] dark:hover:text-[#FAF5EC] hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Dismiss install prompt"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Inline Compact iPhone / Safari Instructions Drawer (Not a popup modal) */}
      {showIOSGuide && (
        <div className="border-t border-[#E8DCC9]/70 dark:border-border/70 bg-[#FFFDF8] dark:bg-[#1E1510] px-3 sm:px-6 py-2 transition-all animate-in slide-in-from-top-1 duration-200">
          <div className="w-full max-w-[1400px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] sm:text-xs text-[#3A2418] dark:text-[#FAF5EC]">
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <span className="font-bold text-[#C65A28] inline-flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5" />
                {isIOS ? 'iPhone Safari Steps:' : 'Browser Steps:'}
              </span>

              {isIOS ? (
                <>
                  <span className="inline-flex items-center gap-1 bg-[#FAF5EC] dark:bg-card px-2 py-0.5 rounded-md border border-[#E8DCC9]/60">
                    <span className="font-bold text-[#C65A28]">1.</span> Tap <Share className="w-3 h-3 text-[#C65A28] inline" /> <strong>Share</strong>
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="inline-flex items-center gap-1 bg-[#FAF5EC] dark:bg-card px-2 py-0.5 rounded-md border border-[#E8DCC9]/60">
                    <span className="font-bold text-[#C65A28]">2.</span> Tap <PlusSquare className="w-3 h-3 text-[#C65A28] inline" /> <strong>Add to Home Screen</strong>
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="inline-flex items-center gap-1 bg-[#FAF5EC] dark:bg-card px-2 py-0.5 rounded-md border border-[#E8DCC9]/60">
                    <span className="font-bold text-[#C65A28]">3.</span> Tap <strong className="text-[#C65A28]">Add</strong>
                  </span>
                </>
              ) : (
                <span className="text-[#5F5A54] dark:text-[#C5BEB6]">
                  Click the <strong>Install</strong> icon in your browser address bar or menu (⋮) to add ODA Market.
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="self-end sm:self-auto px-3 py-1 rounded-md bg-[#FAF5EC] dark:bg-card hover:bg-[#E8DCC9]/50 text-[#C65A28] font-bold text-[11px] border border-[#E8DCC9]/80 cursor-pointer transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
