use crate::crypto;
use crate::models::PasswordEntry;
use std::sync::Mutex;
use tauri::State;
pub struct AppState {
    pub vault: Mutex<Option<Vec<PasswordEntry>>>,
}

#[tauri::command]
pub fn create_database(
    path: String,
    master_password: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let data = "[]";

    crypto::encrypt_and_save(&path, &master_password, data)?;

    *state.vault.lock().unwrap() = Some(Vec::new());

    Ok(())
}

#[tauri::command]
pub fn open_database(
    path: String,
    master_password: String,
    state: State<'_, AppState>,
) -> Result<Vec<PasswordEntry>, String> {
    let decrypted = crypto::decrypt_file(&path, &master_password)?;
    let parsed: Vec<PasswordEntry> =
        serde_json::from_str(&decrypted).map_err(|e| format!("Failed to parse data: {}", e))?;

    *state.vault.lock().unwrap() = Some(parsed.clone());

    Ok(parsed)
}

#[tauri::command]
pub fn save_database(
    path: String,
    master_password: String,
    entries: Vec<PasswordEntry>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let json_data =
        serde_json::to_string(&entries).map_err(|e| format!("Failed to serialize data: {}", e))?;

    crypto::encrypt_and_save(&path, &master_password, &json_data)?;

    *state.vault.lock().unwrap() = Some(entries);

    Ok(())
}

#[tauri::command]
pub fn lock_vault(state: State<'_, AppState>) -> Result<(), String> {
    *state.vault.lock().unwrap() = None;
    Ok(())
}
