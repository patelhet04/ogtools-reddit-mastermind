import { NextResponse } from "next/server";

import { generateCalendar } from "@/lib/algorithm";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * Generate the next week's calendar based on an existing calendar.
 * POST /api/calendars/generate-next
 * Body: { calendar_id: string }
 */
export async function POST(req: Request) {
  const { calendar_id } = await req.json();

  if (!calendar_id) {
    return NextResponse.json(
      { error: "calendar_id is required" },
      { status: 400 }
    );
  }

  // Get the existing calendar to determine company and current week
  const { data: existingCalendar, error: calError } = await supabaseServer
    .from("content_calendars")
    .select("company_id, week_of")
    .eq("id", calendar_id)
    .single();

  if (calError || !existingCalendar) {
    return NextResponse.json({ error: "Calendar not found" }, { status: 404 });
  }

  // Get company's posts_per_week setting
  const { data: company } = await supabaseServer
    .from("companies")
    .select("posts_per_week")
    .eq("id", existingCalendar.company_id)
    .single();

  // Calculate next week's date (add 7 days)
  const currentWeek = new Date(existingCalendar.week_of);
  const nextWeek = new Date(currentWeek);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekOf = nextWeek.toISOString().split("T")[0];

  // Check if a calendar already exists for next week
  const { data: existingNext } = await supabaseServer
    .from("content_calendars")
    .select("id")
    .eq("company_id", existingCalendar.company_id)
    .eq("week_of", nextWeekOf)
    .single();

  if (existingNext) {
    return NextResponse.json(
      {
        error: "A calendar for next week already exists",
        existing_id: existingNext.id,
      },
      { status: 409 }
    );
  }

  // Generate the new calendar
  const { calendar_id: newCalendarId } = await generateCalendar({
    company_id: existingCalendar.company_id,
    week_of: nextWeekOf,
    posts_per_week: company?.posts_per_week ?? 3,
  });

  // Fetch the new calendar data
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
    .eq("id", newCalendarId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

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
