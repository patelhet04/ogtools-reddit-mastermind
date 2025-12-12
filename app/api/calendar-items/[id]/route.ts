import { NextResponse } from "next/server";

import { supabaseServer } from "@/lib/supabase-server";
import type { CalendarItemStatus } from "@/lib/supabase";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const payload = (await req.json()) as Partial<{
    title: string | null;
    body: string;
    scheduled_at: string;
    status: CalendarItemStatus;
  }>;

  const update: any = {};
  if (payload.title !== undefined) update.title = payload.title;
  if (payload.body !== undefined) update.body = payload.body;
  if (payload.scheduled_at !== undefined)
    update.scheduled_at = payload.scheduled_at;
  if (payload.status !== undefined) update.status = payload.status;

  const { data, error } = await supabaseServer
    .from("calendar_items")
    .update(update)
    .eq("id", id)
    .select(
      `
      id,
      type,
      status,
      subreddit,
      scheduled_at,
      title,
      body,
      personas ( id, username, personality, writing_style )
    `
    )
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const persona = Array.isArray(data.personas)
    ? data.personas[0]
    : data.personas;

  return NextResponse.json({
    id: data.id,
    type: data.type,
    status: data.status ?? "pending",
    subreddit: (data.subreddit ?? "").replace(/^r\//i, ""),
    scheduledTime: new Date(data.scheduled_at).toISOString(),
    title: data.title ?? undefined,
    content: data.body ?? "",
    mentionsProduct: false,
    persona: {
      id: persona?.id ?? "unknown",
      username: persona?.username ?? "unknown",
      personality: persona?.personality ?? null,
      writingStyle: persona?.writing_style ?? null,
    },
  });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await supabaseServer
    .from("calendar_items")
    .delete()
    .eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
