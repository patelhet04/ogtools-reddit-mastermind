import { cn } from "@/lib/utils";

interface QualityScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function QualityScore({
  score,
  size = "md",
  showLabel = false,
}: QualityScoreProps) {
  const getColor = () => {
    if (score < 5)
      return {
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-600 dark:text-red-400",
      };
    if (score < 8)
      return {
        bg: "bg-amber-100 dark:bg-amber-900/30",
        text: "text-amber-600 dark:text-amber-400",
      };
    return {
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
      text: "text-emerald-600 dark:text-emerald-400",
    };
  };

  const sizeClasses = {
    sm: "w-7 h-7 text-[10px]",
    md: "w-9 h-9 text-xs",
    lg: "w-12 h-12 text-sm",
  };

  const colors = getColor();

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "rounded-md flex items-center justify-center font-semibold",
          colors.bg,
          colors.text,
          sizeClasses[size]
        )}
      >
        {score.toFixed(1)}
      </div>
      {showLabel && (
        <span className="text-sm text-muted-foreground">Quality</span>
      )}
    </div>
  );
}
