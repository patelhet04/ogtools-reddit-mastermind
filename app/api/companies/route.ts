import { NextResponse } from "next/server";

import { supabaseServer } from "@/lib/supabase-server";
import type { CompanyUpsertPayload, UICompany } from "@/lib/types";

function normalizeSubreddit(name: string): string {
  return name.trim().replace(/^r\//i, "").replace(/^\//, "").trim();
}

export async function GET() {
  const { data, error } = await supabaseServer
    .from("companies")
    .select("*, personas(*), subreddits(*)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const companies: UICompany[] = (data ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    description: c.description ?? null,
    website_url: c.website_url ?? null,
    value_props: c.value_props ?? null,
    pain_points: c.pain_points ?? null,
    target_audience: c.target_audience ?? null,
    posts_per_week: c.posts_per_week ?? null,
    personas: (c.personas ?? []).map((p: any) => ({
      id: p.id,
      username: p.username,
      personality: p.personality ?? null,
      writingStyle: p.writing_style ?? null,
    })),
    subreddits: (c.subreddits ?? []).map((s: any) => ({
      id: s.id,
      name: normalizeSubreddit(s.name),
    })),
  }));

  return NextResponse.json(companies);
}

export async function POST(req: Request) {
  const payload = (await req.json()) as CompanyUpsertPayload;

  if (!payload?.name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const { data: company, error: companyError } = await supabaseServer
    .from("companies")
    .insert({
      name: payload.name.trim(),
      description: payload.description ?? null,
      website_url: payload.website_url ?? null,
      value_props: payload.value_props ?? [],
      pain_points: payload.pain_points ?? [],
      target_audience: payload.target_audience ?? null,
      posts_per_week: payload.posts_per_week ?? null,
    })
    .select("*")
    .single();

  if (companyError) {
    return NextResponse.json({ error: companyError.message }, { status: 500 });
  }

  const companyId = company.id as string;

  const personas = (payload.personas ?? [])
    .filter((p) => p.username?.trim())
    .map((p) => ({
      company_id: companyId,
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
    .map((name) => ({ company_id: companyId, name }));

  if (subreddits.length > 0) {
    const { error } = await supabaseServer.from("subreddits").insert(subreddits);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Re-fetch with relations to return UI shape
  const { data, error } = await supabaseServer.from("companies").select("*, personas(*), subreddits(*)").eq("id", companyId).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const response: UICompany = {
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

  return NextResponse.json(response, { status: 201 });
}


