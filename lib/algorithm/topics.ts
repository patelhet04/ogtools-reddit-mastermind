import "server-only";

import { z } from "zod";

import { jsonCompletion } from "@/lib/openai";
import type { TopicCandidate } from "@/lib/algorithm/types";

const topicSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  type: z.enum(["question", "discussion", "recommendation_request"]),
  target_keywords: z.array(z.string()).default([]),
  product_angle: z.string().min(1),
});

const topicsSchema = z.array(topicSchema).min(1);

export async function generateTopics(opts: {
  company: {
    name: string;
    description: string | null;
    value_props: string[] | null;
    pain_points: string[] | null;
  };
  keywords: Array<{ keyword_code: string; keyword: string }>;
  postsPerWeek: number;
}): Promise<TopicCandidate[]> {
  const n = Math.max(1, Math.ceil(opts.postsPerWeek * 1.5));
  const keywordList = opts.keywords.map(
    (k) => `${k.keyword_code}: ${k.keyword}`
  );

  const topics = await jsonCompletion<TopicCandidate[]>({
    schema: topicsSchema as unknown as z.ZodType<TopicCandidate[]>,
    temperature: 0.2,
    max_tokens: 5000,
    messages: [
      {
        role: "user",
        content: `
Given this company: ${opts.company.name}
Description: ${opts.company.description ?? ""}
Value props: ${(opts.company.value_props ?? []).join(" | ")}
Pain points they solve: ${(opts.company.pain_points ?? []).join(" | ")}

And these keywords to target (code: keyword):
${keywordList.join("\n")}

Generate EXACTLY ${n} Reddit post topics that:
1) Sound like real people asking real questions (not ads)
2) Create opportunities for someone to mention ${
          opts.company.name
        } in comments naturally
3) Are suitable for B2B/productivity/ops audiences
4) Keep each "body" under 240 characters
5) Keep each "product_angle" under 160 characters

Return ONLY a JSON array. Each item:
{
  "title": string,
  "body": string (1-3 sentences),
  "type": "question" | "discussion" | "recommendation_request",
  "target_keywords": string[] (keyword codes like "K1"),
  "product_angle": string (how product could come up in comments)
}
        `.trim(),
      },
    ],
  });

  // Some models ignore "EXACTLY N"; hard-cap to expected size for downstream logic.
  return topics.slice(0, n);
}
