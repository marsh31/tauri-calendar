// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
//

use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf, sync::Mutex};
use tauri::Manager;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Event {
    id: u64,
    title: String,
    start: String,
    end: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Persisted {
    next_id: u64,
    events: Vec<Event>,
}

struct AppState {
    file_path: PathBuf,
    events: Mutex<Vec<Event>>,
    next_id: Mutex<u64>,
}

#[tauri::command]
fn list_events(state: tauri::State<AppState>) -> Vec<Event> {
    state.events.lock().unwrap().clone()
}

fn load_from_file(file_path: &PathBuf) -> Persisted {
    let Ok(text) = fs::read_to_string(file_path) else {
        return Persisted {
            next_id: 1,
            events: vec![],
        };
    };

    serde_json::from_str::<Persisted>(&text).unwrap_or(Persisted {
        next_id: 1,
        events: vec![],
    })
}

fn save_to_file(file_path: &PathBuf, next_id: u64, events: &Vec<Event>) -> Result<(), String> {
    let data = Persisted {
        next_id,
        events: events.clone(),
    };

    let json = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
    fs::write(file_path, json).map_err(|e| e.to_string())
}

#[tauri::command]
fn add_event(
    title: String,
    start: String,
    end: String,
    state: tauri::State<AppState>,
) -> Result<Vec<Event>, String> {
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

    save_to_file(&state.file_path, *next_id, &events)?;
    Ok(events.clone())
}

#[tauri::command]
fn delete_event(id: u64, state: tauri::State<AppState>) -> Result<Vec<Event>, String> {
    let mut events = state.events.lock().unwrap();
    let next_id = state.next_id.lock().unwrap();

    let before = events.len();
    events.retain(|e| e.id != id);
    let after = events.len();

    save_to_file(&state.file_path, *next_id, &events)?;

    if before == after {
        return Err(format!("not found event id: {id}"));
    }

    Ok(events.clone())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let data_dir = app
                .path()
                .app_data_dir()
                .map_err(|e| format!("failed to get app_data_dir: {e}"))?;

            let _ = fs::create_dir_all(&data_dir)
                .map_err(|e| format!("failed to create data dir: {e}"));

            let file_path = data_dir.join("events.json");
            let persisted = load_from_file(&file_path);

            app.manage(AppState {
                file_path,
                events: Mutex::new(persisted.events),
                next_id: Mutex::new(persisted.next_id),
            });

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            list_events,
            add_event,
            delete_event
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
