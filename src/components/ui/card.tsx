import type React from "react";
import { cn } from "@/lib/cn";

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-line/80 bg-white p-6 sm:p-7 shadow-xs transition-all duration-300 hover:shadow-md",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

