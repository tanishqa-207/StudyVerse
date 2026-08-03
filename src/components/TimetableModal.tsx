"use client";

import { useState } from "react";
import Icon from "./Icon";
import Modal from "./Modal";
import { useStore, useTimetable, type TimetableEntry } from "@/lib/store";
import { useUI } from "@/lib/uiStore";

export default function TimetableModal() {
  const open = useUI((s) => s.modal === "timetable");
  const closeModal = useUI((s) => s.closeModal);

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const timetable = useTimetable();
  const entries = timetable[selectedDate] || [];
  const sortedEntries = [...entries].sort((a, b) => a.startTime.localeCompare(b.startTime));

  const addTimetableEntry = useStore((s) => s.addTimetableEntry);
  const updateTimetableEntry = useStore((s) => s.updateTimetableEntry);
  const deleteTimetableEntry = useStore((s) => s.deleteTimetableEntry);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ startTime: "09:00", endTime: "10:00", subject: "", location: "" });

  const resetForm = () => {
    setForm({ startTime: "09:00", endTime: "10:00", subject: "", location: "" });
    setEditingId(null);
  };

  const startEdit = (e: TimetableEntry) => {
    setForm({ startTime: e.startTime, endTime: e.endTime, subject: e.subject, location: e.location || "" });
    setEditingId(e.id);
  };

  const handleSave = () => {
    if (!form.subject.trim()) return;
    if (editingId) {
      updateTimetableEntry(selectedDate, editingId, form);
    } else {
      addTimetableEntry(selectedDate, form);
    }
    resetForm();
  };

  const datePicker = (
    <input 
      type="date" 
      value={selectedDate}
      onChange={(e) => {
        if (e.target.value) {
          setSelectedDate(e.target.value);
          resetForm();
        }
      }}
      className="glass rounded-xl px-4 py-2 text-[14px] font-semibold text-white focus:outline-none h-[40px]"
      style={{ colorScheme: "dark" }}
    />
  );

  return (
    <Modal 
      open={open} 
      onClose={closeModal} 
      title="Timetable" 
      subtitle="Plan your day effectively" 
      width={720}
      headerAction={datePicker}
    >
      <div className="flex gap-5 min-h-[360px]">
        
        {/* Form Panel (Left) */}
        <div className="glass flex flex-col gap-4 rounded-2xl p-5 border border-white/5 w-[300px] shrink-0">
          <div className="text-[13px] font-bold text-[var(--violet-bright)] uppercase tracking-wider">
            {editingId ? "Edit Entry" : "New Entry"}
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[11px] text-[var(--text-faint)] ml-1 mb-1 block">Start</label>
              <input type="time" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} className="w-full glass rounded-xl px-3 py-2 text-[14px]" style={{ colorScheme: "dark" }} />
            </div>
            <div className="flex-1">
              <label className="text-[11px] text-[var(--text-faint)] ml-1 mb-1 block">End</label>
              <input type="time" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} className="w-full glass rounded-xl px-3 py-2 text-[14px]" style={{ colorScheme: "dark" }} />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-[var(--text-faint)] ml-1 mb-1 block">Subject / Task</label>
            <input placeholder="e.g. Mathematics" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="w-full glass rounded-xl px-4 py-2.5 text-[14px] placeholder:text-white/30" />
          </div>
          <div>
            <label className="text-[11px] text-[var(--text-faint)] ml-1 mb-1 block">Location (Optional)</label>
            <input placeholder="e.g. Library" value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="w-full glass rounded-xl px-4 py-2.5 text-[14px] placeholder:text-white/30" />
          </div>
          
          <div className="flex gap-2 mt-auto pt-2">
            <button onClick={handleSave} disabled={!form.subject.trim()} className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold text-white transition disabled:opacity-40" style={{ background: "linear-gradient(135deg, var(--violet-bright), var(--violet-dark))" }}>
              {editingId ? "Save Changes" : "Add Entry"}
            </button>
            {editingId && (
              <button onClick={resetForm} className="rounded-xl px-4 py-2.5 bg-white/10 text-[13px] font-semibold text-[var(--text-dim)] hover:text-white transition">Cancel</button>
            )}
          </div>
        </div>

        {/* Entries List (Right) */}
        <div className="flex-1 glass rounded-2xl p-5 flex flex-col gap-3 h-[360px] overflow-y-auto custom-scroll">
          <h3 className="text-[14px] font-semibold text-white mb-2">Schedule for {selectedDate}</h3>
          
          {sortedEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-faint)] opacity-60">
              <Icon name="clock" size={40} className="mb-3" />
              <span className="text-[14px]">No entries scheduled.</span>
            </div>
          ) : (
            sortedEntries.map((e) => (
              <div key={e.id} className="glass flex items-center justify-between rounded-xl p-4 border-l-[3px] border-[var(--violet-bright)] transition hover:bg-white/5 shrink-0">
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-bold text-white truncate mb-1">{e.subject}</div>
                  <div className="text-[13px] text-[var(--text-dim)] flex items-center gap-3">
                    <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-[12px]">{e.startTime} - {e.endTime}</span>
                    {e.location && (
                      <span className="truncate flex items-center gap-1.5"><Icon name="map-pin" size={13} className="opacity-70" /> {e.location}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <button onClick={() => startEdit(e)} className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 hover:bg-white/10 transition text-[var(--text-dim)] hover:text-white">
                    <Icon name="pencil" size={15} />
                  </button>
                  <button onClick={() => deleteTimetableEntry(selectedDate, e.id)} className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 hover:bg-[#ff8a8a]/20 transition text-[var(--text-dim)] hover:text-[#ff8a8a]">
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </Modal>
  );
}
