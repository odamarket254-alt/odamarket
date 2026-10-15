import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";

interface AnimatedSuccessCheckmarkProps {
  onAnimationComplete?: () => void;
  orderNumber?: string;
  totalAmountKsh?: number;
  compact?: boolean;
}

export const AnimatedSuccessCheckmark: React.FC<AnimatedSuccessCheckmarkProps> = ({
  onAnimationComplete,
  orderNumber,
  totalAmountKsh,
  compact = false
}) => {
  const [stage, setStage] = useState<"drawing" | "celebrating">("drawing");

  useEffect(() => {
    const timer = setTimeout(() => {
      setStage("celebrating");
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center text-center transition-all duration-500 ${
        compact ? "py-2" : "py-6"
      }`}
    >
      {/* Animated SVG Checkmark */}
      <div className="relative flex items-center justify-center">
        {/* Glowing pulse ring */}
        <div
          className="absolute inset-0 rounded-full bg-emerald-500/20 blur-md animate-checkmark-glow pointer-events-none"
          aria-hidden="true"
        />

        <svg
          className={`${
            compact ? "w-14 h-14" : "w-20 h-20 sm:w-24 sm:h-24"
          } text-[#2BB673] drop-shadow-sm`}
          viewBox="0 0 52 52"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background circle */}
          <circle
            cx="26"
            cy="26"
            r="24"
            className="stroke-emerald-100"
            strokeWidth="3.5"
            fill="#ECFDF5"
          />

          {/* Animated green perimeter ring */}
          <circle
            cx="26"
            cy="26"
            r="24"
            className="stroke-[#2BB673] animate-checkmark-circle"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Animated check path */}
          <path
            d="M14.5 26.5L22.5 34.5L37.5 18"
            className="stroke-[#2BB673] animate-checkmark-check"
            strokeWidth="3.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Status prose */}
      <div className="mt-4 space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold tracking-wide uppercase">
          <span className="w-2 h-2 rounded-full bg-[#2BB673] animate-pulse" />
          Authoritative Paystack Verified
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#3A2418] tracking-tight">
          Payment Successful
        </h2>

        <p className="text-sm sm:text-base text-[#5F5A54] max-w-sm mx-auto">
          {orderNumber ? (
            <>
              Order <span className="font-semibold text-[#3A2418]">#{orderNumber}</span> has been confirmed.
            </>
          ) : (
            "Your transaction has been securely processed."
          )}
        </p>

        {typeof totalAmountKsh === "number" && totalAmountKsh > 0 && (
          <p className="text-xs text-[#8B857D] font-mono tabular-nums">
            Total Paid: <span className="font-bold text-[#C65A28]">KSh {totalAmountKsh.toLocaleString("en-KE")}</span>
          </p>
        )}
      </div>
    </div>
  );
};
