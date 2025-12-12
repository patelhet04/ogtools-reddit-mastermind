import { NextResponse } from "next/server";

import { generateCalendar } from "@/lib/algorithm";
import { supabaseServer } from "@/lib/supabase-server";
import type { CalendarGeneratePayload } from "@/lib/types";

export async function POST(req: Request) {
  const payload = (await req.json()) as CalendarGeneratePayload;

  const { calendar_id } = await generateCalendar(payload);

  // Return same shape as GET /api/calendars/[id]
  const { data, error } = await supabaseServer
    .from("content_calendars")
    .select(
      `
      id,
      company_id,
      week_of,
      status,
      quality_score,
      companies ( name )
    `
    )
    .eq("id", calendar_id)
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const start = new Date(`${data.week_of}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);

  return NextResponse.json({
    id: data.id,
    companyId: data.company_id,
    companyName:
      (Array.isArray(data.companies) ? data.companies[0] : data.companies)
        ?.name ?? "Unknown Company",
    weekOf: data.week_of,
    weekStart: start.toISOString(),
    weekEnd: end.toISOString(),
    status: data.status ?? "draft",
    qualityScore: data.quality_score?.overall ?? 0,
    items: [],
  });
}
