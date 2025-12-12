import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm transition-all duration-200",
        "placeholder:text-muted-foreground",
        "focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "dark:bg-input/30",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
