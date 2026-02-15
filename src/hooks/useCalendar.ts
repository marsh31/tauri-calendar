import { useEffect, useMemo, useState } from "react";
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

export function useCalendar() {
  const [events, setEvents] = useState<Event[]>([]);
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedDay, setSelectedDay] = useState<string> (() => ymd(new Date()));

  const [title,  setTitle]  = useState("");
  const [start,  setStart]  = useState("${selectedDay}T10:00");
  const [end,    setEnd]    = useState("${selectedDay}T11:00");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [error,  setError]  = useState<string, null>(null);

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
  }, [eventsByDay, selectedDay]);

  async function refresh() {
    setError(null);
    try {
      setEvents(await listEvents());
    } catch (e) {
      setError(String(e));
    }
  }

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
    setError(null);
  }

  function beginEdit(e: Event) {
    setEditingId(e.id);
    setTitle(e.title);
    setStart(toDatetimeLocal(e.start));
    setEnd(toDatetimeLocal(e.end));
    setError(null);
  }

  async function del(id: number) {
    setError(null);

    try {
      setEvents(await deleteEvent({ id }));
    } catch (e) {
      setError(String(e));
    }
  }

  async function save() {
    setError(null);
    try {
      if (editingId === null) {
        setEvents(await addEvent({ title, start, end }));
        setTitle("");
        return ;
      }

      setEvents(await updateEvent({ id: editingId, title, start, end }));
      setEditingId(null);
      setTitle("");

    } catch (e) {
      setError(String(e));
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setTitle("");
    setStart(`${selectedDay}T10:00`);
    setEnd(`${selectedDay}T11:00`);
    setError(null);
  }

  useEffect(() => {
    refresh();
  }, []);

  return {
    // state
    state: {
      events,
      viewMonth,
      selectedDay,
      selectedEvents,
      title,
      start,
      end,
      editingId,
      error,
    },

    actions: {
      setTitle,
      setStart,
      setEnd,
      refresh,
      prevMonth,
      nextMonth,
      pickDay,
      beginEdit,
      del,
      save,
      cancelEdit,
    },
  };
}


