#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
    Manager, Runtime, Emitter,
};
use tauri_plugin_global_shortcut::GlobalShortcutExt;

fn main() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_stronghold::Builder::new(|_| vec![]).build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            setup_app(app)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                window.hide().unwrap();
                api.prevent_close();
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_version,
            show_window,
            hide_window,
            lock_vault,
            unlock_vault,
            is_vault_locked,
            get_privacy_status
        ]);

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn setup_app(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let _window = app.get_webview_window("main").unwrap();

    #[cfg(target_os = "macos")]
    {
        use tauri::TitleBarStyle;
        _window.set_title_bar_style(TitleBarStyle::Transparent).unwrap();
    }

    let quit = MenuItem::with_id(app, "quit", "Quit gh0st", true, None::<&str>)?;
    let show = MenuItem::with_id(app, "show", "Show gh0st", true, None::<&str>)?;
    let lock = MenuItem::with_id(app, "lock", "Lock Vault", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &lock, &quit])?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "quit" => {
                app.exit(0);
            }
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
            }
            "lock" => {
                app.emit("lock-vault", ()).unwrap();
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click { button: MouseButton::Left, .. } = event {
                if let Some(window) = tray.app_handle().get_webview_window("main") {
                    if window.is_visible().unwrap_or(false) {
                        window.hide().unwrap();
                    } else {
                        window.show().unwrap();
                        window.set_focus().unwrap();
                    }
                }
            }
        })
        .build(app)?;

    app.global_shortcut()
        .on_shortcut("CommandOrControl+Shift+G", |app, _, _| {
            if let Some(window) = app.get_webview_window("main") {
                if window.is_visible().unwrap_or(false) {
                    window.hide().unwrap();
                } else {
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
            }
        })?;

    Ok(())
}

#[tauri::command]
fn get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
fn show_window<R: Runtime>(window: tauri::Window<R>) -> Result<(), String> {
    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn hide_window<R: Runtime>(window: tauri::Window<R>) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())?;
    Ok(())
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