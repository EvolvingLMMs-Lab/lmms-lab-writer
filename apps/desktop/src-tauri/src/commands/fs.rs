use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher, EventKind, event::ModifyKind};
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};
use tokio::fs;

#[derive(Debug, Serialize, Deserialize)]
pub struct FileNode {
    pub name: String,
    pub path: String,
    #[serde(rename = "type")]
    pub node_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub children: Option<Vec<FileNode>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileChangeEvent {
    pub path: String,
    pub kind: String,
}

pub struct WatcherState {
    watcher: Option<RecommendedWatcher>,
    watched_path: Option<String>,
    last_events: Arc<Mutex<HashMap<String, Instant>>>,
}

impl Default for WatcherState {
    fn default() -> Self {
        Self {
            watcher: None,
            watched_path: None,
            last_events: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

pub struct ProjectState {
    pub project_path: Option<String>,
}

impl Default for ProjectState {
    fn default() -> Self {
        Self { project_path: None }
    }
}

fn validate_path_within_project(path: &str, project_path: &str) -> Result<(), String> {
    let canonical_project = std::fs::canonicalize(project_path)
        .map_err(|e| format!("Invalid project path: {}", e))?;
    
    let target_path = Path::new(path);
    let canonical_target = if target_path.exists() {
        std::fs::canonicalize(target_path)
            .map_err(|e| format!("Invalid target path: {}", e))?
    } else {
        let parent = target_path.parent()
            .ok_or_else(|| "Invalid path: no parent directory".to_string())?;
        let parent_canonical = std::fs::canonicalize(parent)
            .map_err(|e| format!("Invalid parent path: {}", e))?;
        parent_canonical.join(target_path.file_name().unwrap_or_default())
    };
    
    if !canonical_target.starts_with(&canonical_project) {
        return Err("Access denied: path is outside project directory".to_string());
    }
    
    Ok(())
}

const IGNORED_DIRS: &[&str] = &[
    "node_modules",
    ".git",
    ".next",
    "dist",
    "build",
    "__pycache__",
    ".cache",
    "out",
];

const DEBOUNCE_MS: u64 = 100;

#[tauri::command]
pub async fn set_project_path(
    state: tauri::State<'_, Mutex<ProjectState>>,
    path: String,
) -> Result<(), String> {
    let canonical = std::fs::canonicalize(&path)
        .map_err(|e| format!("Invalid project path: {}", e))?;
    
    if !canonical.is_dir() {
        return Err("Project path must be a directory".to_string());
    }
    
    let mut state_guard = state.lock().map_err(|e| e.to_string())?;
    state_guard.project_path = Some(canonical.to_string_lossy().to_string());
    Ok(())
}

#[tauri::command]
pub async fn read_file(
    state: tauri::State<'_, Mutex<ProjectState>>,
    path: String,
) -> Result<String, String> {
    let project_path = {
        let state_guard = state.lock().map_err(|e| e.to_string())?;
        state_guard.project_path.clone()
            .ok_or_else(|| "No project open".to_string())?
    };
    
    validate_path_within_project(&path, &project_path)?;
    
    let metadata = fs::metadata(&path).await.map_err(|e| e.to_string())?;
    if metadata.is_dir() {
        return Err("Cannot read directory as file".to_string());
    }
    fs::read_to_string(&path).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn write_file(
    state: tauri::State<'_, Mutex<ProjectState>>,
    path: String,
    content: String,
) -> Result<(), String> {
    let project_path = {
        let state_guard = state.lock().map_err(|e| e.to_string())?;
        state_guard.project_path.clone()
            .ok_or_else(|| "No project open".to_string())?
    };
    
    validate_path_within_project(&path, &project_path)?;
    
    fs::write(&path, content).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_file(path: String) -> Result<(), String> {
    // Create parent directory if it doesn't exist
    if let Some(parent) = Path::new(&path).parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).await.map_err(|e| e.to_string())?;
        }
    }

    // Check if file already exists
    if Path::new(&path).exists() {
        return Err(format!("File already exists: {}", path));
    }

    // Create empty file
    fs::write(&path, "").await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_directory(path: String) -> Result<(), String> {
    // Check if directory already exists
    if Path::new(&path).exists() {
        return Err(format!("Directory already exists: {}", path));
    }

    fs::create_dir_all(&path).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn rename_path(old_path: String, new_path: String) -> Result<(), String> {
    // Check if old path exists
    if !Path::new(&old_path).exists() {
        return Err(format!("Path not found: {}", old_path));
    }

    // Check if new path already exists
    if Path::new(&new_path).exists() {
        return Err(format!("Path already exists: {}", new_path));
    }

    fs::rename(&old_path, &new_path).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_path(path: String) -> Result<(), String> {
    let path_obj = Path::new(&path);

    // Check if path exists
    if !path_obj.exists() {
        return Err(format!("Path not found: {}", path));
    }

    if path_obj.is_dir() {
        fs::remove_dir_all(&path).await.map_err(|e| e.to_string())
    } else {
        fs::remove_file(&path).await.map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub async fn get_file_tree(dir: String) -> Result<Vec<FileNode>, String> {
    let path = Path::new(&dir);
    if !path.exists() {
        return Err(format!("Directory not found: {}", dir));
    }

    let dir_clone = dir.clone();
    let result = tauri::async_runtime::spawn_blocking(move || {
        build_file_tree(Path::new(&dir_clone), "")
    })
    .await
    .map_err(|e| e.to_string())?;

    Ok(result)
}

fn build_file_tree(dir: &Path, base_path: &str) -> Vec<FileNode> {
    let mut nodes = Vec::new();

    let entries = match std::fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return nodes,
    };

    for entry in entries.flatten() {
        let name = entry.file_name().to_string_lossy().to_string();

        if IGNORED_DIRS.contains(&name.as_str()) {
            continue;
        }

        let file_type = match entry.file_type() {
            Ok(ft) => ft,
            Err(_) => continue,
        };
        
        let relative_path = if base_path.is_empty() {
            name.clone()
        } else {
            format!("{}/{}", base_path, name)
        };

        if file_type.is_dir() {
            let children = build_file_tree(&entry.path(), &relative_path);
            nodes.push(FileNode {
                name,
                path: relative_path,
                node_type: "directory".to_string(),
                children: Some(children),
            });
        } else if file_type.is_file() {
            nodes.push(FileNode {
                name,
                path: relative_path,
                node_type: "file".to_string(),
                children: None,
            });
        }
    }

    nodes.sort_by(|a, b| {
        if a.node_type != b.node_type {
            if a.node_type == "directory" {
                std::cmp::Ordering::Less
            } else {
                std::cmp::Ordering::Greater
            }
        } else {
            a.name.cmp(&b.name)
        }
    });

    nodes
}

fn should_ignore_path(path: &Path) -> bool {
    for component in path.components() {
        let name = component.as_os_str().to_string_lossy();
        if IGNORED_DIRS.contains(&name.as_ref()) {
            return true;
        }
    }

    false
}

fn event_kind_to_string(kind: &EventKind) -> &'static str {
    match kind {
        EventKind::Create(_) => "create",
        EventKind::Modify(modify_kind) => {
            // Distinguish rename events from other modifications
            match modify_kind {
                ModifyKind::Name(_) => "rename",
                _ => "modify",
            }
        }
        EventKind::Remove(_) => "remove",
        EventKind::Access(_) => "access",
        EventKind::Other => "other",
        _ => "unknown",
    }
}

#[tauri::command]
pub fn watch_directory(
    app: AppHandle,
    state: tauri::State<'_, Mutex<WatcherState>>,
    path: String,
) -> Result<(), String> {
    let mut state_guard = state.lock().map_err(|e| e.to_string())?;
    state_guard.watcher = None;
    state_guard.watched_path = None;

    let watch_path = Path::new(&path);
    if !watch_path.exists() {
        return Err(format!("Directory not found: {}", path));
    }

    let last_events = state_guard.last_events.clone();
    let app_handle = app.clone();

    // Canonicalize base_path for reliable path comparison on Windows
    let base_path: PathBuf = std::fs::canonicalize(&path)
        .map_err(|e| format!("Failed to canonicalize path: {}", e))?;

    let watcher = RecommendedWatcher::new(
        move |res: Result<notify::Event, notify::Error>| {
            if let Ok(event) = res {
                for event_path in &event.paths {
                    if should_ignore_path(event_path) {
                        continue;
                    }

                    let path_str = event_path.to_string_lossy().to_string();

                    {
                        let Ok(mut events) = last_events.lock() else {
                            continue;
                        };
                        let now = Instant::now();

                        // Clean up old entries when map grows too large (prevent memory leak)
                        if events.len() > 100 {
                            events.retain(|_, time| now.duration_since(*time) < Duration::from_secs(5));
                        }

                        if let Some(last) = events.get(&path_str) {
                            if now.duration_since(*last) < Duration::from_millis(DEBOUNCE_MS) {
                                continue;
                            }
                        }
                        events.insert(path_str.clone(), now);
                    }

                    // Calculate relative path with proper handling for Windows paths
                    let relative_path = match event_path.canonicalize() {
                        Ok(canonical_event_path) => {
                            canonical_event_path
                                .strip_prefix(&base_path)
                                .map(|p| p.to_string_lossy().replace("\\", "/"))
                                .unwrap_or_else(|_| event_path.to_string_lossy().replace("\\", "/"))
                        }
                        Err(_) => {
                            // File might have been deleted, try direct comparison
                            event_path
                                .strip_prefix(&base_path)
                                .map(|p| p.to_string_lossy().replace("\\", "/"))
                                .unwrap_or_else(|_| event_path.to_string_lossy().replace("\\", "/"))
                        }
                    };

                    let change_event = FileChangeEvent {
                        path: relative_path,
                        kind: event_kind_to_string(&event.kind).to_string(),
                    };

                    app_handle.emit("file-changed", change_event).ok();
                }
            }
        },
        Config::default(),
    )
    .map_err(|e| format!("Failed to create watcher: {}", e))?;

    let mut watcher = watcher;
    watcher
        .watch(watch_path, RecursiveMode::Recursive)
        .map_err(|e| format!("Failed to watch directory: {}", e))?;

    state_guard.watcher = Some(watcher);
    state_guard.watched_path = Some(path);

    Ok(())
}

#[tauri::command]
pub fn stop_watch(state: tauri::State<'_, Mutex<WatcherState>>) -> Result<(), String> {
    let mut state_guard = state.lock().map_err(|e| e.to_string())?;
    state_guard.watcher = None;
    state_guard.watched_path = None;

    // Clear debounce cache to free memory
    if let Ok(mut events) = state_guard.last_events.lock() {
        events.clear();
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    #[tokio::test]
    async fn test_read_file_returns_content() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("test.txt");
        fs::write(&file_path, "hello world").unwrap();

        let content = read_file(file_path.to_string_lossy().to_string()).await.unwrap();
        assert_eq!(content, "hello world");
    }

    #[tokio::test]
    async fn test_read_file_returns_error_for_missing_file() {
        let result = read_file("/nonexistent/path/file.txt".to_string()).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_write_file_creates_file() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("new.txt");

        write_file(file_path.to_string_lossy().to_string(), "test content".to_string())
            .await
            .unwrap();

        let content = fs::read_to_string(&file_path).unwrap();
        assert_eq!(content, "test content");
    }

    #[tokio::test]
    async fn test_get_file_tree_returns_files_and_directories() {
        let temp_dir = TempDir::new().unwrap();
        
        fs::write(temp_dir.path().join("file1.tex"), "").unwrap();
        fs::write(temp_dir.path().join("file2.txt"), "").unwrap();
        fs::create_dir(temp_dir.path().join("subdir")).unwrap();
        fs::write(temp_dir.path().join("subdir/nested.tex"), "").unwrap();

        let tree = get_file_tree(temp_dir.path().to_string_lossy().to_string()).await.unwrap();

        assert!(!tree.is_empty());
        
        let names: Vec<&str> = tree.iter().map(|n| n.name.as_str()).collect();
        assert!(names.contains(&"file1.tex"));
        assert!(names.contains(&"file2.txt"));
        assert!(names.contains(&"subdir"));
    }

    #[tokio::test]
    async fn test_get_file_tree_shows_dotfiles() {
        let temp_dir = TempDir::new().unwrap();

        fs::write(temp_dir.path().join(".gitignore"), "").unwrap();
        fs::write(temp_dir.path().join("visible.tex"), "").unwrap();

        let tree = get_file_tree(temp_dir.path().to_string_lossy().to_string()).await.unwrap();

        let names: Vec<&str> = tree.iter().map(|n| n.name.as_str()).collect();
        assert!(names.contains(&".gitignore"));
        assert!(names.contains(&"visible.tex"));
    }

    #[tokio::test]
    async fn test_get_file_tree_shows_all_files() {
        let temp_dir = TempDir::new().unwrap();

        fs::write(temp_dir.path().join("main.tex"), "").unwrap();
        fs::write(temp_dir.path().join("main.aux"), "").unwrap();
        fs::write(temp_dir.path().join("main.log"), "").unwrap();
        fs::write(temp_dir.path().join("main.synctex.gz"), "").unwrap();

        let tree = get_file_tree(temp_dir.path().to_string_lossy().to_string()).await.unwrap();

        let names: Vec<&str> = tree.iter().map(|n| n.name.as_str()).collect();
        assert!(names.contains(&"main.tex"));
        assert!(names.contains(&"main.aux"));
        assert!(names.contains(&"main.log"));
        assert!(names.contains(&"main.synctex.gz"));
    }

    #[tokio::test]
    async fn test_get_file_tree_returns_error_for_nonexistent_dir() {
        let result = get_file_tree("/nonexistent/directory".to_string()).await;
        assert!(result.is_err());
    }
}
