import { useMemo } from "react";
import type { Event } from "../types";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function ymd(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function ymLabel(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

function buildMonthGrid(view: Date): Date[] {
  const year = view.getFullYear();
  const month = view.getMonth()
  const first = new Date(year, month, 1);
  const startDow = first.getDay();
  const gridStart = new Date(year, month, 1 - startDow);

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }

  return days;
}

export function CalendarGrid(props: {
  viewMonth: Date;
  events: Event[];
  selectedDay: string;
  onPickDay: (day: string) => void;
}) {
  const { viewMonth, events, selectedDay, onPickDay } = props;
  
  const grid = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const e of events) {
      const day = e.start.slice(0, 10);
      const arr = map.get(day) ?? [];
      arr.push(e);
      map.set(day, arr);
    }

    for (const [day, arr] of map.entries()) {
      arr.sort((a, b) => a.start.localeCompare(b.start));
      map.set(day, arr);
    }

    return map;
  }, [events]);

  const viewYear = viewMonth.getFullYear();
  const viewMon  = viewMonth.getMonth();
  const dow = [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
      {dow.map((d) => (
        <div key={d} style={{ fontWeight: 700, padding: "6px 8px", opacity: 0.7 }}>
          {d}
        </div>
      ))}

      {grid.map((d) => {
        const inMonth = d.getMonth() === viewMon && d.getFullYear() === viewYear;
        const dayKey = ymd(d);

        const dayEvents = eventsByDay.get(dayKey) ?? [];
        const visible = dayEvents.slice(0, 2);
        const rest = dayEvents.length - visible.length;

        return (

          <button
            key={dayKey}
            onClick={() => onPickDay(dayKey)}
            style={{
              textAlign: "left",
              padding: 10,
              minHeight: 128,
              borderRadius: 8,
              border: "1px solid #ddd",
              background: inMonth ? "white" : "#f6f6f6",
              opacity: inMonth ? 1 : 0.6,
              cursor: "pointer",
            }}
            title={`Pick ${dayKey}`}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontWeight: 700 }}>{d.getDate()}</div>
              {dayEvents.length > 0 && (
                <div style={{ fontSize: 12, opacity: 0.8 }}>{dayEvents.length}</div>
              )}
            </div>

            <div style={{ marginTop: 6, display: "grid", gap: 4 }}>
              {visible.map((e) => (
                <div
                  key={e.id}
                  style={{
                    fontSize: 12,
                    border: "1px solid #eee",
                    borderRadius: 6,
                    padding: "2px 6px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={`${e.title} (${e.start} → ${e.end})`}
                >
                  {e.title}
                </div>
              ))}

              {rest > 0 && (
                <div style={{ fontSize: 12, opacity: 0.8 }}>+{rest}</div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
