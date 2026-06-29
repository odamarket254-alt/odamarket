import React, { useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { cn } from "../../lib/utils";

interface VerifiedBadgeProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  text?: string;
  showText?: boolean;
  country?: string;
}

export function VerifiedBadge({ className, iconClassName, textClassName, text, showText = false, country }: VerifiedBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const regionalCountries = ["Kenya", "Rwanda", "South Africa"];
  const isRegional = country && regionalCountries.includes(country);

  const defaultText = isRegional ? "Verified Regional" : "Verified";
  const displayText = text || defaultText;

  return (
    <div 
      className={cn("relative inline-flex items-center group cursor-help", className)}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onTouchStart={() => setShowTooltip(!showTooltip)}
    >
      <div 
        className={cn(
          "flex items-center justify-center shrink-0 rounded-full text-white shadow-sm transition-transform group-hover:scale-105 duration-200",
          isRegional ? "bg-emerald-500" : "bg-blue-600",
          iconClassName || "w-4 h-4"
        )}
        aria-label={isRegional ? "Verified Regional Supplier" : "Verified Supplier"}
      >
        {isRegional ? (
          <ShieldCheck strokeWidth={2.5} className="w-[65%] h-[65%]" />
        ) : (
          <Check strokeWidth={3.5} className="w-[65%] h-[65%]" />
        )}
      </div>
      {showText && (
        <span className={cn(
          "ml-1.5 text-xs font-semibold",
          isRegional ? "text-emerald-700 dark:text-emerald-400" : "text-blue-700 dark:text-blue-400",
          textClassName
        )}>
          {displayText}
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
        {isRegional 
          ? `Verified Regional Supplier – Trusted local supply chain partner in ${country}.` 
          : "Verified Supplier – This business has completed OdaMarket's verification process."}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-slate-900 dark:border-t-slate-100" />
      </div>
    </div>
  );
}

