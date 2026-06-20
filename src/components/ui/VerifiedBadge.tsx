import React, { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "../../lib/utils";

interface VerifiedBadgeProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  text?: string;
  showText?: boolean;
}

export function VerifiedBadge({ className, iconClassName, textClassName, text = "Verified", showText = false }: VerifiedBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className={cn("relative inline-flex items-center group cursor-help", className)}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onTouchStart={() => setShowTooltip(!showTooltip)}
    >
      <div 
        className={cn(
          "flex items-center justify-center shrink-0 rounded-full bg-blue-600 text-white shadow-sm transition-transform group-hover:scale-105 duration-200",
          iconClassName || "w-4 h-4"
        )}
        aria-label="Verified Supplier"
      >
        <Check strokeWidth={3.5} className="w-[65%] h-[65%]" />
      </div>
      {showText && (
        <span className={cn("ml-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400", textClassName)}>
          {text}
        </span>
      )}

      {/* Tooltip */}
      <div 
        className={cn(
          "absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-max max-w-[240px]",
          "px-3 py-2.5 bg-slate-900 text-slate-100 dark:bg-slate-100 dark:text-slate-900",
          "text-xs font-medium rounded-lg shadow-xl z-50 text-center leading-relaxed",
          "transition-all duration-300 pointer-events-none origin-bottom",
          showTooltip ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-1 scale-95"
        )}
      >
        Verified Supplier – This business has completed OdaMarket's verification process.
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-slate-900 dark:border-t-slate-100" />
      </div>
    </div>
  );
}

