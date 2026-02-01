mod commands;

use commands::auth::AuthCallbackStateWrapper;
use commands::fs::{ProjectState, WatcherState};
use commands::latex::LaTeXCompilationState;
use commands::opencode::OpenCodeState;
use commands::terminal::PtyState;
use std::sync::{Arc, Mutex};
use tauri::webview::WebviewWindowBuilder;
use tauri::WebviewUrl;
use tauri_plugin_opener::OpenerExt;
use tokio::sync::Mutex as TokioMutex;

fn is_external_url(url: &url::Url, dev_port: u16) -> bool {
    let scheme = url.scheme();
    if scheme != "http" && scheme != "https" {
        return false;
    }

    let host = url.host_str().unwrap_or("");
    let port = url.port();

    if host == "localhost" || host == "127.0.0.1" {
        if let Some(p) = port {
            return p != dev_port;
        }
        return false;
    }

    if host == "tauri.localhost" {
        return false;
    }

    true
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_deep_link::init())
        .manage(PtyState::default())
        .manage(OpenCodeState::default())
        .manage(LaTeXCompilationState::default())
        .manage(Mutex::new(WatcherState::default()))
        .manage(Mutex::new(ProjectState::default()))
        .manage(Arc::new(TokioMutex::new(
            commands::auth::AuthCallbackState::default(),
        )) as AuthCallbackStateWrapper)
        .invoke_handler(tauri::generate_handler![
            commands::auth::start_auth_callback_server,
            commands::auth::stop_auth_callback_server,
            commands::auth::get_auth_callback_port,
            commands::fs::set_project_path,
            commands::fs::read_file,
            commands::fs::write_file,
            commands::fs::get_file_tree,
            commands::fs::watch_directory,
            commands::fs::stop_watch,
            commands::fs::create_file,
            commands::fs::create_directory,
            commands::fs::rename_path,
            commands::fs::delete_path,
            commands::git::git_status,
            commands::git::git_log,
            commands::git::git_diff,
            commands::git::git_add,
            commands::git::git_commit,
            commands::git::git_push,
            commands::git::git_pull,
            commands::git::git_init,
            commands::git::git_clone,
            commands::git::git_add_remote,
            commands::terminal::spawn_pty,
            commands::terminal::write_pty,
            commands::terminal::resize_pty,
            commands::terminal::kill_pty,
            commands::opencode::opencode_status,
            commands::opencode::opencode_start,
            commands::opencode::opencode_stop,
            commands::opencode::opencode_restart,
            commands::opencode::kill_port_process,
            commands::latex::latex_detect_compilers,
            commands::latex::latex_detect_main_file,
            commands::latex::latex_compile,
            commands::latex::latex_stop_compilation,
            commands::latex::latex_clean_aux_files,
            commands::latex::latex_get_distributions,
            commands::latex::latex_install,
            commands::latex::latex_open_download_page,
        ])
        .setup(|app| {
            let app_handle = app.handle().clone();

            let webview_url = if cfg!(debug_assertions) {
                WebviewUrl::External("http://localhost:3000".parse().unwrap())
            } else {
                WebviewUrl::App("index.html".into())
            };

            let mut builder = WebviewWindowBuilder::new(app, "main", webview_url)
                .title("LMMs-Lab Writer")
                .inner_size(1400.0, 900.0)
                .min_inner_size(960.0, 640.0)
                .resizable(true)
                .center();

            let opener_handle = app_handle.clone();
            builder = builder.on_navigation(move |url| {
                if is_external_url(url, 3000) {
                    let url_str = url.to_string();
                    let handle = opener_handle.clone();
                    std::thread::spawn(move || {
                        let _ = handle.opener().open_url(&url_str, None::<&str>);
                    });
                    return false;
                }
                true
            });

            let _window = builder.build()?;

            #[cfg(debug_assertions)]
            _window.open_devtools();

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
