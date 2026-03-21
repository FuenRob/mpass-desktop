pub mod commands;
pub mod crypto;
pub mod models;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .manage(commands::AppState {
            vault: std::sync::Mutex::new(None),
            crypto_ctx: std::sync::Mutex::new(None),
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::create_database,
            commands::open_database,
            commands::save_database,
            commands::lock_vault,
            commands::copy_to_clipboard_with_timeout,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
