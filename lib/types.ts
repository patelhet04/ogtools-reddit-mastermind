// lib/types.ts
// UI/View-model types (API response/request shapes) — designed to match the UI needs.

import type {
  CalendarItemStatus,
  CalendarItemType,
  ContentCalendarStatus,
  PersonaRole,
} from "@/lib/supabase";

export type UIStatus = ContentCalendarStatus | CalendarItemStatus;

export interface UIPersona {
  id: string;
  username: string;
  personality: string | null;
  writingStyle: string | null;
}

export interface UICalendarItem {
  id: string;
  type: CalendarItemType;
  status: CalendarItemStatus;
  persona: UIPersona;
  subreddit: string; // without "r/"
  scheduledTime: string; // ISO string
  title?: string;
  content: string;
  mentionsProduct: boolean;
}

export interface UICalendar {
  id: string;
  companyId: string;
  companyName: string;
  weekOf: string; // YYYY-MM-DD (original DB value for navigation)
  weekStart: string; // ISO string
  weekEnd: string; // ISO string
  status: ContentCalendarStatus;
  qualityScore: number;
  items: Array<Pick<UICalendarItem, "id" | "type" | "status">>;
}

export interface UISubreddit {
  id: string;
  name: string; // without "r/"
}

export interface UICompany {
  id: string;
  name: string;
  description: string | null;
  website_url: string | null;
  value_props: string[] | null;
  pain_points: string[] | null;
  target_audience: string | null;
  posts_per_week: number | null;
  personas: UIPersona[];
  subreddits: UISubreddit[];
}

export interface CompanyUpsertPayload {
  name: string;
  description?: string;
  website_url?: string;
  value_props?: string[];
  pain_points?: string[];
  target_audience?: string;
  posts_per_week?: number;
  personas?: Array<{
    username: string;
    role?: PersonaRole;
    bio?: string;
    personality?: string;
    writing_style?: string;
    expertise_areas?: string[];
  }>;
  subreddits?: string[]; // without "r/"
  target_keywords?: Array<{
    keyword_code?: string;
    keyword: string;
  }>;
}

export interface CalendarGeneratePayload {
  company_id: string;
  week_of: string; // YYYY-MM-DD
  posts_per_week?: number; // if/when you want to use it for generation
}
