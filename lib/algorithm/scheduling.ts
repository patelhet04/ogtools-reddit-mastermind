import "server-only";

import type { PlannedThread, ScheduledItem } from "@/lib/algorithm/types";
import {
  hashSeed,
  mulberry32,
  randInt,
  weightedChoice,
} from "@/lib/algorithm/rng";

function addDays(d: Date, days: number) {
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

function addMinutes(d: Date, minutes: number) {
  const out = new Date(d);
  out.setUTCMinutes(out.getUTCMinutes() + minutes);
  return out;
}

function calculateDelay(
  rand: () => number,
  commentIndex: number,
  isReply: boolean
) {
  // First comment: 20-60 min after post
  if (commentIndex === 0) return randInt(rand, 20, 60);
  // Reply to comment: 15-45 min (must be >= 15 to pass quality check)
  if (isReply) return randInt(rand, 15, 45);
  // New top-level comment: 30-240 min
  return randInt(rand, 30, 240);
}

function selectPostingHour(rand: () => number) {
  // weighted toward 9am/12pm/6pm local-ish, but we keep UTC for simplicity
  return weightedChoice(rand, [
    { item: 15, weight: 3 }, // 3pm UTC
    { item: 18, weight: 3 }, // 6pm UTC
    { item: 12, weight: 2 }, // noon UTC
    { item: 9, weight: 1.5 },
    { item: 21, weight: 1.2 },
    { item: 10, weight: 1 },
    { item: 14, weight: 1 },
  ]);
}

export function scheduleThreads(opts: {
  threads: PlannedThread[];
  week_of: string; // YYYY-MM-DD (Monday)
  seed: string;
}): Array<{ post: ScheduledItem; comments: ScheduledItem[] }> {
  const rand = mulberry32(hashSeed(opts.seed));
  const weekStart = new Date(`${opts.week_of}T00:00:00.000Z`);

  // distribute posts across days
  const postDays: number[] = [];
  for (let i = 0; i < opts.threads.length; i++) postDays.push(i % 7);

  return opts.threads.map((thread, i) => {
    const day = postDays[i];
    const hour = selectPostingHour(rand);
    const minute = randInt(rand, 0, 59);
    const postTime = addMinutes(
      addDays(addMinutes(weekStart, hour * 60), day),
      minute
    );

    const post: ScheduledItem = {
      type: "post",
      persona_id: thread.post.poster_persona_id,
      subreddit: thread.post.subreddit,
      scheduled_at: postTime.toISOString(),
      title: thread.post.topic.title,
      body: thread.post.topic.body,
      keyword_ids: thread.post.topic.target_keywords ?? null,
      parent_ref: { kind: "none" },
      mentionsProduct: false,
    };

    const comments: ScheduledItem[] = [];
    let last = postTime;
    for (let j = 0; j < thread.comments.length; j++) {
      const c = thread.comments[j];
      const delay = calculateDelay(rand, j, c.isReplyToComment);
      const cTime = addMinutes(last, delay);

      comments.push({
        type: "comment",
        persona_id: c.persona_id,
        subreddit: thread.post.subreddit,
        scheduled_at: cTime.toISOString(),
        title: null,
        body: "", // filled in content generation
        keyword_ids: thread.post.topic.target_keywords ?? null,
        parent_ref:
          c.isReplyToComment && c.replyToIndex !== null
            ? { kind: "comment", refIndex: c.replyToIndex }
            : { kind: "none" },
        mentionsProduct: c.mentionsProduct,
      });

      if (c.isReplyToComment) last = cTime;
    }

    return { post, comments };
  });
}
