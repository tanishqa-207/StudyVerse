// AI Study Coach endpoint — powers the in-dashboard assistant + search bar.
//
// Primary provider is Groq's API, which streams fast, high-quality answers.
// Responses are streamed as they generate so the client can render tokens live.
// Safety filters are applied at the Groq API level.
//
// The API key is read from GROQ_API_KEY and never exposed to the client. If a
// Groq key is not set, we fall back to Anthropic. When neither is configured,
// we return a single, honest "add a key" message — no canned/placeholder answers.
//
// Wire protocol (Server-Sent Events, one JSON object per `data:` line):
//   {"type":"delta","text":"..."}   incremental answer text
//   {"type":"error","error":"..."}  a recoverable error (client may retry)
//   {"type":"done"}                 end of stream

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
const MAX_TOKENS = 2048;
const MAX_UPSTREAM_ATTEMPTS = 3;

const SYSTEM_PROMPT =
  "You are StudyVerse Coach, a friendly, motivating study companion embedded in a gamified study dashboard. " +
  "You help learners plan and stick to their studies. You do two things well:\n" +
  "1. STUDY PLANS: When asked to plan, prepare for an exam, or learn a topic, produce a clear, actionable study plan. " +
  "Use Markdown: a short intro line, then a day-by-day or session-by-session breakdown as a list, each item with a focus, " +
  "a concrete task, and a suggested duration (e.g. two 25-min focus sessions). End with one short motivational line.\n" +
  "2. Q&A: Answer questions on any topic — programming, science, math, study techniques, and more — concisely and clearly.\n" +
  "Prefer short paragraphs, bullet lists, and fenced code blocks when they help. Lead with the answer. " +
  "Keep responses safe and appropriate for a learning environment.";

const enc = new TextEncoder();

/** One SSE frame. */
function sse(obj: unknown): Uint8Array {
  return enc.encode(`data: ${JSON.stringify(obj)}\n\n`);
}

/** A single-shot SSE stream that emits one payload then closes. Used for setup
 *  guidance and for surfacing errors over the same wire. */
function singleShot(payload:
  | { type: "delta"; text: string }
  | { type: "error"; error: string }): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(sse(payload));
      if (payload.type === "delta") controller.enqueue(sse({ type: "done" }));
      controller.close();
    },
  });
  return sseResponse(stream);
}

function sseResponse(stream: ReadableStream<Uint8Array>): Response {
  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  let messages: ChatMessage[];
  try {
    const body = await req.json();
    messages = Array.isArray(body?.messages) ? body.messages : [];
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Validate + trim history: keep the last several turns, drop empties.
  const trimmed = messages
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content.trim() }));

  if (trimmed.length === 0) {
    return NextResponse.json({ error: "No message provided." }, { status: 400 });
  }

  const groqKey = process.env.GROQ_API_KEY?.trim();
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (groqKey) return streamGroq(trimmed, groqKey);
  if (anthropicKey) return streamAnthropic(trimmed, anthropicKey);

  // No key configured — one honest message, no fabricated/placeholder answer.
  return singleShot({
    type: "delta",
    text:
      "The AI coach isn't configured yet. Add your **Groq API key** to `.env.local` " +
      "as `GROQ_API_KEY=...` (get one free at https://console.groq.com/keys) and restart the dev server. " +
      "Then I can answer any question you ask.",
  });
}

// ---------------------------------------------------------------------------
// Groq (primary) — OpenAI-compatible streaming API.
// ---------------------------------------------------------------------------
async function streamGroq(trimmed: ChatMessage[], apiKey: string): Promise<Response> {
  const url = "https://api.groq.com/openai/v1/chat/completions";

  const payload = {
    model: GROQ_MODEL,
    messages: [{ role: "system" as const, content: SYSTEM_PROMPT }, ...trimmed],
    max_tokens: MAX_TOKENS,
    temperature: 0.8,
    top_p: 0.95,
    stream: true,
  };

  let upstream: Response | null = null;
  let lastError = "";
  for (let attempt = 0; attempt < MAX_UPSTREAM_ATTEMPTS; attempt++) {
    try {
      upstream = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });
    } catch {
      lastError = "Could not reach the coach service.";
      await sleep(400 * (attempt + 1));
      continue;
    }
    if (upstream.ok) break;

    const status = upstream.status;
    const retryable = status === 429 || status >= 500;
    const detail = await upstream.text().catch(() => "");
    lastError = friendlyGroqError(status, detail);
    if (retryable && attempt < MAX_UPSTREAM_ATTEMPTS - 1) {
      const retryAfter = Number(upstream.headers.get("retry-after"));
      const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 500 * Math.pow(2, attempt);
      upstream = null;
      await sleep(Math.min(wait, 8000));
      continue;
    }
    upstream = null;
    break;
  }

  if (!upstream || !upstream.body) {
    return singleShot({ type: "error", error: lastError || "The coach is unavailable right now. Please try again." });
  }

  const source = upstream.body;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = source.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let emittedAny = false;
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let sep: number;
          while ((sep = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, sep);
            buffer = buffer.slice(sep + 1);
            if (!line.startsWith("data:")) continue;
            const json = line.slice(5).trim();
            if (!json || json === "[DONE]") continue;
            let evt: GroqChunk;
            try {
              evt = JSON.parse(json);
            } catch {
              continue;
            }
            const text = evt.choices?.[0]?.delta?.content ?? "";
            if (text) {
              emittedAny = true;
              controller.enqueue(sse({ type: "delta", text }));
            }
          }
        }
        if (!emittedAny) {
          controller.enqueue(sse({ type: "error", error: "The coach returned an empty response. Please try again." }));
        }
        controller.enqueue(sse({ type: "done" }));
      } catch {
        controller.enqueue(sse({ type: "error", error: "The connection to the coach dropped. Please try again." }));
      } finally {
        reader.releaseLock();
        controller.close();
      }
    },
  });

  return sseResponse(stream);
}

interface GroqChunk {
  choices?: { delta?: { content?: string } }[];
}

function friendlyGroqError(status: number, detail: string): string {
  if (status === 400) return `Coach request rejected (400). Detail: ${detail.slice(0, 160)}`;
  if (status === 401 || status === 403) return "The Groq API key was rejected. Check GROQ_API_KEY in `.env.local` and restart the server.";
  if (status === 429) return "The coach is rate-limited right now — please wait a moment and retry.";
  if (status >= 500) return "The coach service is busy. Please try again in a moment.";
  const snippet = detail.slice(0, 160);
  return `Coach request failed (${status}).${snippet ? ` ${snippet}` : ""}`;
}

// ---------------------------------------------------------------------------
// Anthropic (fallback) — used only when no Groq key is set.
// ---------------------------------------------------------------------------
async function streamAnthropic(trimmed: ChatMessage[], apiKey: string): Promise<Response> {
  let upstream: Response | null = null;
  let lastError = "";
  for (let attempt = 0; attempt < MAX_UPSTREAM_ATTEMPTS; attempt++) {
    try {
      upstream = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: MAX_TOKENS,
          system: SYSTEM_PROMPT,
          messages: trimmed,
          stream: true,
        }),
      });
    } catch {
      lastError = "Could not reach the coach service.";
      await sleep(400 * (attempt + 1));
      continue;
    }
    if (upstream.ok) break;
    const status = upstream.status;
    const retryable = status === 429 || status === 529 || status >= 500;
    const detail = await upstream.text().catch(() => "");
    lastError = friendlyAnthropicError(status, detail);
    if (retryable && attempt < MAX_UPSTREAM_ATTEMPTS - 1) {
      const retryAfter = Number(upstream.headers.get("retry-after"));
      const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 500 * Math.pow(2, attempt);
      upstream = null;
      await sleep(Math.min(wait, 8000));
      continue;
    }
    upstream = null;
    break;
  }

  if (!upstream || !upstream.body) {
    return singleShot({ type: "error", error: lastError || "The coach is unavailable right now. Please try again." });
  }

  const source = upstream.body;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = source.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let emittedAny = false;
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let sep: number;
          while ((sep = buffer.indexOf("\n\n")) !== -1) {
            const frame = buffer.slice(0, sep);
            buffer = buffer.slice(sep + 2);
            for (const line of frame.split("\n")) {
              if (!line.startsWith("data:")) continue;
              const json = line.slice(5).trim();
              if (!json) continue;
              let evt: {
                type?: string;
                delta?: { type?: string; text?: string };
                error?: { message?: string };
              };
              try {
                evt = JSON.parse(json);
              } catch {
                continue;
              }
              if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta" && evt.delta.text) {
                emittedAny = true;
                controller.enqueue(sse({ type: "delta", text: evt.delta.text }));
              } else if (evt.type === "error") {
                controller.enqueue(sse({ type: "error", error: evt.error?.message || "Stream error." }));
              }
            }
          }
        }
        if (!emittedAny) {
          controller.enqueue(sse({ type: "error", error: "The coach returned an empty response. Please try again." }));
        }
        controller.enqueue(sse({ type: "done" }));
      } catch {
        controller.enqueue(sse({ type: "error", error: "The connection to the coach dropped. Please try again." }));
      } finally {
        reader.releaseLock();
        controller.close();
      }
    },
  });

  return sseResponse(stream);
}

function friendlyAnthropicError(status: number, detail: string): string {
  if (status === 401) return "The AI key in `.env.local` was rejected (401). Check ANTHROPIC_API_KEY and restart the server.";
  if (status === 403) return "This API key doesn't have access to the model (403).";
  if (status === 429) return "The coach is rate-limited right now — please wait a moment and retry.";
  if (status === 529 || status >= 500) return "The coach service is busy. Please try again in a moment.";
  const snippet = detail.slice(0, 160);
  return `Coach request failed (${status}).${snippet ? ` ${snippet}` : ""}`;
}
