import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

export const PWASmartBanner: React.FC = () => {
  const { isInstalled, isStandalone, isIOS, hasNativePrompt, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const dismissed = sessionStorage.getItem('oda_pwa_banner_dismissed') === 'true';
    setIsDismissed(dismissed);
  }, []);

  if (isInstalled || isStandalone || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('oda_pwa_banner_dismissed', 'true');
  };

  const handleAction = async () => {
    if (hasNativePrompt) {
      const outcome = await install();
      if (outcome === 'accepted') {
        handleDismiss();
        return;
      }
    }
    setShowModal(true);
  };

  return (
    <>
      <div className="md:hidden bg-[#FAF5EC] dark:bg-[#251B14] border-b border-[#E8DCC9] dark:border-border px-3 py-2 flex items-center justify-between gap-2 text-xs z-30 relative animate-in slide-in-from-top duration-200">
        <button
          onClick={handleDismiss}
          className="text-[#8B857D] hover:text-[#3A2418] dark:hover:text-[#FAF5EC] p-1 -ml-1"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 flex-1 min-w-0" onClick={handleAction} role="button" tabIndex={0}>
          <img
            src="/pwa-192x192.png"
            alt="ODA Market"
            className="w-8 h-8 rounded-lg shadow-2xs border border-white dark:border-border/60 object-contain bg-white shrink-0"
          />
          <div className="flex-1 min-w-0 leading-tight">
            <p className="font-bold text-[#3A2418] dark:text-[#FAF5EC] truncate text-[12px]">
              ODA Market
            </p>
            <p className="text-[10px] text-[#736357] dark:text-[#B5AFA7] truncate">
              {isIOS ? 'Add to iPhone Home Screen' : 'Install for faster shopping'}
            </p>
          </div>
        </div>

        <button
          onClick={handleAction}
          className="px-3 py-1.5 rounded-full bg-[#C65A28] hover:bg-[#A84A1E] text-white font-bold text-[11px] shrink-0 shadow-2xs transition-colors cursor-pointer"
        >
          {isIOS ? 'Add' : 'Install'}
        </button>
      </div>

      <PWAInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};
