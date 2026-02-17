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
  const { state, actions} = useCalendar();
  return (
    <div style={{ padding: 16, fontFamily: "sans-serif", maxWidth: 980 }}>
      <h1>tcal</h1>

      {/* 月ナビ */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <button onClick={actions.prevMonth}>◀</button>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{ymLabel(state.viewMonth)}</div>
        <button onClick={actions.nextMonth}>▶</button>
        <div style={{ marginLeft: "auto", opacity: 0.7 }}>
          stored: ~/.local/share/com.marsh.tcal/events.json
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, alignItems: "start" }}>
        {/* Left: カレンダー */}
        <CalendarGrid
          viewMonth={state.viewMonth}
          events={state.events}
          selectedDay={state.selectedDay}
          onPickDay={actions.pickDay}
        />

        {/* right: side panel */}
        <SidePanel
          selectedDay={state.selectedDay}
          events={state.selectedEvents}
          title={state.title}
          start={state.start}
          end={state.end}
          loading={state.loading}
          editingId={state.editingId}
          error={state.error}
          onChangeTitle={actions.setTitle}
          onChangeStart={actions.setStart}
          onChangeEnd={actions.setEnd}
          onBeginEdit={actions.beginEdit}
          onDelete={actions.del}
          onSave={actions.save}
          onCancelEdit={actions.cancelEdit}
          onRefresh={actions.refresh}
        />
      </div>
    </div>
  );
}

export default App;
