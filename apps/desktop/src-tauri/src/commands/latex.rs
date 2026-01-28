use serde::{Deserialize, Serialize};
use std::process::Stdio;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::{Child, Command};
use tokio::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompilerInfo {
    pub name: String,
    pub path: Option<String>,
    pub available: bool,
    pub version: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LaTeXCompilersStatus {
    pub pdflatex: CompilerInfo,
    pub xelatex: CompilerInfo,
    pub lualatex: CompilerInfo,
    pub latexmk: CompilerInfo,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompilationResult {
    pub success: bool,
    pub exit_code: Option<i32>,
    pub pdf_path: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompileOutputEvent {
    pub line: String,
    pub is_error: bool,
    pub is_warning: bool,
}

pub struct LaTeXCompilationState {
    pub current_process: Arc<Mutex<Option<Child>>>,
}

impl Default for LaTeXCompilationState {
    fn default() -> Self {
        Self {
            current_process: Arc::new(Mutex::new(None)),
        }
    }
}

async fn find_compiler(name: &str) -> CompilerInfo {
    let which_cmd = if cfg!(target_os = "windows") {
        "where"
    } else {
        "which"
    };

    // Try system PATH first
    let output = Command::new(which_cmd)
        .arg(name)
        .output()
        .await;

    if let Ok(output) = output {
        if output.status.success() {
            let path = String::from_utf8_lossy(&output.stdout)
                .lines()
                .next()
                .unwrap_or("")
                .trim()
                .to_string();

            if !path.is_empty() {
                let version = get_compiler_version(name, &path).await;
                return CompilerInfo {
                    name: name.to_string(),
                    path: Some(path),
                    available: true,
                    version,
                };
            }
        }
    }

    // Check common installation paths
    let common_paths = get_common_paths(name);
    for path in common_paths {
        if std::path::Path::new(&path).exists() {
            let version = get_compiler_version(name, &path).await;
            return CompilerInfo {
                name: name.to_string(),
                path: Some(path),
                available: true,
                version,
            };
        }
    }

    CompilerInfo {
        name: name.to_string(),
        path: None,
        available: false,
        version: None,
    }
}

fn get_common_paths(name: &str) -> Vec<String> {
    let mut paths = Vec::new();

    #[cfg(target_os = "windows")]
    {
        // TeX Live paths
        for year in (2020..=2030).rev() {
            paths.push(format!("C:\\texlive\\{}\\bin\\win32\\{}.exe", year, name));
            paths.push(format!("C:\\texlive\\{}\\bin\\windows\\{}.exe", year, name));
        }
        // MiKTeX paths
        paths.push(format!("C:\\Program Files\\MiKTeX\\miktex\\bin\\x64\\{}.exe", name));
        paths.push(format!("C:\\Program Files (x86)\\MiKTeX\\miktex\\bin\\{}.exe", name));
        // User MiKTeX
        if let Ok(home) = std::env::var("LOCALAPPDATA") {
            paths.push(format!("{}\\Programs\\MiKTeX\\miktex\\bin\\x64\\{}.exe", home, name));
        }
    }

    #[cfg(target_os = "macos")]
    {
        paths.push(format!("/Library/TeX/texbin/{}", name));
        paths.push(format!("/opt/homebrew/bin/{}", name));
        paths.push(format!("/usr/local/bin/{}", name));
        paths.push(format!("/usr/local/texlive/2024/bin/universal-darwin/{}", name));
        paths.push(format!("/usr/local/texlive/2023/bin/universal-darwin/{}", name));
    }

    #[cfg(target_os = "linux")]
    {
        paths.push(format!("/usr/bin/{}", name));
        paths.push(format!("/usr/local/bin/{}", name));
        for year in (2020..=2030).rev() {
            paths.push(format!("/usr/local/texlive/{}/bin/x86_64-linux/{}", year, name));
        }
    }

    paths
}

async fn get_compiler_version(name: &str, path: &str) -> Option<String> {
    let output = Command::new(path)
        .arg("--version")
        .output()
        .await
        .ok()?;

    if output.status.success() {
        let version_output = String::from_utf8_lossy(&output.stdout);
        // Extract first line which usually contains version info
        let first_line = version_output.lines().next()?;
        // Try to extract just the version number
        if name == "latexmk" {
            // latexmk outputs "Latexmk, John Collins, ..."
            Some(first_line.to_string())
        } else {
            // pdflatex, xelatex, lualatex output "pdfTeX 3.14159265-2.6-1.40.25 (TeX Live 2024)"
            Some(first_line.to_string())
        }
    } else {
        None
    }
}

#[tauri::command]
pub async fn latex_detect_compilers() -> Result<LaTeXCompilersStatus, String> {
    let (pdflatex, xelatex, lualatex, latexmk) = tokio::join!(
        find_compiler("pdflatex"),
        find_compiler("xelatex"),
        find_compiler("lualatex"),
        find_compiler("latexmk"),
    );

    Ok(LaTeXCompilersStatus {
        pdflatex,
        xelatex,
        lualatex,
        latexmk,
    })
}

#[tauri::command]
pub async fn latex_compile(
    app: AppHandle,
    state: State<'_, LaTeXCompilationState>,
    directory: String,
    compiler: String,
    main_file: String,
    args: Vec<String>,
    custom_path: Option<String>,
) -> Result<CompilationResult, String> {
    // Stop any existing compilation
    {
        let mut process_guard = state.current_process.lock().await;
        if let Some(mut child) = process_guard.take() {
            let _ = child.kill().await;
        }
    }

    // Determine the compiler executable
    let compiler_path = if let Some(ref path) = custom_path {
        path.clone()
    } else {
        compiler.clone()
    };

    // Build command arguments
    let mut cmd_args = vec![
        "-interaction=nonstopmode".to_string(),
        "-file-line-error".to_string(),
    ];

    // Add user-provided arguments
    cmd_args.extend(args);

    // Add the main file
    cmd_args.push(main_file.clone());

    // Create the command
    let mut cmd = Command::new(&compiler_path);
    cmd.current_dir(&directory)
        .args(&cmd_args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    // Ensure PATH includes common TeX directories
    let env_path = std::env::var("PATH").unwrap_or_default();
    #[cfg(target_os = "macos")]
    let env_path = {
        if !env_path.contains("/Library/TeX/texbin") {
            format!("/Library/TeX/texbin:/opt/homebrew/bin:/usr/local/bin:{}", env_path)
        } else {
            env_path
        }
    };
    cmd.env("PATH", env_path);

    // Spawn the process
    let child = cmd.spawn().map_err(|e| format!("Failed to start compiler: {}", e))?;

    // Store the child process
    {
        let mut process_guard = state.current_process.lock().await;
        *process_guard = Some(child);
    }

    // Get stdout and stderr
    let stdout;
    let stderr;
    {
        let mut process_guard = state.current_process.lock().await;
        if let Some(ref mut child) = *process_guard {
            stdout = child.stdout.take();
            stderr = child.stderr.take();
        } else {
            return Err("Process not found".to_string());
        }
    }

    // Stream output
    let app_clone = app.clone();
    let stdout_handle = if let Some(stdout) = stdout {
        let app = app_clone.clone();
        Some(tokio::spawn(async move {
            let reader = BufReader::new(stdout);
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                let is_error = line.contains("!") ||
                              line.contains("Error") ||
                              line.contains("error") ||
                              line.starts_with("l.");
                let is_warning = line.contains("Warning") ||
                                line.contains("warning") ||
                                line.contains("Overfull") ||
                                line.contains("Underfull");

                let event = CompileOutputEvent {
                    line,
                    is_error,
                    is_warning,
                };
                let _ = app.emit("latex-compile-output", &event);
            }
        }))
    } else {
        None
    };

    let stderr_handle = if let Some(stderr) = stderr {
        let app = app_clone;
        Some(tokio::spawn(async move {
            let reader = BufReader::new(stderr);
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                let event = CompileOutputEvent {
                    line,
                    is_error: true,
                    is_warning: false,
                };
                let _ = app.emit("latex-compile-output", &event);
            }
        }))
    } else {
        None
    };

    // Wait for output streams to finish
    if let Some(handle) = stdout_handle {
        let _ = handle.await;
    }
    if let Some(handle) = stderr_handle {
        let _ = handle.await;
    }

    // Wait for the process to complete
    let exit_code;
    {
        let mut process_guard = state.current_process.lock().await;
        if let Some(mut child) = process_guard.take() {
            match child.wait().await {
                Ok(status) => {
                    exit_code = status.code();
                }
                Err(e) => {
                    return Err(format!("Failed to wait for compiler: {}", e));
                }
            }
        } else {
            return Err("Process was terminated".to_string());
        }
    }

    // Determine the PDF path
    let pdf_name = main_file
        .strip_suffix(".tex")
        .unwrap_or(&main_file);
    let pdf_path = format!("{}/{}.pdf", directory, pdf_name);

    let pdf_exists = std::path::Path::new(&pdf_path).exists();

    let success = exit_code == Some(0) && pdf_exists;

    Ok(CompilationResult {
        success,
        exit_code,
        pdf_path: if pdf_exists { Some(pdf_path) } else { None },
        error: if !success && !pdf_exists {
            Some("PDF was not generated".to_string())
        } else if !success {
            Some(format!("Compilation failed with exit code {:?}", exit_code))
        } else {
            None
        },
    })
}

#[tauri::command]
pub async fn latex_stop_compilation(
    state: State<'_, LaTeXCompilationState>,
) -> Result<(), String> {
    let mut process_guard = state.current_process.lock().await;
    if let Some(mut child) = process_guard.take() {
        child.kill().await.map_err(|e| format!("Failed to stop compilation: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
pub async fn latex_clean_aux_files(
    directory: String,
    main_file: String,
) -> Result<(), String> {
    let base_name = main_file
        .strip_suffix(".tex")
        .unwrap_or(&main_file);

    let aux_extensions = [
        ".aux", ".log", ".out", ".toc", ".lof", ".lot",
        ".fls", ".fdb_latexmk", ".synctex.gz", ".synctex",
        ".bbl", ".blg", ".nav", ".snm", ".vrb",
    ];

    for ext in &aux_extensions {
        let file_path = format!("{}/{}{}", directory, base_name, ext);
        if std::path::Path::new(&file_path).exists() {
            let _ = std::fs::remove_file(&file_path);
        }
    }

    Ok(())
}
