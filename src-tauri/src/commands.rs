use crate::crypto::{self, CryptoContext};
use crate::models::{PasswordEntry, VaultData};
use std::sync::Mutex;
use tauri::State;
use zeroize::Zeroizing;

pub struct AppState {
    pub vault: Mutex<Option<VaultData>>,
    pub crypto_ctx: Mutex<Option<CryptoContext>>,
}

fn lock_vault_state(
    state: &AppState,
) -> Result<std::sync::MutexGuard<'_, Option<VaultData>>, String> {
    state
        .vault
        .lock()
        .map_err(|_| "Vault state is unavailable".to_string())
}

fn lock_crypto_state(
    state: &AppState,
) -> Result<std::sync::MutexGuard<'_, Option<CryptoContext>>, String> {
    state
        .crypto_ctx
        .lock()
        .map_err(|_| "Crypto state is unavailable".to_string())
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
    let master_password = Zeroizing::new(master_password);
    let data = VaultData {
        folders: Vec::new(),
        entries: Vec::new(),
    };
    let json_data = Zeroizing::new(
        serde_json::to_string(&data).map_err(|e| format!("Failed to serialize data: {}", e))?,
    );
    let ctx = crypto::encrypt_and_save(&path, &*master_password, &*json_data)?;
    *lock_vault_state(state)? = Some(data);
    *lock_crypto_state(state)? = Some(ctx);
    Ok(())
}

#[tauri::command]
pub fn open_database(
    path: String,
    master_password: String,
    state: State<'_, AppState>,
) -> Result<VaultData, String> {
    open_database_impl(path, master_password, &state)
}

pub fn open_database_impl(
    path: String,
    master_password: String,
    state: &AppState,
) -> Result<VaultData, String> {
    let master_password = Zeroizing::new(master_password);
    let (decrypted, ctx) = crypto::decrypt_file(&path, &*master_password)?;

    let parsed: VaultData = match serde_json::from_str(&*decrypted) {
        Ok(data) => data,
        Err(_) => {
            let legacy_entries: Vec<PasswordEntry> = serde_json::from_str(&*decrypted)
                .map_err(|e| format!("Failed to parse data: {}", e))?;

            let mut folders = std::collections::HashSet::new();
            for e in &legacy_entries {
                if !e.folder.is_empty() && e.folder != "Sin carpeta" {
                    folders.insert(e.folder.clone());
                }
            }
            let legacy_entries: Vec<PasswordEntry> = legacy_entries
                .into_iter()
                .map(|mut e| {
                    if e.folder == "Sin carpeta" {
                        e.folder = String::new();
                    }
                    e
                })
                .collect();
            VaultData {
                folders: folders.into_iter().collect(),
                entries: legacy_entries,
            }
        }
    };

    *lock_vault_state(state)? = Some(parsed.clone());
    *lock_crypto_state(state)? = Some(ctx);
    Ok(parsed)
}

#[tauri::command(rename_all = "camelCase")]
pub fn save_database(
    path: String,
    vault_data: VaultData,
    state: State<'_, AppState>,
) -> Result<(), String> {
    save_database_impl(path, vault_data, &state)
}

pub fn save_database_impl(
    path: String,
    vault_data: VaultData,
    state: &AppState,
) -> Result<(), String> {
    let ctx_guard = lock_crypto_state(state)?;
    let ctx = ctx_guard.as_ref().ok_or("Vault is not unlocked")?;

    let json_data = Zeroizing::new(
        serde_json::to_string(&vault_data)
            .map_err(|e| format!("Failed to serialize data: {}", e))?,
    );

    crypto::encrypt_and_save_with_context(&path, ctx, &*json_data)?;

    drop(ctx_guard);
    *lock_vault_state(state)? = Some(vault_data);
    Ok(())
}

#[tauri::command]
pub fn lock_vault(state: State<'_, AppState>) -> Result<(), String> {
    lock_vault_impl(&state)
}

pub fn lock_vault_impl(state: &AppState) -> Result<(), String> {
    *lock_vault_state(state)? = None;
    *lock_crypto_state(state)? = None;
    Ok(())
}

#[tauri::command]
pub fn copy_to_clipboard_with_timeout(
    app_handle: tauri::AppHandle,
    text: String,
) -> Result<(), String> {
    use tauri_plugin_clipboard_manager::ClipboardExt;
    use std::time::Duration;

    app_handle
        .clipboard()
        .write_text(&text)
        .map_err(|e| format!("Failed to write to clipboard: {}", e))?;

    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(Duration::from_secs(30)).await;

        if let Ok(current_text) = app_handle.clipboard().read_text() {
            if current_text == text {
                let _ = app_handle.clipboard().clear();
            }
        }
    });

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
            crypto_ctx: Mutex::new(None),
        }
    }

    #[test]
    fn test_create_database() {
        let path = get_temp_path("test_cmd_create.txt");
        let password = "test_password".to_string();
        let state = create_test_state();

        let res = create_database_impl(path.to_str().unwrap().to_string(), password, &state);
        assert!(res.is_ok());

        let vault_state = state.vault.lock().unwrap();
        assert!(vault_state.is_some());
        assert!(vault_state.as_ref().unwrap().entries.is_empty());
        assert!(vault_state.as_ref().unwrap().folders.is_empty());
        drop(vault_state);

        let crypto_state = state.crypto_ctx.lock().unwrap();
        assert!(crypto_state.is_some());

        let _ = fs::remove_file(path);
    }

    #[test]
    fn test_open_database() {
        let path = get_temp_path("test_cmd_open.txt");
        let password = "test_password".to_string();
        let state1 = create_test_state();

        create_database_impl(
            path.to_str().unwrap().to_string(),
            password.clone(),
            &state1,
        )
        .unwrap();

        let state2 = create_test_state();
        let res = open_database_impl(path.to_str().unwrap().to_string(), password, &state2);

        assert!(res.is_ok());
        let vault_data = res.unwrap();
        assert!(vault_data.entries.is_empty());

        let vault_state = state2.vault.lock().unwrap();
        assert!(vault_state.is_some());
        drop(vault_state);

        let crypto_state = state2.crypto_ctx.lock().unwrap();
        assert!(crypto_state.is_some());

        let _ = fs::remove_file(path);
    }

    #[test]
    fn test_save_database() {
        let path = get_temp_path("test_cmd_save.txt");
        let password = "test_password".to_string();
        let state = create_test_state();

        create_database_impl(path.to_str().unwrap().to_string(), password.clone(), &state).unwrap();

        let entries = vec![PasswordEntry {
            id: "1".to_string(),
            name: "Test".to_string(),
            url: "test.com".to_string(),
            username: "user".to_string(),
            password: "123".to_string(),
            notes: "".to_string(),
            folder: String::new(),
        }];

        let data = VaultData {
            folders: vec!["emails".to_string()],
            entries,
        };

        let save_res = save_database_impl(
            path.to_str().unwrap().to_string(),
            data,
            &state,
        );
        assert!(save_res.is_ok());

        let vault_state = state.vault.lock().unwrap();
        assert_eq!(vault_state.as_ref().unwrap().entries.len(), 1);
        drop(vault_state);

        let state2 = create_test_state();
        let open_res =
            open_database_impl(path.to_str().unwrap().to_string(), password, &state2).unwrap();
        assert_eq!(open_res.entries.len(), 1);
        assert_eq!(open_res.entries[0].name, "Test");

        let _ = fs::remove_file(path);
    }

    #[test]
    fn test_save_database_without_unlock_fails() {
        let path = get_temp_path("test_cmd_save_no_unlock.txt");
        let state = create_test_state();

        let data = VaultData {
            folders: vec![],
            entries: vec![],
        };

        let res = save_database_impl(path.to_str().unwrap().to_string(), data, &state);
        assert!(res.is_err());
        assert_eq!(res.unwrap_err(), "Vault is not unlocked");
    }

    #[test]
    fn test_lock_vault() {
        let state = create_test_state();
        *state.vault.lock().unwrap() = Some(VaultData {
            entries: vec![],
            folders: vec![],
        });

        let res = lock_vault_impl(&state);
        assert!(res.is_ok());

        let vault_state = state.vault.lock().unwrap();
        assert!(vault_state.is_none());
        drop(vault_state);

        let crypto_state = state.crypto_ctx.lock().unwrap();
        assert!(crypto_state.is_none());
    }
}
