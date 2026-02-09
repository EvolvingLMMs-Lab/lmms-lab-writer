use super::util::command;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct GhStatus {
    pub installed: bool,
    pub authenticated: bool,
    pub username: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GhRepoResult {
    pub url: String,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GitFileChange {
    pub path: String,
    pub status: String,
    pub staged: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GitStatus {
    pub branch: String,
    pub remote: Option<String>,
    pub ahead: i32,
    pub behind: i32,
    #[serde(rename = "hasUpstream")]
    pub has_upstream: bool,
    #[serde(rename = "hasCommits")]
    pub has_commits: bool,
    pub changes: Vec<GitFileChange>,
    #[serde(rename = "isRepo")]
    pub is_repo: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GitLogEntry {
    pub hash: String,
    #[serde(rename = "shortHash")]
    pub short_hash: String,
    pub message: String,
    pub author: String,
    pub date: String,
}

async fn run_git(cwd: &str, args: &[&str]) -> Result<String, String> {
    let output = command("git")
        .args(args)
        .current_dir(cwd)
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub async fn git_status(dir: String) -> Result<GitStatus, String> {
    let git_dir = std::path::Path::new(&dir).join(".git");
    if !git_dir.exists() {
        return Ok(GitStatus {
            branch: String::new(),
            remote: None,
            ahead: 0,
            behind: 0,
            has_upstream: false,
            has_commits: false,
            changes: Vec::new(),
            is_repo: false,
        });
    }

    let dir_ref = &dir;

    // Check if repo has any commits
    let has_commits = run_git(dir_ref, &["rev-parse", "HEAD"]).await.is_ok();

    let (branch_result, status_result, remote_result, upstream_result, ahead_behind_result) = tokio::join!(
        async {
            if has_commits {
                run_git(dir_ref, &["rev-parse", "--abbrev-ref", "HEAD"]).await
            } else {
                // No commits yet - get branch from symbolic-ref or default to "main"
                run_git(dir_ref, &["symbolic-ref", "--short", "HEAD"])
                    .await
                    .or_else(|_| Ok("main".to_string()))
            }
        },
        run_git(dir_ref, &["status", "--porcelain"]),
        run_git(dir_ref, &["remote"]),
        async {
            if has_commits {
                run_git(
                    dir_ref,
                    &["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"],
                )
                .await
            } else {
                Err("no commits".to_string())
            }
        },
        async {
            if has_commits {
                run_git(
                    dir_ref,
                    &["rev-list", "--left-right", "--count", "HEAD...@{u}"],
                )
                .await
            } else {
                Ok("0\t0".to_string())
            }
        }
    );

    let branch = branch_result
        .unwrap_or_else(|_| "main".to_string())
        .trim()
        .to_string();
    let status_output = status_result.unwrap_or_default();
    let has_upstream = upstream_result.is_ok();

    let mut changes = Vec::new();
    for line in status_output.lines() {
        if line.len() < 3 {
            continue;
        }
        let staged =
            line.chars().next().unwrap_or(' ') != ' ' && line.chars().next().unwrap_or(' ') != '?';
        let status_char = if staged {
            line.chars().next().unwrap_or(' ')
        } else {
            line.chars().nth(1).unwrap_or(' ')
        };

        let status = match status_char {
            'M' => "modified",
            'A' => "added",
            'D' => "deleted",
            'R' => "renamed",
            '?' => "untracked",
            _ => "modified",
        }
        .to_string();

        let path = line[3..].trim().to_string();
        changes.push(GitFileChange {
            path,
            status,
            staged,
        });
    }

    let remote = remote_result
        .ok()
        .and_then(|r| r.lines().next().map(|s| s.to_string()));

    let remote_url = if let Some(ref name) = remote {
        run_git(dir_ref, &["remote", "get-url", name])
            .await
            .ok()
            .map(|u| u.trim().to_string())
    } else {
        None
    };

    let (ahead, behind) = ahead_behind_result
        .ok()
        .and_then(|output| {
            let parts: Vec<&str> = output.trim().split('\t').collect();
            if parts.len() == 2 {
                Some((parts[0].parse().unwrap_or(0), parts[1].parse().unwrap_or(0)))
            } else {
                None
            }
        })
        .unwrap_or((0, 0));

    Ok(GitStatus {
        branch,
        remote: remote_url,
        ahead,
        behind,
        has_upstream,
        has_commits,
        changes,
        is_repo: true,
    })
}

#[tauri::command]
pub async fn git_log(dir: String, limit: Option<i32>) -> Result<Vec<GitLogEntry>, String> {
    let limit = limit.unwrap_or(20);
    let format = "%H%n%h%n%s%n%an%n%ci%n---";

    let output = match run_git(
        &dir,
        &[
            "log",
            &format!("-{}", limit),
            &format!("--format={}", format),
        ],
    )
    .await
    {
        Ok(out) => out,
        Err(e) if e.contains("does not have any commits") => return Ok(Vec::new()),
        Err(e) => return Err(e),
    };

    let mut entries = Vec::new();
    for part in output.split("---\n").filter(|s| !s.is_empty()) {
        let lines: Vec<&str> = part.trim().lines().collect();
        if lines.len() >= 5 {
            entries.push(GitLogEntry {
                hash: lines[0].to_string(),
                short_hash: lines[1].to_string(),
                message: lines[2].to_string(),
                author: lines[3].to_string(),
                date: lines[4].to_string(),
            });
        }
    }

    Ok(entries)
}

#[tauri::command]
pub async fn git_graph(dir: String, limit: Option<i32>) -> Result<Vec<String>, String> {
    let limit = limit.unwrap_or(40).clamp(1, 200);
    let limit_arg = format!("-{}", limit);

    let output = match run_git(
        &dir,
        &[
            "log",
            limit_arg.as_str(),
            "--graph",
            "--decorate",
            "--oneline",
            "--all",
            "--no-color",
        ],
    )
    .await
    {
        Ok(out) => out,
        Err(e) if e.contains("does not have any commits") || e.contains("bad default revision") => {
            return Ok(Vec::new())
        }
        Err(e) => return Err(e),
    };

    Ok(output
        .lines()
        .map(|line| line.trim_end().to_string())
        .filter(|line| !line.is_empty())
        .collect())
}

#[tauri::command]
pub async fn git_diff(
    dir: String,
    file: Option<String>,
    staged: Option<bool>,
) -> Result<String, String> {
    let mut args = vec!["diff"];
    if staged.unwrap_or(false) {
        args.push("--staged");
    }
    if let Some(ref f) = file {
        args.push("--");
        args.push(f);
    }
    run_git(&dir, &args).await
}

#[tauri::command]
pub async fn git_discard_all(dir: String) -> Result<(), String> {
    // Restore all tracked modified/deleted files
    run_git(&dir, &["checkout", "--", "."]).await?;
    // Remove all untracked files and directories
    run_git(&dir, &["clean", "-fd"]).await?;
    Ok(())
}

#[tauri::command]
pub async fn git_discard_file(dir: String, file: String) -> Result<(), String> {
    // Check if it's an untracked file by looking at git status
    let status = run_git(&dir, &["status", "--porcelain", "--", &file]).await?;
    if status.starts_with("??") {
        // Untracked file: delete it
        let path = std::path::Path::new(&dir).join(&file);
        if path.is_dir() {
            std::fs::remove_dir_all(&path)
                .map_err(|e| format!("Failed to remove {}: {}", file, e))?;
        } else {
            std::fs::remove_file(&path).map_err(|e| format!("Failed to remove {}: {}", file, e))?;
        }
    } else {
        // Tracked file: restore it
        run_git(&dir, &["checkout", "--", &file]).await?;
    }
    Ok(())
}

#[tauri::command]
pub async fn git_unstage(dir: String, files: Vec<String>) -> Result<(), String> {
    let mut args = vec!["reset", "HEAD", "--"];
    let file_refs: Vec<&str> = files.iter().map(|s| s.as_str()).collect();
    args.extend(file_refs);
    run_git(&dir, &args).await?;
    Ok(())
}

#[tauri::command]
pub async fn git_add(dir: String, files: Vec<String>) -> Result<(), String> {
    let mut args = vec!["add"];
    let file_refs: Vec<&str> = files.iter().map(|s| s.as_str()).collect();
    args.extend(file_refs);
    run_git(&dir, &args).await?;
    Ok(())
}

#[tauri::command]
pub async fn git_commit(dir: String, message: String) -> Result<String, String> {
    run_git(&dir, &["commit", "-m", &message]).await?;
    run_git(&dir, &["rev-parse", "--short", "HEAD"])
        .await
        .map(|s| s.trim().to_string())
}

#[tauri::command]
pub async fn git_push(dir: String) -> Result<(), String> {
    let has_commits = run_git(&dir, &["rev-parse", "--verify", "HEAD"])
        .await
        .is_ok();
    if !has_commits {
        return Err("No commits to push".to_string());
    }

    if run_git(&dir, &["remote", "get-url", "origin"])
        .await
        .is_err()
    {
        return Err("No remote named 'origin'. Add or publish a remote first.".to_string());
    }

    let branch = run_git(&dir, &["rev-parse", "--abbrev-ref", "HEAD"])
        .await?
        .trim()
        .to_string();

    if branch == "HEAD" {
        return Err("Cannot push from detached HEAD".to_string());
    }

    let has_upstream = run_git(
        &dir,
        &["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"],
    )
    .await
    .is_ok();

    if has_upstream {
        run_git(&dir, &["push"]).await?;
    } else {
        run_git(&dir, &["push", "-u", "origin", &branch]).await?;
    }

    Ok(())
}

#[tauri::command]
pub async fn git_fetch(dir: String) -> Result<(), String> {
    let remotes = run_git(&dir, &["remote"]).await?;
    if remotes.lines().all(|line| line.trim().is_empty()) {
        return Ok(());
    }

    run_git(&dir, &["fetch", "--all", "--prune"]).await?;
    Ok(())
}

#[tauri::command]
pub async fn git_pull(dir: String) -> Result<(), String> {
    if run_git(&dir, &["remote", "get-url", "origin"])
        .await
        .is_err()
    {
        return Err("No remote named 'origin'. Add or publish a remote first.".to_string());
    }

    let branch = if run_git(&dir, &["rev-parse", "--verify", "HEAD"])
        .await
        .is_ok()
    {
        run_git(&dir, &["rev-parse", "--abbrev-ref", "HEAD"])
            .await?
            .trim()
            .to_string()
    } else {
        run_git(&dir, &["symbolic-ref", "--short", "HEAD"])
            .await
            .unwrap_or_else(|_| "main".to_string())
            .trim()
            .to_string()
    };

    if branch == "HEAD" {
        return Err("Cannot pull from detached HEAD".to_string());
    }

    let has_upstream = run_git(
        &dir,
        &["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"],
    )
    .await
    .is_ok();

    if has_upstream {
        run_git(&dir, &["pull"]).await?;
    } else {
        run_git(&dir, &["pull", "-u", "origin", &branch]).await?;
    }

    Ok(())
}

// Fallback .gitignore content from https://github.com/github/gitignore/blob/main/TeX.gitignore
const FALLBACK_TEX_GITIGNORE: &str = r#"## Core latex/pdflatex auxiliary files:
*.aux
*.lof
*.log
*.lot
*.fls
*.out
*.toc
*.fmt
*.fot
*.cb
*.cb2
.*.lb

## Intermediate documents:
*.dvi
*.xdv
*-converted-to.*

## Generated if empty string is given at "Please type another file name for output:"
.pdf

## Bibliography auxiliary files (bibtex/biblatex/biber):
*.bbl
*.bbl-SAVE-ERROR
*.bcf
*.bcf-SAVE-ERROR
*.blg
*-blx.aux
*-blx.bib
*.run.xml

## Build tool auxiliary files:
*.fdb_latexmk
*.synctex
*.synctex(busy)
*.synctex.gz
*.synctex.gz(busy)
*.pdfsync
*.rubbercache
rubber.cache

## Build tool directories for auxiliary files
latex.out/

## Auxiliary and intermediate files from other packages:
*.alg
*.loa
acs-*.bib
*.thm
*.atfi
*.nav
*.pre
*.snm
*.vrb
*.soc
*.loc
*.cut
*.cpt
*.spl
*.ent
*.lox
*.mf
*.mp
*.t[1-9]
*.t[1-9][0-9]
*.tfm
*.end
*.?end
*.[1-9]
*.[1-9][0-9]
*.[1-9][0-9][0-9]
*.[1-9]R
*.[1-9][0-9]R
*.[1-9][0-9][0-9]R
*.eledsec[1-9]
*.eledsec[1-9]R
*.eledsec[1-9][0-9]
*.eledsec[1-9][0-9]R
*.eledsec[1-9][0-9][0-9]
*.eledsec[1-9][0-9][0-9]R
*.acn
*.acr
*.glg
*.glg-abr
*.glo
*.glo-abr
*.gls
*.gls-abr
*.glsdefs
*.lzo
*.lzs
*.slg
*.slo
*.sls
*.gnuplot
*.table
*-gnuplottex-*
*.gaux
*.glog
*.gtex
*.4ct
*.4tc
*.idv
*.lg
*.trc
*.xref
*.hd
*.brf
*-concordance.tex
*-tikzDictionary
*.lol
*.ltjruby
*.idx
*.ilg
*.ind
*.maf
*.mlf
*.mlt
*.mtc[0-9]*
*.slf[0-9]*
*.slt[0-9]*
*.stc[0-9]*
_minted*
*.data.minted
*.pyg
*.mw
*.newpax
*.nlg
*.nlo
*.nls
*.pax
*.pdfpc
*.sagetex.sage
*.sagetex.py
*.sagetex.scmd
*.wrt
*.spell.bad
*.spell.txt
svg-inkscape/
*.sout
*.sympy
sympy-plots-for-*.tex/
*.upa
*.upb
*.pytxcode
pythontex-files-*/
*.listing
*.loe
*.dpth
*.md5
*.auxlock
*.ptc
*.tdo
*.hst
*.ver
*.lod
*.xcp
*.xmpi
*.xdy
*.xyc
*.xyd
*.ttt
*.fff
TSWLatexianTemp*

## Editors:
*.bak
*.sav
*.bak[0-9]*
.texpadtmp
*.lyx~
*.backup
.*.swp
*~[0-9]*
*.tps
./auto/*
*.el
*-tags.tex
*.sta
*.lpz
*.xwm

## OS files
.DS_Store
Thumbs.db
"#;

async fn fetch_gitignore() -> Option<String> {
    let url = "https://raw.githubusercontent.com/github/gitignore/main/TeX.gitignore";
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .ok()?;

    let response = client.get(url).send().await.ok()?;
    if response.status().is_success() {
        response.text().await.ok()
    } else {
        None
    }
}

#[tauri::command]
pub async fn git_init(dir: String) -> Result<(), String> {
    run_git(&dir, &["init"]).await?;

    // Create a .gitignore file for LaTeX projects
    let gitignore_path = std::path::Path::new(&dir).join(".gitignore");
    if !gitignore_path.exists() {
        // Try to fetch from GitHub, fallback to hardcoded version
        let gitignore_content = fetch_gitignore()
            .await
            .unwrap_or_else(|| FALLBACK_TEX_GITIGNORE.to_string());

        std::fs::write(&gitignore_path, gitignore_content)
            .map_err(|e| format!("Failed to create .gitignore: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn git_clone(url: String, directory: String) -> Result<String, String> {
    if url.starts_with('-') {
        return Err("Invalid URL: cannot start with '-'".to_string());
    }

    let output = command("git")
        .args(["clone", "--", &url, &directory])
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(directory)
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub async fn git_add_remote(dir: String, name: String, url: String) -> Result<(), String> {
    run_git(&dir, &["remote", "add", &name, &url]).await?;
    Ok(())
}

// ── GitHub CLI helpers ──────────────────────────────────────────────

async fn run_gh(args: &[&str]) -> Result<String, String> {
    let output = command("gh")
        .args(args)
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

async fn run_gh_in(cwd: &str, args: &[&str]) -> Result<String, String> {
    let output = command("gh")
        .args(args)
        .current_dir(cwd)
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub async fn gh_check() -> Result<GhStatus, String> {
    // Check if gh is installed
    let installed = run_gh(&["--version"]).await.is_ok();
    if !installed {
        return Ok(GhStatus {
            installed: false,
            authenticated: false,
            username: String::new(),
        });
    }

    // Only check the active account on github.com.
    // `gh auth status` without `--active` returns exit code 1 if *any* saved account is stale,
    // which can incorrectly look unauthenticated in apps.
    let output = command("gh")
        .args(["auth", "status", "--hostname", "github.com", "--active"])
        .output()
        .await
        .map_err(|e| e.to_string())?;

    let authenticated = output.status.success();
    let combined_output = format!(
        "{}\n{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    let username = combined_output
        .lines()
        .find_map(|line| {
            if let Some(pos) = line.find("account ") {
                let rest = &line[pos + 8..];
                Some(rest.split_whitespace().next().unwrap_or("").to_string())
            } else {
                None
            }
        })
        .unwrap_or_default();

    Ok(GhStatus {
        installed: true,
        authenticated,
        username,
    })
}

#[tauri::command]
pub async fn gh_auth_login() -> Result<String, String> {
    // Spawn gh auth login in a visible terminal so the user can see the device code
    // and complete the interactive browser-based auth flow.
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW_FLAG: u32 = 0x08000000;
        // The outer cmd is hidden; `start` creates a new visible console window.
        std::process::Command::new("cmd")
            .args([
                "/c",
                "start",
                "",
                "cmd",
                "/c",
                "gh auth login --web --git-protocol https --hostname github.com",
            ])
            .creation_flags(CREATE_NO_WINDOW_FLAG)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(not(target_os = "windows"))]
    {
        std::process::Command::new("gh")
            .args([
                "auth",
                "login",
                "--web",
                "--git-protocol",
                "https",
                "--hostname",
                "github.com",
            ])
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok("Authentication started".to_string())
}

#[tauri::command]
pub async fn gh_create_repo(
    dir: String,
    name: String,
    private: bool,
    description: Option<String>,
) -> Result<GhRepoResult, String> {
    let visibility = if private { "--private" } else { "--public" };
    let has_commits = run_git(&dir, &["rev-parse", "--verify", "HEAD"])
        .await
        .is_ok();

    let mut args = vec![
        "repo",
        "create",
        &name,
        visibility,
        "--source=.",
        "--remote=origin",
    ];

    if has_commits {
        args.push("--push");
    }

    let desc_string;
    if let Some(ref desc) = description {
        if !desc.trim().is_empty() {
            desc_string = format!("--description={}", desc);
            args.push(&desc_string);
        }
    }

    let output = run_gh_in(&dir, &args).await?;

    // gh repo create prints the URL on stdout
    let url = output.trim().to_string();

    Ok(GhRepoResult { url, name })
}
