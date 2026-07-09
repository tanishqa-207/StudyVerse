// AI Study Coach endpoint — powers the in-dashboard assistant + search bar.
// Uses the Anthropic Messages API over HTTPS (no SDK dependency). The API key
// is read from ANTHROPIC_API_KEY and never exposed to the client.
//
// When no key is configured, study-plan requests are still answered with a
// locally-generated plan so the coach is useful out of the box; other questions
// return a friendly "configure a key" message.

import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT =
  "You are StudyVerse Coach, a friendly, motivating study companion embedded in a gamified study dashboard. " +
  "You help learners plan and stick to their studies. You do two things well:\n" +
  "1. STUDY PLANS: When asked to plan, prepare for an exam, or learn a topic, produce a clear, actionable study plan. " +
  "Use Markdown: a short intro line, then a day-by-day or session-by-session breakdown as a list, each item with a focus, " +
  "a concrete task, and a suggested duration (e.g. two 25-min focus sessions). End with one short motivational line.\n" +
  "2. Q&A: Answer questions on any topic — programming, science, math, study techniques, and more — concisely and clearly.\n" +
  "Prefer short paragraphs, bullet lists, and fenced code blocks when they help. Lead with the answer.";

export async function POST(req: Request) {
  let messages: ChatMessage[];
  try {
    const body = await req.json();
    messages = Array.isArray(body?.messages) ? body.messages : [];
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const trimmed = messages
    .filter((m) => (m.role === "user" || m.role === "assistant") && m.content?.trim())
    .slice(-20) // keep the last few turns
    .map((m) => ({ role: m.role, content: m.content }));

  if (trimmed.length === 0) {
    return NextResponse.json({ error: "No message provided." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const lastUser = [...trimmed].reverse().find((m) => m.role === "user")?.content ?? "";

  // No key → still be useful for the headline feature (study plans).
  if (!apiKey) {
    const plan = tryLocalStudyPlan(lastUser);
    if (plan) return NextResponse.json({ text: plan }, { status: 200 });
    return NextResponse.json(
      {
        text:
          "I can generate a **study plan** for you right now — try “Make me a 5-day plan to learn calculus” or “Plan my week for a biology exam”.\n\n" +
          "For open-ended questions, add an `ANTHROPIC_API_KEY` to enable full AI answers.",
      },
      { status: 200 },
    );
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-8",
        max_tokens: 1200,
        system: SYSTEM_PROMPT,
        messages: trimmed,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      // Fall back to a local plan rather than a dead end when possible.
      const plan = tryLocalStudyPlan(lastUser);
      if (plan) return NextResponse.json({ text: plan }, { status: 200 });
      return NextResponse.json(
        { error: `Coach request failed (${res.status}). ${detail.slice(0, 200)}` },
        { status: 200 },
      );
    }

    const data = await res.json();
    const text = Array.isArray(data?.content)
      ? data.content
          .filter((b: { type: string }) => b.type === "text")
          .map((b: { text: string }) => b.text)
          .join("\n")
          .trim()
      : "";

    return NextResponse.json({ text: text || "(no response)" }, { status: 200 });
  } catch {
    const plan = tryLocalStudyPlan(lastUser);
    if (plan) return NextResponse.json({ text: plan }, { status: 200 });
    return NextResponse.json(
      { error: "Could not reach the coach service." },
      { status: 200 },
    );
  }
}

// ---------------------------------------------------------------------------
// Offline study-plan generator — deterministic, no network needed.
// Recognises phrasing like "plan", "study", "learn", "prepare", "exam".
// ---------------------------------------------------------------------------
function tryLocalStudyPlan(query: string): string | null {
  const q = query.toLowerCase();
  const isPlan = /\b(plan|schedule|prepare|prep|study|learn|revise|revision|exam|roadmap)\b/.test(q);
  if (!isPlan) return null;

  const days = extractDays(q);
  const topic = extractTopic(query) || "your subject";

  const focusAreas = [
    "Foundations & key concepts",
    "Core techniques and worked examples",
    "Practice problems (active recall)",
    "Weak spots — revisit what felt hard",
    "Mixed practice + timed drills",
    "Past papers / mock test",
    "Final review & spaced repetition",
  ];

  const lines: string[] = [];
  lines.push(`Here's a **${days}-day plan to study ${topic}** 📚`);
  lines.push("");
  for (let i = 0; i < days; i++) {
    const focus = focusAreas[Math.min(i, focusAreas.length - 1)];
    const sessions = i === days - 1 ? "1 review session" : "two 25-min focus sessions";
    lines.push(
      `- **Day ${i + 1} — ${focus}:** ${sessions}. ` +
        `Start a Focus Session, then jot 3 things you learned.`,
    );
  }
  lines.push("");
  lines.push("Tip: earn XP by completing each Focus Session — small daily wins keep your streak alive. You've got this! 🔥");
  return lines.join("\n");
}

function extractDays(q: string): number {
  const m = q.match(/(\d+)\s*(?:-|\s)?\s*day/);
  if (m) return Math.max(1, Math.min(14, parseInt(m[1], 10)));
  if (/\bweek\b/.test(q)) return 7;
  if (/\bweekend\b/.test(q)) return 2;
  return 5;
}

function extractTopic(query: string): string | null {
  // Grab the phrase after common lead-ins: "learn X", "study X", "plan for X".
  const m = query.match(
    /(?:learn|study|revise|master|prepare\s+for|prep\s+for|plan\s+for|about|on|for)\s+(.+?)(?:\s+(?:in|over|for|by|this|next|exam|test)\b.*)?[.?!]?$/i,
  );
  if (m && m[1]) {
    const topic = m[1].trim().replace(/\bmy\b\s*/i, "").replace(/[.?!]+$/, "");
    if (topic.length > 1 && topic.length < 60) return topic;
  }
  return null;
}
