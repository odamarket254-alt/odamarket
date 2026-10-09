import { useEffect, useState, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// Global cached prompt in case beforeinstallprompt fired prior to component mounting
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new CustomEvent('oda-pwa-prompt-available'));
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    try {
      localStorage.setItem('oda_pwa_installed', 'true');
    } catch {}
    window.dispatchEvent(new CustomEvent('oda-pwa-installed'));
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if running in standalone mode (already installed on homescreen / desktop)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://') ||
        localStorage.getItem('oda_pwa_installed') === 'true';

      setIsStandalone(isStandaloneMode);
      setIsInstalled(isStandaloneMode);
    };

    checkStandalone();

    // Detect user platform
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice =
      /iphone|ipad|ipod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroidDevice = /android/.test(ua);

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    if (globalDeferredPrompt && !deferredPrompt) {
      setDeferredPrompt(globalDeferredPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      globalDeferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handlePromptAvailable = () => {
      if (globalDeferredPrompt) {
        setDeferredPrompt(globalDeferredPrompt);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsStandalone(true);
      globalDeferredPrompt = null;
      setDeferredPrompt(null);
      try {
        localStorage.setItem('oda_pwa_installed', 'true');
      } catch {}
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('oda-pwa-prompt-available', handlePromptAvailable);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('oda-pwa-installed', handleAppInstalled);

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (evt: MediaQueryListEvent) => {
      if (evt.matches) {
        setIsInstalled(true);
        setIsStandalone(true);
      }
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('oda-pwa-prompt-available', handlePromptAvailable);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('oda-pwa-installed', handleAppInstalled);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      }
    };
  }, [deferredPrompt]);

  const install = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unsupported'> => {
    const promptToUse = deferredPrompt || globalDeferredPrompt;
    if (promptToUse) {
      try {
        await promptToUse.prompt();
        const choice = await promptToUse.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setIsStandalone(true);
          globalDeferredPrompt = null;
          setDeferredPrompt(null);
          try {
            localStorage.setItem('oda_pwa_installed', 'true');
          } catch {}
        }
        return choice.outcome;
      } catch (err) {
        console.error('[PWA] Error during install prompt:', err);
        return 'unsupported';
      }
    }
    return 'unsupported';
  }, [deferredPrompt]);

  return {
    isInstallable: !!(deferredPrompt || globalDeferredPrompt),
    isInstalled,
    isStandalone,
    isIOS,
    isAndroid,
    install,
    hasNativePrompt: !!(deferredPrompt || globalDeferredPrompt),
  };
}
