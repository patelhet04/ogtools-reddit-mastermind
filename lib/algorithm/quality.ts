import "server-only";

import type { ScheduledItem } from "@/lib/algorithm/types";

export interface QualityResult {
  overall: number;
  naturalness: number;
  coverage: number;
  risk_level: number;
  issues: string[];
}

const MIN_COMMENT_DELAY_MINUTES = 15;
const MAX_TOPIC_SIMILARITY_THRESHOLD = 0.7;

/**
 * Check if a comment appears too quickly after its parent post
 */
function checkCommentTiming(
  posts: ScheduledItem[],
  comments: ScheduledItem[]
): { tooFast: boolean; count: number } {
  let tooFastCount = 0;

  // Group posts by subreddit and day
  const postsBySubAndDay: Record<string, Date[]> = {};
  for (const post of posts) {
    const postDate = new Date(post.scheduled_at);
    const dayKey = `${post.subreddit}:${postDate.toISOString().split("T")[0]}`;
    if (!postsBySubAndDay[dayKey]) {
      postsBySubAndDay[dayKey] = [];
    }
    postsBySubAndDay[dayKey].push(postDate);
  }

  for (const comment of comments) {
    const commentDate = new Date(comment.scheduled_at);
    const dayKey = `${comment.subreddit}:${
      commentDate.toISOString().split("T")[0]
    }`;
    const postsOnSameDay = postsBySubAndDay[dayKey] || [];

    // Find the closest earlier post in the same subreddit
    const earlierPosts = postsOnSameDay.filter((p) => p < commentDate);
    if (earlierPosts.length > 0) {
      const closestPost = earlierPosts.reduce((a, b) => (b > a ? b : a));
      const diffMinutes =
        (commentDate.getTime() - closestPost.getTime()) / (1000 * 60);
      if (diffMinutes < MIN_COMMENT_DELAY_MINUTES) {
        tooFastCount++;
      }
    }
  }

  return { tooFast: tooFastCount > 0, count: tooFastCount };
}

/**
 * Detect topic overlap - posts that are too similar in topic/angle
 */
function detectTopicOverlap(posts: ScheduledItem[]): {
  hasOverlap: boolean;
  overlappingPairs: number;
} {
  let overlappingPairs = 0;

  // Simple keyword-based similarity check
  const getKeywords = (text: string): Set<string> => {
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3);
    return new Set(words);
  };

  const jaccardSimilarity = (a: Set<string>, b: Set<string>): number => {
    const intersection = new Set([...a].filter((x) => b.has(x)));
    const union = new Set([...a, ...b]);
    return union.size > 0 ? intersection.size / union.size : 0;
  };

  for (let i = 0; i < posts.length; i++) {
    for (let j = i + 1; j < posts.length; j++) {
      const postA = posts[i];
      const postB = posts[j];

      // Check title and body similarity
      const keywordsA = getKeywords(`${postA.title || ""} ${postA.body}`);
      const keywordsB = getKeywords(`${postB.title || ""} ${postB.body}`);

      const similarity = jaccardSimilarity(keywordsA, keywordsB);
      if (similarity > MAX_TOPIC_SIMILARITY_THRESHOLD) {
        overlappingPairs++;
      }
    }
  }

  return { hasOverlap: overlappingPairs > 0, overlappingPairs };
}

/**
 * Detect awkward back-and-forth between personas
 * - Same persona replying to itself
 * - Two personas having an excessive ping-pong conversation
 */
function detectAwkwardBackAndForth(items: ScheduledItem[]): {
  hasAwkward: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Group items by subreddit and sort by time
  const bySubreddit: Record<string, ScheduledItem[]> = {};
  for (const item of items) {
    if (!bySubreddit[item.subreddit]) {
      bySubreddit[item.subreddit] = [];
    }
    bySubreddit[item.subreddit].push(item);
  }

  for (const [subreddit, subItems] of Object.entries(bySubreddit)) {
    const sorted = subItems.sort(
      (a, b) =>
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    );

    // Check for consecutive comments by the same persona
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];

      if (
        curr.type === "comment" &&
        prev.type === "comment" &&
        curr.persona_id === prev.persona_id
      ) {
        // Check if they're close in time (within 1 hour)
        const timeDiff =
          Math.abs(
            new Date(curr.scheduled_at).getTime() -
              new Date(prev.scheduled_at).getTime()
          ) /
          (1000 * 60);
        if (timeDiff < 60) {
          issues.push(
            `Same persona commenting consecutively in r/${subreddit}`
          );
        }
      }
    }

    // Detect ping-pong patterns (A → B → A → B)
    const comments = sorted.filter((i) => i.type === "comment");
    if (comments.length >= 4) {
      for (let i = 0; i < comments.length - 3; i++) {
        const sequence = comments.slice(i, i + 4).map((c) => c.persona_id);
        // Check for A-B-A-B pattern
        if (
          sequence[0] === sequence[2] &&
          sequence[1] === sequence[3] &&
          sequence[0] !== sequence[1]
        ) {
          issues.push(
            `Ping-pong conversation detected in r/${subreddit} (looks manufactured)`
          );
          break; // Only report once per subreddit
        }
      }
    }
  }

  return {
    hasAwkward: issues.length > 0,
    issues: [...new Set(issues)], // Deduplicate
  };
}

export function evaluateQuality(opts: {
  companyName: string;
  postsPerWeek: number;
  items: ScheduledItem[];
}): QualityResult {
  const issues: string[] = [];

  const posts = opts.items.filter((i) => i.type === "post");
  const comments = opts.items.filter((i) => i.type === "comment");

  // 1. Subreddit distribution check
  const bySub: Record<string, number> = {};
  for (const p of posts) bySub[p.subreddit] = (bySub[p.subreddit] ?? 0) + 1;
  const maxShare =
    Math.max(...Object.values(bySub)) / Math.max(1, posts.length);
  if (maxShare > 0.4) {
    issues.push(
      "Subreddit distribution too concentrated (>40% in one subreddit)"
    );
  }

  // 2. Comment timing validation
  const timingCheck = checkCommentTiming(posts, comments);
  if (timingCheck.tooFast) {
    issues.push(
      `${timingCheck.count} comment(s) appear too fast (<${MIN_COMMENT_DELAY_MINUTES} min after post)`
    );
  }

  // 3. Topic overlap detection
  const topicCheck = detectTopicOverlap(posts);
  if (topicCheck.hasOverlap) {
    issues.push(
      `${topicCheck.overlappingPairs} post pair(s) have overlapping topics (>70% similarity)`
    );
  }

  // 4. Awkward back-and-forth detection
  const backAndForthCheck = detectAwkwardBackAndForth(opts.items);
  if (backAndForthCheck.hasAwkward) {
    issues.push(...backAndForthCheck.issues);
  }

  // 5. Persona variety
  const uniquePosters = new Set(posts.map((p) => p.persona_id)).size;
  if (uniquePosters < 1) {
    issues.push("No poster variety");
  }

  // 6. Product mention density
  const mentionCount = comments.filter((c) =>
    c.body.toLowerCase().includes(opts.companyName.toLowerCase())
  ).length;
  const mentionDensity = comments.length ? mentionCount / comments.length : 0;
  if (mentionDensity > 0.8) {
    issues.push("Too many comments mention the product (>80%)");
  }

  // Calculate penalties
  const penalties =
    (maxShare > 0.4 ? 2 : 0) +
    (timingCheck.tooFast ? 1 : 0) +
    (topicCheck.hasOverlap ? 1.5 : 0) +
    (backAndForthCheck.hasAwkward ? 2 : 0) +
    (mentionDensity > 0.8 ? 2 : 0);

  const overall = Math.max(1, Math.min(10, 9 - penalties));
  const naturalness = Math.max(
    1,
    Math.min(
      10,
      overall -
        (mentionDensity > 0.8 ? 1 : 0) -
        (backAndForthCheck.hasAwkward ? 1 : 0)
    )
  );
  const coverage = Math.max(
    1,
    Math.min(10, overall - (topicCheck.hasOverlap ? 1 : 0))
  );

  // Risk level calculation
  let risk_level = 3; // Base risk
  if (mentionDensity > 0.8) risk_level += 2;
  if (backAndForthCheck.hasAwkward) risk_level += 2;
  if (timingCheck.tooFast) risk_level += 1;
  risk_level = Math.min(10, risk_level);

  return { overall, naturalness, coverage, risk_level, issues };
}
