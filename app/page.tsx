"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Header } from "@/components/layout/header";
import { StatsSection } from "@/components/dashboard/stats-section";
import { CalendarList } from "@/components/dashboard/calendar-list";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import type { UICalendar } from "@/lib/types";
import { apiGet } from "@/lib/api";

export default function DashboardPage() {
  const [calendars, setCalendars] = useState<UICalendar[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiGet<UICalendar[]>("/api/calendars")
      .then((data) => setCalendars(data))
      .finally(() => setIsLoading(false));
  }, []);

  const postsScheduled = calendars.reduce(
    (acc, cal) => acc + cal.items.filter((i) => i.type === "post").length,
    0
  );
  const commentsPending = calendars.reduce(
    (acc, cal) =>
      acc +
      cal.items.filter((i) => i.type === "comment" && i.status === "pending")
        .length,
    0
  );
  const averageQuality =
    calendars.length > 0
      ? calendars.reduce((acc, cal) => acc + cal.qualityScore, 0) /
        calendars.length
      : 0;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <MobileNav />

      <main className="flex-1 pb-16 lg:pb-0 min-w-0">
        <Header title="Dashboard" />

        <div className="p-4 lg:p-6 space-y-6">
          {/* Welcome Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Welcome back!
              </h2>
              <p className="text-sm text-muted-foreground">
                Here&apos;s what&apos;s happening with your Reddit campaigns.
              </p>
            </div>
            <Link href="/generate">
              <Button className="w-full sm:w-auto">
                <Sparkles className="w-4 h-4" />
                Generate Calendar
              </Button>
            </Link>
          </div>

          {/* Stats */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-card rounded-xl p-5 border border-border animate-pulse"
                >
                  <div className="flex justify-between">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-20" />
                      <div className="h-7 bg-muted rounded w-12" />
                    </div>
                    <div className="w-10 h-10 bg-muted rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <StatsSection
              postsScheduled={postsScheduled}
              commentsPending={commentsPending}
              averageQuality={averageQuality}
            />
          )}

          {/* Recent Calendars */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">
                Recent Calendars
              </h3>
              <Link
                href="/calendars"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                View all
              </Link>
            </div>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-card rounded-xl p-4 border border-border animate-pulse"
                  >
                    <div className="h-5 bg-muted rounded w-28 mb-2" />
                    <div className="h-4 bg-muted rounded w-40" />
                  </div>
                ))}
              </div>
            ) : (
              <CalendarList calendars={calendars.slice(0, 4)} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
