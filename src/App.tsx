import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Event } from "./types";
import { CalendarGrid } from "./components/CalendarGrid";
import { SidePanel } from "./components/SidePanel";
import "./App.css";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function ymd(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function ymLabel(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

function toDatetimeLocal(v: string) {
  if (v.length >= 16) return v.slice(0, 16);
  return v;
}

function App() {

  const [selectedDay, setSelectedDay] = useState<string> (() => {
    const now = new Date();
    return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  });

  const [editingId, setEditingId] = useState<number | null>(null);

  const [events, setEvents] = useState<Event[]>([]);

  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [title,  setTitle]  = useState("");
  const [start,  setStart]  = useState("${selectedDay}T10:00");
  const [end,    setEnd]    = useState("${selectedDay}T11:00");

  const [error,  setError]  = useState<string, null>(null);

  async function refresh() {
    const list = await invoke<Event[]>("list_events");
    setEvents(list);
  }

  async function save() {
    setError(null);

    try {
      if (editingId === null) {
        const list = await invoke<Event[]>("add_event", { title, start, end });
        setEvents(list);
        setTitle("");
        return ;
      }

      const list = await invoke<Event[]>("update_event", {
        id: editingId,
        title,
        start,
        end,
      });

      setEvents(list);
      setEditingId(null);
      setTitle("");

    } catch (e) {
      setError(String(e));
    }
  }

  async function del(id: number) {
    const list = await invoke<Event[]>("delete_event", { id });
    setEvents(list);
  }

  function beginEdit(e: Event) {
    setEditingId(e.id);
    setTitle(e.title);
    setStart(toDatetimeLocal(e.start));
    setEnd(toDatetimeLocal(e.end));
  }

  function cancelEdit() {
    setEditingId(null);
    setTitle("");
  }

  useEffect(() => {
    refresh();
  }, []);

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

  const selectedEvents = useMemo(() => {
    const arr = eventsByDay.get(selectedDay) ?? [];
    return arr;
  });

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
    setSelectedDay(day);
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

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, alignItems: "start" }}>
        {/* Left: カレンダー */}
        <CalendarGrid
          viewMonth={viewMonth}
          events={events}
          selectedDay={selectedDay}
          onPickDay={pickDay}
        />

        {/* right: side panel */}
        <SidePanel
          selectedDay={selectedDay}
          events={selectedEvents}
          title={title}
          start={start}
          end={end}
          editingId={editingId}
          error={error}
          onChangeTitle={setTitle}
          onChangeStart={setStart}
          onChangeEnd={setEnd}
          onBeginEdit={beginEdit}
          onDelete={del}
          onSave={save}
          onCancelEdit={cancelEdit}
          onRefresh={refresh}
        />
      </div>
    </div>
  );
}

export default App;
