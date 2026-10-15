import React, { useState, useEffect, useRef } from 'react';
import { OrderReceipt, OrderReceiptData } from './OrderReceipt';
import { Download, Printer, PackageCheck, MessageCircle, ArrowRight, Check } from 'lucide-react';

interface ThermalPrinterProps {
  receiptData: OrderReceiptData;
  onDownloadPdf: () => void;
  onPrintReceipt: () => void;
  onViewOrder: () => void;
  onResendEmail: () => void;
  onWhatsAppShare: () => void;
  onContinueShopping: () => void;
  isDownloadingPdf?: boolean;
  isResendingEmail?: boolean;
  emailStatusMessage?: string | null;
}

export const ThermalPrinter: React.FC<ThermalPrinterProps> = ({
  receiptData,
  onDownloadPdf,
  onPrintReceipt,
  onViewOrder,
  onResendEmail,
  onWhatsAppShare,
  onContinueShopping,
  isDownloadingPdf = false,
  isResendingEmail = false,
  emailStatusMessage = null
}) => {
  // Check prefers-reduced-motion for accessibility
  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const storageKey = `oda_receipt_animated_${receiptData.order_number}`;
  const alreadyAnimatedInSession = typeof window !== 'undefined' && (
    prefersReducedMotion || sessionStorage.getItem(storageKey) === 'true'
  );

  const [phase, setPhase] = useState<'preparing' | 'printing' | 'completed'>(
    alreadyAnimatedInSession ? 'completed' : 'preparing'
  );

  // Guard against replaying the printing animation on React re-renders
  const hasAnimatedRef = useRef<boolean>(alreadyAnimatedInSession);

  useEffect(() => {
    if (hasAnimatedRef.current) {
      setPhase('completed');
      return;
    }

    // Step 1: Brief "Preparing your receipt..." (400ms)
    const prepTimer = setTimeout(() => {
      setPhase('printing');
    }, 400);

    // Step 2: Realistic printing paper feed completes at 2.4s total (2000ms feed)
    const feedTimer = setTimeout(() => {
      setPhase('completed');
      hasAnimatedRef.current = true;
      try {
        sessionStorage.setItem(storageKey, 'true');
      } catch (e) {
        // Ignore session storage errors
      }
    }, 2400);

    return () => {
      clearTimeout(prepTimer);
      clearTimeout(feedTimer);
    };
  }, [storageKey]);

  return (
    <div className="w-full max-w-[400px] mx-auto flex flex-col items-center">
      {/* Implied Printer Slot Housing (Till Machine Ejection Slot) */}
      <div className="no-print w-full max-w-[380px] bg-neutral-900 border border-neutral-700/80 rounded-t-xl px-4 py-2.5 shadow-md relative z-20">
        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mb-1.5">
          <span className="flex items-center gap-1.5 font-bold tracking-wider text-neutral-300">
            <span
              className={`w-2 h-2 rounded-full transition-colors ${
                phase === 'completed'
                  ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                  : phase === 'printing'
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-amber-400 animate-pulse'
              }`}
            />
            ODA-POS TILL #01
          </span>
          <span className="text-[10px] tracking-wide text-neutral-400 uppercase">
            {phase === 'preparing' && 'PREPARING...'}
            {phase === 'printing' && 'PRINTING...'}
            {phase === 'completed' && 'READY'}
          </span>
        </div>

        {/* Recessed Printer Slot Mouth where paper emerges */}
        <div className="h-1.5 bg-black rounded-full border border-neutral-800 shadow-inner w-full relative overflow-hidden">
          {phase === 'printing' && (
            <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent animate-pulse" />
          )}
        </div>
      </div>

      {/* Printer Paper Container */}
      <div className="w-full relative z-10 -mt-0.5">
        {phase === 'preparing' && (
          <div className="bg-white/95 border border-neutral-300 max-w-[380px] mx-auto py-7 px-4 rounded-b-lg text-center font-mono text-xs text-neutral-600 shadow-sm animate-pulse">
            <div className="w-4 h-4 border-2 border-neutral-700 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="font-semibold text-neutral-800">Preparing your receipt...</p>
            <p className="text-[10px] text-neutral-500 mt-0.5">Payment verified • Connecting to till</p>
          </div>
        )}

        {(phase === 'printing' || phase === 'completed') && (
          <div
            className={`w-full ${
              phase === 'printing' ? 'animate-thermal-feed' : ''
            }`}
          >
            <OrderReceipt order={receiptData} id="receipt-printable-container" />
          </div>
        )}
      </div>

      {/* Subtle Success Message (Visible once printing is completed) */}
      {phase === 'completed' && (
        <div className="no-print mt-3 mb-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300/80 px-3.5 py-1 rounded-full shadow-xs">
          <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
          <span>Receipt Printed • Order #{receiptData.order_number} Paid &amp; Verified</span>
        </div>
      )}

      {/* Compact Secondary Action Controls Directly Underneath Paper */}
      {phase === 'completed' && (
        <div className="no-print w-full max-w-[380px] mt-1 space-y-2">
          {/* 4 Compact Actions Grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* Download PDF Receipt */}
            <button
              onClick={onDownloadPdf}
              disabled={isDownloadingPdf}
              className="h-9 px-3 bg-neutral-900 text-white hover:bg-neutral-800 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-xs disabled:opacity-70 cursor-pointer"
              title="Download official PDF receipt"
            >
              {isDownloadingPdf ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isDownloadingPdf ? "Saving PDF..." : "Download PDF Receipt"}</span>
            </button>

            {/* Print Receipt */}
            <button
              onClick={onPrintReceipt}
              className="h-9 px-3 bg-white border border-neutral-300 text-neutral-800 hover:bg-neutral-50 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="Print thermal receipt on standard or POS printer"
            >
              <Printer className="w-3.5 h-3.5 text-neutral-600" />
              <span>Print Receipt</span>
            </button>

            {/* View Order */}
            <button
              onClick={onViewOrder}
              className="h-9 px-3 bg-white border border-neutral-300 text-neutral-800 hover:bg-neutral-50 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="View live order fulfillment status"
            >
              <PackageCheck className="w-3.5 h-3.5 text-neutral-600" />
              <span>View Order</span>
            </button>

            {/* Share Receipt via WhatsApp */}
            <button
              onClick={onWhatsAppShare}
              className="h-9 px-3 bg-[#25D366]/10 border border-[#25D366]/30 text-[#128C7E] hover:bg-[#25D366]/20 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Share receipt or chat on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
              <span>Share via WhatsApp</span>
            </button>
          </div>

          {/* Email Resend & Info Pill */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-100/90 rounded-lg border border-neutral-200/80 text-[11px] text-neutral-600">
            <span className="truncate max-w-[220px]">
              {emailStatusMessage || `Dispatched to ${receiptData.customer_email || 'your email'}`}
            </span>
            <button
              onClick={onResendEmail}
              disabled={isResendingEmail}
              className="text-[#C65A28] hover:underline font-semibold text-[11px] shrink-0 cursor-pointer disabled:opacity-50 ml-2"
            >
              {isResendingEmail ? 'Sending...' : 'Resend'}
            </button>
          </div>

          {/* Continue Shopping Link */}
          <div className="text-center pt-1 pb-3">
            <button
              onClick={onContinueShopping}
              className="inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-950 font-medium transition-colors cursor-pointer"
            >
              <span>Continue Shopping</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
