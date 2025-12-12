import { cn } from "@/lib/utils";
import type { UIStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: UIStatus | null | undefined;
  className?: string;
}

const statusConfig: Record<UIStatus, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground",
  },
  approved: {
    label: "Approved",
    className: "bg-primary/10 text-primary",
  },
  executing: {
    label: "Executing",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  completed: {
    label: "Completed",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  pending: {
    label: "Pending",
    className: "bg-muted text-muted-foreground",
  },
  posted: {
    label: "Posted",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized: UIStatus = (status ?? "draft") as UIStatus;
  const config = statusConfig[normalized];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
