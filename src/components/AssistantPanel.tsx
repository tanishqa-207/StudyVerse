"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "./Icon";
import Emblem from "./Emblem";
import { useAssistant } from "@/lib/assistantStore";

const QUICK_PROMPTS = [
  "Explain recursion",
  "Make me a 5-day study plan",
  "Tips to focus",
];

export default function AssistantPanel() {
  const { open, loading, streaming, messages, error, closePanel, reset, send, retry } =
    useAssistant();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view as content streams in.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const submit = () => {
    const text = input;
    if (!text.trim() || loading) return;
    setInput("");
    send(text);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 28, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="glass-strong fixed inset-x-3 bottom-3 z-[55] flex h-[72vh] max-h-[560px] flex-col overflow-hidden rounded-[26px] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[560px] sm:max-h-[calc(100vh-3rem)] sm:w-[404px]"
          style={{ boxShadow: "0 30px 80px -24px rgba(0,0,0,0.7), 0 0 40px -18px var(--glow-violet)" }}
        >
          {/* neon top accent */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, var(--violet-bright), transparent)" }}
          />

          {/* header */}
          <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5">
            <Emblem size={30} glow />
            <div className="min-w-0 flex-1 leading-tight">
              <div className="text-[15px] font-bold">StudyVerse Assistant</div>
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-faint)]">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-[var(--green)]"
                  style={{ boxShadow: "0 0 6px var(--green)" }}
                />
                {loading ? "Thinking…" : streaming ? "Typing…" : "Online · ask me anything"}
              </div>
            </div>
            <button
              onClick={reset}
              aria-label="Clear conversation"
              title="Clear conversation"
              className="grid h-8 w-8 place-items-center rounded-full bg-white/8 text-[var(--text-dim)] transition hover:bg-white/15 hover:text-white"
            >
              <Icon name="trash" size={15} />
            </button>
            <button
              onClick={closePanel}
              aria-label="Close assistant"
              className="grid h-8 w-8 place-items-center rounded-full bg-white/8 text-[var(--text-dim)] transition hover:bg-white/15 hover:text-white"
            >
              <Icon name="close" size={16} />
            </button>
          </div>

          {/* messages */}
          <div
            ref={scrollRef}
            className="scroll-slim flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-4 py-4"
          >
            {messages.length === 0 && !loading && (
              <div className="mt-6 flex flex-col items-center gap-2 text-center text-[var(--text-dim)]">
                <Emblem size={46} glow />
                <p className="mt-2 text-[14.5px] font-medium">
                  How can I help you study today?
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {QUICK_PROMPTS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-full bg-white/8 px-3 py-1.5 text-[12px] text-white transition hover:bg-white/16"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => {
              const isUser = m.role === "user";
              const isLast = i === messages.length - 1;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className="max-w-[85%] break-words rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed"
                    style={
                      isUser
                        ? {
                            background: "linear-gradient(135deg, var(--violet-bright), var(--violet-dark))",
                            color: "#fff",
                            borderBottomRightRadius: 6,
                            boxShadow: "0 8px 22px -10px var(--glow-violet)",
                          }
                        : {
                            background: "rgba(255,255,255,0.07)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            color: "var(--text)",
                            borderBottomLeftRadius: 6,
                          }
                    }
                  >
                    <MessageContent text={m.content} />
                    {streaming && isLast && !isUser && (
                      <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-pulse bg-[var(--violet-bright)] align-middle" />
                    )}
                  </div>
                </motion.div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl bg-white/8 px-4 py-3">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-2 w-2 rounded-full bg-[var(--violet-bright)]"
                      style={{ animation: `typing 1.2s ease-in-out ${i * 0.18}s infinite` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="flex flex-col gap-2 rounded-2xl bg-[#ff6a6a]/15 px-3.5 py-2.5 text-[12.5px] text-[#ffb3b3]">
                <span>{error}</span>
                <button
                  onClick={retry}
                  className="self-start rounded-full bg-white/10 px-3 py-1 text-[12px] font-semibold text-white transition hover:bg-white/20"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* input */}
          <div className="border-t border-white/10 p-3">
            <div className="glass flex items-end gap-2 rounded-2xl px-3 py-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                rows={1}
                placeholder="Ask a question…"
                className="max-h-24 min-h-[24px] w-full resize-none bg-transparent text-[14px] text-white placeholder:text-[var(--text-faint)] focus:outline-none"
              />
              <button
                onClick={submit}
                disabled={loading || !input.trim()}
                aria-label="Send"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white transition hover:brightness-110 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, var(--violet-bright), var(--violet-dark))" }}
              >
                <Icon name="send" size={17} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Lightweight, safe Markdown-ish renderer (no external deps, no HTML injection).
// Supports: fenced code blocks, inline `code`, **bold**, and bullet / numbered
// lines. Everything else renders as plain paragraphs with preserved breaks.
// ---------------------------------------------------------------------------
function MessageContent({ text }: { text: string }) {
  if (!text) return null;
  const blocks = text.split(/```/);

  return (
    <div className="space-y-1.5">
      {blocks.map((block, i) => {
        // Odd indices are fenced code blocks.
        if (i % 2 === 1) {
          const body = block.replace(/^[a-zA-Z0-9]*\n/, "");
          return (
            <pre
              key={i}
              className="scroll-slim my-1 overflow-x-auto rounded-xl bg-black/30 p-3 text-[12.5px] leading-relaxed"
            >
              <code className="font-mono text-[#d6e2ff]">{body.replace(/\n$/, "")}</code>
            </pre>
          );
        }
        const lines = block.split("\n");
        return (
          <Fragment key={i}>
            {lines.map((line, j) => {
              if (line.trim() === "") return null;
              const bullet = /^\s*[-*]\s+/.test(line);
              const numbered = /^\s*\d+\.\s+/.test(line);
              const content = line.replace(/^\s*(?:[-*]|\d+\.)\s+/, "");
              return (
                <div key={j} className={bullet || numbered ? "flex gap-2" : undefined}>
                  {(bullet || numbered) && (
                    <span className="mt-[2px] shrink-0 text-[var(--violet-bright)]">
                      {numbered ? `${line.match(/^\s*(\d+)\./)?.[1]}.` : "•"}
                    </span>
                  )}
                  <span>{renderInline(content)}</span>
                </div>
              );
            })}
          </Fragment>
        );
      })}
    </div>
  );
}

// Inline **bold** and `code`.
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-[12px] text-[#d6e2ff]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}
