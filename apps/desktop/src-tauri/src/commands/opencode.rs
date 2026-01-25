use std::process::{Child, Stdio};
use std::sync::Mutex;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use tokio::process::Command as TokioCommand;
use tokio::time::{sleep, Duration};

pub struct OpenCodeState {
    pub process: Mutex<Option<Child>>,
    pub port: Mutex<u16>,
}

impl Default for OpenCodeState {
    fn default() -> Self {
        Self {
            process: Mutex::new(None),
            port: Mutex::new(4096),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenCodeStatus {
    pub running: bool,
    pub port: u16,
    pub installed: bool,
}

async fn find_opencode() -> Option<String> {
    let candidates = if cfg!(target_os = "windows") {
        vec!["opencode.cmd", "opencode.exe", "opencode"]
    } else {
        vec!["opencode"]
    };

    for candidate in candidates {
        if let Ok(output) = TokioCommand::new("which").arg(candidate).output().await {
            if output.status.success() {
                return Some(String::from_utf8_lossy(&output.stdout).trim().to_string());
            }
        }
    }

    let home = std::env::var("HOME").unwrap_or_default();
    let common_paths: Vec<String> = vec![
        "/opt/homebrew/bin/opencode".to_string(),
        "/usr/local/bin/opencode".to_string(),
        "/usr/bin/opencode".to_string(),
        format!("{}/.local/bin/opencode", home),
        format!("{}/.opencode/bin/opencode", home),
        format!("{}/.bun/bin/opencode", home),
        format!("{}/bin/opencode", home),
    ];

    for path in common_paths {
        if std::path::Path::new(&path).exists() {
            return Some(path);
        }
    }

    None
}

#[tauri::command]
pub async fn opencode_status(state: tauri::State<'_, OpenCodeState>) -> Result<OpenCodeStatus, String> {
    let running = state
        .process
        .lock()
        .map_err(|e| e.to_string())?
        .as_ref()
        .map(|_| true)
        .unwrap_or(false);

    let port = *state.port.lock().map_err(|e| e.to_string())?;
    let installed = find_opencode().await.is_some();

    Ok(OpenCodeStatus {
        running,
        port,
        installed,
    })
}

#[tauri::command]
pub async fn opencode_start(
    app: AppHandle,
    state: tauri::State<'_, OpenCodeState>,
    directory: String,
    port: Option<u16>,
) -> Result<OpenCodeStatus, String> {
    {
        let mut process_guard = state.process.lock().map_err(|e| e.to_string())?;
        if let Some(mut existing) = process_guard.take() {
            existing.kill().ok();
            existing.wait().ok();
        }
    }

    let opencode_path = find_opencode().await.ok_or("OpenCode not found. Install with: npm install -g opencode")?;

    let port = port.unwrap_or(4096);
    *state.port.lock().map_err(|e| e.to_string())? = port;

    let mut child = std::process::Command::new(&opencode_path)
        .args(["serve", "--port", &port.to_string()])
        .current_dir(&directory)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start OpenCode: {}", e))?;

    sleep(Duration::from_millis(500)).await;

    if let Some(status) = child.try_wait().map_err(|e| e.to_string())? {
        return Err(format!("OpenCode exited immediately with status: {}", status));
    }

    *state.process.lock().map_err(|e| e.to_string())? = Some(child);

    app.emit("opencode-status", "running").ok();

    Ok(OpenCodeStatus {
        running: true,
        port,
        installed: true,
    })
}

#[tauri::command]
pub async fn opencode_stop(
    app: AppHandle,
    state: tauri::State<'_, OpenCodeState>,
) -> Result<(), String> {
    let mut process = state.process.lock().map_err(|e| e.to_string())?;

    if let Some(mut child) = process.take() {
        child.kill().ok();
        child.wait().ok();
    }

    app.emit("opencode-status", "stopped").ok();

    Ok(())
}

#[tauri::command]
pub async fn opencode_restart(
    app: AppHandle,
    state: tauri::State<'_, OpenCodeState>,
    directory: String,
) -> Result<OpenCodeStatus, String> {
    opencode_stop(app.clone(), state.clone()).await.ok();
    sleep(Duration::from_millis(200)).await;
    opencode_start(app, state, directory, None).await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_find_opencode_returns_valid_path_when_installed() {
        let result = find_opencode().await;
        
        if let Some(path) = result {
            assert!(
                path.contains("opencode"),
                "Found path should contain 'opencode': {}",
                path
            );
            assert!(
                std::path::Path::new(&path).exists(),
                "Found path should exist: {}",
                path
            );
        }
    }

    #[tokio::test]
    async fn test_find_opencode_never_panics() {
        let result = find_opencode().await;
        
        if let Some(path) = &result {
            assert!(!path.is_empty());
        }
    }

    #[test]
    fn test_opencode_state_default_has_no_process_and_port_4096() {
        let state = OpenCodeState::default();
        
        let process = state.process.lock().unwrap();
        assert!(process.is_none(), "Default state should have no process");
        
        let port = state.port.lock().unwrap();
        assert_eq!(*port, 4096, "Default port should be 4096");
    }

    #[test]
    fn test_opencode_status_roundtrip_serialization() {
        let status = OpenCodeStatus {
            running: true,
            port: 4096,
            installed: true,
        };
        
        let json = serde_json::to_string(&status).unwrap();
        assert!(json.contains("\"running\":true"));
        assert!(json.contains("\"port\":4096"));
        assert!(json.contains("\"installed\":true"));
        
        let deserialized: OpenCodeStatus = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.running, status.running);
        assert_eq!(deserialized.port, status.port);
        assert_eq!(deserialized.installed, status.installed);
    }
}
