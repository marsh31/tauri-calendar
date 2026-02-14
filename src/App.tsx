import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

type Event = {
  id: number;
  title: String;
  start: String;
  end: String;
};

function App() {
  const [events, setEvents] = useState<Event[]>([]);
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

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div style={{ padding: 16, fontFamily: "sans-serif" }}>
      <h1>tcal</h1>

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

      <h2>Events</h2>
      <ul>
        {events.map((e) => (
          <li key={e.id}>
            <b>{e.title}</b> ({e.start} → {e.end})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
