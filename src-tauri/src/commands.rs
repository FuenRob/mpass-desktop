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
    create_database_impl(path, master_password, &state)
}

pub fn create_database_impl(
    path: String,
    master_password: String,
    state: &AppState,
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
    open_database_impl(path, master_password, &state)
}

pub fn open_database_impl(
    path: String,
    master_password: String,
    state: &AppState,
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
    save_database_impl(path, master_password, entries, &state)
}

pub fn save_database_impl(
    path: String,
    master_password: String,
    entries: Vec<PasswordEntry>,
    state: &AppState,
) -> Result<(), String> {
    let json_data =
        serde_json::to_string(&entries).map_err(|e| format!("Failed to serialize data: {}", e))?;

    crypto::encrypt_and_save(&path, &master_password, &json_data)?;

    *state.vault.lock().unwrap() = Some(entries);
    Ok(())
}

#[tauri::command]
pub fn lock_vault(state: State<'_, AppState>) -> Result<(), String> {
    lock_vault_impl(&state)
}

pub fn lock_vault_impl(state: &AppState) -> Result<(), String> {
    *state.vault.lock().unwrap() = None;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;

    fn get_temp_path(filename: &str) -> PathBuf {
        let mut path = std::env::temp_dir();
        path.push(filename);
        path
    }

    fn create_test_state() -> AppState {
        AppState {
            vault: Mutex::new(None),
        }
    }

    #[test]
    fn test_create_database() {
        let path = get_temp_path("test_cmd_create.txt");
        let password = "test_password".to_string();
        let state = create_test_state();

        let res = create_database_impl(path.to_str().unwrap().to_string(), password, &state);
        assert!(res.is_ok());

        // View memory state
        let vault_state = state.vault.lock().unwrap();
        assert!(vault_state.is_some());
        assert!(vault_state.as_ref().unwrap().is_empty());

        let _ = fs::remove_file(path);
    }

    #[test]
    fn test_open_database() {
        let path = get_temp_path("test_cmd_open.txt");
        let password = "test_password".to_string();
        let state1 = create_test_state();

        // Create first
        create_database_impl(path.to_str().unwrap().to_string(), password.clone(), &state1).unwrap();

        // Open in a new state
        let state2 = create_test_state();
        let res = open_database_impl(path.to_str().unwrap().to_string(), password, &state2);
        
        assert!(res.is_ok());
        let entries = res.unwrap();
        assert!(entries.is_empty());

        let vault_state = state2.vault.lock().unwrap();
        assert!(vault_state.is_some());

        let _ = fs::remove_file(path);
    }

    #[test]
    fn test_save_database() {
        let path = get_temp_path("test_cmd_save.txt");
        let password = "test_password".to_string();
        let state = create_test_state();

        create_database_impl(path.to_str().unwrap().to_string(), password.clone(), &state).unwrap();

        let entries = vec![
            PasswordEntry {
                id: "1".to_string(),
                name: "Test".to_string(),
                url: "test.com".to_string(),
                username: "user".to_string(),
                password: "123".to_string(),
                notes: "".to_string(),
            }
        ];

        let save_res = save_database_impl(path.to_str().unwrap().to_string(), password.clone(), entries.clone(), &state);
        assert!(save_res.is_ok());

        // Verify memory was updated
        let vault_state = state.vault.lock().unwrap();
        assert_eq!(vault_state.as_ref().unwrap().len(), 1);
        drop(vault_state); // release lock

        // Verify file was updated by opening with a new state
        let state2 = create_test_state();
        let open_res = open_database_impl(path.to_str().unwrap().to_string(), password, &state2).unwrap();
        assert_eq!(open_res.len(), 1);
        assert_eq!(open_res[0].name, "Test");

        let _ = fs::remove_file(path);
    }

    #[test]
    fn test_lock_vault() {
        let state = create_test_state();
        *state.vault.lock().unwrap() = Some(vec![]);

        let res = lock_vault_impl(&state);
        assert!(res.is_ok());

        let vault_state = state.vault.lock().unwrap();
        assert!(vault_state.is_none());
    }
}
