// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
//

use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Event {
    id: u64,
    title: String,
    start: String,
    end: String,
}

struct AppState {
    events: Mutex<Vec<Event>>,
    next_id: Mutex<u64>,
}

#[tauri::command]
fn list_events(state: tauri::State<AppState>) -> Vec<Event> {
    state.events.lock().unwrap().clone()
}

#[tauri::command]
fn add_event(
    title: String,
    start: String,
    end: String,
    state: tauri::State<AppState>,
) -> Vec<Event> {
    let mut events = state.events.lock().unwrap();
    let mut next_id = state.next_id.lock().unwrap();

    let ev = Event {
        id: *next_id,
        title: title,
        start: start,
        end: end,
    };
    *next_id += 1;

    events.push(ev);
    events.clone()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            events: Mutex::new(Vec::new()),
            next_id: Mutex::new(1),
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![list_events, add_event])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
