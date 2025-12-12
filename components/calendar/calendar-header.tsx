"use client";

import { useState } from "react";
import type { ContentCalendarStatus } from "@/lib/supabase";
import type { UICalendar } from "@/lib/types";
import { QualityScore } from "@/components/ui/quality-score";
import { QualityBreakdownCard } from "@/components/ui/quality-breakdown";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  RefreshCw,
  CalendarPlus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface CalendarHeaderProps {
  calendar: UICalendar;
  onWeekChange?: (direction: "prev" | "next") => void;
  onApprove?: () => void;
  onRegenerate?: () => void;
  onGenerateNextWeek?: (
    onProgress?: (step: string, message: string) => void
  ) => Promise<string | null>;
}

export function CalendarHeader({
  calendar,
  onWeekChange,
  onApprove,
  onRegenerate,
  onGenerateNextWeek,
}: CalendarHeaderProps) {
  const [generatingNext, setGeneratingNext] = useState(false);

  const handleApprove = () => {
    toast.success("Calendar approved successfully");
    onApprove?.();
  };

  const handleRegenerate = () => {
    toast.info("Regenerating calendar...");
    onRegenerate?.();
  };

  const handleGenerateNextWeek = async () => {
    if (!onGenerateNextWeek) return;

    setGeneratingNext(true);
    let toastId: string | number | undefined;

    try {
      const newCalendarId = await onGenerateNextWeek((step, message) => {
        // Update toast with progress
        if (step === "complete") {
          if (toastId) toast.dismiss(toastId);
          toast.success("Next week's calendar generated!", { duration: 3000 });
        } else if (step === "error") {
          if (toastId) toast.dismiss(toastId);
          toast.error(message);
        } else {
          // Show/update loading toast
          if (toastId) {
            toast.loading(message, { id: toastId });
          } else {
            toastId = toast.loading(message);
          }
        }
      });

      if (!newCalendarId) {
        if (toastId) toast.dismiss(toastId);
      }
    } catch (error) {
      if (toastId) toast.dismiss(toastId);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate"
      );
    } finally {
      setGeneratingNext(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 p-4 bg-card rounded-xl border border-border">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onWeekChange?.("prev")}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="sr-only">Previous week</span>
          </Button>
          <div className="text-center min-w-[160px] px-2">
            <p className="font-medium text-sm text-foreground">
              {new Date(calendar.weekStart).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}{" "}
              -{" "}
              {new Date(calendar.weekEnd).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onWeekChange?.("next")}
          >
            <ChevronRight className="w-4 h-4" />
            <span className="sr-only">Next week</span>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={calendar.status} />
          {calendar.qualityBreakdown ? (
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-1 rounded-lg border border-border bg-background hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer group">
                  <QualityScore score={calendar.qualityScore} size="sm" />
                  <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors hidden sm:inline">
                    View breakdown
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <QualityBreakdownCard
                  breakdown={calendar.qualityBreakdown}
                  className="border-0 shadow-none"
                />
              </PopoverContent>
            </Popover>
          ) : (
            <QualityScore score={calendar.qualityScore} size="sm" />
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateNextWeek}
          disabled={generatingNext}
        >
          {generatingNext ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CalendarPlus className="w-3.5 h-3.5" />
          )}
          Generate Next Week
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRegenerate}
          disabled={["approved", "executing", "completed"].includes(
            calendar.status as ContentCalendarStatus
          )}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Regenerate
        </Button>
        <Button
          size="sm"
          onClick={handleApprove}
          disabled={["approved", "executing", "completed"].includes(
            calendar.status as ContentCalendarStatus
          )}
        >
          <Check className="w-3.5 h-3.5" />
          Approve
        </Button>
      </div>
    </div>
  );
}
