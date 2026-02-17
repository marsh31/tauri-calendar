import type { Event } from "../types";


export function SidePanel(props: {
  selectedDay: string;
  events: Event[];
  title: string;
  start: string;
  end: string;
  loading: boolean;
  editingId: number | null;
  error: string | null;

  onChangeTitle: (v: stirng) => void;
  onChangeStart: (v: stirng) => void;
  onChangeEnd: (v: stirng) => void;

  onBeginEdit: (e: Event) => void;
  onDelete: (id: number) => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onRefresh: () => void;
}) {
  const {
    selectedDay,
    events,
    title,
    start,
    end,
    loading,
    editingId,
    error,
    onChangeTitle,
    onChangeStart,
    onChangeEnd,
    onBeginEdit,
    onDelete,
    onSave,
    onCancelEdit,
    onRefresh,
  } = props;

  const titleError = error?.op === "save" && error?.field === "title";
  const startError = error?.op === "save" && error?.field === "start";
  const endError = error?.op === "save" && error?.field === "end";

  return (
    <div 
      style={{
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 12,
        position: "sticky",
        top: 12,
        background: "white",
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>
        {selectedDay}
      </div>

      <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
        {events.length === 0 ? (
          <div style={{ opacity: 0.7 }}>No events</div>
        ) : (
          events.map((e) => (
            <div
              key={e.id}
              style={{
                border: "1px solid #eee",
                borderRadius: 12,
                padding: 12,
                position: "sticky",
                top: 12,
                background: "white",
              }}
            >
              <div style={{ fontWeight: 800 }}>{e.title}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                {e.start.slice(11,16)} → {e.end.slice(11,16)}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => onBeginEdit(e)} style={{ justifySelf: "start" }} disabled={loading}>
                  Edit
                </button>
                <button onClick={() => onDelete(e.id)} style={{ justifySelf: "start" }} disabled={loading}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <hr style={{ margin: "12px 0" }} />

      {/* 追加フォーム */}
      <div style={{ display: "grid", gap: 8 }}>
        {error && (
          <div style={{ borderr: "1px solid #f3c", padding: 8, borderRadius: 8, marginBottom: 8 }}>
            <b>{error.op}</b>: {error.message}
          </div>
        )}
        <label>
          Title
          <input 
            value={title}
            onChange={(e) => onChangeTitle(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: titleError ? "2px solid crimson" : "1px solid #ccc",
              borderRadius: 6,
              padding: "6px 8px"
            }}
          />
          {titleError && (
            <div style={{ fontSize: 12, opacity: 0.8 }}>{error?.message}</div>
          )}
        </label>
        <label>
          Start
          <input 
            type="datetime-local"
            value={start}
            onChange={(e) => onChangeStart(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: startError ? "2px solid crimson" : "1px solid #ccc",
              borderRadius: 6,
              padding: "6px 8px"
            }}
          />
          {startError && (
            <div style={{ fontSize: 12, opacity: 0.8 }}>{error?.message}</div>
          )}
        </label>
        <label>
          End
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => onChangeEnd(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: endError ? "2px solid crimson" : "1px solid #ccc",
              borderRadius: 6,
              padding: "6px 8px"
            }}
          />
          {endError && (
            <div style={{ fontSize: 12, opacity: 0.8 }}>{error?.message}</div>
          )}
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onSave} disabled={loading}>
            {editingId === null ? "Add" : "Save"}
          </button>

          {editingId !== null && (
            <button onClick={onCancelEdit} disabled={loading}>Cancel</button>
          )}

          <button onClick={onRefresh} disabled={loading}>Refresh</button>
        </div>
      </div>
    </div>
  );
}


