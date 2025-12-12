import { NextResponse } from "next/server";

import { supabaseServer } from "@/lib/supabase-server";
import type { UICalendar, UICalendarItem } from "@/lib/types";

function normalizeSubreddit(name: string | null): string {
  if (!name) return "";
  return name.trim().replace(/^r\//i, "").trim();
}

function isoWeekRange(weekOf: string) {
  const start = new Date(`${weekOf}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data, error } = await supabaseServer
    .from("content_calendars")
    .select(
      `
      id,
      company_id,
      week_of,
      status,
      quality_score,
      companies ( name ),
      calendar_items (
        id,
        type,
        status,
        subreddit,
        scheduled_at,
        title,
        body,
        personas ( id, username, personality, writing_style )
      )
    `
    )
    .eq("id", id)
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 404 });

  const range = isoWeekRange(data.week_of);
  const company = Array.isArray(data.companies)
    ? data.companies[0]
    : data.companies;
  const companyName = company?.name ?? "Unknown Company";
  const items: UICalendarItem[] = (data.calendar_items ?? []).map((i: any) => ({
    id: i.id,
    type: i.type,
    status: i.status ?? "pending",
    subreddit: normalizeSubreddit(i.subreddit),
    scheduledTime: new Date(i.scheduled_at).toISOString(),
    title: i.title ?? undefined,
    content: i.body ?? "",
    mentionsProduct: (i.body ?? "")
      .toLowerCase()
      .includes(String(companyName).toLowerCase()),
    persona: {
      id: i.personas?.id ?? "unknown",
      username: i.personas?.username ?? "unknown",
      personality: i.personas?.personality ?? null,
      writingStyle: i.personas?.writing_style ?? null,
    },
  }));

  const qualityData = data.quality_score ?? {};
  const response: UICalendar & { itemsFull: UICalendarItem[] } = {
    id: data.id,
    companyId: data.company_id,
    companyName,
    weekOf: data.week_of,
    weekStart: range.start,
    weekEnd: range.end,
    status: data.status ?? "draft",
    qualityScore: qualityData.overall ?? 0,
    qualityBreakdown: {
      overall: qualityData.overall ?? 0,
      naturalness: qualityData.naturalness ?? 0,
      coverage: qualityData.coverage ?? 0,
      risk_level: qualityData.risk_level ?? 0,
      issues: qualityData.issues ?? [],
    },
    items: items.map((it) => ({ id: it.id, type: it.type, status: it.status })),
    itemsFull: items,
  };

  return NextResponse.json(response);
}
