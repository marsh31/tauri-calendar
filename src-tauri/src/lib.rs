use chrono::NaiveDateTime;
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

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ValidationError {
    code: String,          //
    field: Option<String>, //
    message: String,       //
}

fn v_err(code: &str, field: Option<&str>, message: &str) -> ValidationError {
    ValidationError {
        code: code.to_string(),
        field: field.map(|s| s.to_string()),
        message: message.to_string(),
    }
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

fn parse_dt(field: &str, s: &str) -> Result<NaiveDateTime, ValidationError> {
    let formats = ["%Y-%m-%dT%H:%M", "%Y-%m-%dT%H:%M:%S"];
    for fmt in formats {
        if let Ok(dt) = NaiveDateTime::parse_from_str(s, fmt) {
            return Ok(dt);
        }
    }

    Err(v_err(
        "format",
        Some(field),
        "DateTime must be like YYYY-MM-DDTHH:mm",
    ))
}

fn validate_event_fields(
    title: &String,
    start: &String,
    end: &String,
) -> Result<(), ValidationError> {
    let title = title.trim();
    if title.is_empty() {
        return Err(v_err("required", Some("title"), "title is required"));
    }

    let start_dt = parse_dt("start", start)?;
    let end_dt = parse_dt("end", end)?;

    if start_dt > end_dt {
        return Err(v_err("range", Some("end"), "End must be after Start"));
    }

    Ok(())
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
    if let Err(ve) = validate_event_fields(&title, &start, &end) {
        return Err(serde_json::to_string(&ve).unwrap());
    }

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

#[tauri::command]
fn update_event(
    id: u64,
    title: String,
    start: String,
    end: String,
    state: tauri::State<AppState>,
) -> Result<Vec<Event>, String> {
    if let Err(ve) = validate_event_fields(&title, &start, &end) {
        return Err(serde_json::to_string(&ve).unwrap());
    }

    let mut events = state.events.lock().unwrap();
    let next_id = *state.next_id.lock().unwrap();

    let mut found = false;
    for e in events.iter_mut() {
        if e.id == id {
            e.title = title;
            e.start = start;
            e.end = end;
            found = true;
            break;
        }
    }

    if !found {
        return Err(format!("event not found: {id}"));
    }

    save_to_file(&state.file_path, next_id, &events)?;
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
            delete_event,
            update_event
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
