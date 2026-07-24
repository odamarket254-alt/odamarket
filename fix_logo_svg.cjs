const fs = require('fs');
const file = 'src/components/ui/Logo.tsx';
let content = `import { useState } from "react";
import { cn } from "../../lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className={cn("flex items-center shrink-0", className || "h-[36px] md:h-[48px]")}>
        <span className="text-xl md:text-2xl font-bold text-[#0A2E5C] whitespace-nowrap tracking-tight">
          ODA <span className="text-[#2BB673]">Market</span>
        </span>
      </div>
    );
  }

  return (
    <img 
      src="/images/oda-logo.svg" 
      alt="Oda Market – E-Commerce in Africa" 
      className={cn("w-auto object-contain shrink-0", className || "h-[36px] md:h-[48px]")}
      style={{ aspectRatio: "240/60" }}
      onError={(e) => {
        // Fallback to jpeg if svg fails for some reason
        if (e.currentTarget.src.includes('.svg')) {
          e.currentTarget.src = '/images/oda-logo.jpeg';
          e.currentTarget.style.mixBlendMode = 'darken';
          e.currentTarget.style.aspectRatio = '1408/768';
        } else {
          console.error("[Logo] Failed to load ODA Market logo");
          setHasError(true);
        }
      }}
    />
  );
}
`;
fs.writeFileSync(file, content);
