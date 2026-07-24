import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "flex w-full bg-[#FFFFFF] border border-[#D1D5DB] rounded-[14px] h-[56px] px-[18px] py-[16px] text-[16px] font-medium transition-all duration-200 ease-in-out text-[#111827] placeholder:text-[#9CA3AF] hover:border-[#94A3B8] focus-visible:outline-none focus-visible:border-[#0B2A5B] focus-visible:shadow-[0_0_0_4px_rgba(11,42,91,0.12)] disabled:bg-[#F3F4F6] disabled:text-[#6B7280] disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
