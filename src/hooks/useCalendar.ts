import { useEffect, useMemo, useState, useReducer } from "react";
import type { Event, ValidationError } from "./types";
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

type Op = "refresh" | "save" | "delete";

type AppError = {
  op: Op;
  message: string;
  field?: "title" | "start" | "end";
  code?: string;
};

type UiState = {
  // data
  events: Event[];
  loading: boolean;
  error: AppError | null;

  // ui
  viewMonth: Date;
  selectedDay: string;

  title: string;
  start: string;
  end: string;

  editingId: number | null;
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
  | { type: "afterSaveSuccess" }
  | { type: "opStart"; op: Op }
  | { type: "opError"; op: Op; message: string; field?: "title" | "start" | "end"; code?: string }
  | { type: "opSuccess"; op: Op; events: Event[] };

function parseValidationError(raw: unknown): ValidationError | null {
  const s = String(raw);

  const idx = s.lastIndexOf("{");
  if (idx === -1) return null;

  const maybeJson = s.slice(idx);
  try {
    const obj = JSON.parse(maybeJson);
    if (obj && typeof obj.message === "string" && typeof obj.code === "string") {
      return obj as ValidationError;
    }

    return null;
  } catch {
    return null;
  }
}


function initState(): UiState {
  const now = new Date();
  const viewMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const day = ymd(now);

  return {
    events: [],
    loading: false,
    error: null,

    viewMonth,
    selectedDay: day,

    title: "",
    start: `${day}T10:00`,
    end: `${day}T11:00`,

    editingId: null,
  }
}

function reducer(state: UiState, action: UiAction): UiState {
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
        title: "",
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

    case "afterSaveSuccess":
      return { ...state, editingId: null, title: "", error: null };

    case "opStart":
      return { ...state, loading: true, error: null };

    case "opError":
      return { ...state, loading: false, error: { op: action.op, message: action.message, field: action.field, code: action.code } };

    case "opSuccess":
      return { ...state, loading: false, error: null, events: action.events };

    default: {
      const _exhaustive: never = action;
      return state;
    }
  }
}

export function useCalendar() {
  const [state, dispatch] = useReducer(reducer, undefined, initState);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const e of state.events) {
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
  }, [state.events]);

  const selectedEvents = useMemo(() => {
    const arr = eventsByDay.get(state.selectedDay) ?? [];
    return arr;
  }, [eventsByDay, state.selectedDay]);

  async function refresh() {
    dispatch({ type: "opStart", op: "refresh" });
    try {
      const events = await listEvents();
      dispatch({ type: "opSuccess", op: "refresh", events });
    } catch (e) {
      dispatch({ type: "opError", op: "refresh", message: String(e) });
    }
  }

  async function del(id: number) {
    dispatch({ type: "opStart", op: "delete" });
    try {
      const events = await deleteEvent({ id });
      dispatch({ type: "opSuccess", op: "delete", events });
    } catch (e) {
      dispatch({ type: "opError", op: "delete", message: String(e) });
    }
  }

  async function save() {
    dispatch({ type: "opStart", op: "save" });
    try {
      let events: Event[];

      if (state.editingId === null) {
        events = await addEvent({ 
          title: state.title,
          start: state.start,
          end: state.end 
        });
      } else {
        events = await updateEvent({
          id: state.editingId,
          title: state.title,
          start: state.start,
          end: state.end
        });
      }
      dispatch({ type: "opSuccess", op: "save", events });
      dispatch({ type: "afterSaveSuccess" });
    } catch (e) {
      const ve = parseValidationError(e);
      if (ve) {
        dispatch({ type: "opError", op: "save", message: ve.message, field: ve.field, code: ve.code });
      } else {
        dispatch({ type: "opError", op: "save", message: String(e) });
      }
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return {
    // state
    state: {
      ...state,
      selectedEvents,
    },

    actions: {
      prevMonth: () => dispatch({ type: "prevMonth" }),
      nextMonth: () => dispatch({ type: "nextMonth" }),
      pickDay: (day: string) => dispatch({ type: "pickDay", day }),
      setTitle: (s: string) => dispatch({ type: "setTitle", value: s}),
      setStart: (s: string) => dispatch({ type: "setStart", value: s}),
      setEnd: (s: string) => dispatch({ type: "setEnd", value: s }),
      beginEdit: (v: Event) => dispatch({ type: "beginEdit", event: v }),
      cancelEdit: () => dispatch({ type: "cancelEdit" }),

      refresh,
      del,
      save,
    },
  };
}


