"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "./Icon";
import Emblem from "./Emblem";
import { useAssistant } from "@/lib/assistantStore";

export default function AssistantPanel() {
  const { open, loading, messages, error, closePanel, reset, send } = useAssistant();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const submit = () => {
    const text = input;
    setInput("");
    send(text);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="glass-strong fixed bottom-6 right-6 z-[55] flex h-[540px] w-[400px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[26px]"
        >
          {/* header */}
          <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
            <Emblem size={30} glow />
            <div className="min-w-0 flex-1 leading-tight">
              <div className="text-[15px] font-bold">StudyVerse Assistant</div>
              <div className="text-[11px] text-[var(--text-faint)]">Ask me anything</div>
            </div>
            <button
              onClick={reset}
              aria-label="Clear conversation"
              className="grid h-8 w-8 place-items-center rounded-full bg-white/8 text-[var(--text-dim)] transition hover:text-white"
              title="Clear"
            >
              <Icon name="sparkle" size={16} />
            </button>
            <button
              onClick={closePanel}
              aria-label="Close assistant"
              className="grid h-8 w-8 place-items-center rounded-full bg-white/8 text-[var(--text-dim)] transition hover:text-white"
            >
              <Icon name="close" size={16} />
            </button>
          </div>

          {/* messages */}
          <div ref={scrollRef} className="scroll-slim flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && !loading && (
              <div className="mt-8 flex flex-col items-center gap-2 text-center text-[var(--text-dim)]">
                <Emblem size={44} glow />
                <p className="mt-2 text-[14px] font-medium">How can I help you study today?</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {["Explain recursion", "Weather in Tokyo", "Tips to focus"].map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-full bg-white/8 px-3 py-1.5 text-[12px] text-white transition hover:bg-white/15"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed"
                  style={
                    m.role === "user"
                      ? { background: "linear-gradient(135deg,#8a7bf0,#6355e6)", color: "#fff" }
                      : { background: "rgba(255,255,255,0.08)", color: "var(--text)" }
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}

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
              <div className="rounded-2xl bg-[#ff6a6a]/15 px-3.5 py-2.5 text-[12.5px] text-[#ffb3b3]">
                {error}
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
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white transition disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#8a7bf0,#6355e6)" }}
              >
                <Icon name="chevron-right" size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
