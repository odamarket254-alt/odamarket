import { cn } from "../../lib/utils";

interface LogoProps {
  className?: string;
  classNameText?: string;
}

export function Logo({ className, classNameText }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center justify-center shrink-0 w-10 h-10 md:w-11 md:h-11">
        <svg
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <path
            d="M50 5 L90 28 V72 L50 95 L10 72 V28 Z"
            fill="none"
            stroke="#10B981"
            strokeWidth="12"
            strokeLinejoin="round"
          />
          <path
            d="M50 25 L75 40 V65 L50 80 L25 65 V40 Z"
            className="fill-slate-900 dark:fill-white"
          />
          <path d="M25 40 L50 25 L75 40 L50 55 Z" fill="#22C55E" />
        </svg>
      </div>
      <span
        className={cn(
          "text-[24px] md:text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-white font-sans",
          classNameText,
        )}
      >
        Oda
        <span className="text-emerald-600 dark:text-emerald-500">Market</span>
      </span>
    </div>
  );
}
