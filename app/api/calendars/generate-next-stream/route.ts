import { generateCalendar } from "@/lib/algorithm";
import { supabaseServer } from "@/lib/supabase-server";
import type { GenerationProgress } from "@/lib/algorithm/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Generate the next week's calendar with SSE progress streaming.
 * POST /api/calendars/generate-next-stream
 * Body: { calendar_id: string }
 */
export async function POST(req: Request) {
  const { calendar_id } = await req.json();

  if (!calendar_id) {
    return new Response(JSON.stringify({ error: "calendar_id is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get the existing calendar to determine company and current week
  const { data: existingCalendar, error: calError } = await supabaseServer
    .from("content_calendars")
    .select("company_id, week_of")
    .eq("id", calendar_id)
    .single();

  if (calError || !existingCalendar) {
    return new Response(JSON.stringify({ error: "Calendar not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
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
    return new Response(
      JSON.stringify({
        error: "A calendar for next week already exists",
        existing_id: existingNext.id,
      }),
      {
        status: 409,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (
        data: GenerationProgress & { calendar_id?: string }
      ) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const { calendar_id: newCalendarId, quality } = await generateCalendar(
          {
            company_id: existingCalendar.company_id,
            week_of: nextWeekOf,
            posts_per_week: company?.posts_per_week ?? 3,
          },
          (progress) => sendEvent(progress)
        );

        // Send final success event with calendar ID
        sendEvent({
          step: "complete",
          message: "Next week's calendar generated!",
          progress: 100,
          calendar_id: newCalendarId,
        });
      } catch (error) {
        sendEvent({
          step: "error",
          message: error instanceof Error ? error.message : "Generation failed",
          progress: 0,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
