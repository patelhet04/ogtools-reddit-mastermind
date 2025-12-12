import { NextResponse } from "next/server";

import { supabaseServer } from "@/lib/supabase-server";
import type { CompanyUpsertPayload, UICompany } from "@/lib/types";

function normalizeSubreddit(name: string): string {
  return name.trim().replace(/^r\//i, "").replace(/^\//, "").trim();
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabaseServer
    .from("companies")
    .select("*, personas(*), subreddits(*)")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  const company: UICompany = {
    id: data.id,
    name: data.name,
    description: data.description ?? null,
    website_url: data.website_url ?? null,
    value_props: data.value_props ?? null,
    pain_points: data.pain_points ?? null,
    target_audience: data.target_audience ?? null,
    posts_per_week: data.posts_per_week ?? null,
    personas: (data.personas ?? []).map((p: any) => ({
      id: p.id,
      username: p.username,
      personality: p.personality ?? null,
      writingStyle: p.writing_style ?? null,
    })),
    subreddits: (data.subreddits ?? []).map((s: any) => ({ id: s.id, name: normalizeSubreddit(s.name) })),
  };

  return NextResponse.json(company);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = (await req.json()) as CompanyUpsertPayload;

  if (!payload?.name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const { error: updateError } = await supabaseServer
    .from("companies")
    .update({
      name: payload.name.trim(),
      description: payload.description ?? null,
      website_url: payload.website_url ?? null,
      value_props: payload.value_props ?? [],
      pain_points: payload.pain_points ?? [],
      target_audience: payload.target_audience ?? null,
      posts_per_week: payload.posts_per_week ?? null,
    })
    .eq("id", id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // Replace related rows (simple approach)
  await supabaseServer.from("personas").delete().eq("company_id", id);
  await supabaseServer.from("subreddits").delete().eq("company_id", id);

  const personas = (payload.personas ?? [])
    .filter((p) => p.username?.trim())
    .map((p) => ({
      company_id: id,
      username: p.username.trim(),
      bio: p.bio ?? null,
      role: p.role ?? null,
      personality: p.personality ?? null,
      writing_style: p.writing_style ?? null,
      expertise_areas: p.expertise_areas ?? [],
    }));
  if (personas.length > 0) {
    const { error } = await supabaseServer.from("personas").insert(personas);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const subreddits = (payload.subreddits ?? [])
    .map(normalizeSubreddit)
    .filter(Boolean)
    .map((name) => ({ company_id: id, name }));
  if (subreddits.length > 0) {
    const { error } = await supabaseServer.from("subreddits").insert(subreddits);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data, error } = await supabaseServer
    .from("companies")
    .select("*, personas(*), subreddits(*)")
    .eq("id", id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const company: UICompany = {
    id: data.id,
    name: data.name,
    description: data.description ?? null,
    website_url: data.website_url ?? null,
    value_props: data.value_props ?? null,
    pain_points: data.pain_points ?? null,
    target_audience: data.target_audience ?? null,
    posts_per_week: data.posts_per_week ?? null,
    personas: (data.personas ?? []).map((p: any) => ({
      id: p.id,
      username: p.username,
      personality: p.personality ?? null,
      writingStyle: p.writing_style ?? null,
    })),
    subreddits: (data.subreddits ?? []).map((s: any) => ({ id: s.id, name: normalizeSubreddit(s.name) })),
  };

  return NextResponse.json(company);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Delete related data first (cascading)
  await supabaseServer.from("personas").delete().eq("company_id", id);
  await supabaseServer.from("subreddits").delete().eq("company_id", id);
  
  // Delete any calendars and their items for this company
  const { data: calendars } = await supabaseServer
    .from("content_calendars")
    .select("id")
    .eq("company_id", id);
  
  if (calendars && calendars.length > 0) {
    const calendarIds = calendars.map((c) => c.id);
    await supabaseServer.from("calendar_items").delete().in("calendar_id", calendarIds);
    await supabaseServer.from("content_calendars").delete().eq("company_id", id);
  }

  // Finally delete the company
  const { error } = await supabaseServer.from("companies").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
