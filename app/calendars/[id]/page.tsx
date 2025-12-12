"use client";

import { useState, useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Header } from "@/components/layout/header";
import { CalendarHeader } from "@/components/calendar/calendar-header";
import { WeekView } from "@/components/calendar/week-view";
import type { UICalendar, UICalendarItem } from "@/lib/types";
import { apiGet, apiSend } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function CalendarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [calendar, setCalendar] = useState<
    (UICalendar & { itemsFull: UICalendarItem[] }) | null
  >(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<UICalendar & { itemsFull: UICalendarItem[] }>(`/api/calendars/${id}`)
      .then((data) => setCalendar(data))
      .finally(() => setLoading(false));
  }, [id]);

  const handleGenerateNextWeek = async (
    onProgress?: (step: string, message: string) => void
  ): Promise<string | null> => {
    if (!calendar) return null;

    const response = await fetch("/api/calendars/generate-next-stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calendar_id: id }),
    });

    // Handle non-stream error responses
    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.existing_id) {
        router.push(`/calendars/${errorData.existing_id}`);
        return errorData.existing_id;
      }
      throw new Error(errorData.error || "Failed to generate");
    }

    // Process SSE stream
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let newCalendarId: string | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            onProgress?.(data.step, data.message);

            if (data.calendar_id) {
              newCalendarId = data.calendar_id;
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }

    if (newCalendarId) {
      router.push(`/calendars/${newCalendarId}`);
    }

    return newCalendarId;
  };

  const handleWeekChange = async (direction: "prev" | "next") => {
    if (!calendar) return;

    const currentWeekOf = calendar.weekOf;

    // Fetch ALL calendars for this company, then find prev/next by date
    try {
      const allCalendars = await apiGet<UICalendar[]>(
        `/api/calendars?company_id=${calendar.companyId}`
      );

      // Sort by weekOf date
      const sorted = allCalendars
        .filter((c) => c.id !== calendar.id) // exclude current
        .sort((a, b) => a.weekOf.localeCompare(b.weekOf));

      let target: UICalendar | undefined;
      if (direction === "prev") {
        // Find the latest calendar that's before current
        target = sorted.filter((c) => c.weekOf < currentWeekOf).pop();
      } else {
        // Find the earliest calendar that's after current
        target = sorted.find((c) => c.weekOf > currentWeekOf);
      }

      if (target) {
        router.push(`/calendars/${target.id}`);
      }
    } catch {
      // Error fetching calendars - do nothing
    }
  };

  const handleApprove = async () => {
    if (!calendar) return;
    await apiSend(`/api/calendars/${id}/approve`, "POST");
    setCalendar({ ...calendar, status: "approved" });
  };

  const handleRegenerate = async () => {
    if (!calendar) return;
    // Navigate to generate page with pre-filled data
    router.push(
      `/generate?company_id=${calendar.companyId}&week_of=${
        calendar.weekStart.split("T")[0]
      }&regenerate=${id}`
    );
  };

  const handleItemUpdate = async (updatedItem: UICalendarItem) => {
    if (!calendar) return;
    const saved = await apiSend<UICalendarItem>(
      `/api/calendar-items/${updatedItem.id}`,
      "PATCH",
      {
      title: updatedItem.title ?? null,
      body: updatedItem.content,
      scheduled_at: updatedItem.scheduledTime,
      status: updatedItem.status,
      }
    );

    setCalendar({
      ...calendar,
      items: calendar.items.map((item) =>
        item.id === saved.id
          ? { ...item, type: saved.type, status: saved.status }
          : item
      ),
      itemsFull: calendar.itemsFull.map((item) =>
        item.id === saved.id ? saved : item
      ),
    });
  };

  const handleItemDelete = async (itemId: string) => {
    if (!calendar) return;
    await apiSend<{ ok: boolean }>(`/api/calendar-items/${itemId}`, "DELETE");
    setCalendar({
      ...calendar,
      items: calendar.items.filter((item) => item.id !== itemId),
      itemsFull: calendar.itemsFull.filter((item) => item.id !== itemId),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <MobileNav />
        <main className="flex-1 min-w-0 pb-16 lg:pb-0">
          <Header title="Loading..." />
          <div className="p-4 lg:p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-20 bg-muted rounded-xl" />
              <div className="h-96 bg-muted rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!calendar) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <MobileNav />

      <main className="flex-1 min-w-0 pb-16 lg:pb-0">
        <Header title={calendar.companyName} />

        <div className="p-4 lg:p-6">
          <CalendarHeader
            calendar={calendar}
            onWeekChange={handleWeekChange}
            onApprove={handleApprove}
            onRegenerate={handleRegenerate}
            onGenerateNextWeek={handleGenerateNextWeek}
          />
          <WeekView
            calendar={calendar}
            onItemUpdate={handleItemUpdate}
            onItemDelete={handleItemDelete}
          />
        </div>
      </main>
    </div>
  );
}
