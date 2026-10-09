import React from 'react';
import { X, Share, PlusSquare, Smartphone, CheckCircle, Download, ArrowRight } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isIOS, isAndroid, hasNativePrompt, install } = usePWAInstall();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (hasNativePrompt) {
      const res = await install();
      if (res === 'accepted') {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-[#251B14] rounded-3xl shadow-2xl border border-[#E8DCC9] dark:border-border overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with App Logo and Close */}
        <div className="relative p-6 bg-gradient-to-br from-[#FAF5EC] to-white dark:from-[#251B14] dark:to-[#1C140E] border-b border-[#E8DCC9]/60 dark:border-border">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center text-[#5F5A54] dark:text-[#E8DCC9] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <img
              src="/pwa-192x192.png"
              alt="ODA Market"
              className="w-16 h-16 rounded-2xl shadow-md border-2 border-white dark:border-border/60 object-contain bg-white p-1"
            />
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#C65A28]/10 text-[#C65A28] text-[11px] font-bold uppercase tracking-wider mb-1">
                Official Web App
              </div>
              <h3 className="text-xl font-bold text-[#3A2418] dark:text-[#FAF5EC]">
                ODA Market
              </h3>
              <p className="text-xs text-[#8B857D] dark:text-[#B5AFA7]">
                odamarket.co.ke
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Native Install (Chrome / Android / Edge / Desktop) */}
          {hasNativePrompt ? (
            <div className="space-y-4">
              <p className="text-sm text-[#5F5A54] dark:text-[#E8DCC9]/90 leading-relaxed">
                Install ODA Market on your device for instant access to fresh groceries, exclusive deals, and rapid checkout directly from your home screen.
              </p>

              <div className="space-y-2 text-xs text-[#736357] dark:text-[#B5AFA7]">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#3E7D44]" />
                  <span>Instant 1-tap launch from your home screen</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#3E7D44]" />
                  <span>Faster page loads with smart caching</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#3E7D44]" />
                  <span>Uses less than 5 MB of device storage</span>
                </div>
              </div>

              <button
                onClick={handleInstallClick}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#C65A28] hover:bg-[#A84A1E] text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Install ODA Market App</span>
              </button>
            </div>
          ) : isIOS ? (
            /* iOS Safari Step-by-Step Instructions */
            <div className="space-y-4">
              <p className="text-sm text-[#5F5A54] dark:text-[#E8DCC9]/90">
                Install ODA Market on your iPhone or iPad using Safari:
              </p>

              <div className="space-y-3 bg-[#FAF5EC] dark:bg-[#1C140E] p-4 rounded-2xl border border-[#E8DCC9]/60 dark:border-border">
                {/* Step 1 */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#C65A28] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="text-xs text-[#3A2418] dark:text-[#FAF5EC] leading-relaxed">
                    Tap the <strong className="inline-flex items-center gap-1 font-semibold text-[#C65A28]"><Share className="w-3.5 h-3.5 inline" /> Share</strong> button in Safari's bottom toolbar.
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#C65A28] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="text-xs text-[#3A2418] dark:text-[#FAF5EC] leading-relaxed">
                    Scroll down and select <strong className="inline-flex items-center gap-1 font-semibold text-[#C65A28]"><PlusSquare className="w-3.5 h-3.5 inline" /> Add to Home Screen</strong>.
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#C65A28] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="text-xs text-[#3A2418] dark:text-[#FAF5EC] leading-relaxed">
                    Tap <strong className="font-semibold text-[#C65A28]">Add</strong> in the top-right corner to complete installation.
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <button
                  onClick={onClose}
                  className="w-full py-3 px-4 rounded-2xl bg-[#E8DCC9]/50 dark:bg-muted text-[#3A2418] dark:text-foreground text-xs font-semibold hover:bg-[#E8DCC9] transition-colors"
                >
                  Got It, Thanks!
                </button>
              </div>
            </div>
          ) : (
            /* General Browser / Android without automatic prompt */
            <div className="space-y-4">
              <p className="text-sm text-[#5F5A54] dark:text-[#E8DCC9]/90 leading-relaxed">
                To install ODA Market on your browser:
              </p>

              <div className="space-y-3 bg-[#FAF5EC] dark:bg-[#1C140E] p-4 rounded-2xl border border-[#E8DCC9]/60 dark:border-border text-xs text-[#3A2418] dark:text-[#FAF5EC]">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#C65A28] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    1
                  </div>
                  <p className="leading-relaxed">
                    Tap the browser menu icon (<strong>⋮</strong> or <strong>⋯</strong>) in the top right corner.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#C65A28] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    2
                  </div>
                  <p className="leading-relaxed">
                    Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 px-4 rounded-2xl bg-[#C65A28] text-white text-xs font-semibold hover:bg-[#A84A1E] transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
