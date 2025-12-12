import "server-only";

import { z } from "zod";

import { jsonCompletion } from "@/lib/openai";
import type { ScheduledItem, TopicType } from "@/lib/algorithm/types";

export interface PersonaForPrompt {
  id: string;
  username: string;
  bio: string | null;
  personality: string | null;
  writing_style: string | null;
}

const postOutSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
});

const commentOutSchema = z.object({
  body: z.string().min(1),
});

export async function generatePostText(opts: {
  companyName: string;
  persona: PersonaForPrompt;
  subreddit: string;
  topic: {
    title: string;
    body: string;
    type: TopicType;
    product_angle: string;
  };
}): Promise<{ title: string; body: string }> {
  return await jsonCompletion({
    schema: postOutSchema,
    temperature: 0.8,
    max_tokens: 5000,
    messages: [
      {
        role: "user",
        content: `
You are ${opts.persona.username}.
Background: ${opts.persona.bio ?? ""}
Personality: ${opts.persona.personality ?? ""}
Writing style: ${opts.persona.writing_style ?? ""}

Write a Reddit post for r/${opts.subreddit}.
Topic: ${opts.topic.title}
Type: ${opts.topic.type}

Requirements:
- Sound like a real person, not marketing
- Match the subreddit's typical tone
- You are genuinely seeking advice/opinions
- Keep it concise (2-4 sentences)
- DO NOT mention ${opts.companyName}

Return JSON:
{ "title": "...", "body": "..." }
        `.trim(),
      },
    ],
  });
}

export async function generateCommentText(opts: {
  companyName: string;
  persona: PersonaForPrompt;
  subreddit: string;
  post: { title: string; body: string };
  parentCommentBody?: string;
  role: string;
  mentionsProduct: boolean;
  productAngle: string;
}): Promise<{ body: string }> {
  return await jsonCompletion({
    schema: commentOutSchema,
    temperature: 0.8,
    max_tokens: 5000,
    messages: [
      {
        role: "user",
        content: `
You are ${opts.persona.username}.
Background: ${opts.persona.bio ?? ""}
Personality: ${opts.persona.personality ?? ""}
Writing style: ${opts.persona.writing_style ?? ""}

You're replying in r/${opts.subreddit} to this post:
Title: ${opts.post.title}
Body: ${opts.post.body}

${
  opts.parentCommentBody
    ? `You're replying to this comment:\n"${opts.parentCommentBody}"\n`
    : ""
}

Your role: ${opts.role}

${
  opts.mentionsProduct
    ? `Naturally mention ${opts.companyName}. Frame it as personal experience, not an ad.\nAngle: ${opts.productAngle}\n`
    : `Do NOT mention ${opts.companyName}.\n`
}

Requirements:
- Actually respond to what was said
- Sound like a real Reddit comment
- Keep it to 1-3 sentences
- No hype/marketing language

Return JSON:
{ "body": "..." }
        `.trim(),
      },
    ],
  });
}

export async function fillScheduledContent(opts: {
  companyName: string;
  personasById: Record<string, PersonaForPrompt>;
  subreddit: string;
  topic: { type: TopicType; product_angle: string };
  post: ScheduledItem;
  comments: Array<{ item: ScheduledItem; role: string }>;
  onCommentProgress?: (commentIndex: number, totalComments: number) => void;
}): Promise<{ post: ScheduledItem; comments: ScheduledItem[] }> {
  const poster = opts.personasById[opts.post.persona_id];
  const postText = await generatePostText({
    companyName: opts.companyName,
    persona: poster,
    subreddit: opts.subreddit,
    topic: {
      title: opts.post.title ?? "",
      body: opts.post.body,
      type: opts.topic.type,
      product_angle: opts.topic.product_angle,
    },
  });

  const post: ScheduledItem = {
    ...opts.post,
    title: postText.title,
    body: postText.body,
  };

  const comments: ScheduledItem[] = [];
  for (let i = 0; i < opts.comments.length; i++) {
    // Report progress before generating each comment
    opts.onCommentProgress?.(i, opts.comments.length);

    const { item, role } = opts.comments[i];
    const persona = opts.personasById[item.persona_id];
    const parentBody =
      item.parent_ref.kind === "comment"
        ? comments[item.parent_ref.refIndex]?.body
        : undefined;
    const out = await generateCommentText({
      companyName: opts.companyName,
      persona,
      subreddit: opts.subreddit,
      post: { title: post.title ?? "", body: post.body },
      parentCommentBody: parentBody,
      role,
      mentionsProduct: item.mentionsProduct,
      productAngle: opts.topic.product_angle,
    });
    comments.push({ ...item, body: out.body });
  }

  return { post, comments };
}
