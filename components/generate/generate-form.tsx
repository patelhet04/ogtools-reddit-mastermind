"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Building2, Calendar, FileText, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { CalendarGeneratePayload, UICompany } from "@/lib/types";
import type { GenerationStep, GenerationProgress } from "@/lib/algorithm/types";
import { apiGet } from "@/lib/api";
import { GenerationProgress as GenerationProgressUI } from "./generation-progress";

const steps = [
  { id: 1, title: "Company", icon: Building2 },
  { id: 2, title: "Week", icon: Calendar },
  { id: 3, title: "Volume", icon: FileText },
  { id: 4, title: "Review", icon: Check },
];

export function GenerateForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [companies, setCompanies] = useState<UICompany[]>([]);
  const [formData, setFormData] = useState({
    companyId: "",
    weekStart: getNextMonday(),
    postsPerWeek: 3,
  });

  // Generation progress state
  const [generationProgress, setGenerationProgress] = useState<{
    step: GenerationStep;
    message: string;
    progress: number;
    detail?: string;
  }>({
    step: "initializing",
    message: "Starting...",
    progress: 0,
  });

  function getNextMonday() {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? 1 : 8);
    const nextMonday = new Date(today.setDate(diff));
    return nextMonday.toISOString().split("T")[0];
  }

  useEffect(() => {
    apiGet<UICompany[]>("/api/companies")
      .then(setCompanies)
      .catch(() => setCompanies([]));
  }, []);

  const selectedCompany = companies.find((c) => c.id === formData.companyId);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!formData.companyId;
      case 2:
        return !!formData.weekStart;
      case 3:
        return formData.postsPerWeek >= 1 && formData.postsPerWeek <= 20;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationProgress({
      step: "initializing",
      message: "Starting generation...",
      progress: 0,
    });

    try {
      const payload: CalendarGeneratePayload = {
        company_id: formData.companyId,
        week_of: formData.weekStart,
        posts_per_week: formData.postsPerWeek,
      };

      const response = await fetch("/api/calendars/generate-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to start generation");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response stream");
      }

      const decoder = new TextDecoder();
      let calendarId: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6)) as GenerationProgress & {
                calendar_id?: string;
              };

              setGenerationProgress({
                step: data.step,
                message: data.message,
                progress: data.progress,
                detail: data.detail,
              });

              if (data.calendar_id) {
                calendarId = data.calendar_id;
              }

              if (data.step === "error") {
                toast.error(data.message);
                setIsGenerating(false);
                return;
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }

      if (calendarId) {
        toast.success("Calendar generated successfully!");
        // Small delay to show completion state
        setTimeout(() => {
          router.push(`/calendars/${calendarId}`);
        }, 1000);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation failed");
      setIsGenerating(false);
    }
  };

  // Show progress UI when generating
  if (isGenerating) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Generating Your Calendar
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedCompany?.name} • Week of{" "}
            {new Date(formData.weekStart).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>

        <GenerationProgressUI
          isGenerating={isGenerating}
          currentStep={generationProgress.step}
          message={generationProgress.message}
          progress={generationProgress.progress}
          detail={generationProgress.detail}
        />

        <p className="text-center text-xs text-muted-foreground">
          This usually takes 20-40 seconds depending on the number of posts
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-lg transition-colors",
                  currentStep >= step.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {currentStep > step.id ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <step.icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={cn(
                  "mt-1.5 text-[10px] font-medium hidden sm:block",
                  currentStep >= step.id
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-px mx-2 transition-colors",
                  currentStep > step.id ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-card rounded-xl p-5 border border-border mb-5">
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Select a Company</Label>
              <p className="text-sm text-muted-foreground mt-0.5">
                Choose the company you want to generate content for.
              </p>
            </div>
            <div className="space-y-2 mt-4">
              {companies.map((company) => (
                <button
                  key={company.id}
                  onClick={() =>
                    setFormData({ ...formData, companyId: company.id })
                  }
                  className={cn(
                    "flex items-center gap-3 w-full p-3 rounded-lg text-left transition-colors",
                    "border",
                    formData.companyId === company.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                      formData.companyId === company.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">
                      {company.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {company.personas.length} personas •{" "}
                      {company.subreddits.length} subreddits
                    </p>
                  </div>
                  {formData.companyId === company.id && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
              {companies.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No companies found. Create one first.
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Choose Week</Label>
              <p className="text-sm text-muted-foreground mt-0.5">
                Select the week you want to schedule content for.
              </p>
            </div>
            <Input
              type="date"
              value={formData.weekStart}
              onChange={(e) =>
                setFormData({ ...formData, weekStart: e.target.value })
              }
              className="mt-4"
            />
            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              Week will start on{" "}
              <span className="font-medium text-foreground">
                {new Date(formData.weekStart).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </p>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Posts per Week</Label>
              <p className="text-sm text-muted-foreground mt-0.5">
                Set how many posts to generate. Comments are added
                automatically.
              </p>
            </div>
            <div className="py-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">1</span>
                <div className="text-center">
                  <span className="text-3xl font-semibold text-primary">
                    {formData.postsPerWeek}
                  </span>
                  <p className="text-xs text-muted-foreground">posts</p>
                </div>
                <span className="text-sm text-muted-foreground">20</span>
              </div>
              <Slider
                value={[formData.postsPerWeek]}
                onValueChange={(value) =>
                  setFormData({ ...formData, postsPerWeek: value[0] })
                }
                min={1}
                max={20}
                step={1}
                className="w-full"
              />
            </div>
            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              This will generate{" "}
              <span className="font-medium text-foreground">
                {formData.postsPerWeek} posts
              </span>{" "}
              and approximately{" "}
              <span className="font-medium text-foreground">
                {formData.postsPerWeek * 3} comments
              </span>
            </p>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Review Settings</Label>
              <p className="text-sm text-muted-foreground mt-0.5">
                Confirm your calendar settings before generating.
              </p>
            </div>
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Company</span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {selectedCompany?.name}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Week Starting
                  </span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {new Date(formData.weekStart).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Content</span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {formData.postsPerWeek} posts, ~{formData.postsPerWeek * 3}{" "}
                  comments
                </span>
              </div>
            </div>

            {/* Estimated time */}
            <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm text-foreground">
                <span className="font-medium">Estimated time:</span>{" "}
                {Math.ceil((formData.postsPerWeek * 4 * 3) / 60)} -{" "}
                {Math.ceil((formData.postsPerWeek * 4 * 4) / 60)} minutes
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                AI will generate {formData.postsPerWeek} posts and{" "}
                {formData.postsPerWeek * 3} comments
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          Back
        </Button>

        {currentStep < 4 ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Continue
          </Button>
        ) : (
          <Button onClick={handleGenerate}>
            <Sparkles className="w-4 h-4" />
            Generate Calendar
          </Button>
        )}
      </div>
    </div>
  );
}
