import { generateCalendar } from "@/lib/algorithm";
import { supabaseServer } from "@/lib/supabase-server";
import type { CalendarGeneratePayload } from "@/lib/types";
import type { GenerationProgress } from "@/lib/algorithm/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const payload = (await req.json()) as CalendarGeneratePayload;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (
        data: GenerationProgress & { calendar_id?: string }
      ) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const { calendar_id, quality } = await generateCalendar(
          payload,
          (progress) => {
            sendEvent(progress);
          }
        );

        // Fetch final calendar data
        const { data } = await supabaseServer
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

        if (data) {
          const start = new Date(`${data.week_of}T00:00:00.000Z`);
          const end = new Date(start);
          end.setUTCDate(end.getUTCDate() + 6);

          sendEvent({
            step: "complete",
            message: "Calendar generated successfully!",
            progress: 100,
            detail: `Quality score: ${quality.overall}/10`,
            calendar_id: data.id,
          });
        }
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
