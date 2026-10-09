import React, { useState } from 'react';
import { Smartphone, Download, Sparkles, Check, ChevronRight } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  variant?: 'header' | 'drawer' | 'footer' | 'banner' | 'inline';
  className?: string;
  onInstalled?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'inline',
  className = '',
  onInstalled,
}) => {
  const { isInstalled, isStandalone, isIOS, hasNativePrompt, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  // If already installed or running as standalone app, suppress the install prompt
  if (isInstalled || isStandalone) {
    if (variant === 'drawer') {
      return (
        <div className="mx-2 my-2 p-3 rounded-2xl bg-[#3E7D44]/10 border border-[#3E7D44]/30 flex items-center gap-3 text-xs text-[#3E7D44]">
          <Check className="w-4 h-4 shrink-0 stroke-[2.5]" />
          <span className="font-semibold">ODA Market App Installed</span>
        </div>
      );
    }
    return null;
  }

  const handleClick = async () => {
    // If browser supports native beforeinstallprompt (e.g. Chrome / Android / Edge)
    if (hasNativePrompt) {
      const outcome = await install();
      if (outcome === 'accepted') {
        onInstalled?.();
        return;
      }
    }
    // Otherwise open guided installation modal (especially for iOS Safari or instructions)
    setShowModal(true);
  };

  // Header Variant (Desktop Top Bar / Nav)
  if (variant === 'header') {
    return (
      <>
        <button
          onClick={handleClick}
          type="button"
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF5EC]/20 hover:bg-[#FAF5EC]/30 text-white text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer ${className}`}
          title="Install ODA Market App"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>
        <PWAInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
      </>
    );
  }

  // Drawer Variant (Mobile Navigation Drawer in MobileBottomNav)
  if (variant === 'drawer') {
    return (
      <>
        <div className={`p-4 rounded-2xl bg-gradient-to-br from-[#FAF5EC] to-[#F5ECE0] dark:from-[#251B14] dark:to-[#1C140E] border border-[#E8DCC9] dark:border-border shadow-xs my-2 ${className}`}>
          <div className="flex items-start gap-3">
            <img
              src="/pwa-192x192.png"
              alt="ODA Market"
              className="w-11 h-11 rounded-xl shadow-xs border border-white dark:border-border/60 object-contain bg-white p-0.5 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-[#3A2418] dark:text-[#FAF5EC] truncate">
                Install ODA Market
              </h4>
              <p className="text-[11px] text-[#736357] dark:text-[#B5AFA7] leading-snug mt-0.5">
                Faster shopping &amp; 1-tap checkout from your home screen.
              </p>
            </div>
          </div>

          <button
            onClick={handleClick}
            type="button"
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#C65A28] hover:bg-[#A84A1E] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isIOS ? 'Add to iPhone Home Screen' : 'Install App'}</span>
          </button>
        </div>
        <PWAInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
      </>
    );
  }

  // Footer Variant
  if (variant === 'footer') {
    return (
      <>
        <button
          onClick={handleClick}
          type="button"
          className={`inline-flex items-center gap-2 text-sm text-[#FAF5EC]/80 hover:text-[#D9A62E] transition-colors cursor-pointer ${className}`}
        >
          <Smartphone className="w-4 h-4 text-[#D9A62E]" />
          <span>Install ODA Market App</span>
        </button>
        <PWAInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
      </>
    );
  }

  // Default Inline Variant
  return (
    <>
      <button
        onClick={handleClick}
        type="button"
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#C65A28] hover:bg-[#A84A1E] text-white text-xs font-bold shadow-sm transition-all cursor-pointer ${className}`}
      >
        <Smartphone className="w-4 h-4" />
        <span>Install App</span>
      </button>
      <PWAInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};
