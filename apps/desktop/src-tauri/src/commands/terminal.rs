use portable_pty::{native_pty_system, CommandBuilder, MasterPty, PtySize};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::path::Path;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, State};

#[cfg(target_os = "windows")]
fn build_env_path(original: String) -> String {
    original
}

#[cfg(target_os = "macos")]
fn build_env_path(original: String) -> String {
    let mut env_path = original;
    if !env_path.contains("/opt/homebrew/bin") {
        env_path = format!(
            "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:{}",
            env_path
        );
    }
    env_path
}

#[cfg(target_os = "linux")]
fn build_env_path(original: String) -> String {
    let mut env_path = original;
    if !env_path.contains("/usr/local/bin") {
        env_path = format!("/usr/local/bin:/usr/bin:/bin:{}", env_path);
    }
    env_path
}

pub struct PtyInstance {
    pub master: Box<dyn MasterPty + Send>,
    pub writer: Box<dyn Write + Send>,
    pub child: Box<dyn portable_pty::Child + Send + Sync>,
}

pub struct PtyState {
    pub instances: Arc<Mutex<HashMap<String, PtyInstance>>>,
}

impl Default for PtyState {
    fn default() -> Self {
        Self {
            instances: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PtyOutputEvent {
    pub id: String,
    pub data: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PtyExitEvent {
    pub id: String,
    pub code: i32,
}

fn normalize_shell(raw: &str) -> String {
    raw.trim().trim_matches('"').to_string()
}

fn is_executable_available(executable: &str) -> bool {
    let normalized = normalize_shell(executable);
    if normalized.is_empty() {
        return false;
    }

    let executable_path = Path::new(&normalized);
    if executable_path.is_absolute() || normalized.contains(std::path::MAIN_SEPARATOR) {
        return executable_path.is_file();
    }

    let Some(path_var) = std::env::var_os("PATH") else {
        return false;
    };

    #[cfg(target_os = "windows")]
    {
        let has_extension = executable_path.extension().is_some();
        let path_ext =
            std::env::var("PATHEXT").unwrap_or_else(|_| ".COM;.EXE;.BAT;.CMD".to_string());
        let extensions: Vec<String> = path_ext
            .split(';')
            .filter_map(|ext| {
                let trimmed = ext.trim();
                if trimmed.is_empty() {
                    None
                } else {
                    Some(trimmed.to_ascii_lowercase())
                }
            })
            .collect();

        for dir in std::env::split_paths(&path_var) {
            if has_extension {
                if dir.join(&normalized).is_file() {
                    return true;
                }
                continue;
            }

            for ext in &extensions {
                if dir.join(format!("{}{}", normalized, ext)).is_file() {
                    return true;
                }
            }
        }

        false
    }

    #[cfg(not(target_os = "windows"))]
    {
        for dir in std::env::split_paths(&path_var) {
            if dir.join(&normalized).is_file() {
                return true;
            }
        }
        false
    }
}

#[cfg(target_os = "windows")]
fn get_default_shell() -> String {
    if is_executable_available("powershell.exe") {
        return "powershell.exe".to_string();
    }

    if let Ok(comspec) = std::env::var("COMSPEC") {
        let normalized = normalize_shell(&comspec);
        if is_executable_available(&normalized) {
            return normalized;
        }
    }

    if is_executable_available("cmd.exe") {
        return "cmd.exe".to_string();
    }

    "cmd.exe".to_string()
}

#[cfg(target_os = "macos")]
fn get_default_shell() -> String {
    if let Ok(shell) = std::env::var("SHELL") {
        let normalized = normalize_shell(&shell);
        if is_executable_available(&normalized) {
            return normalized;
        }
    }

    for candidate in ["/bin/zsh", "/bin/bash", "/bin/sh"] {
        if is_executable_available(candidate) {
            return candidate.to_string();
        }
    }

    "/bin/sh".to_string()
}

#[cfg(all(not(target_os = "windows"), not(target_os = "macos")))]
fn get_default_shell() -> String {
    if let Ok(shell) = std::env::var("SHELL") {
        let normalized = normalize_shell(&shell);
        if is_executable_available(&normalized) {
            return normalized;
        }
    }

    for candidate in ["/bin/bash", "/bin/sh"] {
        if is_executable_available(candidate) {
            return candidate.to_string();
        }
    }

    "/bin/sh".to_string()
}

fn resolve_shell(preferred_shell: Option<String>) -> String {
    if let Some(shell) = preferred_shell {
        let normalized = normalize_shell(&shell);
        if !normalized.is_empty() && is_executable_available(&normalized) {
            return normalized;
        }
    }

    get_default_shell()
}

#[tauri::command]
pub async fn spawn_pty(
    app: AppHandle,
    state: State<'_, PtyState>,
    cwd: String,
    cols: u16,
    rows: u16,
    shell: Option<String>,
) -> Result<String, String> {
    let pty_system = native_pty_system();

    let pair = pty_system
        .openpty(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| e.to_string())?;

    let shell = resolve_shell(shell);
    let mut cmd = CommandBuilder::new(&shell);
    cmd.cwd(&cwd);

    let env_path = build_env_path(std::env::var("PATH").unwrap_or_default());

    cmd.env("PATH", env_path);
    cmd.env("TERM", "xterm-256color");
    cmd.env("COLORTERM", "truecolor");

    let child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;
    let writer = pair.master.take_writer().map_err(|e| e.to_string())?;
    let mut reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;

    let id = uuid::Uuid::new_v4().to_string();
    let id_for_reader = id.clone();
    let id_for_result = id.clone();

    std::thread::spawn(move || {
        let mut buf = [0u8; 4096];
        loop {
            match reader.read(&mut buf) {
                Ok(0) => break,
                Ok(n) => {
                    let data = String::from_utf8_lossy(&buf[..n]).to_string();
                    let event = PtyOutputEvent {
                        id: id_for_reader.clone(),
                        data,
                    };
                    app.emit("pty-output", event).ok();
                }
                Err(_) => break,
            }
        }
        let exit_event = PtyExitEvent {
            id: id_for_reader.clone(),
            code: 0,
        };
        app.emit("pty-exit", exit_event).ok();
    });

    let instance = PtyInstance {
        master: pair.master,
        writer,
        child,
    };

    state
        .instances
        .lock()
        .map_err(|e| e.to_string())?
        .insert(id.clone(), instance);

    Ok(id_for_result)
}

#[tauri::command]
pub async fn write_pty(state: State<'_, PtyState>, id: String, data: String) -> Result<(), String> {
    let mut instances = state.instances.lock().map_err(|e| e.to_string())?;

    if let Some(instance) = instances.get_mut(&id) {
        instance
            .writer
            .write_all(data.as_bytes())
            .map_err(|e| e.to_string())?;
        instance.writer.flush().map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err(format!("PTY instance not found: {}", id))
    }
}

#[tauri::command]
pub async fn resize_pty(
    state: State<'_, PtyState>,
    id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let instances = state.instances.lock().map_err(|e| e.to_string())?;

    if let Some(instance) = instances.get(&id) {
        instance
            .master
            .resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err(format!("PTY instance not found: {}", id))
    }
}

#[tauri::command]
pub async fn kill_pty(state: State<'_, PtyState>, id: String) -> Result<(), String> {
    let mut instances = state.instances.lock().map_err(|e| e.to_string())?;

    if let Some(mut instance) = instances.remove(&id) {
        instance.child.kill().ok();
        Ok(())
    } else {
        Err(format!("PTY instance not found: {}", id))
    }
}
