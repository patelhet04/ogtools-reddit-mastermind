import { NextResponse } from "next/server";

import { supabaseServer } from "@/lib/supabase-server";
import type { CalendarGeneratePayload, UICalendar } from "@/lib/types";

function isoWeekRange(weekOf: string) {
  const start = new Date(`${weekOf}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("company_id");
  const weekOf = searchParams.get("week_of");

  let query = supabaseServer.from("content_calendars").select(
    `
      id,
      company_id,
      week_of,
      status,
      quality_score,
      companies ( name ),
      calendar_items ( id, type, status )
    `
  );

  // Apply filters if provided
  if (companyId) {
    query = query.eq("company_id", companyId);
  }
  if (weekOf) {
    query = query.eq("week_of", weekOf);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const calendars: UICalendar[] = (data ?? []).map((c: any) => {
    const range = isoWeekRange(c.week_of);
    const items = (c.calendar_items ?? []).map((i: any) => ({
      id: i.id,
      type: i.type,
      status: i.status ?? "pending",
    }));
    const company = Array.isArray(c.companies) ? c.companies[0] : c.companies;
    return {
      id: c.id,
      companyId: c.company_id,
      companyName: company?.name ?? "Unknown Company",
      weekOf: c.week_of,
      weekStart: range.start,
      weekEnd: range.end,
      status: c.status ?? "draft",
      qualityScore: c.quality_score?.overall ?? 0,
      items,
    };
  });

  return NextResponse.json(calendars);
}

export async function POST(req: Request) {
  const payload = (await req.json()) as CalendarGeneratePayload;

  if (!payload?.company_id)
    return NextResponse.json(
      { error: "company_id is required" },
      { status: 400 }
    );
  if (!payload?.week_of)
    return NextResponse.json({ error: "week_of is required" }, { status: 400 });

  const { data: calendar, error } = await supabaseServer
    .from("content_calendars")
    .insert({
      company_id: payload.company_id,
      week_of: payload.week_of,
      status: "draft",
    })
    .select(
      "id, company_id, week_of, status, quality_score, companies ( name ), calendar_items ( id, type, status )"
    )
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const range = isoWeekRange(calendar.week_of);
  const company = Array.isArray(calendar.companies)
    ? calendar.companies[0]
    : calendar.companies;
  const response: UICalendar = {
    id: calendar.id,
    companyId: calendar.company_id,
    companyName: company?.name ?? "Unknown Company",
    weekOf: calendar.week_of,
    weekStart: range.start,
    weekEnd: range.end,
    status: calendar.status ?? "draft",
    qualityScore: calendar.quality_score?.overall ?? 0,
    items: (calendar.calendar_items ?? []).map((i: any) => ({
      id: i.id,
      type: i.type,
      status: i.status ?? "pending",
    })),
  };

  return NextResponse.json(response, { status: 201 });
}
