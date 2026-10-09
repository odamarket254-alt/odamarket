import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[120] bg-[#3A2418] text-[#FAF5EC] border border-[#D9A62E]/40 rounded-2xl p-3.5 shadow-2xl flex items-start gap-3 animate-in slide-in-from-bottom duration-300"
    >
      <div className="w-8 h-8 rounded-full bg-[#C65A28]/20 flex items-center justify-center shrink-0 mt-0.5">
        <WifiOff className="w-4 h-4 text-[#D9A62E]" />
      </div>
      <div className="flex-1 text-xs">
        <p className="font-semibold text-white">Offline Mode</p>
        <p className="text-[#FAF5EC]/80 mt-0.5 leading-relaxed">
          You are viewing cached content. Live stock, checkout, M-Pesa payments, and account actions require an internet connection.
        </p>
      </div>
    </div>
  );
};
