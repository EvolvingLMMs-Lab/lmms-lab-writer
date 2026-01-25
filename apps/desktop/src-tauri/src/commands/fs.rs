use serde::{Deserialize, Serialize};
use std::path::Path;
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

const IGNORED_EXTENSIONS: &[&str] = &[
    ".aux", ".log", ".out", ".toc", ".lof", ".lot", ".fls", ".fdb_latexmk", ".synctex.gz", ".bbl",
    ".blg",
];

#[tauri::command]
pub async fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn write_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content).await.map_err(|e| e.to_string())
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

        if name.starts_with('.') && name != ".latexmkrc" {
            continue;
        }

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
            let should_ignore = IGNORED_EXTENSIONS.iter().any(|ext| name.ends_with(ext));
            if should_ignore {
                continue;
            }

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

#[tauri::command]
pub async fn watch_directory(_path: String) -> Result<(), String> {
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
    async fn test_get_file_tree_ignores_hidden_files() {
        let temp_dir = TempDir::new().unwrap();
        
        fs::write(temp_dir.path().join(".hidden"), "").unwrap();
        fs::write(temp_dir.path().join("visible.tex"), "").unwrap();

        let tree = get_file_tree(temp_dir.path().to_string_lossy().to_string()).await.unwrap();

        let names: Vec<&str> = tree.iter().map(|n| n.name.as_str()).collect();
        assert!(!names.contains(&".hidden"));
        assert!(names.contains(&"visible.tex"));
    }

    #[tokio::test]
    async fn test_get_file_tree_ignores_latex_aux_files() {
        let temp_dir = TempDir::new().unwrap();
        
        fs::write(temp_dir.path().join("main.tex"), "").unwrap();
        fs::write(temp_dir.path().join("main.aux"), "").unwrap();
        fs::write(temp_dir.path().join("main.log"), "").unwrap();
        fs::write(temp_dir.path().join("main.synctex.gz"), "").unwrap();

        let tree = get_file_tree(temp_dir.path().to_string_lossy().to_string()).await.unwrap();

        let names: Vec<&str> = tree.iter().map(|n| n.name.as_str()).collect();
        assert!(names.contains(&"main.tex"));
        assert!(!names.contains(&"main.aux"));
        assert!(!names.contains(&"main.log"));
        assert!(!names.contains(&"main.synctex.gz"));
    }

    #[tokio::test]
    async fn test_get_file_tree_returns_error_for_nonexistent_dir() {
        let result = get_file_tree("/nonexistent/directory".to_string()).await;
        assert!(result.is_err());
    }
}
