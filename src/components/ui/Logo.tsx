import { cn } from "../../lib/utils";

interface LogoProps {
  className?: string;
  classNameText?: string;
}

export function Logo({ className, classNameText }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img
        src="/logo.png"
        alt="OdaMarket Logo"
        className="h-[28px] sm:h-[32px] w-auto object-contain"
        onError={(e) => {
          // Fallback if the user hasn't uploaded logo.png yet
          e.currentTarget.style.display = "none";
          const fallback = e.currentTarget.nextElementSibling;
          if (fallback) {
            fallback.classList.remove("hidden");
            fallback.classList.add("flex");
          }
        }}
      />
      <div className="hidden items-center gap-2">
        <svg
          width="32"
          height="32"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="block dark:opacity-90"
        >
          <path
            d="M50 5 L90 28 L90 75 L50 98 L10 75 L10 28 Z"
            fill="url(#gradBg)"
            fillOpacity="0.1"
            stroke="url(#gradTop)"
            strokeWidth="2"
          />
          <path d="M50 5 L90 28 L50 51 L10 28 Z" fill="url(#gradTop)" />
          <path
            d="M10 28 L50 51 L50 98 L10 75 Z"
            fill="#E2E8F0"
            className="dark:fill-slate-800"
          />
          <path
            d="M50 51 L90 28 L90 75 L50 98 Z"
            fill="#0F766E"
            className="dark:fill-teal-600"
          />

          {/* Inner cutout to make it look like a G or ribbon */}
          <path
            d="M40 34 L70 51 L70 65 L40 48 Z"
            fill="#ffffff"
            className="dark:fill-slate-900"
          />
          <path
            d="M40 48 L70 65 L50 76 L20 59 Z"
            fill="#ffffff"
            className="dark:fill-slate-900"
          />

          <defs>
            <linearGradient id="gradTop" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00C46A" />
              <stop offset="100%" stopColor="#00E08A" />
            </linearGradient>
            <linearGradient id="gradBg" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00C46A" />
              <stop offset="100%" stopColor="#0D1510" />
            </linearGradient>
          </defs>
        </svg>
        <span
          className={cn(
            "text-xl font-bold tracking-tight text-foreground",
            classNameText,
          )}
        >
          ODA <span className="text-emerald-500">MARKET</span>
        </span>
      </div>
    </div>
  );
}
