"use client";

import { cn } from "@/lib/utils";
import type { QualityBreakdown } from "@/lib/types";
import {
  Shield,
  MessageSquare,
  Target,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface QualityBreakdownProps {
  breakdown: QualityBreakdown;
  className?: string;
}

function ScoreBar({
  label,
  value,
  icon: Icon,
  inverted = false,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  inverted?: boolean;
}) {
  // For risk_level, lower is better (inverted)
  const displayValue = inverted ? 10 - value : value;
  const percentage = (displayValue / 10) * 100;

  const getColor = (val: number) => {
    if (val >= 8) return "bg-emerald-500";
    if (val >= 5) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="w-3.5 h-3.5" />
          {label}
        </span>
        <span className="font-medium text-foreground">
          {value.toFixed(1)}
          {inverted && (
            <span className="text-xs text-muted-foreground">/10</span>
          )}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            getColor(displayValue)
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function getOverallLabel(score: number): { label: string; color: string } {
  if (score >= 8) return { label: "Excellent", color: "text-emerald-600" };
  if (score >= 6) return { label: "Good", color: "text-amber-600" };
  if (score >= 4) return { label: "Needs Work", color: "text-orange-600" };
  return { label: "High Risk", color: "text-red-600" };
}

export function QualityBreakdownCard({
  breakdown,
  className,
}: QualityBreakdownProps) {
  const { label, color } = getOverallLabel(breakdown.overall);
  const hasIssues = breakdown.issues.length > 0;

  return (
    <div
      className={cn(
        "bg-card rounded-xl border border-border p-4 space-y-4",
        className
      )}
    >
      {/* Header with Overall Score */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Quality Score</h3>
          <p className={cn("text-sm font-medium", color)}>{label}</p>
        </div>
        <div
          className={cn(
            "w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold",
            breakdown.overall >= 8
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : breakdown.overall >= 5
              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          )}
        >
          {breakdown.overall.toFixed(1)}
        </div>
      </div>

      {/* Score Bars */}
      <div className="space-y-3">
        <ScoreBar
          label="Naturalness"
          value={breakdown.naturalness}
          icon={MessageSquare}
        />
        <ScoreBar label="Coverage" value={breakdown.coverage} icon={Target} />
        <ScoreBar
          label="Risk Level"
          value={breakdown.risk_level}
          icon={Shield}
          inverted
        />
      </div>

      {/* Issues */}
      {hasIssues ? (
        <div className="pt-2 border-t border-border">
          <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Issues Found ({breakdown.issues.length})
          </div>
          <ul className="space-y-1.5">
            {breakdown.issues.map((issue, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="pt-2 border-t border-border">
          <div className="flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            No issues detected
          </div>
        </div>
      )}
    </div>
  );
}
