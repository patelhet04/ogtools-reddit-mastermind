"use client";

import Link from "next/link";
import type { UICalendar } from "@/lib/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { QualityScore } from "@/components/ui/quality-score";
import {
  ChevronRight,
  CalendarDays,
  FileText,
  MessageSquare,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface CalendarListProps {
  calendars: UICalendar[];
}

export function CalendarList({ calendars }: CalendarListProps) {
  if (calendars.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No calendars yet"
        description="Generate your first content calendar to start planning your Reddit marketing strategy."
        action={{
          label: "Generate Calendar",
          onClick: () => (window.location.href = "/generate"),
        }}
      />
    );
  }

  return (
    <div className="space-y-2">
      {calendars.map((calendar) => {
        const postsCount = calendar.items.filter(
          (i) => i.type === "post"
        ).length;
        const commentsCount = calendar.items.filter(
          (i) => i.type === "comment"
        ).length;

        return (
          <Link
            key={calendar.id}
            href={`/calendars/${calendar.id}`}
            className="group block bg-card rounded-xl p-4 border border-border hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                  {calendar.companyName}
                </h3>
                <p className="text-sm text-muted-foreground">
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
              <StatusBadge status={calendar.status} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{postsCount} posts</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{commentsCount} comments</span>
                </div>
                <QualityScore score={calendar.qualityScore} size="sm" />
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
