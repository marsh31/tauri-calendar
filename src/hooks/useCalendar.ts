import { useEffect, useMemo, useState, useReducer } from "react";
import type { Event } from "./types";
import { addEvent, deleteEvent, listEvents, updateEvent } from "../api/events";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function ymd(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toDatetimeLocal(v: string) {
  if (v.length >= 16) return v.slice(0, 16);
  return v;
}

type UiState = {
  viewMonth: Date;
  selectedDay: string;

  title: string;
  start: string;
  end: string;

  editingId: number | null;
  error: string | null;
}

type UiAction = 
  | { type: "prevMonth" }
  | { type: "nextMonth" }
  | { type: "pickDay"; day: string }
  | { type: "setTitle"; value: string }
  | { type: "setStart"; value: string }
  | { type: "setEnd"; value: string }
  | { type: "beginEdit"; event: Event }
  | { type: "cancelEdit" }
  | { type: "clearError" }
  | { type: "setError"; error: string }
  | { type: "afterSaveSuccess" };

function initUiState(): UiState {
  const now = new Date();
  const viewMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const day = ymd(now);

  return {
    viewMonth,
    selectedDay: day,
    title: "",
    start: `${day}T10:00`,
    end: `${day}T11:00`,
    editingId: null,
    error: null,
  }
}

function uiReducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case "prevMonth":
      return { ...state, viewMonth: new Date(state.viewMonth.getFullYear(), state.viewMonth.getMonth() - 1, 1) };

    case "nextMonth":
      return { ...state, viewMonth: new Date(state.viewMonth.getFullYear(), state.viewMonth.getMonth() + 1, 1) };

    case "pickDay": {
      const day = action.day;
      return {
        ...state,
        selectedDay: day,
        start: `${day}T10:00`,
        end: `${day}T11:00`,
        editingId: null,
        error: null,
      };
    }

    case "setTitle":
      return { ...state, title: action.value };

    case "setStart":
      return { ...state, start: action.value };

    case "setEnd":
      return { ...state, end: action.value };

    case "beginEdit":
      return {
        ...state,
        editingId: action.event.id,
        title: action.event.title,
        start: toDatetimeLocal(action.event.start),
        end: toDatetimeLocal(action.event.end),
        error: null,
      };

    case "cancelEdit":
      return {
        ...state,
        editingId: null,
        title: "",
        start: `${state.selectedDay}T10:00`,
        end: `${state.selectedDay}T11:00`,
        error: null,
      };

    case "clearError":
      return { ...state, error: null };

    case "setError":
      return { ...state, error: action.error };


    case "afterSaveSuccess":
      return { ...state, editingId: null, title: "", error: null };

    default: {
      const _exhaustive: never = action;
      return state;
    }
  }
}

export function useCalendar() {
  const [events, setEvents] = useState<Event[]>([]);
  const [ui, dispatch] = useReducer(uiReducer, undefined, initUiState);

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
    const arr = eventsByDay.get(ui.selectedDay) ?? [];
    return arr;
  }, [eventsByDay, ui.selectedDay]);

  async function refresh() {
    dispatch({ type: "clearError" });
    try {
      setEvents(await listEvents());
    } catch (e) {
      dispatch({ type: "setError", error: String(e) });
    }
  }

  async function del(id: number) {
    dispatch({ type: "clearError" });
    try {
      setEvents(await deleteEvent({ id }));
    } catch (e) {
      dispatch({ type: "setError", error: String(e) });
    }
  }

  async function save() {
    dispatch({ type: "clearError" });
    try {
      if (ui.editingId === null) {
        setEvents(await addEvent({ 
          title: ui.title,
          start: ui.start,
          end: ui.end 
        }));
        dispatch({ type: "afterSaveSuccess" });
        return ;
      }

      setEvents(await updateEvent({
        id: ui.editingId,
        title: ui.title,
        start: ui.start,
        end: ui.end
      }));
      setEditingId(null);
      dispatch({ type: "afterSaveSuccess" });

    } catch (e) {
      dispatch({ type: "setError", error: String(e) });
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return {
    // state
    state: {
      events,
      viewMonth: ui.viewMonth,
      selectedDay: ui.selectedDay,
      selectedEvents,

      title: ui.title,
      start: ui.start,
      end: ui.end,

      editingId: ui.editingId,
      error: ui.error,
    },

    actions: {
      prevMonth: () => dispatch({ type: "prevMonth" }),
      nextMonth: () => dispatch({ type: "nextMonth" }),
      pickDay: (day: string) => dispatch({ type: "pickDay", day }),
      setTitle: (s: string) => dispatch({ type: "setTitle", value: s}),
      setStart: (s: string) => dispatch({ type: "setStart", value: s}),
      setEnd: (s: string) => dispatch({ type: "setEnd", value: s }),
      beginEdit: (v: Event) => dispatch({ type: "beginEdit", value: v }),
      cancelEdit: () => dispatch({ type: "cancelEdit" }),

      refresh,
      del,
      save,
    },
  };
}


