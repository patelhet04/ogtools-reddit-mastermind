import "server-only";

import OpenAI from "openai";
import { z } from "zod";

/**
 * OpenAI API client for LLM calls.
 *
 * Expected env:
 * - OPENAI_API_KEY: Your OpenAI API key
 * - OPENAI_MODEL (optional): Model to use (defaults to gpt-4o-mini)
 */

const DEFAULT_MODEL = "gpt-4o-mini";

let clientInstance: OpenAI | null = null;

function getClient(): OpenAI {
  if (!clientInstance) {
    clientInstance = new OpenAI();
  }
  return clientInstance;
}

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

export async function chatCompletion(opts: {
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}): Promise<string> {
  const client = getClient();
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  const response = await client.chat.completions.create({
    model,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.max_tokens ?? 800,
  });

  return response.choices[0]?.message?.content ?? "";
}

function extractFirstJson(text: string): string {
  // Best-effort extraction for LLMs that wrap JSON in prose or code fences.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const firstObj = text.indexOf("{");
  const firstArr = text.indexOf("[");
  const start =
    firstObj === -1
      ? firstArr
      : firstArr === -1
      ? firstObj
      : Math.min(firstObj, firstArr);
  if (start === -1) return text.trim();

  // Walk to find a balanced end for object/array (ignoring braces inside strings).
  let depth = 0;
  let inString = false;
  let escape = false;
  const open = text[start];
  const close = open === "{" ? "}" : "]";
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === open) depth++;
    if (ch === close) depth--;
    if (depth === 0) return text.slice(start, i + 1).trim();
  }

  return text.slice(start).trim();
}

export async function jsonCompletion<T>(opts: {
  messages: ChatMessage[];
  schema: z.ZodType<T>;
  temperature?: number;
  max_tokens?: number;
}): Promise<T> {
  const tryParse = (text: string): T => {
    const jsonText = extractFirstJson(text);
    const parsed = JSON.parse(jsonText);
    return opts.schema.parse(parsed);
  };

  const baseMessages: ChatMessage[] = [
    {
      role: "system",
      content:
        "Return ONLY valid JSON. Do not include markdown, code fences, or commentary.",
    },
    ...opts.messages,
  ];

  const raw = await chatCompletion({
    messages: baseMessages,
    temperature: opts.temperature,
    max_tokens: opts.max_tokens,
  });

  try {
    return tryParse(raw);
  } catch {
    // Retry once: rerun with deterministic settings + more room (common fix for truncated JSON).
    const retryRaw = await chatCompletion({
      messages: baseMessages,
      temperature: 0,
      max_tokens: Math.max(opts.max_tokens ?? 800, 5000),
    });
    try {
      return tryParse(retryRaw);
    } catch {
      // Repair once by asking the model to repair/normalize the JSON.
      const extracted = extractFirstJson(retryRaw);
      const repaired = await chatCompletion({
        messages: [
          {
            role: "system",
            content:
              "You are a JSON repair tool. Convert the user's content into STRICT valid JSON only. No markdown, no commentary.",
          },
          {
            role: "user",
            content: `Fix this into valid JSON (keep the same structure/fields):\n\n${extracted.slice(
              0,
              8000
            )}`,
          },
        ],
        temperature: 0,
        max_tokens: Math.max(opts.max_tokens ?? 800, 5000),
      });

      try {
        return tryParse(repaired);
      } catch {
        const snippet = retryRaw.slice(0, 4000);
        throw new Error(
          `OpenAI JSON parse failed after retries. Original snippet:\n${snippet}`
        );
      }
    }
  }
}
