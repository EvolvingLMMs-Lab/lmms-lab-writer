use std::process::Stdio;
use std::sync::Mutex;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::{Child as TokioChild, Command as TokioCommand};
use tokio::time::{sleep, Duration};

pub struct OpenCodeState {
    pub process: Mutex<Option<TokioChild>>,
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

    // On Windows, use 'where' command; on Unix, use 'which'
    let which_cmd = if cfg!(target_os = "windows") { "where" } else { "which" };

    for candidate in &candidates {
        if let Ok(output) = TokioCommand::new(which_cmd).arg(candidate).output().await {
            if output.status.success() {
                let path = String::from_utf8_lossy(&output.stdout)
                    .lines()
                    .next()
                    .unwrap_or("")
                    .trim()
                    .to_string();
                if !path.is_empty() {
                    return Some(path);
                }
            }
        }
    }

    // On Windows, also check common npm/node paths
    #[cfg(target_os = "windows")]
    {
        if let Ok(appdata) = std::env::var("APPDATA") {
            let npm_path = format!("{}\\npm\\opencode.cmd", appdata);
            if std::path::Path::new(&npm_path).exists() {
                return Some(npm_path);
            }
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
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

        let result = tokio::task::spawn_blocking(move || {
            for path in common_paths {
                if std::path::Path::new(&path).exists() {
                    return Some(path);
                }
            }
            None
        }).await.ok().flatten();

        if result.is_some() {
            return result;
        }
    }

    None
}

#[tauri::command]
pub async fn opencode_status(state: tauri::State<'_, OpenCodeState>) -> Result<OpenCodeStatus, String> {
    let process_running = state
        .process
        .lock()
        .map_err(|e| e.to_string())?
        .as_ref()
        .map(|_| true)
        .unwrap_or(false);

    let mut port = *state.port.lock().map_err(|e| e.to_string())?;
    let installed = find_opencode().await.is_some();

    // If no process is tracked by this app, check if daemon is running externally
    let running = if process_running {
        true
    } else if let Some(detected_port) = find_running_opencode_port(4096, 10).await {
        // Found an externally running daemon, update the port
        port = detected_port;
        if let Ok(mut port_guard) = state.port.lock() {
            *port_guard = detected_port;
        }
        true
    } else {
        false
    };

    Ok(OpenCodeStatus {
        running,
        port,
        installed,
    })
}

async fn check_port_in_use(port: u16) -> bool {
    use std::net::TcpListener;
    TcpListener::bind(("127.0.0.1", port)).is_err()
}

/// Check if OpenCode daemon is running on a specific port by making an HTTP request
async fn check_opencode_running_on_port(port: u16) -> bool {
    let url = format!("http://127.0.0.1:{}/agent", port);
    let client = match reqwest::Client::builder()
        .timeout(Duration::from_millis(500))
        .build()
    {
        Ok(c) => c,
        Err(_) => return false,
    };

    match client.get(&url).send().await {
        Ok(resp) => resp.status().is_success(),
        Err(_) => false,
    }
}

/// Find a running OpenCode daemon on common ports
async fn find_running_opencode_port(start_port: u16, max_attempts: u16) -> Option<u16> {
    for offset in 0..max_attempts {
        let port = start_port + offset;
        if check_opencode_running_on_port(port).await {
            return Some(port);
        }
    }
    None
}

async fn find_available_port(start_port: u16, max_attempts: u16) -> Option<u16> {
    for offset in 0..max_attempts {
        let port = start_port + offset;
        if !check_port_in_use(port).await {
            return Some(port);
        }
    }
    None
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
        if let Some(existing) = process_guard.take() {
            drop(existing);
        }
    }

    let opencode_path = find_opencode().await.ok_or("OpenCode not found. Please install it from https://opencode.ai/ or run: npm i -g opencode-ai@latest")?;

    let requested_port = port.unwrap_or(4096);

    // Try to find an available port, starting from the requested port
    let port = find_available_port(requested_port, 10).await.ok_or_else(|| {
        format!(
            "Could not find an available port in range {}-{}. Please close some applications or specify a different port.",
            requested_port,
            requested_port + 9
        )
    })?;

    let dir_path = std::path::Path::new(&directory);
    if !dir_path.exists() {
        return Err(format!("Directory does not exist: {}", directory));
    }
    if !dir_path.is_dir() {
        return Err(format!("Path is not a directory: {}", directory));
    }

    *state.port.lock().map_err(|e| e.to_string())? = port;

    let mut child = TokioCommand::new(&opencode_path)
        .args(["serve", "--port", &port.to_string()])
        .current_dir(&directory)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .kill_on_drop(true)
        .spawn()
        .map_err(|e| format!("Failed to spawn OpenCode process: {}", e))?;

    // Spawn tasks to stream stdout/stderr to frontend
    if let Some(stdout) = child.stdout.take() {
        let app_clone = app.clone();
        tokio::spawn(async move {
            let reader = BufReader::new(stdout);
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                let _ = app_clone.emit("opencode-log", serde_json::json!({
                    "type": "stdout",
                    "message": line
                }));
            }
        });
    }

    if let Some(stderr) = child.stderr.take() {
        let app_clone = app.clone();
        tokio::spawn(async move {
            let reader = BufReader::new(stderr);
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                let _ = app_clone.emit("opencode-log", serde_json::json!({
                    "type": "stderr",
                    "message": line
                }));
            }
        });
    }

    // Wait for the process to start listening on the port
    let start_time = std::time::Instant::now();
    let timeout = Duration::from_secs(10);
    let mut started = false;

    while start_time.elapsed() < timeout {
        // Check if process is still running
        if let Some(status) = child.try_wait().map_err(|e| e.to_string())? {
            let error_msg = format!(
                "OpenCode exited immediately (exit code: {})\n\
                Path: {}\n\
                Directory: {}\n\n\
                Check the opencode-log events for detailed output.",
                status.code().map(|c| c.to_string()).unwrap_or_else(|| "signal".to_string()),
                opencode_path,
                directory
            );
            return Err(error_msg);
        }

        // Check if port is in use (meaning it started listening)
        if check_port_in_use(port).await {
            started = true;
            break;
        }

        sleep(Duration::from_millis(200)).await;
    }

    if !started {
        // Kill the process if it timed out
        let _ = child.kill().await;
        return Err(format!(
            "OpenCode failed to start within {} seconds (port {} not listening).\n\
            Check the opencode-log events for detailed output.",
            timeout.as_secs(),
            port
        ));
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

    if let Some(child) = process.take() {
        drop(child);
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
