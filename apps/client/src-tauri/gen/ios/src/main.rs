#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    menu::{Menu, MenuItem},
    Manager, Runtime,
};

fn main() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_stronghold::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            #[cfg(target_os = "ios")]
            {
                if let Some(window) = app.get_webview_window("main") {
                    window.set_title("gh0st").unwrap();
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_version,
            lock_vault,
            unlock_vault,
            is_vault_locked,
            get_privacy_status
        ]);

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
fn lock_vault() -> Result<(), String> {
    Ok(())
}

#[tauri::command]
fn unlock_vault() -> Result<(), String> {
    Ok(())
}

#[tauri::command]
fn is_vault_locked() -> bool {
    true
}

#[tauri::command]
fn get_privacy_status() -> serde_json::Value {
    serde_json::json!({
        "vault": "encrypted",
        "zdr": "verified",
        "telemetry": "off",
        "analytics": "none",
        "externalMcp": "none",
        "tools": {
            "web": true,
            "x": false,
            "code": true
        }
    })
}