import { CalendarGrid } from "./components/CalendarGrid";
import { SidePanel } from "./components/SidePanel";
import { useCalendar } from "./hooks/useCalendar";
import "./App.css";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function ymLabel(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

function App() {
  const cal = useCalendar();
  return (
    <div style={{ padding: 16, fontFamily: "sans-serif", maxWidth: 980 }}>
      <h1>tcal</h1>

      {/* 月ナビ */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <button onClick={cal.prevMonth}>◀</button>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{ymLabel(cal.viewMonth)}</div>
        <button onClick={cal.nextMonth}>▶</button>
        <div style={{ marginLeft: "auto", opacity: 0.7 }}>
          stored: ~/.local/share/com.marsh.tcal/events.json
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, alignItems: "start" }}>
        {/* Left: カレンダー */}
        <CalendarGrid
          viewMonth={cal.viewMonth}
          events={cal.events}
          selectedDay={cal.selectedDay}
          onPickDay={cal.pickDay}
        />

        {/* right: side panel */}
        <SidePanel
          selectedDay={cal.selectedDay}
          events={cal.selectedEvents}
          title={cal.title}
          start={cal.start}
          end={cal.end}
          editingId={cal.editingId}
          error={cal.error}
          onChangeTitle={cal.setTitle}
          onChangeStart={cal.setStart}
          onChangeEnd={cal.setEnd}
          onBeginEdit={cal.beginEdit}
          onDelete={cal.del}
          onSave={cal.save}
          onCancelEdit={cal.cancelEdit}
          onRefresh={cal.refresh}
        />
      </div>
    </div>
  );
}

export default App;
