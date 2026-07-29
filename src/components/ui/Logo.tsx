import { useState } from "react";
import { cn } from "../../lib/utils";
import { LOGO_PATH } from "../../lib/constants";

interface LogoProps {
  className?: string;
  imageClassName?: string;
  noBlend?: boolean;
}

export function Logo({ className, imageClassName }: LogoProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <span className={cn("font-black text-[#C65A28] whitespace-nowrap tracking-tight", className)}>
        ODA Market
      </span>
    );
  }

  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className || "w-[150px] sm:w-[180px] lg:w-[200px]")}>
      <img
        src={LOGO_PATH}
        alt="ODA Market Logo"
        className={cn(
          "w-full h-auto object-contain",
          imageClassName
        )}
        onError={() => {
          console.error("[Logo] Failed to load ODA Market logo from", LOGO_PATH);
          setHasError(true);
        }}
      />
    </div>
  );
}
