use serde::{Deserialize, Serialize};
use std::path::Path;
use tokio::fs;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::{Child, Command};
use tokio::sync::Mutex;
use tauri::{Emitter, AppHandle, State};

pub struct CompileProcess(pub Mutex<Option<Child>>);

impl Default for CompileProcess {
    fn default() -> Self {
        CompileProcess(Mutex::new(None))
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CompileResult {
    pub success: bool,
    pub code: Option<i32>,
    pub output: String,
    pub error: Option<String>,
}

#[tauri::command]
pub async fn find_main_tex(dir: String, current_file: Option<String>) -> Result<Option<String>, String> {
    let path = Path::new(&dir);
    
    if let Some(ref file) = current_file {
        if file.ends_with(".tex") {
            let full_path = path.join(file);
            if full_path.exists() {
                if let Ok(content) = fs::read_to_string(&full_path).await {
                    let has_documentclass = content.lines().any(|line| {
                        !line.trim_start().starts_with('%') && line.contains("\\documentclass")
                    });
                    if has_documentclass {
                        return Ok(Some(file.clone()));
                    }
                }
            }
        }
    }

    let mut entries = fs::read_dir(path).await.map_err(|e| e.to_string())?;
    
    while let Ok(Some(entry)) = entries.next_entry().await {
        let name = entry.file_name().to_string_lossy().to_string();
        if name == "main.tex" {
            return Ok(Some(name));
        }
    }

    let mut entries = fs::read_dir(path).await.map_err(|e| e.to_string())?;
    while let Ok(Some(entry)) = entries.next_entry().await {
        let name = entry.file_name().to_string_lossy().to_string();
        if name.ends_with(".tex") {
            return Ok(Some(name));
        }
    }

    Ok(None)
}

#[tauri::command]
pub async fn compile_latex(
    app: AppHandle,
    compile_process: State<'_, CompileProcess>,
    dir: String,
    #[allow(non_snake_case)]
    mainFile: String,
    engine: Option<String>,
) -> Result<CompileResult, String> {
    let engine = engine.unwrap_or_else(|| "xelatex".to_string());
    let engine_arg = match engine.as_str() {
        "xelatex" => "-xelatex",
        "lualatex" => "-lualatex",
        _ => "-pdf",
    };

    app.emit("compile-start", &mainFile).ok();

    let mut child = Command::new("latexmk")
        .args([
            engine_arg,
            "-interaction=nonstopmode",
            "-file-line-error",
            "-synctex=1",
            &mainFile,
        ])
        .current_dir(&dir)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| e.to_string())?;

    let stdout = child.stdout.take();
    
    {
        let mut process = compile_process.0.lock().await;
        *process = Some(child);
    }

    let mut output = String::new();
    let mut output_buffer = Vec::new();

    if let Some(stdout) = stdout {
        let mut reader = BufReader::new(stdout).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            output.push_str(&line);
            output.push('\n');
            output_buffer.push(line.clone());
            
            if output_buffer.len() >= 10 {
                let batch = output_buffer.join("\n");
                app.emit("compile-output", &batch).ok();
                output_buffer.clear();
            }
        }
        
        if !output_buffer.is_empty() {
            let batch = output_buffer.join("\n");
            app.emit("compile-output", &batch).ok();
        }
    }

    let status = {
        let mut process = compile_process.0.lock().await;
        if let Some(ref mut child) = *process {
            let status = child.wait().await.map_err(|e| e.to_string())?;
            *process = None;
            status
        } else {
            return Ok(CompileResult {
                success: false,
                code: None,
                output,
                error: Some("Compilation was stopped".to_string()),
            });
        }
    };
    
    let success = status.success();
    let code = status.code();

    let result = CompileResult {
        success,
        code,
        output,
        error: if success { None } else { Some("Compilation failed".to_string()) },
    };

    app.emit("compile-result", &result).ok();

    Ok(result)
}

#[tauri::command]
pub async fn stop_compile(
    compile_process: State<'_, CompileProcess>,
) -> Result<bool, String> {
    let mut process = compile_process.0.lock().await;
    if let Some(ref mut child) = *process {
        child.kill().await.map_err(|e| e.to_string())?;
        *process = None;
        Ok(true)
    } else {
        Ok(false)
    }
}
