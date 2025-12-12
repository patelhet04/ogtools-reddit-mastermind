"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Sparkles,
  MessageSquare,
  Target,
  Users,
  Calendar,
  FileText,
  Shield,
  Database,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { GenerationStep } from "@/lib/algorithm/types";

interface GenerationProgressProps {
  isGenerating: boolean;
  currentStep: GenerationStep;
  message: string;
  progress: number;
  detail?: string;
}

const stepConfig: Record<
  GenerationStep,
  { icon: React.ElementType; label: string; color: string }
> = {
  initializing: {
    icon: Loader2,
    label: "Initializing",
    color: "text-muted-foreground",
  },
  generating_topics: {
    icon: Sparkles,
    label: "Generating Topics",
    color: "text-amber-500",
  },
  matching_subreddits: {
    icon: Target,
    label: "Matching Subreddits",
    color: "text-blue-500",
  },
  planning_personas: {
    icon: Users,
    label: "Planning Personas",
    color: "text-purple-500",
  },
  scheduling: {
    icon: Calendar,
    label: "Scheduling",
    color: "text-cyan-500",
  },
  generating_post: {
    icon: FileText,
    label: "Writing Posts",
    color: "text-green-500",
  },
  generating_comment: {
    icon: MessageSquare,
    label: "Writing Comments",
    color: "text-emerald-500",
  },
  quality_check: {
    icon: Shield,
    label: "Quality Check",
    color: "text-orange-500",
  },
  saving: {
    icon: Database,
    label: "Saving",
    color: "text-indigo-500",
  },
  complete: {
    icon: CheckCircle2,
    label: "Complete",
    color: "text-green-500",
  },
  error: {
    icon: XCircle,
    label: "Error",
    color: "text-red-500",
  },
};

const allSteps: GenerationStep[] = [
  "generating_topics",
  "matching_subreddits",
  "planning_personas",
  "scheduling",
  "generating_post",
  "generating_comment",
  "quality_check",
  "saving",
];

export function GenerationProgress({
  isGenerating,
  currentStep,
  message,
  progress,
  detail,
}: GenerationProgressProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 400);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const config = stepConfig[currentStep] || stepConfig.initializing;
  const Icon = config.icon;
  const currentStepIndex = allSteps.indexOf(currentStep);

  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-6">
      {/* Main Progress Indicator */}
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "w-14 h-14 rounded-xl flex items-center justify-center",
            currentStep === "error"
              ? "bg-red-500/10"
              : currentStep === "complete"
              ? "bg-green-500/10"
              : "bg-primary/10"
          )}
        >
          <Icon
            className={cn(
              "w-7 h-7",
              config.color,
              currentStep !== "complete" &&
                currentStep !== "error" &&
                "animate-pulse"
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-foreground">
            {message}
            {isGenerating &&
              currentStep !== "complete" &&
              currentStep !== "error" && (
                <span className="text-muted-foreground">{dots}</span>
              )}
          </h3>
          {detail && (
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {detail}
            </p>
          )}
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-primary">{progress}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            currentStep === "error"
              ? "bg-red-500"
              : currentStep === "complete"
              ? "bg-green-500"
              : "bg-primary"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {allSteps.map((step, index) => {
          const stepConf = stepConfig[step];
          const StepIcon = stepConf.icon;
          const isPast = currentStepIndex > index;
          const isCurrent = currentStep === step;

          return (
            <div
              key={step}
              className={cn(
                "flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors",
                isCurrent && "bg-primary/10",
                isPast && "opacity-50"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : isPast
                    ? "bg-green-500/20 text-green-500"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isPast ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <StepIcon
                    className={cn("w-4 h-4", isCurrent && "animate-pulse")}
                  />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium text-center leading-tight hidden sm:block",
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {stepConf.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Live Activity Feed */}
      {isGenerating &&
        currentStep !== "complete" &&
        currentStep !== "error" && (
          <div className="pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>
                {currentStep === "generating_post" ||
                currentStep === "generating_comment"
                  ? "AI is writing content..."
                  : "Processing..."}
              </span>
            </div>
          </div>
        )}
    </div>
  );
}
