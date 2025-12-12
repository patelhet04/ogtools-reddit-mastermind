import { cn } from "@/lib/utils";
import type { UIPersona } from "@/lib/types";

interface PersonaAvatarProps {
  persona: UIPersona;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
}

// Warm, earthy color palette
const colors = [
  "bg-primary",
  "bg-amber-600",
  "bg-teal-600",
  "bg-rose-500",
  "bg-violet-500",
  "bg-emerald-600",
];

export function PersonaAvatar({
  persona,
  size = "md",
  showName = false,
}: PersonaAvatarProps) {
  const initials = persona.username
    .split("_")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const colorIndex = persona.id.charCodeAt(0) % colors.length;

  const sizeClasses = {
    sm: "w-6 h-6 text-[9px]",
    md: "w-8 h-8 text-[10px]",
    lg: "w-10 h-10 text-xs",
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "rounded-md flex items-center justify-center text-white font-semibold shrink-0",
          colors[colorIndex],
          sizeClasses[size]
        )}
      >
        {initials}
      </div>
      {showName && (
        <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
          {persona.username}
        </span>
      )}
    </div>
  );
}
