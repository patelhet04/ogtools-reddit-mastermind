import "server-only";

import type { PlannedThread, TopicCandidate } from "@/lib/algorithm/types";
import type { PersonaRole } from "@/lib/supabase";
import { mulberry32, randInt, hashSeed } from "@/lib/algorithm/rng";

export interface PersonaRow {
  id: string;
  username: string;
  role: PersonaRole | null;
}

export function orchestratePersonas(opts: {
  assignments: Array<{ topic: TopicCandidate; subreddit: string }>;
  personas: PersonaRow[];
  seed: string;
}): PlannedThread[] {
  const rand = mulberry32(hashSeed(opts.seed));

  const poster =
    opts.personas.find((p) => p.role === "poster") ?? opts.personas[0];
  const commenters = opts.personas.filter((p) => p.id !== poster.id);

  return opts.assignments.map(({ topic, subreddit }, idx) => {
    const numComments = randInt(rand, 2, 4);
    const comments: PlannedThread["comments"] = [];

    for (let i = 0; i < numComments; i++) {
      const persona = commenters[(idx + i) % commenters.length];
      const mentionsProduct = i === 0 ? true : rand() > 0.55;
      const isReplyToComment = i > 0 && rand() > 0.4;
      const replyToIndex = isReplyToComment ? Math.max(0, i - 1) : null;
      const role =
        i === 0
          ? ("recommender" as const)
          : isReplyToComment
          ? ("supporter" as const)
          : rand() > 0.7
          ? "questioner"
          : "supporter";

      comments.push({
        persona_id: persona.id,
        mentionsProduct,
        isReplyToComment,
        replyToIndex,
        role,
      });
    }

    // Optional OP reply to last comment
    if (rand() > 0.3) {
      comments.push({
        persona_id: poster.id,
        mentionsProduct: false,
        isReplyToComment: true,
        replyToIndex: Math.max(0, comments.length - 1),
        role: "thankful_op",
      });
    }

    return {
      post: { topic, subreddit, poster_persona_id: poster.id },
      comments,
    };
  });
}
