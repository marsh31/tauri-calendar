import { invoke } from "@tauri-apps/api/core";
import type { Event } from "../type";

export async function listEvents(): Promise<Event[]> {
  return await invoke<Event[]>("list_events");
}

export async function addEvent(args: {
  title: string;
  start: string;
  end: string;
}): Promise<Event[]> {
  return await invoke<Event[]>("add_event", args);
}

export async function updateEvent(args: {
  id: number;
  title: string;
  start: string;
  end: string;
}): Promise<Event[]> {
  return await invoke<Event[]>("update_event", args);
}

export async function deleteEvent(args: { id: number }): Promise<Event[]> {
  return await invoke<Event[]>("delete_event", args);
}
