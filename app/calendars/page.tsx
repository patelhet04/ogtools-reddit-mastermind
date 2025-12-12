"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Header } from "@/components/layout/header";
import { CalendarList } from "@/components/dashboard/calendar-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import type { UICalendar } from "@/lib/types";
import { apiGet } from "@/lib/api";

export default function CalendarsPage() {
  const [calendars, setCalendars] = useState<UICalendar[]>([]);

  useEffect(() => {
    apiGet<UICalendar[]>("/api/calendars")
      .then(setCalendars)
      .catch(() => setCalendars([]));
  }, []);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <MobileNav />

      <main className="flex-1 min-w-0 pb-16 lg:pb-0">
        <Header title="Calendars" />

        <div className="p-4 lg:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                All Calendars
              </h2>
              <p className="text-sm text-muted-foreground">
                {calendars.length} calendar{calendars.length !== 1 ? "s" : ""}{" "}
                total
              </p>
            </div>
            <Link href="/generate">
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4" />
                New Calendar
              </Button>
            </Link>
          </div>

          <CalendarList calendars={calendars} />
        </div>
      </main>
    </div>
  );
}
