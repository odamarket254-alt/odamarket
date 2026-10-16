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

  const orderId = receiptData.order_number || receiptData.order_id || 'default_order';
  const storageKey = `oda_thermal_printed_${orderId}`;

  const isAlreadyCompleted = typeof window !== 'undefined' && (
    prefersReducedMotion || sessionStorage.getItem(storageKey) === 'true'
  );

  // Phases:
  // 'start': Printer activates (Phase 1, ~1000ms)
  // 'printing': Paper feeds downward continuously (Phase 2 & 3, adjusted 6-9.5s)
  // 'completed': Final resting state with cutter finish, PAID stamp, and secondary buttons
  const [phase, setPhase] = useState<'start' | 'printing' | 'completed'>(
    isAlreadyCompleted ? 'completed' : 'start'
  );

  // Compute realistic print duration based on item count: 6–10s target
  const itemsCount = receiptData.items?.length || 1;
  const printDurationMs = Math.round(
    Math.min(9500, Math.max(6000, 5400 + itemsCount * 600))
  );

  const receiptRef = useRef<HTMLDivElement>(null);
  const [measuredHeight, setMeasuredHeight] = useState<number>(750);
  const [paperHeight, setPaperHeight] = useState<number | string>(
    isAlreadyCompleted ? 'auto' : 0
  );

  // Guard against replaying the printing animation on React re-renders or realtime updates
  const hasAnimatedRef = useRef<boolean>(isAlreadyCompleted);

  // Verify payment status authoritatively
  const isPaymentVerified = (receiptData.payment_status || '').toUpperCase() === 'PAID';

  // Measure initial receipt height
  useEffect(() => {
    if (receiptRef.current) {
      const height = receiptRef.current.scrollHeight;
      if (height > 100) {
        setMeasuredHeight(height);
      }
    }
  }, [receiptData]);

  useEffect(() => {
    if (hasAnimatedRef.current) {
      setPhase('completed');
      setPaperHeight('auto');
      return;
    }

    // Phase 1: Printer warmup / activation (1000ms)
    // Shows "Generating your receipt...", printer hum activates, amber indicator pulses
    const warmupTimer = setTimeout(() => {
      setPhase('printing');
      // Trigger paper height expansion downward from slot
      const targetH = receiptRef.current?.scrollHeight || measuredHeight || 750;
      setPaperHeight(targetH);
    }, 1000);

    // Phase 4: Final printing details after the complete paper has emerged
    const completeTimer = setTimeout(() => {
      setPhase('completed');
      setPaperHeight('auto');
      hasAnimatedRef.current = true;
      try {
        sessionStorage.setItem(storageKey, 'true');
      } catch (e) {
        // Ignore session storage errors
      }
    }, 1000 + printDurationMs);

    return () => {
      clearTimeout(warmupTimer);
      clearTimeout(completeTimer);
    };
  }, [printDurationMs, storageKey, measuredHeight]);

  return (
    <div className="w-full max-w-[400px] mx-auto flex flex-col items-center">
      {/* 
        ========================================================================
        PHASE 1: REALISTIC ODA MARKET SUPERMARKET RECEIPT PRINTER (STATIONARY TOP)
        Colors match OdaMarket's dark brown (#1E1916), cream (#F6EFE8),
        white, and brand orange (#C65A28)
        ========================================================================
      */}
      <div
        className={`no-print w-full max-w-[380px] bg-[#1E1916] border border-[#382F2A] rounded-t-2xl shadow-xl relative z-20 overflow-hidden transition-all duration-300 ${
          phase === 'printing' ? 'animate-printer-hum' : ''
        }`}
      >
        {/* Top Metallic / Ventilation Trim Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#2A231E] via-[#4A3D34] to-[#2A231E] border-b border-[#382F2A]" />

        <div className="px-4 py-2.5">
          {/* Printer Header: Model Badge, Status Text & Indicator LED */}
          <div className="flex items-center justify-between text-[11px] font-mono mb-2">
            {/* Left: OdaMarket Brand & Model Badge */}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#C65A28] flex items-center justify-center text-[7px] font-black text-white">
                O
              </span>
              <span className="font-bold tracking-wider text-[#F6EFE8] text-[10.5px]">
                ODAMARKET TILL POS-01
              </span>
            </div>

            {/* Right: Status Indicator Light & Dynamic Label */}
            <div className="flex items-center gap-1.5 text-[10px] tracking-wide font-medium">
              <span
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  phase === 'completed'
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                    : phase === 'printing'
                    ? 'bg-[#C65A28] animate-pulse shadow-[0_0_8px_rgba(198,90,40,0.8)]'
                    : 'bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                }`}
              />
              <span className="text-[#F6EFE8]/90 font-mono uppercase">
                {phase === 'start' && 'Generating your receipt...'}
                {phase === 'printing' && 'Printing receipt...'}
                {phase === 'completed' && 'Receipt ready'}
              </span>
            </div>
          </div>

          {/* Tactile Control Elements: Side Ribs, Status & Buttons */}
          <div className="flex items-center justify-between pb-1 text-[9px] font-mono text-neutral-400">
            {/* Ventilation Grooves */}
            <div className="flex gap-1" aria-hidden="true">
              <div className="w-4 h-1 bg-[#2C241E] rounded-full" />
              <div className="w-4 h-1 bg-[#2C241E] rounded-full" />
              <div className="w-4 h-1 bg-[#2C241E] rounded-full" />
            </div>

            {/* Power & Feed Buttons */}
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[#F6EFE8]/70">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 inline-block" />
                POWER
              </span>
              <span className="px-1.5 py-0.5 bg-[#2B231D] border border-[#3E3229] rounded text-[8px] text-[#F6EFE8]/80 font-bold uppercase tracking-tight">
                FEED
              </span>
            </div>
          </div>

          {/* Recessed Printer Slot Mouth where paper physically emerges */}
          <div className="relative mt-1">
            <div className="h-2.5 bg-black rounded-sm border border-[#3D332A] shadow-inner w-full relative overflow-hidden flex items-center justify-center">
              {/* Metallic Roller Glint during active paper feed */}
              {phase === 'printing' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C65A28]/40 to-transparent animate-roller-spin w-full h-full" />
              )}
              {/* Cutter slice flash at completion */}
              {phase === 'completed' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent animate-cutter-slice w-full h-full" />
              )}
              {/* Internal roller line */}
              <div className="w-full h-0.5 bg-neutral-800/80 mx-2 rounded-full" />
            </div>

            {/* Cutter Blade Metallic Edge Guide */}
            <div className="h-0.5 w-full bg-gradient-to-r from-[#3D332A] via-[#635447] to-[#3D332A]" />
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        PHASE 2 & 3: CONTINUOUS REALISTIC PAPER FEED CONTAINER
        Paper begins inside printer slot (0px height) and expands downward
        visibly from the opening over the calculated duration (6–10 seconds),
        revealing all 9 sections in exact order!
        ========================================================================
      */}
      <div
        className="paper-viewport w-full relative z-10 -mt-0.5"
        style={{
          height: paperHeight,
          overflow: phase === 'completed' ? 'visible' : 'hidden',
          transition:
            phase === 'printing'
              ? `height ${printDurationMs}ms cubic-bezier(0.25, 0.1, 0.25, 1)`
              : phase === 'completed'
              ? 'none'
              : 'height 0.2s ease-out'
        }}
      >
        <div ref={receiptRef} className="w-full">
          <OrderReceipt
            order={receiptData}
            id="receipt-printable-container"
            showPaidStamp={phase === 'completed'}
            isPaymentVerified={isPaymentVerified}
          />
        </div>
      </div>

      {/* 
        ========================================================================
        PHASE 4: FINAL PRINTING DETAILS & RESTING STATE
        Small green confirmation indicator: "Receipt generated successfully."
        Followed by compact secondary actions underneath.
        ========================================================================
      */}
      {phase === 'completed' && (
        <div className="no-print mt-3 mb-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300/80 px-3.5 py-1 rounded-full shadow-xs transition-opacity duration-500 animate-fade-in">
          <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
          <span>Receipt generated successfully.</span>
        </div>
      )}

      {/* Compact Secondary Action Controls Directly Underneath Paper */}
      {phase === 'completed' && (
        <div className="no-print w-full max-w-[380px] mt-1 space-y-2 transition-all duration-500 animate-fade-in">
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
              <span>Share Receipt via WhatsApp</span>
            </button>
          </div>

          {/* Email Resend & Info Line */}
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
