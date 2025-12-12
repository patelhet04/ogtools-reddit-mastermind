import { NextResponse } from "next/server";

import { supabaseServer } from "@/lib/supabase-server";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabaseServer
    .from("content_calendars")
    .update({ status: "approved", approved_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}


