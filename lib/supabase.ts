// lib/supabase.ts
// NOTE: This file is safe to import from client components (types only).

// Types (DB row shapes)
export type PersonaRole = "poster" | "commenter";

export type ContentCalendarStatus =
  | "draft"
  | "approved"
  | "executing"
  | "completed";

export type CalendarItemType = "post" | "comment";
export type CalendarItemStatus = "pending" | "posted" | "failed";

export interface Company {
  id: string;
  name: string;
  description: string | null;
  website_url: string | null;
  value_props: string[] | null;
  pain_points: string[] | null;
  target_audience: string | null;
  posts_per_week: number | null;
  created_at: string;
  updated_at: string;
}

export interface Persona {
  id: string;
  company_id: string;
  username: string;
  bio: string | null;
  role: PersonaRole | null;
  personality: string | null;
  writing_style: string | null;
  expertise_areas: string[] | null;
  created_at: string;
}

export interface Subreddit {
  id: string;
  company_id: string;
  name: string;
  created_at: string;
}

export interface TargetKeyword {
  id: string;
  company_id: string;
  keyword_code: string; // K1, K2, etc.
  keyword: string;
  created_at: string;
}

export interface ContentCalendar {
  id: string;
  company_id: string;
  week_of: string; // DATE in DB
  status: ContentCalendarStatus | null;
  quality_score: Partial<QualityScore> | null; // JSONB default '{}' in DB
  created_at: string;
  approved_at: string | null;
}

export interface CalendarItem {
  id: string;
  calendar_id: string;
  item_code: string | null; // P1, P2, C1, etc.
  type: CalendarItemType;
  persona_id: string | null;
  subreddit: string | null;
  scheduled_at: string;
  title: string | null;
  body: string;
  parent_item_id: string | null;
  keyword_ids: string[] | null; // ['K1','K14',...]
  status: CalendarItemStatus | null;
  reddit_post_id: string | null;
  posted_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface QualityScore {
  overall: number;
  naturalness: number;
  coverage: number;
  risk_level: number;
  issues: string[];
}
