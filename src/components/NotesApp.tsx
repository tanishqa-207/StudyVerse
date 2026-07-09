"use client";

// Notes system for the (unlocked) Memory Forest.
//
// A genuinely functional rich-text notebook: create / edit / delete notes,
// automatic debounced saving to local storage (persistent, scoped per profile),
// starter templates, and a formatting toolbar (font family + size, bold /
// italic / underline, text colours, and insertable shapes). Rich text is edited
// in a contentEditable surface driven by document.execCommand — deprecated but
// universally supported and exactly right for a self-contained editor with no
// dependencies.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Icon from "./Icon";
import { useActiveProfile } from "@/lib/store";
import { storage } from "@/lib/storage";

interface Note {
  id: string;
  title: string;
  html: string;
  updatedAt: number;
}

const FONTS = [
  { label: "Sans", value: "system-ui, sans-serif" },
  { label: "Serif", value: "Georgia, serif" },
  { label: "Mono", value: "ui-monospace, monospace" },
  { label: "Rounded", value: "'Comic Sans MS', 'Segoe UI', cursive" },
];

// execCommand fontSize uses legacy 1–7 buckets; label them in px for clarity.
const SIZES = [
  { label: "S", value: "2" },
  { label: "M", value: "3" },
  { label: "L", value: "5" },
  { label: "XL", value: "6" },
  { label: "XXL", value: "7" },
];

const COLORS = ["#f3f4ff", "#9a8bff", "#56b6f5", "#48d38a", "#f5b74a", "#f0803f", "#f472c9", "#ff6a6a"];

const TEMPLATES: { label: string; title: string; html: string }[] = [
  { label: "Blank", title: "Untitled note", html: "<p><br></p>" },
  {
    label: "Cornell Notes",
    title: "Cornell Notes",
    html:
      "<h3>Topic</h3><p><b>Cues / Questions</b></p><ul><li>…</li></ul>" +
      "<p><b>Notes</b></p><ul><li>…</li></ul><p><b>Summary</b></p><p>…</p>",
  },
  {
    label: "To-Do / Study Plan",
    title: "Study Plan",
    html:
      "<h3>Study Plan</h3><ul><li>☐ Review lecture notes</li>" +
      "<li>☐ Practice problems</li><li>☐ Flashcards</li><li>☐ Mock test</li></ul>",
  },
  {
    label: "Flashcards",
    title: "Flashcards",
    html:
      "<h3>Flashcards</h3><p><b>Q:</b> …</p><p><b>A:</b> …</p><hr><p><b>Q:</b> …</p><p><b>A:</b> …</p>",
  },
];

const SHAPES: { label: string; svg: string }[] = [
  { label: "▭", svg: '<svg width="46" height="30" style="vertical-align:middle;margin:0 4px"><rect x="2" y="2" width="42" height="26" rx="5" fill="#7c6cf5" opacity="0.85"/></svg>' },
  { label: "●", svg: '<svg width="30" height="30" style="vertical-align:middle;margin:0 4px"><circle cx="15" cy="15" r="13" fill="#56b6f5" opacity="0.85"/></svg>' },
  { label: "▲", svg: '<svg width="32" height="30" style="vertical-align:middle;margin:0 4px"><polygon points="16,2 30,28 2,28" fill="#48d38a" opacity="0.85"/></svg>' },
  { label: "★", svg: '<svg width="32" height="30" style="vertical-align:middle;margin:0 4px"><polygon points="16,2 20,12 31,12 22,19 25,29 16,23 7,29 10,19 1,12 12,12" fill="#f5b74a" opacity="0.9"/></svg>' },
  { label: "—", svg: '<svg width="60" height="14" style="vertical-align:middle;margin:0 4px"><line x1="2" y1="7" x2="58" y2="7" stroke="#f472c9" stroke-width="3" stroke-linecap="round"/></svg>' },
];

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `n_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export default function NotesApp() {
  const profile = useActiveProfile();
  const storeKey = profile ? `notes:${profile.id}` : "notes:anon";

  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = useMemo(() => notes.find((n) => n.id === activeId) ?? null, [notes, activeId]);

  // Load persisted notes for this profile once.
  useEffect(() => {
    const saved = storage.get<Note[]>(storeKey, []);
    if (saved.length === 0) {
      const seed: Note = {
        id: newId(),
        title: "Welcome to your Forest",
        html:
          "<h3>🌳 Memory Forest Notes</h3><p>This is your private notebook. " +
          "Use the toolbar to <b>bold</b>, <i>italicise</i> or <u>underline</u> text, " +
          "change fonts and colours, and drop in shapes. Everything saves automatically.</p>",
        updatedAt: Date.now(),
      };
      setNotes([seed]);
      setActiveId(seed.id);
    } else {
      setNotes(saved);
      setActiveId(saved[0].id);
    }
    setReady(true);
  }, [storeKey]);

  // Load the active note's HTML into the editor when switching notes.
  useEffect(() => {
    if (editorRef.current && active) editorRef.current.innerHTML = active.html;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, ready]);

  // Persist (debounced) whenever notes change — this is the auto-save.
  const persist = useCallback(
    (next: Note[]) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        storage.set(storeKey, next);
        setSavedAt(Date.now());
      }, 500);
    },
    [storeKey],
  );

  const updateActive = (patch: Partial<Note>) => {
    setNotes((prev) => {
      const next = prev.map((n) =>
        n.id === activeId ? { ...n, ...patch, updatedAt: Date.now() } : n,
      );
      persist(next);
      return next;
    });
  };

  const onEditorInput = () => {
    if (editorRef.current) updateActive({ html: editorRef.current.innerHTML });
  };

  const createNote = (template = TEMPLATES[0]) => {
    const note: Note = { id: newId(), title: template.title, html: template.html, updatedAt: Date.now() };
    setNotes((prev) => {
      const next = [note, ...prev];
      persist(next);
      return next;
    });
    setActiveId(note.id);
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== id);
      persist(next);
      if (id === activeId) setActiveId(next[0]?.id ?? null);
      return next;
    });
    setConfirmDelete(null);
  };

  // Run a rich-text command against the current selection without losing focus.
  const exec = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(command, false, value);
    onEditorInput();
  };

  const insertShape = (svg: string) => {
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, `${svg}&nbsp;`);
    onEditorInput();
  };

  const applyTemplate = (t: (typeof TEMPLATES)[number]) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand("insertHTML", false, t.html);
    onEditorInput();
  };

  if (!ready) {
    return <div className="grid h-40 place-items-center text-[var(--text-faint)]">Loading notes…</div>;
  }

  return (
    <div className="flex h-[62vh] max-h-[640px] flex-col gap-3 sm:flex-row">
      {/* --- note list --- */}
      <aside className="flex shrink-0 flex-col gap-2 sm:w-[190px]">
        <button
          onClick={() => createNote()}
          className="flex items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-[13px] font-semibold text-white transition hover:brightness-110"
          style={{ background: "linear-gradient(135deg, var(--violet-bright), var(--violet))" }}
        >
          <Icon name="plus" size={16} /> New note
        </button>
        <div className="scroll-slim flex max-h-24 flex-row gap-2 overflow-x-auto sm:max-h-none sm:flex-1 sm:flex-col sm:overflow-y-auto">
          {notes.map((n) => (
            <div
              key={n.id}
              className="group relative flex min-w-[150px] items-center rounded-xl transition sm:min-w-0"
              style={n.id === activeId ? { background: "rgba(124,108,245,0.22)" } : undefined}
            >
              <button
                onClick={() => setActiveId(n.id)}
                className="min-w-0 flex-1 rounded-xl px-3 py-2 text-left"
              >
                <div className="truncate text-[13px] font-semibold">{n.title || "Untitled"}</div>
                <div className="truncate text-[11px] text-[var(--text-faint)]">
                  {new Date(n.updatedAt).toLocaleDateString()} · {new Date(n.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </button>
              <button
                onClick={() => setConfirmDelete(n.id)}
                aria-label="Delete note"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[var(--text-faint)] transition hover:text-[#ff8a8a]"
              >
                <Icon name="trash" size={14} />
              </button>
            </div>
          ))}
          {notes.length === 0 && (
            <div className="rounded-xl px-3 py-4 text-center text-[12px] text-[var(--text-faint)]">
              No notes yet.
            </div>
          )}
        </div>
      </aside>

      {/* --- editor --- */}
      <div className="flex min-w-0 flex-1 flex-col rounded-2xl bg-white/[0.04] ring-1 ring-white/10">
        {active ? (
          <>
            <input
              value={active.title}
              onChange={(e) => updateActive({ title: e.target.value })}
              placeholder="Note title"
              className="w-full rounded-t-2xl bg-transparent px-4 pt-3 text-[17px] font-bold text-white placeholder:text-[var(--text-faint)] focus:outline-none"
            />

            <Toolbar exec={exec} insertShape={insertShape} applyTemplate={applyTemplate} />

            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={onEditorInput}
              className="notes-editor scroll-slim min-h-0 flex-1 overflow-y-auto px-4 py-3 text-[14px] leading-relaxed text-[var(--text)] focus:outline-none"
            />

            <div className="flex items-center justify-between border-t border-white/10 px-4 py-2 text-[11px] text-[var(--text-faint)]">
              <span className="flex items-center gap-1.5">
                <Icon name="check" size={13} className="text-[var(--green)]" />
                {savedAt ? `Saved ${new Date(savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Auto-saves as you type"}
              </span>
              <span>Rich text · persistent</span>
            </div>
          </>
        ) : (
          <div className="grid flex-1 place-items-center p-6 text-center text-[var(--text-faint)]">
            <div>
              <p className="mb-3 text-[14px]">No note selected.</p>
              <button
                onClick={() => createNote()}
                className="rounded-xl px-4 py-2 text-[13px] font-semibold text-white"
                style={{ background: "linear-gradient(135deg, var(--violet-bright), var(--violet))" }}
              >
                Create your first note
              </button>
            </div>
          </div>
        )}
      </div>

      {/* delete confirm */}
      {confirmDelete && (
        <div className="absolute inset-0 z-10 grid place-items-center rounded-[28px] bg-[#05071c]/70 p-6">
          <div className="glass-strong w-full max-w-[300px] rounded-2xl p-5 text-center">
            <p className="text-[15px] font-semibold">Delete this note?</p>
            <p className="mt-1 text-[12px] text-[var(--text-faint)]">This cannot be undone.</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => deleteNote(confirmDelete)}
                className="flex-1 rounded-xl px-4 py-2 text-[13px] font-semibold text-white"
                style={{ background: "linear-gradient(135deg,#f0603f,#c53a2a)" }}
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-xl bg-white/8 px-4 py-2 text-[13px] font-semibold text-[var(--text-dim)] transition hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- formatting toolbar ----
function Toolbar({
  exec,
  insertShape,
  applyTemplate,
}: {
  exec: (command: string, value?: string) => void;
  insertShape: (svg: string) => void;
  applyTemplate: (t: (typeof TEMPLATES)[number]) => void;
}) {
  // preventDefault on mousedown keeps the editor's text selection intact when a
  // toolbar control is clicked.
  const keep = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div
      onMouseDown={keep}
      className="scroll-slim flex flex-wrap items-center gap-1.5 overflow-x-auto border-y border-white/10 px-3 py-2"
    >
      <select
        onChange={(e) => exec("fontName", e.target.value)}
        className="rounded-lg bg-white/8 px-2 py-1.5 text-[12px] text-white focus:outline-none"
        aria-label="Font family"
        defaultValue={FONTS[0].value}
      >
        {FONTS.map((f) => (
          <option key={f.value} value={f.value} className="bg-[#141a45]">
            {f.label}
          </option>
        ))}
      </select>

      <select
        onChange={(e) => exec("fontSize", e.target.value)}
        className="rounded-lg bg-white/8 px-2 py-1.5 text-[12px] text-white focus:outline-none"
        aria-label="Font size"
        defaultValue="3"
      >
        {SIZES.map((s) => (
          <option key={s.value} value={s.value} className="bg-[#141a45]">
            {s.label}
          </option>
        ))}
      </select>

      <Divider />

      <TBtn label="B" title="Bold" onClick={() => exec("bold")} style={{ fontWeight: 800 }} />
      <TBtn label="I" title="Italic" onClick={() => exec("italic")} style={{ fontStyle: "italic" }} />
      <TBtn label="U" title="Underline" onClick={() => exec("underline")} style={{ textDecoration: "underline" }} />
      <TBtn label="• List" title="Bullet list" onClick={() => exec("insertUnorderedList")} />

      <Divider />

      {/* text colours */}
      <span className="grid h-7 w-7 place-items-center text-[var(--text-dim)]">
        <Icon name="palette" size={16} />
      </span>
      {COLORS.map((c) => (
        <button
          key={c}
          onClick={() => exec("foreColor", c)}
          title={`Colour ${c}`}
          aria-label={`Text colour ${c}`}
          className="h-6 w-6 shrink-0 rounded-full ring-1 ring-white/25 transition hover:scale-110"
          style={{ background: c }}
        />
      ))}

      <Divider />

      {/* shapes */}
      {SHAPES.map((s) => (
        <button
          key={s.label}
          onClick={() => insertShape(s.svg)}
          title={`Insert ${s.label}`}
          className="grid h-7 min-w-7 place-items-center rounded-lg bg-white/8 px-1.5 text-[14px] text-white transition hover:bg-white/15"
        >
          {s.label}
        </button>
      ))}

      <Divider />

      {/* templates */}
      <select
        onChange={(e) => {
          const t = TEMPLATES.find((x) => x.label === e.target.value);
          if (t) applyTemplate(t);
          e.target.selectedIndex = 0;
        }}
        className="rounded-lg bg-white/8 px-2 py-1.5 text-[12px] text-white focus:outline-none"
        aria-label="Insert template"
        defaultValue=""
      >
        <option value="" className="bg-[#141a45]">
          Templates
        </option>
        {TEMPLATES.map((t) => (
          <option key={t.label} value={t.label} className="bg-[#141a45]">
            {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TBtn({
  label,
  title,
  onClick,
  style,
}: {
  label: string;
  title: string;
  onClick: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="grid h-7 min-w-7 place-items-center rounded-lg bg-white/8 px-2 text-[13px] text-white transition hover:bg-white/15"
      style={style}
    >
      {label}
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px shrink-0 bg-white/12" />;
}
