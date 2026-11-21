"use client";

import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import {
  Download,
  Printer,
  PackageCheck,
  MessageCircle,
  ArrowRight,
  RotateCcw,
  Check,
  ShieldCheck,
  Truck,
  Sparkles,
} from "lucide-react";
import {
  ReceiptPrinter,
  ReceiptPrinterStage,
  ReceiptFeedMotion,
} from "./ReceiptPrinter";
import { OrderReceiptData } from "./OrderReceipt";
import { cn } from "@/helpers/classname-helper";

export interface ReceiptPrinterAnimationProps {
  receiptData: OrderReceiptData;
  onDownloadPdf: () => void;
  onPrintReceipt: () => void;
  onViewOrder: () => void;
  onResendEmail?: () => void;
  onWhatsAppShare?: () => void;
  onContinueShopping: () => void;
  isDownloadingPdf?: boolean;
  isResendingEmail?: boolean;
  emailStatusMessage?: string | null;
  defaultFeedMotion?: ReceiptFeedMotion;
}

export const ReceiptPrinterAnimation: React.FC<ReceiptPrinterAnimationProps> = ({
  receiptData,
  onDownloadPdf,
  onPrintReceipt,
  onViewOrder,
  onResendEmail,
  onWhatsAppShare,
  onContinueShopping,
  isDownloadingPdf = false,
  isResendingEmail = false,
  emailStatusMessage = null,
  defaultFeedMotion = "stepped",
}) => {
  const orderId =
    receiptData.order_number || receiptData.order_id || "default_order";
  const storageKey = `oda_receipt_printer_${orderId}`;

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const isAlreadyCompleted =
    typeof window !== "undefined" &&
    (prefersReducedMotion || sessionStorage.getItem(storageKey) === "true");

  const [stage, setStage] = useState<ReceiptPrinterStage>(
    isAlreadyCompleted ? "complete" : "processing",
  );
  const [feedMotion, setFeedMotion] = useState<ReceiptFeedMotion>(defaultFeedMotion);
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    setCurrentTime(format(new Date(), "HH:mm:ss"));
  }, []);

  // Progression: processing (1.2s) -> printing (2.0s) -> complete
  useEffect(() => {
    if (isAlreadyCompleted) return;

    const timer1 = setTimeout(() => {
      setStage("printing");
    }, 1200);

    const timer2 = setTimeout(() => {
      setStage("complete");
      try {
        sessionStorage.setItem(storageKey, "true");
      } catch (e) {
        // Ignore session storage errors
      }
    }, 3200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isAlreadyCompleted, storageKey]);

  const handleReplay = () => {
    setStage("processing");
    setTimeout(() => {
      setStage("printing");
      setTimeout(() => {
        setStage("complete");
      }, 2000);
    }, 1200);
  };

  const formattedDate = React.useMemo(() => {
    if (!receiptData.created_at) return format(new Date(), "dd/MM/yyyy HH:mm");
    try {
      return format(new Date(receiptData.created_at), "dd/MM/yyyy hh:mm a");
    } catch {
      return "N/A";
    }
  }, [receiptData.created_at]);

  const deliveryFee = Number(receiptData.delivery_fee || 0);
  const discount = Number(receiptData.discount || 0);
  const isPaymentVerified =
    (receiptData.payment_status || "").toUpperCase() === "PAID";

  return (
    <div className="w-full flex flex-col items-center justify-start pb-16 px-2 sm:px-4">
      {/* Top Banner Celebration */}
      <div className="w-full max-w-md mb-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-medium mb-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Payment Received • Order Confirmed</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-neutral-900 dark:text-neutral-100">
          Thank you for your order!
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          Your thermal receipt has been generated below.
        </p>
      </div>

      {/* The Exact Receipt Printer Machine */}
      <ReceiptPrinter.Root
        stage={stage}
        feedMotion={feedMotion}
        animate={true}
        className="w-full max-w-sm sm:max-w-md shadow-2xl rounded-2xl"
      >
        <ReceiptPrinter.Machine className="w-full bg-[#18191b] border-neutral-700/80 shadow-2xl">
          {/* Header Bar */}
          <ReceiptPrinter.Header className="px-1 text-xs">
            <ReceiptPrinter.Status />
            <div className="flex items-center gap-2 font-mono text-[10px] text-neutral-400">
              <span className="hidden sm:inline">POS-01</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{currentTime}</span>
            </div>
          </ReceiptPrinter.Header>

          {/* Machine OLED / Digital Screen */}
          <ReceiptPrinter.Screen className="mt-1 bg-[#101113] border-neutral-800/90 shadow-inner">
            <div className="flex flex-col gap-2 font-mono">
              <div className="flex items-center justify-between text-[11px] text-neutral-400 border-b border-neutral-800/80 pb-1.5">
                <span className="font-semibold tracking-wider text-neutral-300">
                  ODA MARKET POS TILL
                </span>
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                  LIVE M-PESA
                </span>
              </div>

              <div className="flex items-baseline justify-between py-1">
                <span className="text-xs text-neutral-400">Total Charged:</span>
                <span className="text-lg sm:text-xl font-bold tracking-tight text-white tabular-nums">
                  KSh {Number(receiptData.grand_total).toLocaleString("en-KE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10.5px] text-neutral-400 pt-1 border-t border-neutral-800/80">
                <div>
                  <span className="block text-[9.5px] text-neutral-500 uppercase">
                    Order Ref
                  </span>
                  <span className="font-semibold text-neutral-200">
                    #{receiptData.order_number}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[9.5px] text-neutral-500 uppercase">
                    Status
                  </span>
                  <span className="font-semibold text-emerald-400 flex items-center justify-end gap-1">
                    <Check className="w-3 h-3 stroke-[3]" />
                    PAID
                  </span>
                </div>
              </div>
            </div>
          </ReceiptPrinter.Screen>
        </ReceiptPrinter.Machine>

        {/* Ejected Paper Output with Jagged Bottom Cut Edge */}
        <ReceiptPrinter.Output className="w-full">
          <ReceiptPrinter.Paper
            id="receipt-printable-container"
            className="w-full max-w-[360px] mx-auto bg-white text-neutral-900 border border-neutral-300/80 shadow-lg text-[11.5px] select-text px-4 sm:px-5 pt-6 pb-10"
            style={{
              fontFamily:
                "'SF Mono', Monaco, Menlo, Consolas, 'Liberation Mono', 'Courier New', monospace",
              letterSpacing: "-0.01em",
            }}
          >
            {/* ODA Market Store Heading */}
            <div className="text-center space-y-1">
              <div className="flex justify-center items-center py-1">
                <img
                  src="/oda-logo.png.jpeg"
                  alt="ODA Market"
                  className="h-9 w-auto object-contain max-w-[150px]"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = "none";
                    const sibling = target.nextElementSibling as HTMLElement;
                    if (sibling) sibling.style.display = "block";
                  }}
                />
                <div className="hidden" aria-label="ODA Market">
                  <span className="font-extrabold text-lg tracking-tight text-[#0A2E5C]">
                    ODA
                  </span>
                  <span className="font-extrabold text-lg tracking-tight text-[#C65A28]">
                    Market
                  </span>
                </div>
              </div>

              <h2 className="text-[12.5px] font-black uppercase tracking-wider text-neutral-950">
                ODAMARKET SUPERMARKET
              </h2>
              <p className="text-[10px] text-neutral-600">
                Quality • Value • Convenience
              </p>
              <p className="text-[9.5px] text-neutral-500 border-t border-dotted border-neutral-300 pt-1">
                Nairobi, Kenya • PIN: P051234567Z • ETR FISCAL RECEIPT
              </p>
            </div>

            <div className="border-b border-dashed border-neutral-400 my-2" />

            {/* Receipt Identification & Date */}
            <div className="space-y-0.5 text-[10.5px]">
              <div className="flex justify-between items-baseline">
                <span className="text-neutral-500 uppercase">RECEIPT NO:</span>
                <span className="font-bold text-neutral-950">
                  #{receiptData.order_number}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-neutral-500 uppercase">DATE / TIME:</span>
                <span className="font-medium text-neutral-900">
                  {formattedDate}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-neutral-500 uppercase">TERMINAL:</span>
                <span className="font-medium text-neutral-700">
                  POS-01 (ONLINE CHECKOUT)
                </span>
              </div>
            </div>

            <div className="border-b border-dashed border-neutral-400 my-2" />

            {/* Customer Details */}
            <div className="space-y-0.5 text-[10.5px]">
              <div className="flex justify-between items-start gap-2">
                <span className="text-neutral-500 uppercase shrink-0">
                  CUSTOMER:
                </span>
                <span className="font-bold text-neutral-950 text-right">
                  {receiptData.customer_name}
                </span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-neutral-500 uppercase shrink-0">
                  PHONE:
                </span>
                <span className="font-medium text-neutral-900 text-right">
                  {receiptData.customer_phone}
                </span>
              </div>
              {receiptData.customer_email && (
                <div className="flex justify-between items-start gap-2">
                  <span className="text-neutral-500 uppercase shrink-0">
                    EMAIL:
                  </span>
                  <span className="font-medium text-neutral-800 text-right truncate max-w-[190px]">
                    {receiptData.customer_email}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-start gap-2">
                <span className="text-neutral-500 uppercase shrink-0">
                  DELIVERY:
                </span>
                <span className="font-medium text-neutral-800 text-right">
                  {receiptData.delivery_location}
                </span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-neutral-500 uppercase shrink-0">
                  ADDRESS:
                </span>
                <span className="font-medium text-neutral-800 text-right max-w-[190px] break-words">
                  {receiptData.delivery_address}
                </span>
              </div>
              {receiptData.delivery_method && (
                <div className="flex justify-between items-start gap-2">
                  <span className="text-neutral-500 uppercase shrink-0">
                    METHOD:
                  </span>
                  <span className="font-semibold text-[#C65A28] text-right uppercase">
                    {receiptData.delivery_method === "express"
                      ? "Express Boda (30-60 min)"
                      : "Standard Delivery"}
                  </span>
                </div>
              )}
            </div>

            <div className="border-b border-dashed border-neutral-400 my-2" />

            {/* Itemized Table */}
            <div className="grid grid-cols-[28px_1fr_85px] gap-1 text-[9.5px] font-bold uppercase text-neutral-500 pb-1 border-b border-neutral-300">
              <span>QTY</span>
              <span>DESCRIPTION</span>
              <span className="text-right">AMOUNT (KSH)</span>
            </div>

            <div className="py-1 space-y-1.5">
              {receiptData.items && receiptData.items.length > 0 ? (
                receiptData.items.map((it, idx) => {
                  const lineTotal =
                    it.total_price || it.unit_price * it.quantity;
                  return (
                    <div key={idx} className="space-y-0.5">
                      <div className="grid grid-cols-[28px_1fr_85px] gap-1 items-start text-[11px]">
                        <span className="font-bold text-neutral-950">
                          {it.quantity}x
                        </span>
                        <span className="font-medium text-neutral-900 leading-snug break-words">
                          {it.product_name}
                        </span>
                        <span className="text-right font-bold tabular-nums text-neutral-950">
                          {Number(lineTotal).toLocaleString("en-KE", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      {it.quantity > 1 && (
                        <div className="pl-7 text-[9.5px] text-neutral-500 tabular-nums">
                          @ KSh{" "}
                          {Number(it.unit_price).toLocaleString("en-KE", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          each
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-2 text-center text-neutral-400 text-xs italic">
                  No items recorded
                </div>
              )}
            </div>

            <div className="border-b border-dashed border-neutral-400 my-2" />

            {/* Totals Section */}
            <div className="space-y-1 text-[11px] text-neutral-800">
              <div className="flex justify-between items-baseline">
                <span className="text-neutral-600 uppercase">SUBTOTAL:</span>
                <span className="font-medium tabular-nums text-neutral-900">
                  KSh{" "}
                  {Number(receiptData.subtotal).toLocaleString("en-KE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="flex justify-between items-baseline">
                <span className="text-neutral-600 uppercase">DELIVERY FEE:</span>
                <span className="font-medium tabular-nums text-neutral-900">
                  {deliveryFee > 0
                    ? `KSh ${deliveryFee.toLocaleString("en-KE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : "FREE"}
                </span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between items-baseline text-emerald-700">
                  <span className="uppercase">DISCOUNT:</span>
                  <span className="font-medium tabular-nums">
                    -KSh{" "}
                    {discount.toLocaleString("en-KE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}

              {/* Total Paid Double Rule */}
              <div className="border-t-2 border-b-2 border-neutral-950 py-1.5 my-1.5 flex justify-between items-baseline">
                <span className="text-[13px] font-black tracking-wide uppercase text-neutral-950">
                  TOTAL PAID:
                </span>
                <span className="text-[14px] font-black tabular-nums text-[#C65A28]">
                  KSh{" "}
                  {Number(receiptData.grand_total).toLocaleString("en-KE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            {/* Payment Verification Box */}
            <div className="space-y-1 pt-1">
              <div className="space-y-0.5 text-[10px] text-neutral-800 bg-neutral-100/70 p-2 rounded border border-neutral-200">
                <div className="flex justify-between items-baseline">
                  <span className="text-neutral-500 uppercase">PAYMENT:</span>
                  <span className="font-bold text-neutral-900 uppercase">
                    {receiptData.payment_method || "M-Pesa"} (Paystack)
                  </span>
                </div>

                {receiptData.transaction_id && (
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-neutral-500 uppercase shrink-0">
                      REF ID:
                    </span>
                    <span className="font-mono text-[9px] font-bold text-neutral-900 break-all text-right">
                      {receiptData.transaction_id}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-baseline">
                  <span className="text-neutral-500 uppercase">STATUS:</span>
                  <span
                    className={`font-bold uppercase ${
                      isPaymentVerified ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {isPaymentVerified
                      ? "CONFIRMED & SETTLED ✓"
                      : "AWAITING CONFIRMATION"}
                  </span>
                </div>
              </div>

              {/* Official Paid Rubber Stamp */}
              <div className="py-1">
                <div className="border-2 border-emerald-600 bg-emerald-50/90 rounded px-2.5 py-1.5 text-center text-emerald-800 shadow-xs">
                  <div className="flex items-center justify-center gap-1.5 text-[10.5px] font-black uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>★ OFFICIAL RECEIPT • PAID IN FULL ★</span>
                  </div>
                  <div className="text-[9px] font-mono text-emerald-700 tracking-tight mt-0.5">
                    ODAMARKET LEDGER • M-PESA SETTLED &amp; VERIFIED
                  </div>
                </div>
              </div>
            </div>

            {/* Barcode & Supermarket Greeting */}
            <div className="text-center pt-2 space-y-1">
              <svg
                className="h-6 w-44 mx-auto"
                viewBox="0 0 200 24"
                preserveAspectRatio="none"
              >
                <rect x="0" y="0" width="3" height="24" fill="#111827" />
                <rect x="5" y="0" width="1" height="24" fill="#111827" />
                <rect x="8" y="0" width="4" height="24" fill="#111827" />
                <rect x="15" y="0" width="2" height="24" fill="#111827" />
                <rect x="20" y="0" width="5" height="24" fill="#111827" />
                <rect x="28" y="0" width="2" height="24" fill="#111827" />
                <rect x="33" y="0" width="1" height="24" fill="#111827" />
                <rect x="36" y="0" width="4" height="24" fill="#111827" />
                <rect x="43" y="0" width="2" height="24" fill="#111827" />
                <rect x="48" y="0" width="6" height="24" fill="#111827" />
                <rect x="57" y="0" width="1" height="24" fill="#111827" />
                <rect x="61" y="0" width="3" height="24" fill="#111827" />
                <rect x="67" y="0" width="2" height="24" fill="#111827" />
                <rect x="72" y="0" width="5" height="24" fill="#111827" />
                <rect x="80" y="0" width="1" height="24" fill="#111827" />
                <rect x="84" y="0" width="4" height="24" fill="#111827" />
                <rect x="91" y="0" width="2" height="24" fill="#111827" />
                <rect x="96" y="0" width="4" height="24" fill="#111827" />
                <rect x="103" y="0" width="1" height="24" fill="#111827" />
                <rect x="107" y="0" width="3" height="24" fill="#111827" />
                <rect x="113" y="0" width="5" height="24" fill="#111827" />
                <rect x="121" y="0" width="2" height="24" fill="#111827" />
                <rect x="126" y="0" width="3" height="24" fill="#111827" />
                <rect x="132" y="0" width="1" height="24" fill="#111827" />
                <rect x="136" y="0" width="4" height="24" fill="#111827" />
                <rect x="143" y="0" width="2" height="24" fill="#111827" />
                <rect x="148" y="0" width="5" height="24" fill="#111827" />
                <rect x="156" y="0" width="1" height="24" fill="#111827" />
                <rect x="160" y="0" width="3" height="24" fill="#111827" />
                <rect x="166" y="0" width="2" height="24" fill="#111827" />
                <rect x="171" y="0" width="4" height="24" fill="#111827" />
                <rect x="178" y="0" width="2" height="24" fill="#111827" />
                <rect x="183" y="0" width="4" height="24" fill="#111827" />
                <rect x="190" y="0" width="2" height="24" fill="#111827" />
                <rect x="195" y="0" width="3" height="24" fill="#111827" />
              </svg>
              <div className="text-[9px] text-neutral-500 tracking-widest uppercase">
                * ODA-{receiptData.order_number} *
              </div>
              <p className="text-[9.5px] font-bold text-neutral-900 pt-1">
                THANK YOU FOR SHOPPING AT ODAMARKET!
              </p>
              <p className="text-[8.5px] text-neutral-500">
                KARIBU TENA • PLEASE VISIT US AGAIN
              </p>
            </div>
          </ReceiptPrinter.Paper>
        </ReceiptPrinter.Output>
      </ReceiptPrinter.Root>

      {/* Action Controls & Floating Toolbars */}
      <div className="w-full max-w-sm sm:max-w-md mt-6 space-y-3 z-30">
        {/* Primary Actions */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onDownloadPdf}
            disabled={isDownloadingPdf}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold shadow-xs hover:bg-neutral-50 dark:hover:bg-neutral-700/80 active:scale-95 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-[#C65A28]" />
            <span>{isDownloadingPdf ? "Saving PDF..." : "Download PDF"}</span>
          </button>

          <button
            type="button"
            onClick={onPrintReceipt}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold shadow-xs hover:bg-neutral-50 dark:hover:bg-neutral-700/80 active:scale-95 transition-all"
          >
            <Printer className="w-4 h-4 text-emerald-600" />
            <span>Print Receipt</span>
          </button>
        </div>

        {/* WhatsApp & View Order */}
        <div className="grid grid-cols-2 gap-2.5">
          {onWhatsAppShare && (
            <button
              type="button"
              onClick={onWhatsAppShare}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm active:scale-95 transition-all"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Share Receipt</span>
            </button>
          )}

          <button
            type="button"
            onClick={onViewOrder}
            className={cn(
              "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-neutral-900 hover:bg-black dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold shadow-sm active:scale-95 transition-all",
              !onWhatsAppShare && "col-span-2",
            )}
          >
            <PackageCheck className="w-4 h-4" />
            <span>Track Order</span>
          </button>
        </div>

        {/* Replay Animation & Feed Motion Controls */}
        <div className="flex items-center justify-between pt-2 px-1 text-[11px] text-neutral-500">
          <button
            type="button"
            onClick={handleReplay}
            className="inline-flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Replay Print Animation</span>
          </button>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-neutral-400">Feed:</span>
            <button
              type="button"
              onClick={() => setFeedMotion("stepped")}
              className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-mono",
                feedMotion === "stepped"
                  ? "bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 font-bold"
                  : "text-neutral-400 hover:text-neutral-600",
              )}
            >
              Stepped
            </button>
            <button
              type="button"
              onClick={() => setFeedMotion("smooth")}
              className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-mono",
                feedMotion === "smooth"
                  ? "bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 font-bold"
                  : "text-neutral-400 hover:text-neutral-600",
              )}
            >
              Smooth
            </button>
          </div>
        </div>

        {/* Continue Shopping */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onContinueShopping}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#C65A28] hover:text-[#a8491e] transition-colors"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
