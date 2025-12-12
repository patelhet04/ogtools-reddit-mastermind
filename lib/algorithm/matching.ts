import "server-only";

import { z } from "zod";

import { jsonCompletion } from "@/lib/openai";
import type { TopicCandidate } from "@/lib/algorithm/types";

const assignmentSchema = z.object({
  topic_index: z.number().int().min(0),
  subreddit: z.string().min(1),
});

const assignmentsSchema = z.array(assignmentSchema);

export async function matchTopicsToSubreddits(opts: {
  topics: TopicCandidate[];
  subreddits: string[]; // without r/
  postsPerWeek: number;
}): Promise<Array<{ topic: TopicCandidate; subreddit: string }>> {
  const maxPerSubreddit =
    Math.ceil(opts.postsPerWeek / Math.max(1, opts.subreddits.length)) + 1;

  const assignments = await jsonCompletion<
    Array<{ topic_index: number; subreddit: string }>
  >({
    schema: assignmentsSchema as unknown as z.ZodType<
      Array<{ topic_index: number; subreddit: string }>
    >,
    temperature: 0.2,
    max_tokens: 5000,
    messages: [
      {
        role: "user",
        content: `
You are assigning Reddit post topics to the best subreddit.

Subreddits (must choose from this list exactly):
${opts.subreddits.map((s) => `- ${s}`).join("\n")}

Rules:
- Pick the best fit subreddit for each topic
- Ensure no subreddit gets more than ${maxPerSubreddit} posts
- Select exactly ${opts.postsPerWeek} topics from the list (0..${
          opts.topics.length - 1
        })

Topics (index: title):
${opts.topics.map((t, i) => `${i}: ${t.title}`).join("\n")}

Return ONLY JSON array of objects:
[{ "topic_index": number, "subreddit": string }]
        `.trim(),
      },
    ],
  });

  // Filter to valid, enforce count, enforce allowed subs
  const allowed = new Set(opts.subreddits);
  const counts: Record<string, number> = {};
  const picked: Array<{ topic: TopicCandidate; subreddit: string }> = [];

  for (const a of assignments) {
    if (picked.length >= opts.postsPerWeek) break;
    if (
      !Number.isInteger(a.topic_index) ||
      a.topic_index < 0 ||
      a.topic_index >= opts.topics.length
    )
      continue;
    if (!allowed.has(a.subreddit)) continue;
    counts[a.subreddit] = (counts[a.subreddit] ?? 0) + 1;
    if (counts[a.subreddit] > maxPerSubreddit) continue;
    const topic = opts.topics[a.topic_index];
    if (picked.some((p) => p.topic.title === topic.title)) continue;
    picked.push({ topic, subreddit: a.subreddit });
  }

  // If model returns too few, fall back to a simple round-robin
  if (picked.length < opts.postsPerWeek) {
    for (
      let i = 0;
      i < opts.topics.length && picked.length < opts.postsPerWeek;
      i++
    ) {
      const topic = opts.topics[i];
      if (picked.some((p) => p.topic.title === topic.title)) continue;
      const subreddit = opts.subreddits[picked.length % opts.subreddits.length];
      picked.push({ topic, subreddit });
    }
  }

  return picked.slice(0, opts.postsPerWeek);
}
