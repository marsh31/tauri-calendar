import { useEffect, useMemo, useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

type Event = {
  id: number;
  title: String;
  start: String;
  end: String;
};

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

function App() {
  const [events, setEvents] = useState<Event[]>([]);

  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [title,  setTitle]  = useState("");
  const [start,  setStart]  = useState("2026-02-14T10:00");
  const [end,    setEnd]    = useState("2026-02-14T11:00");

  async function refresh() {
    const list = await invoke<Event[]>("list_events");
    setEvents(list);
  }

  async function add() {
    const list = await invoke<Event[]>("add_event", { title, start, end });
    setEvents(list);
    setTitle("");
  }

  async function del(id: number) {
    const list = await invoke<Event[]>("delete_event", { id });
    setEvents(list);
  }

  useEffect(() => {
    refresh();
  }, []);

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

  function prevMonth() {
    setViewMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  function nextMonth() {
    setViewMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  function pickDay(d: Date) {
    const day = ymd(d);
    setStart(`${day}T10:00`);
    setEnd(`${day}T11:00`);
  }

  return (
    <div style={{ padding: 16, fontFamily: "sans-serif", maxWidth: 980 }}>
      <h1>tcal</h1>

      {/* 月ナビ */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <button onClick={prevMonth}>◀</button>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{ymLabel(viewMonth)}</div>
        <button onClick={nextMonth}>▶</button>
        <div style={{ marginLeft: "auto", opacity: 0.7 }}>
          stored: ~/.local/share/com.marsh.tcal/events.json
        </div>
      </div>

      {/* カレンダー */}
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
              onClick={() => pickDay(d)}
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

      <hr style={{ margin: "16px 0" }} />

      {/* 追加フォーム */}
      <div style={{ display: "grid", gap: 8, maxWidth: 520 }}>
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%" }} />
        </label>
        <label>
          Start
          <input value={start} onChange={(e) => setStart(e.target.value)} style={{ width: "100%" }} />
        </label>
        <label>
          End
          <input value={end} onChange={(e) => setEnd(e.target.value)} style={{ width: "100%" }} />
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={add} disabled={!title.trim()}>
            Add
          </button>
          <button onClick={refresh}>Refresh</button>
        </div>
      </div>

      <hr style={{ margin: "16px 0" }} />

      {/* 一覧（デバッグ用に残す） */}
      <h2>Events</h2>
      <ul>
        {events.map((e) => (
          <li key={e.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span>
              <b>{e.title}</b> ({e.start} → {e.end})
            </span>
            <button onClick={() => del(e.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
