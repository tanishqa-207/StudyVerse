"use client";

import { useState } from "react";
import Icon from "./Icon";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Record<string, string[]>>({});
  
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }, (_, i) => i); // Mon = 0
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 hover:bg-white/20 transition"><Icon name="chevron-left" size={16} /></button>
          <span className="text-[18px] font-bold w-40 text-center">{monthName}</span>
          <button onClick={nextMonth} className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 hover:bg-white/20 transition"><Icon name="chevron-right" size={16} /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-[12px] font-bold text-[var(--text-dim)] mb-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-2 flex-1 auto-rows-fr">
        {blanks.map(b => (
          <div key={`b-${b}`} className="rounded-xl bg-white/5 opacity-30" />
        ))}
        {days.map(d => {
          const dateKey = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
          const dayEvents = events[dateKey] || [];
          
          return (
            <div 
              key={d} 
              onClick={() => {
                const title = prompt(`Add event for ${monthName} ${d}:`);
                if (title) {
                  setEvents(prev => ({
                    ...prev,
                    [dateKey]: [...(prev[dateKey] || []), title]
                  }));
                }
              }}
              className="rounded-xl bg-white/10 p-2 flex flex-col items-start justify-start text-[14px] font-semibold text-white transition hover:bg-white/15 cursor-pointer relative overflow-hidden"
            >
              <span className="mb-1">{d}</span>
              <div className="flex flex-col gap-1 w-full flex-1 overflow-y-auto custom-scroll">
                {dayEvents.map((ev, i) => (
                  <div key={i} className="text-[9px] bg-[var(--violet)] text-white px-1.5 py-0.5 rounded-md truncate w-full" title={ev}>
                    {ev}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
