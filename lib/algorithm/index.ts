import "server-only";

import { z } from "zod";

import { supabaseServer } from "@/lib/supabase-server";
import type { CalendarItemType } from "@/lib/supabase";
import type { CalendarGeneratePayload } from "@/lib/types";
import { isOpenAIConfigured } from "@/lib/openai";
import { generateTopics } from "@/lib/algorithm/topics";
import { matchTopicsToSubreddits } from "@/lib/algorithm/matching";
import { orchestratePersonas } from "@/lib/algorithm/personas";
import { scheduleThreads } from "@/lib/algorithm/scheduling";
import { fillScheduledContent } from "@/lib/algorithm/content";
import { evaluateQuality } from "@/lib/algorithm/quality";
import type { ProgressCallback } from "@/lib/algorithm/types";

const generateInputSchema = z.object({
  company_id: z.string().min(1),
  week_of: z.string().min(1), // YYYY-MM-DD
  posts_per_week: z.number().int().min(1).max(20).optional(),
});

function buildItemCode(prefix: "P" | "C", n: number) {
  return `${prefix}${n}`;
}

// Default no-op progress callback
const noopProgress: ProgressCallback = () => {};

/**
 * Generate a content calendar with optional progress reporting for SSE.
 */
export async function generateCalendar(
  payload: CalendarGeneratePayload,
  onProgress: ProgressCallback = noopProgress
) {
  const input = generateInputSchema.parse(payload);
  const postsPerWeek = input.posts_per_week ?? 3;

  // Progress tracking - we'll recalculate totalSteps after scheduling
  // Initial estimate: 4 setup phases + posts + ~3 comments per post + 2 final phases
  let totalSteps = 4 + postsPerWeek + postsPerWeek * 4 + 2;
  let currentStep = 0;
  const calcProgress = () =>
    Math.min(99, Math.round((currentStep / totalSteps) * 100));

  onProgress({
    step: "initializing",
    message: "Loading company data...",
    progress: 0,
  });

  const { data: company, error: companyError } = await supabaseServer
    .from("companies")
    .select("id, name, description, value_props, pain_points, posts_per_week")
    .eq("id", input.company_id)
    .single();
  if (companyError) throw new Error(companyError.message);

  const { data: personas, error: personasError } = await supabaseServer
    .from("personas")
    .select("id, username, bio, role, personality, writing_style")
    .eq("company_id", input.company_id)
    .order("created_at", { ascending: true });
  if (personasError) throw new Error(personasError.message);

  const { data: subreddits, error: subError } = await supabaseServer
    .from("subreddits")
    .select("name")
    .eq("company_id", input.company_id)
    .order("created_at", { ascending: true });
  if (subError) throw new Error(subError.message);

  const { data: keywords, error: kwError } = await supabaseServer
    .from("target_keywords")
    .select("keyword_code, keyword")
    .eq("company_id", input.company_id)
    .order("keyword_code", { ascending: true });
  if (kwError) throw new Error(kwError.message);

  if (!personas || personas.length < 2) {
    throw new Error("Need at least 2 personas to generate a calendar");
  }
  if (!subreddits || subreddits.length < 1) {
    throw new Error("Need at least 1 subreddit to generate a calendar");
  }

  if (!isOpenAIConfigured()) {
    throw new Error(
      "OpenAI is not configured. Set OPENAI_API_KEY environment variable to enable generation."
    );
  }

  // Phase 1: Generate Topics
  currentStep++;
  onProgress({
    step: "generating_topics",
    message: "Generating topic ideas...",
    progress: calcProgress(),
    detail: `Creating ${Math.ceil(postsPerWeek * 1.5)} topic candidates`,
  });

  const topics = await generateTopics({
    company: {
      name: company.name,
      description: company.description ?? null,
      value_props: company.value_props ?? null,
      pain_points: company.pain_points ?? null,
    },
    keywords: keywords ?? [],
    postsPerWeek,
  });

  // Phase 2: Match to Subreddits
  currentStep++;
  onProgress({
    step: "matching_subreddits",
    message: "Matching topics to subreddits...",
    progress: calcProgress(),
    detail: `Analyzing ${(subreddits ?? []).length} subreddits`,
  });

  const assignments = await matchTopicsToSubreddits({
    topics,
    subreddits: (subreddits ?? []).map((s: { name: string }) =>
      String(s.name).replace(/^r\//i, "")
    ),
    postsPerWeek,
  });

  // Phase 3: Plan Personas
  currentStep++;
  onProgress({
    step: "planning_personas",
    message: "Planning persona assignments...",
    progress: calcProgress(),
    detail: `Orchestrating ${(personas ?? []).length} personas`,
  });

  const threads = orchestratePersonas({
    assignments,
    personas: (personas ?? []).map(
      (p: { id: string; username: string; role: string | null }) => ({
        id: p.id,
        username: p.username,
        role: (p.role as "poster" | "commenter" | null) ?? null,
      })
    ),
    seed: `${input.company_id}:${input.week_of}`,
  });

  // Phase 4: Schedule
  currentStep++;
  onProgress({
    step: "scheduling",
    message: "Creating weekly schedule...",
    progress: calcProgress(),
    detail: "Distributing posts across the week",
  });

  const scheduled = scheduleThreads({
    threads,
    week_of: input.week_of,
    seed: `${input.company_id}:${input.week_of}:schedule`,
  });

  // Recalculate total steps now that we know exact comment counts
  const actualCommentCount = scheduled.reduce(
    (sum, s) => sum + s.comments.length,
    0
  );
  totalSteps = 4 + scheduled.length + actualCommentCount + 2;

  // Create calendar container early
  const { data: calendar, error: calError } = await supabaseServer
    .from("content_calendars")
    .insert({
      company_id: input.company_id,
      week_of: input.week_of,
      status: "draft",
      quality_score: {
        overall: 6,
        naturalness: 6,
        coverage: 6,
        risk_level: 3,
        issues: ["Generating..."],
      },
    })
    .select("*")
    .single();
  if (calError) throw new Error(calError.message);

  // Phase 5: Generate Content
  const personasById: Record<
    string,
    {
      id: string;
      username: string;
      bio: string | null;
      personality: string | null;
      writing_style: string | null;
    }
  > = {};
  for (const p of personas as Array<{
    id: string;
    username: string;
    bio: string | null;
    personality: string | null;
    writing_style: string | null;
  }>) {
    personasById[p.id] = {
      id: p.id,
      username: p.username,
      bio: p.bio ?? null,
      personality: p.personality ?? null,
      writing_style: p.writing_style ?? null,
    };
  }

  type PendingItem = {
    type: CalendarItemType;
    item_code: string;
    persona_id: string;
    subreddit: string;
    scheduled_at: string;
    title: string | null;
    body: string;
    parent_item_id: string | null;
    keyword_ids: string[] | null;
  };

  const pending: PendingItem[] = [];
  const parentUpdateQueue: Array<{ childCode: string; parentCode: string }> =
    [];

  let postNum = 0;
  let commentNum = 0;

  for (let i = 0; i < scheduled.length; i++) {
    const { post, comments } = scheduled[i];
    const thread = threads[i];
    const persona = personasById[post.persona_id];

    // Progress for post
    currentStep++;
    onProgress({
      step: "generating_post",
      message: `Writing post ${i + 1} of ${scheduled.length}...`,
      progress: calcProgress(),
      detail: `r/${post.subreddit} • @${persona?.username || "unknown"}`,
    });

    const filled = await fillScheduledContent({
      companyName: company.name,
      personasById,
      subreddit: post.subreddit,
      topic: {
        type: thread.post.topic.type,
        product_angle: thread.post.topic.product_angle,
      },
      post,
      comments: comments.map((c, idx) => ({
        item: c,
        role: thread.comments[idx]?.role ?? "supporter",
      })),
      onCommentProgress: (commentIdx, totalComments) => {
        currentStep++;
        const commentPersona = personasById[comments[commentIdx].persona_id];
        onProgress({
          step: "generating_comment",
          message: `Writing comment ${commentIdx + 1} of ${totalComments}...`,
          progress: calcProgress(),
          detail: `Post ${i + 1} • @${commentPersona?.username || "unknown"}`,
        });
      },
    });

    postNum += 1;
    const postCode = `P${postNum}`;
    pending.push({
      type: "post",
      item_code: postCode,
      persona_id: filled.post.persona_id,
      subreddit: filled.post.subreddit,
      scheduled_at: filled.post.scheduled_at,
      title: filled.post.title,
      body: filled.post.body,
      parent_item_id: null,
      keyword_ids: thread.post.topic.target_keywords ?? null,
    });

    const commentCodes: string[] = [];
    for (let j = 0; j < filled.comments.length; j++) {
      commentNum += 1;
      const cCode = `C${commentNum}`;
      commentCodes.push(cCode);

      pending.push({
        type: "comment",
        item_code: cCode,
        persona_id: filled.comments[j].persona_id,
        subreddit: filled.comments[j].subreddit,
        scheduled_at: filled.comments[j].scheduled_at,
        title: null,
        body: filled.comments[j].body,
        parent_item_id: null,
        keyword_ids: thread.post.topic.target_keywords ?? null,
      });
    }

    // parent refs inside the thread
    for (let j = 0; j < filled.comments.length; j++) {
      const c = filled.comments[j];
      if (c.parent_ref?.kind === "comment") {
        parentUpdateQueue.push({
          childCode: commentCodes[j],
          parentCode: commentCodes[c.parent_ref.refIndex],
        });
      }
    }
  }

  // Phase 6: Quality Check
  currentStep++;
  onProgress({
    step: "quality_check",
    message: "Evaluating content quality...",
    progress: calcProgress(),
    detail: "Checking naturalness and distribution",
  });

  const quality = evaluateQuality({
    companyName: company.name,
    postsPerWeek,
    items: pending.map((p) => ({
      type: p.type,
      persona_id: p.persona_id,
      subreddit: p.subreddit,
      scheduled_at: p.scheduled_at,
      title: p.title,
      body: p.body,
      keyword_ids: p.keyword_ids,
      parent_ref: { kind: "none" },
      mentionsProduct: p.body
        .toLowerCase()
        .includes(company.name.toLowerCase()),
    })),
  });

  await supabaseServer
    .from("content_calendars")
    .update({ quality_score: quality })
    .eq("id", calendar.id);

  // Phase 7: Save to Database
  currentStep++;
  onProgress({
    step: "saving",
    message: "Saving calendar items...",
    progress: calcProgress(),
    detail: `${pending.length} items to save`,
  });

  const insertedIdsByCode: Record<string, string> = {};

  for (const item of pending.filter((p) => p.type === "post")) {
    const { data, error } = await supabaseServer
      .from("calendar_items")
      .insert({
        calendar_id: calendar.id,
        item_code: item.item_code,
        type: item.type,
        persona_id: item.persona_id,
        subreddit: item.subreddit,
        scheduled_at: item.scheduled_at,
        title: item.title,
        body: item.body,
        parent_item_id: null,
        keyword_ids: item.keyword_ids,
        status: "pending",
      })
      .select("id, item_code")
      .single();
    if (error) throw new Error(error.message);
    insertedIdsByCode[data.item_code] = data.id;

    const postIdx = Number(item.item_code.slice(1));
    const c1Code = buildItemCode("C", (postIdx - 1) * 3 + 1);
    const c2Code = buildItemCode("C", (postIdx - 1) * 3 + 2);
    const c3Code = buildItemCode("C", (postIdx - 1) * 3 + 3);

    const comments = pending.filter((p) =>
      [c1Code, c2Code, c3Code].includes(p.item_code)
    );
    let firstCommentId: string | null = null;

    for (const c of comments) {
      const { data: cData, error: cErr } = await supabaseServer
        .from("calendar_items")
        .insert({
          calendar_id: calendar.id,
          item_code: c.item_code,
          type: c.type,
          persona_id: c.persona_id,
          subreddit: c.subreddit,
          scheduled_at: c.scheduled_at,
          title: null,
          body: c.body,
          parent_item_id: null,
          keyword_ids: c.keyword_ids,
          status: "pending",
        })
        .select("id, item_code")
        .single();
      if (cErr) throw new Error(cErr.message);
      insertedIdsByCode[cData.item_code] = cData.id;
      if (!firstCommentId) firstCommentId = cData.id;
    }

    if (firstCommentId) {
      const c2Id = insertedIdsByCode[c2Code];
      const c3Id = insertedIdsByCode[c3Code];
      if (c2Id) {
        await supabaseServer
          .from("calendar_items")
          .update({ parent_item_id: firstCommentId })
          .eq("id", c2Id);
      }
      if (c3Id) {
        await supabaseServer
          .from("calendar_items")
          .update({ parent_item_id: firstCommentId })
          .eq("id", c3Id);
      }
    }
  }

  for (const link of parentUpdateQueue) {
    const childId = insertedIdsByCode[link.childCode];
    const parentId = insertedIdsByCode[link.parentCode];
    if (childId && parentId) {
      await supabaseServer
        .from("calendar_items")
        .update({ parent_item_id: parentId })
        .eq("id", childId);
    }
  }

  // Complete!
  onProgress({
    step: "complete",
    message: "Calendar generated successfully!",
    progress: 100,
    detail: `${postNum} posts, ${commentNum} comments`,
  });

  return { calendar_id: calendar.id, quality };
}
