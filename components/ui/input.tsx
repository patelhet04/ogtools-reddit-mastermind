import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm transition-all duration-200",
        "placeholder:text-muted-foreground",
        "focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "dark:bg-input/30",
        className
      )}
      {...props}
    />
  );
}

export { Input };
