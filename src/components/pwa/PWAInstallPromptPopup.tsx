import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Share, PlusSquare, Download, Check, Sparkles, Smartphone, CheckCircle2, Monitor } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { LOGO_PATH } from '../../lib/constants';

const SESSION_DISMISSED_KEY = 'oda_pwa_dismissed_session';
const COOLDOWN_KEY = 'oda_pwa_prompt_cooldown_until';
const INSTALLED_KEY = 'oda_pwa_installed';
const COOLDOWN_DAYS = 7; // Suppress for 7 days if user dismisses

// Critical paths where install prompt must NEVER be shown to avoid blocking shopping, payment, or auth sessions
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
  '/help-center/ticket',
  '/help-center/track',
];

export const PWAInstallPromptPopup: React.FC = () => {
  const { isInstalled, isStandalone, isIOS, hasNativePrompt, install } = usePWAInstall();
  const location = useLocation();

  const [isVisible, setIsVisible] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // Check if current route is sensitive
  const isCurrentRouteSensitive = useCallback((pathname: string) => {
    const lower = pathname.toLowerCase();
    return SENSITIVE_ROUTES.some((route) => lower.startsWith(route));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Immediately abort if running in standalone mode or already flagged installed
    if (isInstalled || isStandalone || localStorage.getItem(INSTALLED_KEY) === 'true') {
      setIsVisible(false);
      return;
    }

    // 2. Abort if user is in an active checkout, payment, auth or admin flow
    if (isCurrentRouteSensitive(location.pathname)) {
      setIsVisible(false);
      return;
    }

    // 3. Respect user sessions: Do NOT show if dismissed in this browser session
    try {
      if (sessionStorage.getItem(SESSION_DISMISSED_KEY) === 'true') {
        setIsVisible(false);
        return;
      }
    } catch {
      // Storage access blocked or restricted
    }

    // 4. Respect multi-day cooldown
    try {
      const cooldownUntil = localStorage.getItem(COOLDOWN_KEY);
      if (cooldownUntil && Number(cooldownUntil) > Date.now()) {
        setIsVisible(false);
        return;
      }
    } catch {
      // Storage access blocked or restricted
    }

    // 5. Short non-intrusive delay: Wait 2.5 seconds after page load before showing
    const timer = setTimeout(() => {
      // Re-verify conditions before revealing
      if (
        !isCurrentRouteSensitive(window.location.pathname) &&
        !isStandalone &&
        !isInstalled &&
        localStorage.getItem(INSTALLED_KEY) !== 'true'
      ) {
        setIsVisible(true);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [location.pathname, isInstalled, isStandalone, isCurrentRouteSensitive]);

  // Handle dismissal: respects current session AND sets multi-day cooldown
  const handleDismiss = () => {
    setIsVisible(false);
    setShowGuide(false);
    try {
      // 1. Session storage: never show again for the remainder of this session
      sessionStorage.setItem(SESSION_DISMISSED_KEY, 'true');
      // 2. Local storage: suppress for 7 days
      const cooldownExpiry = Date.now() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem(COOLDOWN_KEY, String(cooldownExpiry));
    } catch {
      // ignore
    }
  };

  // Handle Install Action
  const handleInstall = async () => {
    if (isIOS) {
      // On iPhones, show clear instructions for Safari -> Share -> Add to Home Screen
      setShowGuide(true);
      return;
    }

    if (hasNativePrompt) {
      // On supported Android / Chromium browsers, trigger the native installation prompt
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
          }, 1800);
        } else {
          // If user clicked Cancel in the browser prompt, dismiss gracefully
          handleDismiss();
        }
      } catch (err) {
        console.error('[PWA Prompt] Install error:', err);
        setShowGuide(true);
      } finally {
        setIsInstalling(false);
      }
    } else {
      // Fallback instruction view if browser does not directly support beforeinstallprompt
      setShowGuide(true);
    }
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Install ODA Market App Prompt"
      className="fixed z-[100] inset-x-3 bottom-20 md:bottom-6 md:right-6 md:left-auto md:max-w-[420px] transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
    >
      <div className="bg-[#FFFDF8] dark:bg-[#251B14] rounded-3xl p-5 shadow-[0_12px_40px_rgba(45,31,23,0.18)] border border-[#E8DCC9] dark:border-border overflow-hidden relative">
        {/* Decorative Top Accent Stripe */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#C65A28] via-[#D9A62E] to-[#C65A28]" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-[#FAF5EC] dark:bg-card hover:bg-[#E8DCC9]/60 dark:hover:bg-muted text-[#736357] dark:text-[#E8DCC9] flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close installation prompt"
        >
          <X className="w-4 h-4" />
        </button>

        {installSuccess ? (
          /* ========================================================= */
          /* SUCCESS STATE                                             */
          /* ========================================================= */
          <div className="py-4 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#3E7D44]/10 text-[#3E7D44] mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h4 className="text-base font-bold text-[#3A2418] dark:text-[#FAF5EC]">
              ODA Market Installed!
            </h4>
            <p className="text-xs text-[#736357] dark:text-[#C5BEB6]">
              You can now launch ODA Market directly from your home screen.
            </p>
          </div>
        ) : !showGuide ? (
          /* ========================================================= */
          /* 1. MAIN INVITATION STATE                                  */
          /* ========================================================= */
          <div className="space-y-4 pt-1">
            {/* Header: Logo & Badge */}
            <div className="flex items-center gap-3.5 pr-8">
              <div className="w-13 h-13 rounded-2xl bg-white dark:bg-card border border-[#E8DCC9]/80 dark:border-border p-1.5 flex items-center justify-center shrink-0 shadow-2xs">
                <img
                  src={LOGO_PATH}
                  alt="ODA Market"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback to PWA icon if image fails
                    (e.currentTarget as HTMLImageElement).src = '/pwa-192x192.png';
                  }}
                />
              </div>
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C65A28]/10 text-[#C65A28] text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-[#D9A62E]" />
                  Official Web App
                </span>
                <h3 className="text-base font-bold text-[#3A2418] dark:text-[#FAF5EC] tracking-tight truncate mt-0.5">
                  Shop Faster with ODA Market
                </h3>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-[#736357] dark:text-[#C5BEB6] leading-relaxed">
              Add ODA Market to your home screen for rapid 1-tap supermarket grocery shopping, faster loading, and live order tracking.
            </p>

            {/* Benefits Checkmarks */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-[#5F5A54] dark:text-[#D5CFC8] pt-0.5">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#3E7D44] stroke-[2.5]" />
                <span>1-Tap Launch</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#3E7D44] stroke-[2.5]" />
                <span>Zero Storage Bloat</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#3E7D44] stroke-[2.5]" />
                <span>Fast Page Speeds</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#3E7D44] stroke-[2.5]" />
                <span>Live Order Updates</span>
              </div>
            </div>

            {/* Action Buttons: "Install App" + "Maybe Later" */}
            <div className="pt-2 flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleInstall}
                disabled={isInstalling}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#C65A28] hover:bg-[#A84A1E] active:scale-[0.98] text-white font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-75"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>
                  {isInstalling
                    ? 'Installing...'
                    : isIOS
                    ? 'Install App'
                    : 'Install App'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="px-4 py-2.5 rounded-xl border border-[#E8DCC9] dark:border-border hover:bg-[#FAF5EC] dark:hover:bg-muted text-xs font-semibold text-[#736357] dark:text-[#E8DCC9] transition-colors cursor-pointer"
              >
                Maybe Later
              </button>
            </div>
          </div>
        ) : isIOS ? (
          /* ========================================================= */
          /* 2. IPHONE / SAFARI INSTALL INSTRUCTIONS                   */
          /* ========================================================= */
          <div className="space-y-3.5 pt-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C65A28]/10 text-[#C65A28] flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#3A2418] dark:text-[#FAF5EC]">
                  Install on iPhone &amp; iPad
                </h4>
                <p className="text-[11px] text-[#736357] dark:text-[#C5BEB6]">
                  Follow 3 quick steps in Safari:
                </p>
              </div>
            </div>

            <div className="space-y-2 bg-[#FAF5EC] dark:bg-card/70 p-3 rounded-2xl border border-[#E8DCC9]/80 dark:border-border text-xs text-[#3A2418] dark:text-[#FAF5EC]">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#C65A28] text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <p className="leading-snug">
                  Tap the <strong className="inline-flex items-center gap-1 text-[#C65A28] font-bold"><Share className="w-3.5 h-3.5 inline shrink-0" /> Share</strong> button in Safari's bottom bar.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#C65A28] text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <p className="leading-snug">
                  Scroll down and tap <strong className="inline-flex items-center gap-1 text-[#C65A28] font-bold"><PlusSquare className="w-3.5 h-3.5 inline shrink-0" /> Add to Home Screen</strong>.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#C65A28] text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <p className="leading-snug">
                  Tap <strong className="text-[#C65A28] font-bold">Add</strong> in the top-right corner to finish.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full py-2.5 px-4 rounded-xl bg-[#C65A28] hover:bg-[#A84A1E] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* 3. DESKTOP / OTHER BROWSER MANUAL INSTRUCTIONS            */
          /* ========================================================= */
          <div className="space-y-3.5 pt-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C65A28]/10 text-[#C65A28] flex items-center justify-center shrink-0">
                <Monitor className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#3A2418] dark:text-[#FAF5EC]">
                  Install ODA Market
                </h4>
                <p className="text-[11px] text-[#736357] dark:text-[#C5BEB6]">
                  Install from your browser:
                </p>
              </div>
            </div>

            <div className="space-y-2 bg-[#FAF5EC] dark:bg-card/70 p-3 rounded-2xl border border-[#E8DCC9]/80 dark:border-border text-xs text-[#3A2418] dark:text-[#FAF5EC]">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#C65A28] text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <p className="leading-snug">
                  Look for the <strong className="text-[#C65A28] font-bold">Install App</strong> icon in your browser's address bar or click the menu (⋮).
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#C65A28] text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <p className="leading-snug">
                  Select <strong className="text-[#C65A28] font-bold">Install ODA Market</strong> to add it to your desktop.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full py-2.5 px-4 rounded-xl bg-[#C65A28] hover:bg-[#A84A1E] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
