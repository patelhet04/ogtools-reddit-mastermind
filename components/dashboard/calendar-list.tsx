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
  Building2,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

interface CalendarListProps {
  calendars: UICalendar[];
}

interface GroupedCalendar {
  companyId: string;
  companyName: string;
  weeks: UICalendar[];
}

function groupByCompany(calendars: UICalendar[]): GroupedCalendar[] {
  const groups: Record<string, GroupedCalendar> = {};

  for (const cal of calendars) {
    if (!groups[cal.companyId]) {
      groups[cal.companyId] = {
        companyId: cal.companyId,
        companyName: cal.companyName,
        weeks: [],
      };
    }
    groups[cal.companyId].weeks.push(cal);
  }

  // Sort weeks by date within each company
  for (const group of Object.values(groups)) {
    group.weeks.sort(
      (a, b) =>
        new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime()
    );
  }

  // Sort companies by most recent activity
  return Object.values(groups).sort((a, b) => {
    const aLatest = new Date(a.weeks[a.weeks.length - 1].weekStart).getTime();
    const bLatest = new Date(b.weeks[b.weeks.length - 1].weekStart).getTime();
    return bLatest - aLatest;
  });
}

function formatWeekRange(weekStart: string, weekEnd: string): string {
  const start = new Date(weekStart);
  const end = new Date(weekEnd);
  const startMonth = start.toLocaleDateString("en-US", { month: "short" });
  const endMonth = end.toLocaleDateString("en-US", { month: "short" });

  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()}-${end.getDate()}`;
  }
  return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}`;
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

  const grouped = groupByCompany(calendars);

  return (
    <div className="space-y-4">
      {grouped.map((group) => (
        <div
          key={group.companyId}
          className="bg-card rounded-xl border border-border overflow-hidden"
        >
          {/* Company Header */}
          <div className="px-4 py-3 border-b border-border/50 bg-muted/30">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">
                {group.companyName}
              </h3>
              <span className="text-xs text-muted-foreground ml-auto">
                {group.weeks.length} week{group.weeks.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Timeline */}
          <div className="p-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {group.weeks.map((calendar, index) => {
                const postsCount = calendar.items.filter(
                  (i) => i.type === "post"
                ).length;
                const commentsCount = calendar.items.filter(
                  (i) => i.type === "comment"
                ).length;
                const isApproved = calendar.status === "approved";

                return (
                  <div key={calendar.id} className="flex items-center">
                    {/* Week Card */}
                    <Link
                      href={`/calendars/${calendar.id}`}
                      className={cn(
                        "group flex-shrink-0 rounded-lg border p-3 transition-all hover:shadow-md min-w-[180px]",
                        isApproved
                          ? "bg-primary/5 border-primary/30 hover:border-primary"
                          : "bg-background border-border hover:border-primary/30"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {formatWeekRange(calendar.weekStart, calendar.weekEnd)}
                        </span>
                        <QualityScore score={calendar.qualityScore} size="sm" />
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {postsCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {commentsCount}
                        </span>
                      </div>

                      <StatusBadge status={calendar.status} />
                    </Link>

                    {/* Connector Arrow */}
                    {index < group.weeks.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-muted-foreground/50 mx-1 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
