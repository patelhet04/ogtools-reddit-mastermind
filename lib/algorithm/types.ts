import type { CalendarItemType } from "@/lib/supabase";

export type TopicType = "question" | "discussion" | "recommendation_request";

export interface TopicCandidate {
  title: string;
  body: string;
  type: TopicType;
  target_keywords: string[]; // keyword codes
  product_angle: string;
}

export interface PlannedPost {
  topic: TopicCandidate;
  subreddit: string;
  poster_persona_id: string;
}

export type CommentRole =
  | "recommender"
  | "supporter"
  | "questioner"
  | "thankful_op";

export interface PlannedComment {
  persona_id: string;
  mentionsProduct: boolean;
  isReplyToComment: boolean;
  replyToIndex: number | null; // index in comments array
  role: CommentRole;
}

export interface PlannedThread {
  post: PlannedPost;
  comments: PlannedComment[];
}

export interface ScheduledItem {
  type: CalendarItemType;
  persona_id: string;
  subreddit: string;
  scheduled_at: string; // ISO
  title: string | null;
  body: string;
  keyword_ids: string[] | null;
  parent_ref: { kind: "none" } | { kind: "comment"; refIndex: number };
  mentionsProduct: boolean;
}

// Progress tracking for SSE
export type GenerationStep =
  | "initializing"
  | "generating_topics"
  | "matching_subreddits"
  | "planning_personas"
  | "scheduling"
  | "generating_post"
  | "generating_comment"
  | "quality_check"
  | "saving"
  | "complete"
  | "error";

export interface GenerationProgress {
  step: GenerationStep;
  message: string;
  progress: number; // 0-100
  detail?: string;
}

export type ProgressCallback = (progress: GenerationProgress) => void;
