use super::util::command;
use serde::{Deserialize, Serialize};
use std::process::Stdio;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Child;
use tokio::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LaTeXDistribution {
    pub name: String,
    pub id: String,
    pub description: String,
    pub install_command: Option<String>,
    pub download_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstallProgress {
    pub stage: String,
    pub message: String,
    pub progress: Option<f32>, // 0.0 to 1.0
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstallResult {
    pub success: bool,
    pub message: String,
    pub needs_restart: bool,
}

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
    let output = command(which_cmd).arg(name).output().await;

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
        // TinyTeX paths (most common for lightweight installs)
        if let Ok(appdata) = std::env::var("APPDATA") {
            paths.push(format!("{}\\TinyTeX\\bin\\windows\\{}.exe", appdata, name));
            paths.push(format!("{}\\TinyTeX\\bin\\win32\\{}.exe", appdata, name));
        }
        // TeX Live paths
        for year in (2020..=2030).rev() {
            paths.push(format!("C:\\texlive\\{}\\bin\\win32\\{}.exe", year, name));
            paths.push(format!("C:\\texlive\\{}\\bin\\windows\\{}.exe", year, name));
        }
        // MiKTeX paths
        paths.push(format!(
            "C:\\Program Files\\MiKTeX\\miktex\\bin\\x64\\{}.exe",
            name
        ));
        paths.push(format!(
            "C:\\Program Files (x86)\\MiKTeX\\miktex\\bin\\{}.exe",
            name
        ));
        // User MiKTeX
        if let Ok(home) = std::env::var("LOCALAPPDATA") {
            paths.push(format!(
                "{}\\Programs\\MiKTeX\\miktex\\bin\\x64\\{}.exe",
                home, name
            ));
        }
    }

    #[cfg(target_os = "macos")]
    {
        // TinyTeX paths (check user home directory first)
        if let Ok(home) = std::env::var("HOME") {
            paths.push(format!(
                "{}/Library/TinyTeX/bin/universal-darwin/{}",
                home, name
            ));
            paths.push(format!(
                "{}/Library/TinyTeX/bin/x86_64-darwin/{}",
                home, name
            ));
            paths.push(format!(
                "{}/Library/TinyTeX/bin/arm64-darwin/{}",
                home, name
            ));
        }
        paths.push(format!("/Library/TeX/texbin/{}", name));
        paths.push(format!("/opt/homebrew/bin/{}", name));
        paths.push(format!("/usr/local/bin/{}", name));
        paths.push(format!(
            "/usr/local/texlive/2024/bin/universal-darwin/{}",
            name
        ));
        paths.push(format!(
            "/usr/local/texlive/2023/bin/universal-darwin/{}",
            name
        ));
    }

    #[cfg(target_os = "linux")]
    {
        // TinyTeX paths
        if let Ok(home) = std::env::var("HOME") {
            paths.push(format!("{}/.TinyTeX/bin/x86_64-linux/{}", home, name));
            paths.push(format!("{}/bin/{}", home, name));
        }
        paths.push(format!("/usr/bin/{}", name));
        paths.push(format!("/usr/local/bin/{}", name));
        for year in (2020..=2030).rev() {
            paths.push(format!(
                "/usr/local/texlive/{}/bin/x86_64-linux/{}",
                year, name
            ));
        }
    }

    paths
}

async fn get_compiler_version(name: &str, path: &str) -> Option<String> {
    let output = command(path).arg("--version").output().await.ok()?;

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

fn has_any_compiler(status: &LaTeXCompilersStatus) -> bool {
    status.pdflatex.available
        || status.xelatex.available
        || status.lualatex.available
        || status.latexmk.available
}

async fn is_compiler_detectable_after_install() -> bool {
    match latex_detect_compilers().await {
        Ok(status) => has_any_compiler(&status),
        Err(_) => false,
    }
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
        "-synctex=1".to_string(),
    ];

    // Add user-provided arguments
    cmd_args.extend(args);

    // Add the main file
    cmd_args.push(main_file.clone());

    // Create the command
    let mut cmd = command(&compiler_path);
    cmd.current_dir(&directory)
        .args(&cmd_args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    // Ensure PATH includes common TeX directories
    let env_path = std::env::var("PATH").unwrap_or_default();
    #[cfg(target_os = "macos")]
    let env_path = {
        if !env_path.contains("/Library/TeX/texbin") {
            format!(
                "/Library/TeX/texbin:/opt/homebrew/bin:/usr/local/bin:{}",
                env_path
            )
        } else {
            env_path
        }
    };
    cmd.env("PATH", env_path);

    // Spawn the process
    let child = cmd
        .spawn()
        .map_err(|e| format!("Failed to start compiler: {}", e))?;

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
                let is_error = line.contains("!")
                    || line.contains("Error")
                    || line.contains("error")
                    || line.starts_with("l.");
                let is_warning = line.contains("Warning")
                    || line.contains("warning")
                    || line.contains("Overfull")
                    || line.contains("Underfull");

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
    let pdf_name = main_file.strip_suffix(".tex").unwrap_or(&main_file);
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
pub async fn latex_stop_compilation(state: State<'_, LaTeXCompilationState>) -> Result<(), String> {
    let mut process_guard = state.current_process.lock().await;
    if let Some(mut child) = process_guard.take() {
        child
            .kill()
            .await
            .map_err(|e| format!("Failed to stop compilation: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
pub async fn latex_clean_aux_files(directory: String, main_file: String) -> Result<(), String> {
    let base_name = main_file.strip_suffix(".tex").unwrap_or(&main_file);

    let aux_extensions = [
        ".aux",
        ".log",
        ".out",
        ".toc",
        ".lof",
        ".lot",
        ".fls",
        ".fdb_latexmk",
        ".bbl",
        ".blg",
        ".nav",
        ".snm",
        ".vrb",
    ];

    for ext in &aux_extensions {
        let file_path = format!("{}/{}{}", directory, base_name, ext);
        if std::path::Path::new(&file_path).exists() {
            let _ = std::fs::remove_file(&file_path);
        }
    }

    Ok(())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SynctexResult {
    pub file: String,
    pub line: u32,
    pub column: u32,
}

#[tauri::command]
pub async fn latex_synctex_edit(
    pdf_path: String,
    page: u32,
    x: f64,
    y: f64,
) -> Result<SynctexResult, String> {
    // Find the synctex binary using the same logic as compiler detection
    let synctex_info = find_compiler("synctex").await;
    let synctex_bin = if synctex_info.available {
        synctex_info.path.unwrap_or_else(|| "synctex".to_string())
    } else {
        return Err("SYNCTEX_NOT_INSTALLED: SyncTeX binary was not found. Install a TeX distribution (TeX Live, MiKTeX, or TinyTeX) to enable PDF-to-source navigation.".to_string());
    };

    let input_spec = format!("{}:{}:{}:{}", page, x, y, pdf_path);
    let mut cmd = command(&synctex_bin);
    cmd.arg("edit").arg("-o").arg(&input_spec);

    // Ensure PATH includes common TeX directories
    let env_path = std::env::var("PATH").unwrap_or_default();
    #[cfg(target_os = "macos")]
    let env_path = {
        if !env_path.contains("/Library/TeX/texbin") {
            format!(
                "/Library/TeX/texbin:/opt/homebrew/bin:/usr/local/bin:{}",
                env_path
            )
        } else {
            env_path
        }
    };
    cmd.env("PATH", env_path);

    let output = cmd
        .output()
        .await
        .map_err(|e| format!("Failed to run synctex: {} (bin={})", e, synctex_bin))?;

    let decode_bytes = |bytes: &[u8]| -> String {
        // Try UTF-8 first
        if let Ok(s) = String::from_utf8(bytes.to_vec()) {
            return s;
        }
        // On Windows with CJK locale, command output is often GBK-encoded
        #[cfg(target_os = "windows")]
        {
            let (decoded, _, _) = encoding_rs::GBK.decode(bytes);
            return decoded.into_owned();
        }
        #[cfg(not(target_os = "windows"))]
        {
            String::from_utf8_lossy(bytes).into_owned()
        }
    };

    if !output.status.success() {
        let stderr = decode_bytes(&output.stderr);
        return Err(format!("synctex edit failed: {}", stderr));
    }

    let stdout = decode_bytes(&output.stdout);

    // Parse the output to extract Input, Line, Column
    let mut file = String::new();
    let mut line: u32 = 0;
    let mut column: u32 = 0;

    for output_line in stdout.lines() {
        if let Some(val) = output_line.strip_prefix("Input:") {
            file = val.trim().to_string();
        } else if let Some(val) = output_line.strip_prefix("Line:") {
            line = val.trim().parse().unwrap_or(0);
        } else if let Some(val) = output_line.strip_prefix("Column:") {
            column = val.trim().parse().unwrap_or(0);
        }
    }

    if file.is_empty() || line == 0 {
        return Err("Could not find source location for this position".to_string());
    }

    Ok(SynctexResult { file, line, column })
}

/// Quick-install synctex via tlmgr (when a TeX distribution already exists).
/// Returns Ok(true) if tlmgr was found and install succeeded,
/// Ok(false) if tlmgr is not available (no TeX distribution).
#[tauri::command]
pub async fn latex_install_synctex() -> Result<bool, String> {
    let tlmgr_info = find_compiler("tlmgr").await;
    if !tlmgr_info.available {
        // No tlmgr → no TeX distribution, caller should fall back to full install
        return Ok(false);
    }

    let tlmgr_bin = tlmgr_info.path.unwrap_or_else(|| "tlmgr".to_string());

    let mut cmd = command(&tlmgr_bin);
    cmd.args(["install", "--reinstall", "synctex"]);

    // Ensure PATH includes common TeX directories
    let env_path = std::env::var("PATH").unwrap_or_default();
    #[cfg(target_os = "macos")]
    let env_path = {
        if !env_path.contains("/Library/TeX/texbin") {
            format!(
                "/Library/TeX/texbin:/opt/homebrew/bin:/usr/local/bin:{}",
                env_path
            )
        } else {
            env_path
        }
    };
    cmd.env("PATH", env_path);

    let output = cmd
        .output()
        .await
        .map_err(|e| format!("Failed to run tlmgr: {}", e))?;

    if output.status.success() {
        Ok(true)
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("tlmgr install synctex failed: {}", stderr))
    }
}

/// Get recommended LaTeX distributions for the current platform
#[tauri::command]
pub async fn latex_get_distributions() -> Result<Vec<LaTeXDistribution>, String> {
    let mut distributions = Vec::new();

    #[cfg(target_os = "windows")]
    {
        distributions.push(LaTeXDistribution {
            name: "TinyTeX".to_string(),
            id: "tinytex".to_string(),
            description: "Recommended. Lightweight (~150MB), cross-platform, with on-demand package installation.".to_string(),
            install_command: Some("tinytex-install".to_string()), // Special marker for our installer
            download_url: Some("https://yihui.org/tinytex/".to_string()),
        });
        distributions.push(LaTeXDistribution {
            name: "MiKTeX".to_string(),
            id: "miktex".to_string(),
            description: "Popular Windows distribution with on-demand package installation."
                .to_string(),
            install_command: Some("winget install MiKTeX.MiKTeX".to_string()),
            download_url: Some("https://miktex.org/download".to_string()),
        });
        distributions.push(LaTeXDistribution {
            name: "TeX Live".to_string(),
            id: "texlive".to_string(),
            description: "Full-featured distribution, larger download size (~4GB).".to_string(),
            install_command: None,
            download_url: Some("https://tug.org/texlive/acquire-netinstall.html".to_string()),
        });
    }

    #[cfg(target_os = "macos")]
    {
        distributions.push(LaTeXDistribution {
            name: "TinyTeX".to_string(),
            id: "tinytex".to_string(),
            description: "Recommended. Lightweight (~150MB), cross-platform, with on-demand package installation.".to_string(),
            install_command: Some("tinytex-install".to_string()), // Special marker for our installer
            download_url: Some("https://yihui.org/tinytex/".to_string()),
        });
        distributions.push(LaTeXDistribution {
            name: "BasicTeX".to_string(),
            id: "basictex".to_string(),
            description:
                "Smaller installation (~100MB). May need to install additional packages via tlmgr."
                    .to_string(),
            install_command: Some("brew install --cask basictex".to_string()),
            download_url: Some("https://tug.org/mactex/morepackages.html".to_string()),
        });
        distributions.push(LaTeXDistribution {
            name: "MacTeX".to_string(),
            id: "mactex".to_string(),
            description: "Full TeX Live distribution with Mac-specific tools (~5GB).".to_string(),
            install_command: Some("brew install --cask mactex".to_string()),
            download_url: Some("https://tug.org/mactex/".to_string()),
        });
    }

    #[cfg(target_os = "linux")]
    {
        distributions.push(LaTeXDistribution {
            name: "TinyTeX".to_string(),
            id: "tinytex".to_string(),
            description: "Recommended. Lightweight (~150MB), cross-platform, with on-demand package installation.".to_string(),
            install_command: Some("tinytex-install".to_string()), // Special marker for our installer
            download_url: Some("https://yihui.org/tinytex/".to_string()),
        });
        distributions.push(LaTeXDistribution {
            name: "TeX Live (Full)".to_string(),
            id: "texlive-full".to_string(),
            description: "Complete TeX Live installation with all packages (~5GB).".to_string(),
            install_command: Some(get_linux_install_command("texlive-full")),
            download_url: Some("https://tug.org/texlive/".to_string()),
        });
        distributions.push(LaTeXDistribution {
            name: "TeX Live (Basic + CJK)".to_string(),
            id: "texlive-cjk".to_string(),
            description: "Basic installation with CJK (Chinese/Japanese/Korean) support."
                .to_string(),
            install_command: Some(get_linux_install_command("texlive-cjk")),
            download_url: None,
        });
    }

    Ok(distributions)
}

#[cfg(target_os = "linux")]
fn get_linux_install_command(package: &str) -> String {
    // Try to detect the package manager
    if std::path::Path::new("/usr/bin/apt").exists() {
        // Debian/Ubuntu
        match package {
            "texlive-full" => "sudo apt install -y texlive-full".to_string(),
            "texlive-cjk" => "sudo apt install -y texlive-base texlive-xetex texlive-lang-chinese texlive-lang-japanese texlive-lang-korean".to_string(),
            _ => format!("sudo apt install -y {}", package),
        }
    } else if std::path::Path::new("/usr/bin/dnf").exists() {
        // Fedora/RHEL
        match package {
            "texlive-full" => "sudo dnf install -y texlive-scheme-full".to_string(),
            "texlive-cjk" => {
                "sudo dnf install -y texlive-scheme-basic texlive-xetex texlive-ctex".to_string()
            }
            _ => format!("sudo dnf install -y {}", package),
        }
    } else if std::path::Path::new("/usr/bin/pacman").exists() {
        // Arch Linux
        match package {
            "texlive-full" => "sudo pacman -S --noconfirm texlive".to_string(),
            "texlive-cjk" => "sudo pacman -S --noconfirm texlive-basic texlive-xetex texlive-langchinese texlive-langjapanese texlive-langkorean".to_string(),
            _ => format!("sudo pacman -S --noconfirm {}", package),
        }
    } else {
        "# Please install TeX Live manually from https://tug.org/texlive/".to_string()
    }
}

/// Install LaTeX distribution
#[tauri::command]
pub async fn latex_install(
    app: AppHandle,
    distribution_id: String,
) -> Result<InstallResult, String> {
    // Emit initial progress
    let _ = app.emit(
        "latex-install-progress",
        InstallProgress {
            stage: "starting".to_string(),
            message: "Preparing installation...".to_string(),
            progress: Some(0.0),
        },
    );

    #[cfg(target_os = "windows")]
    {
        return install_windows(&app, &distribution_id).await;
    }

    #[cfg(target_os = "macos")]
    {
        return install_macos(&app, &distribution_id).await;
    }

    #[cfg(target_os = "linux")]
    {
        return install_linux(&app, &distribution_id).await;
    }

    #[allow(unreachable_code)]
    Err("Unsupported platform".to_string())
}

#[cfg(target_os = "windows")]
async fn install_windows(app: &AppHandle, distribution_id: &str) -> Result<InstallResult, String> {
    match distribution_id {
        "tinytex" => install_tinytex_windows(app).await,
        "miktex" => install_miktex_windows(app).await,
        _ => Ok(InstallResult {
            success: false,
            message:
                "Please download and install this distribution manually from the official website."
                    .to_string(),
            needs_restart: false,
        }),
    }
}

#[cfg(target_os = "windows")]
async fn install_tinytex_windows(app: &AppHandle) -> Result<InstallResult, String> {
    let _ = app.emit(
        "latex-install-progress",
        InstallProgress {
            stage: "downloading".to_string(),
            message: "Downloading TinyTeX installer...".to_string(),
            progress: Some(0.1),
        },
    );

    // Download the install script
    let temp_dir = std::env::temp_dir();
    let script_path = temp_dir.join("install-tinytex.bat");

    let mut child = command("powershell")
        .args([
            "-NoProfile",
            "-Command",
            &format!(
                "Invoke-WebRequest -Uri 'https://yihui.org/tinytex/install-bin-windows.bat' -OutFile '{}'",
                script_path.display()
            ),
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to download installer: {}", e))?;

    let status = child
        .wait()
        .await
        .map_err(|e| format!("Download failed: {}", e))?;

    if !status.success() {
        return Ok(InstallResult {
            success: false,
            message: "Failed to download TinyTeX installer. Please check your internet connection or download manually from https://yihui.org/tinytex/".to_string(),
            needs_restart: false,
        });
    }

    let _ = app.emit(
        "latex-install-progress",
        InstallProgress {
            stage: "installing".to_string(),
            message: "Installing TinyTeX... This may take a few minutes.".to_string(),
            progress: Some(0.3),
        },
    );

    // Run the install script
    let mut child = command("cmd")
        .args(["/c", &script_path.to_string_lossy()])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to run installer: {}", e))?;

    // Stream output
    if let Some(stdout) = child.stdout.take() {
        let app_clone = app.clone();
        tokio::spawn(async move {
            let reader = BufReader::new(stdout);
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                let _ = app_clone.emit(
                    "latex-install-progress",
                    InstallProgress {
                        stage: "installing".to_string(),
                        message: line,
                        progress: None,
                    },
                );
            }
        });
    }

    let status = child
        .wait()
        .await
        .map_err(|e| format!("Installation failed: {}", e))?;

    // Clean up
    let _ = std::fs::remove_file(&script_path);

    if status.success() {
        let detected = is_compiler_detectable_after_install().await;
        let _ = app.emit(
            "latex-install-progress",
            InstallProgress {
                stage: "complete".to_string(),
                message: "TinyTeX installed successfully!".to_string(),
                progress: Some(1.0),
            },
        );

        Ok(InstallResult {
            success: true,
            message: if detected {
                "TinyTeX installed successfully and compiler detection is ready.".to_string()
            } else {
                "TinyTeX installed successfully. Please restart the application to detect the new installation."
                    .to_string()
            },
            needs_restart: !detected,
        })
    } else {
        Ok(InstallResult {
            success: false,
            message: "Installation failed. Please try downloading TinyTeX manually from https://yihui.org/tinytex/".to_string(),
            needs_restart: false,
        })
    }
}

#[cfg(target_os = "windows")]
async fn install_miktex_windows(app: &AppHandle) -> Result<InstallResult, String> {
    // Check if winget is available
    let _ = app.emit(
        "latex-install-progress",
        InstallProgress {
            stage: "checking".to_string(),
            message: "Checking for winget...".to_string(),
            progress: Some(0.1),
        },
    );

    let winget_check = command("winget").arg("--version").output().await;

    if winget_check.is_err() || !winget_check.unwrap().status.success() {
        return Ok(InstallResult {
            success: false,
            message: "winget is not available. Please install MiKTeX manually from https://miktex.org/download".to_string(),
            needs_restart: false,
        });
    }

    // Install MiKTeX via winget
    let _ = app.emit(
        "latex-install-progress",
        InstallProgress {
            stage: "installing".to_string(),
            message: "Installing MiKTeX via winget... This may take several minutes.".to_string(),
            progress: Some(0.2),
        },
    );

    let mut child = command("winget")
        .args([
            "install",
            "MiKTeX.MiKTeX",
            "--accept-package-agreements",
            "--accept-source-agreements",
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start winget: {}", e))?;

    // Stream output
    if let Some(stdout) = child.stdout.take() {
        let app_clone = app.clone();
        tokio::spawn(async move {
            let reader = BufReader::new(stdout);
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                let _ = app_clone.emit(
                    "latex-install-progress",
                    InstallProgress {
                        stage: "installing".to_string(),
                        message: line,
                        progress: None,
                    },
                );
            }
        });
    }

    let status = child
        .wait()
        .await
        .map_err(|e| format!("Installation failed: {}", e))?;

    if status.success() {
        let detected = is_compiler_detectable_after_install().await;
        let _ = app.emit(
            "latex-install-progress",
            InstallProgress {
                stage: "complete".to_string(),
                message: "MiKTeX installed successfully!".to_string(),
                progress: Some(1.0),
            },
        );

        Ok(InstallResult {
            success: true,
            message: if detected {
                "MiKTeX installed successfully and compiler detection is ready.".to_string()
            } else {
                "MiKTeX installed successfully. Please restart the application to detect the new installation."
                    .to_string()
            },
            needs_restart: !detected,
        })
    } else {
        Ok(InstallResult {
            success: false,
            message: "Installation failed. Please try installing MiKTeX manually from https://miktex.org/download".to_string(),
            needs_restart: false,
        })
    }
}

#[cfg(target_os = "macos")]
async fn install_macos(app: &AppHandle, distribution_id: &str) -> Result<InstallResult, String> {
    match distribution_id {
        "tinytex" => install_tinytex_unix(app).await,
        "mactex" | "basictex" => install_brew_cask(app, distribution_id).await,
        _ => Ok(InstallResult {
            success: false,
            message: "Unknown distribution".to_string(),
            needs_restart: false,
        }),
    }
}

#[cfg(any(target_os = "macos", target_os = "linux"))]
async fn install_tinytex_unix(app: &AppHandle) -> Result<InstallResult, String> {
    let _ = app.emit(
        "latex-install-progress",
        InstallProgress {
            stage: "downloading".to_string(),
            message: "Downloading and installing TinyTeX...".to_string(),
            progress: Some(0.1),
        },
    );

    // Use curl to download and execute the install script
    let mut child = command("sh")
        .args([
            "-c",
            "curl -sL 'https://yihui.org/tinytex/install-bin-unix.sh' | sh",
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start installer: {}", e))?;

    // Stream stdout
    if let Some(stdout) = child.stdout.take() {
        let app_clone = app.clone();
        tokio::spawn(async move {
            let reader = BufReader::new(stdout);
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                let _ = app_clone.emit(
                    "latex-install-progress",
                    InstallProgress {
                        stage: "installing".to_string(),
                        message: line,
                        progress: None,
                    },
                );
            }
        });
    }

    // Stream stderr (TinyTeX installer outputs progress to stderr)
    if let Some(stderr) = child.stderr.take() {
        let app_clone = app.clone();
        tokio::spawn(async move {
            let reader = BufReader::new(stderr);
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                let _ = app_clone.emit(
                    "latex-install-progress",
                    InstallProgress {
                        stage: "installing".to_string(),
                        message: line,
                        progress: None,
                    },
                );
            }
        });
    }

    let status = child
        .wait()
        .await
        .map_err(|e| format!("Installation failed: {}", e))?;

    if status.success() {
        let detected = is_compiler_detectable_after_install().await;
        let _ = app.emit(
            "latex-install-progress",
            InstallProgress {
                stage: "complete".to_string(),
                message: "TinyTeX installed successfully!".to_string(),
                progress: Some(1.0),
            },
        );

        Ok(InstallResult {
            success: true,
            message: if detected {
                "TinyTeX installed successfully and compiler detection is ready.".to_string()
            } else {
                "TinyTeX installed successfully. Please restart the application to detect the new installation."
                    .to_string()
            },
            needs_restart: !detected,
        })
    } else {
        Ok(InstallResult {
            success: false,
            message: "Installation failed. Please try downloading TinyTeX manually from https://yihui.org/tinytex/".to_string(),
            needs_restart: false,
        })
    }
}

#[cfg(target_os = "macos")]
async fn install_brew_cask(
    app: &AppHandle,
    distribution_id: &str,
) -> Result<InstallResult, String> {
    // Check if Homebrew is available
    let _ = app.emit(
        "latex-install-progress",
        InstallProgress {
            stage: "checking".to_string(),
            message: "Checking for Homebrew...".to_string(),
            progress: Some(0.1),
        },
    );

    let brew_check = command("brew").arg("--version").output().await;

    if brew_check.is_err() || !brew_check.unwrap().status.success() {
        return Ok(InstallResult {
            success: false,
            message: "Homebrew is not installed. Please install Homebrew first (https://brew.sh) or download manually.".to_string(),
            needs_restart: false,
        });
    }

    let cask = match distribution_id {
        "mactex" => "mactex",
        "basictex" => "basictex",
        _ => {
            return Ok(InstallResult {
                success: false,
                message: "Unknown distribution".to_string(),
                needs_restart: false,
            });
        }
    };

    let _ = app.emit(
        "latex-install-progress",
        InstallProgress {
            stage: "installing".to_string(),
            message: format!("Installing {} via Homebrew... This may take a while.", cask),
            progress: Some(0.2),
        },
    );

    let mut child = command("brew")
        .args(["install", "--cask", cask])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start brew: {}", e))?;

    // Stream output
    if let Some(stdout) = child.stdout.take() {
        let app_clone = app.clone();
        tokio::spawn(async move {
            let reader = BufReader::new(stdout);
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                let _ = app_clone.emit(
                    "latex-install-progress",
                    InstallProgress {
                        stage: "installing".to_string(),
                        message: line,
                        progress: None,
                    },
                );
            }
        });
    }

    let status = child
        .wait()
        .await
        .map_err(|e| format!("Installation failed: {}", e))?;

    if status.success() {
        let detected = is_compiler_detectable_after_install().await;
        let _ = app.emit(
            "latex-install-progress",
            InstallProgress {
                stage: "complete".to_string(),
                message: format!("{} installed successfully!", cask),
                progress: Some(1.0),
            },
        );

        Ok(InstallResult {
            success: true,
            message: if detected {
                format!(
                    "{} installed successfully and compiler detection is ready.",
                    cask
                )
            } else {
                format!(
                    "{} installed successfully. Please restart the application to detect the new installation.",
                    cask
                )
            },
            needs_restart: !detected,
        })
    } else {
        Ok(InstallResult {
            success: false,
            message: format!(
                "Installation failed. Please try installing {} manually.",
                cask
            ),
            needs_restart: false,
        })
    }
}

#[cfg(target_os = "linux")]
async fn install_linux(app: &AppHandle, distribution_id: &str) -> Result<InstallResult, String> {
    // TinyTeX can be installed without sudo
    if distribution_id == "tinytex" {
        return install_tinytex_unix(app).await;
    }

    let install_cmd = get_linux_install_command(distribution_id);

    if install_cmd.starts_with('#') {
        return Ok(InstallResult {
            success: false,
            message: "Could not detect package manager. Please install TeX Live manually."
                .to_string(),
            needs_restart: false,
        });
    }

    let _ = app.emit(
        "latex-install-progress",
        InstallProgress {
            stage: "installing".to_string(),
            message: format!("Running: {}", install_cmd),
            progress: Some(0.1),
        },
    );

    // For Linux, we need to show the user the command since it requires sudo
    // We can't run sudo directly from the app without a proper privilege escalation mechanism
    Ok(InstallResult {
        success: false,
        message: format!(
            "Please run the following command in your terminal to install LaTeX:\n\n{}\n\nAfter installation, restart the application.",
            install_cmd
        ),
        needs_restart: true,
    })
}

/// Open the download URL for manual installation
#[tauri::command]
pub async fn latex_open_download_page(app: AppHandle, url: String) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    app.opener()
        .open_url(&url, None::<&str>)
        .map_err(|e| format!("Failed to open URL: {}", e))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MainFileDetectionResult {
    /// The detected main file, if any
    pub main_file: Option<String>,
    /// All .tex files found in the directory
    pub tex_files: Vec<String>,
    /// Detection method used
    pub detection_method: String,
    /// Whether user input is needed (multiple candidates, none found)
    pub needs_user_input: bool,
    /// Message explaining the detection result
    pub message: String,
}

/// Detect the main LaTeX file in a directory
#[tauri::command]
pub async fn latex_detect_main_file(
    directory: String,
    configured_main_file: Option<String>,
) -> Result<MainFileDetectionResult, String> {
    use std::path::Path;
    use walkdir::WalkDir;

    let dir_path = Path::new(&directory);
    if !dir_path.exists() {
        return Err("Directory does not exist".to_string());
    }

    // Step 1: Check if configured main file exists
    if let Some(ref main_file) = configured_main_file {
        let main_path = dir_path.join(main_file);
        if main_path.exists() {
            return Ok(MainFileDetectionResult {
                main_file: Some(main_file.clone()),
                tex_files: vec![main_file.clone()],
                detection_method: "configured".to_string(),
                needs_user_input: false,
                message: format!("Using configured main file: {}", main_file),
            });
        }
    }

    // Step 2: Find all .tex files (non-recursive for now, just top level)
    let mut tex_files: Vec<String> = Vec::new();
    for entry in WalkDir::new(&directory)
        .max_depth(1)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        if path.is_file() {
            if let Some(ext) = path.extension() {
                if ext == "tex" {
                    if let Some(name) = path.file_name() {
                        tex_files.push(name.to_string_lossy().to_string());
                    }
                }
            }
        }
    }

    // Step 3: If only one .tex file, use it
    if tex_files.len() == 1 {
        let main_file = tex_files[0].clone();
        return Ok(MainFileDetectionResult {
            main_file: Some(main_file.clone()),
            tex_files,
            detection_method: "single_file".to_string(),
            needs_user_input: false,
            message: format!("Only one .tex file found: {}", main_file),
        });
    }

    // Step 4: If no .tex files found
    if tex_files.is_empty() {
        return Ok(MainFileDetectionResult {
            main_file: None,
            tex_files: vec![],
            detection_method: "none".to_string(),
            needs_user_input: true,
            message: "No .tex files found in the project directory".to_string(),
        });
    }

    // Step 5: Multiple .tex files - try to detect main file by content
    let mut candidates: Vec<(String, i32)> = Vec::new();

    for tex_file in &tex_files {
        let file_path = dir_path.join(tex_file);
        if let Ok(content) = std::fs::read_to_string(&file_path) {
            let mut score = 0;

            // Check for \documentclass - strong indicator of main file
            if content.contains("\\documentclass") {
                score += 10;
            }

            // Check for \begin{document}
            if content.contains("\\begin{document}") {
                score += 5;
            }

            // Common main file names get bonus points
            let lower_name = tex_file.to_lowercase();
            if lower_name == "main.tex" {
                score += 8;
            } else if lower_name == "paper.tex"
                || lower_name == "article.tex"
                || lower_name == "thesis.tex"
                || lower_name == "dissertation.tex"
            {
                score += 5;
            } else if lower_name == "report.tex" || lower_name == "document.tex" {
                score += 3;
            }

            // Files that are typically included (not main files) get negative score
            if lower_name.starts_with("chapter") || lower_name.starts_with("section") {
                score -= 3;
            }
            if lower_name == "preamble.tex"
                || lower_name == "packages.tex"
                || lower_name == "macros.tex"
            {
                score -= 5;
            }
            if lower_name == "abstract.tex"
                || lower_name == "appendix.tex"
                || lower_name == "bibliography.tex"
            {
                score -= 3;
            }

            if score > 0 {
                candidates.push((tex_file.clone(), score));
            }
        }
    }

    // Sort by score descending
    candidates.sort_by(|a, b| b.1.cmp(&a.1));

    // If we have a clear winner (significantly higher score)
    if !candidates.is_empty() {
        let best = &candidates[0];
        let second_best_score = candidates.get(1).map(|c| c.1).unwrap_or(0);

        // If the best candidate has a significantly higher score
        if best.1 >= 10 && best.1 > second_best_score + 3 {
            return Ok(MainFileDetectionResult {
                main_file: Some(best.0.clone()),
                tex_files,
                detection_method: "auto_detected".to_string(),
                needs_user_input: false,
                message: format!(
                    "Auto-detected main file: {} (contains \\documentclass)",
                    best.0
                ),
            });
        }
    }

    // Step 6: Can't determine automatically - need user input
    // Sort tex_files to put likely candidates first
    let mut sorted_files = tex_files.clone();
    sorted_files.sort_by(|a, b| {
        let score_a = candidates
            .iter()
            .find(|c| &c.0 == a)
            .map(|c| c.1)
            .unwrap_or(0);
        let score_b = candidates
            .iter()
            .find(|c| &c.0 == b)
            .map(|c| c.1)
            .unwrap_or(0);
        score_b.cmp(&score_a)
    });

    Ok(MainFileDetectionResult {
        main_file: None,
        tex_files: sorted_files,
        detection_method: "ambiguous".to_string(),
        needs_user_input: true,
        message: format!(
            "Multiple .tex files found ({}). Please select the main file.",
            tex_files.len()
        ),
    })
}
