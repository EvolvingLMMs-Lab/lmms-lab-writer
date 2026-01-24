import { WebSocketServer, WebSocket } from "ws";
import pty from "node-pty";
import chalk from "chalk";
import chokidar from "chokidar";
import {
  readdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  statSync,
} from "fs";
import { join, resolve, extname } from "path";
import { execSync, spawn } from "child_process";
import { homedir } from "os";
import { createServer, IncomingMessage, ServerResponse } from "http";

interface ServeOptions {
  port: number;
}

interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
}

interface GitInfo {
  branch: string;
  isDirty: boolean;
  lastCommit?: {
    hash: string;
    message: string;
    date: string;
  };
  remote?: {
    name: string;
    url: string;
  };
  ahead?: number;
  behind?: number;
}

interface GitFileChange {
  path: string;
  status: "modified" | "added" | "deleted" | "renamed" | "untracked";
  staged: boolean;
}

interface GitStatus {
  branch: string;
  remote?: string;
  ahead: number;
  behind: number;
  changes: GitFileChange[];
  isRepo: boolean;
}

interface GitLogEntry {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
}

interface ClientState {
  projectPath: string | null;
  ptyProcess: ReturnType<typeof pty.spawn> | null;
  watcher: ReturnType<typeof chokidar.watch> | null;
}

function getDefaultShell(): string {
  if (process.platform === "win32") {
    return process.env.COMSPEC || "powershell.exe";
  }
  return process.env.SHELL || "/bin/zsh";
}

function getFileTree(dir: string, basePath: string = ""): FileNode[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const nodes: FileNode[] = [];

  const ignoredDirs = new Set([
    "node_modules",
    ".git",
    ".next",
    "dist",
    "build",
    "__pycache__",
    ".cache",
    "out",
  ]);

  const ignoredExtensions = new Set([
    ".aux",
    ".log",
    ".out",
    ".toc",
    ".lof",
    ".lot",
    ".fls",
    ".fdb_latexmk",
    ".synctex.gz",
    ".bbl",
    ".blg",
  ]);

  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".latexmkrc") continue;
    if (ignoredDirs.has(entry.name)) continue;

    const fullPath = join(dir, entry.name);
    const relativePath = join(basePath, entry.name);

    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        path: relativePath,
        type: "directory",
        children: getFileTree(fullPath, relativePath),
      });
    } else {
      const ext = entry.name.slice(entry.name.lastIndexOf("."));
      if (ignoredExtensions.has(ext)) continue;

      nodes.push({
        name: entry.name,
        path: relativePath,
        type: "file",
      });
    }
  }

  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

function getGitInfo(cwd: string): GitInfo | null {
  try {
    const gitDir = join(cwd, ".git");
    if (!existsSync(gitDir)) return null;

    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      cwd,
      encoding: "utf-8",
    }).trim();
    const statusOutput = execSync("git status --porcelain", {
      cwd,
      encoding: "utf-8",
    });
    const isDirty = statusOutput.trim().length > 0;

    let lastCommit: GitInfo["lastCommit"] | undefined;
    try {
      const hash = execSync("git rev-parse --short HEAD", {
        cwd,
        encoding: "utf-8",
      }).trim();
      const message = execSync("git log -1 --format=%s", {
        cwd,
        encoding: "utf-8",
      }).trim();
      const date = execSync("git log -1 --format=%ci", {
        cwd,
        encoding: "utf-8",
      }).trim();
      lastCommit = { hash, message, date };
    } catch {
      // No commits yet
    }

    // Get remote info
    let remote: GitInfo["remote"] | undefined;
    try {
      const remoteName = execSync("git remote", { cwd, encoding: "utf-8" })
        .trim()
        .split("\n")[0];
      if (remoteName) {
        const remoteUrl = execSync(`git remote get-url ${remoteName}`, {
          cwd,
          encoding: "utf-8",
        }).trim();
        remote = { name: remoteName, url: remoteUrl };
      }
    } catch {
      // No remote
    }

    // Get ahead/behind
    let ahead = 0;
    let behind = 0;
    try {
      const aheadBehind = execSync(
        `git rev-list --left-right --count HEAD...@{u}`,
        { cwd, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
      ).trim();
      const [a, b] = aheadBehind.split("\t").map(Number);
      ahead = a ?? 0;
      behind = b ?? 0;
    } catch {
      // No tracking branch
    }

    return { branch, isDirty, lastCommit, remote, ahead, behind };
  } catch {
    return null;
  }
}

function getGitStatus(cwd: string): GitStatus {
  const gitDir = join(cwd, ".git");
  if (!existsSync(gitDir)) {
    return { branch: "", ahead: 0, behind: 0, changes: [], isRepo: false };
  }

  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      cwd,
      encoding: "utf-8",
    }).trim();
    const statusOutput = execSync("git status --porcelain", {
      cwd,
      encoding: "utf-8",
    });

    const changes: GitFileChange[] = [];
    for (const line of statusOutput.split("\n").filter(Boolean)) {
      const staged = line[0] !== " " && line[0] !== "?";
      const statusChar = staged ? line[0] : line[1];
      let status: GitFileChange["status"] = "modified";

      switch (statusChar) {
        case "M":
          status = "modified";
          break;
        case "A":
          status = "added";
          break;
        case "D":
          status = "deleted";
          break;
        case "R":
          status = "renamed";
          break;
        case "?":
          status = "untracked";
          break;
      }

      const path = line.slice(3).trim();
      changes.push({ path, status, staged });
    }

    // Get remote and ahead/behind
    let remote: string | undefined;
    let ahead = 0;
    let behind = 0;
    try {
      const remoteName = execSync("git remote", { cwd, encoding: "utf-8" })
        .trim()
        .split("\n")[0];
      if (remoteName) {
        remote = execSync(`git remote get-url ${remoteName}`, {
          cwd,
          encoding: "utf-8",
        }).trim();
        try {
          const aheadBehind = execSync(
            `git rev-list --left-right --count HEAD...@{u}`,
            { cwd, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
          ).trim();
          const [a, b] = aheadBehind.split("\t").map(Number);
          ahead = a ?? 0;
          behind = b ?? 0;
        } catch {
          // No tracking branch
        }
      }
    } catch {
      // No remote
    }

    return { branch, remote, ahead, behind, changes, isRepo: true };
  } catch {
    return { branch: "", ahead: 0, behind: 0, changes: [], isRepo: false };
  }
}

function getGitLog(cwd: string, limit = 20): GitLogEntry[] {
  try {
    const format = "%H%n%h%n%s%n%an%n%ci%n---";
    const output = execSync(`git log -${limit} --format="${format}"`, {
      cwd,
      encoding: "utf-8",
    });
    const entries: GitLogEntry[] = [];

    const parts = output.split("---\n").filter(Boolean);
    for (const part of parts) {
      const [hash, shortHash, message, author, date] = part.trim().split("\n");
      if (hash && shortHash && message && author && date) {
        entries.push({ hash, shortHash, message, author, date });
      }
    }

    return entries;
  } catch {
    return [];
  }
}

function getGitDiff(cwd: string, file?: string, staged = false): string {
  try {
    const stagedFlag = staged ? "--staged" : "";
    const fileArg = file ? `-- "${file}"` : "";
    return execSync(`git diff ${stagedFlag} ${fileArg}`, {
      cwd,
      encoding: "utf-8",
    });
  } catch {
    return "";
  }
}

function gitAdd(
  cwd: string,
  files: string[],
): { success: boolean; error?: string } {
  try {
    const fileArgs = files.map((f) => `"${f}"`).join(" ");
    execSync(`git add ${fileArgs}`, { cwd, encoding: "utf-8" });
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

function gitCommit(
  cwd: string,
  message: string,
): { success: boolean; error?: string; hash?: string } {
  try {
    execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
      cwd,
      encoding: "utf-8",
    });
    const hash = execSync("git rev-parse --short HEAD", {
      cwd,
      encoding: "utf-8",
    }).trim();
    return { success: true, hash };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

function gitPush(cwd: string): { success: boolean; error?: string } {
  try {
    execSync("git push", {
      cwd,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

function gitPull(cwd: string): { success: boolean; error?: string } {
  try {
    execSync("git pull", {
      cwd,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

function gitInit(cwd: string): { success: boolean; error?: string } {
  try {
    execSync("git init", { cwd, encoding: "utf-8" });
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

function gitClone(
  url: string,
  targetDir: string,
): { success: boolean; error?: string; path?: string } {
  try {
    execSync(`git clone "${url}" "${targetDir}"`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { success: true, path: targetDir };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

function readFile(cwd: string, relativePath: string): string | null {
  try {
    const fullPath = join(cwd, relativePath);
    if (!existsSync(fullPath)) return null;
    return readFileSync(fullPath, "utf-8");
  } catch {
    return null;
  }
}

function writeFile(
  cwd: string,
  relativePath: string,
  content: string,
): boolean {
  try {
    const fullPath = join(cwd, relativePath);
    writeFileSync(fullPath, content, "utf-8");
    return true;
  } catch {
    return false;
  }
}

function findPdfFile(cwd: string): string | null {
  try {
    const entries = readdirSync(cwd, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".pdf")) {
        return join(cwd, entry.name);
      }
    }
    return null;
  } catch {
    return null;
  }
}

function findMainTexFile(cwd: string): string | null {
  try {
    const entries = readdirSync(cwd, { withFileTypes: true });
    // Prefer main.tex, then any .tex file
    for (const entry of entries) {
      if (entry.isFile() && entry.name === "main.tex") {
        return entry.name;
      }
    }
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".tex")) {
        return entry.name;
      }
    }
    return null;
  } catch {
    return null;
  }
}

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".bmp": "image/bmp",
  ".pdf": "application/pdf",
  ".tex": "text/plain",
  ".txt": "text/plain",
};

let currentProjectPath: string | null = null;

function handleStaticFile(req: IncomingMessage, res: ServerResponse): void {
  if (!currentProjectPath) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("No project open");
    return;
  }

  const filePath = req.url?.slice(1) || "";
  const fullPath = join(currentProjectPath, decodeURIComponent(filePath));

  if (!fullPath.startsWith(currentProjectPath)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Forbidden");
    return;
  }

  try {
    if (!existsSync(fullPath) || !statSync(fullPath).isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("File not found");
      return;
    }

    const ext = extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const content = readFileSync(fullPath);

    res.writeHead(200, {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-cache",
    });
    res.end(content);
  } catch {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal server error");
  }
}

export async function serve(options: ServeOptions): Promise<void> {
  const port = options.port;
  const httpPort = port + 1;
  const shell = getDefaultShell();

  const wss = new WebSocketServer({ port });
  const httpServer = createServer(handleStaticFile);
  httpServer.listen(httpPort);

  console.log(chalk.green(`\nLMMs-Lab Writer daemon started`));
  console.log(chalk.gray(`  WebSocket: ws://localhost:${port}`));
  console.log(chalk.gray(`  Files HTTP: http://localhost:${httpPort}`));
  console.log(
    chalk.gray(`  Mode: Background service (no project directory required)`),
  );
  console.log(chalk.gray(`\nPress Ctrl+C to stop\n`));

  wss.on("connection", (ws: WebSocket) => {
    console.log(chalk.blue("Client connected"));

    // Per-client state
    const state: ClientState = {
      projectPath: null,
      ptyProcess: null,
      watcher: null,
    };

    // Send initial connection status
    ws.send(JSON.stringify({ type: "connected", version: "0.1.0" }));

    const setupWatcher = (projectPath: string) => {
      if (state.watcher) {
        state.watcher.close();
      }

      state.watcher = chokidar.watch(projectPath, {
        ignored: [
          /(^|[\/\\])\../,
          "**/node_modules/**",
          "**/.git/**",
          "**/*.aux",
          "**/*.log",
          "**/*.out",
          "**/*.toc",
          "**/*.fls",
          "**/*.fdb_latexmk",
          "**/*.synctex.gz",
          "**/*.bbl",
          "**/*.blg",
        ],
        persistent: true,
        ignoreInitial: true,
      });

      let debounceTimer: NodeJS.Timeout | null = null;
      const debouncedFileChange = (path: string) => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          const relativePath = path.replace(projectPath + "/", "");
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({ type: "file-changed", path: relativePath }),
            );

            if (path.endsWith(".pdf")) {
              ws.send(
                JSON.stringify({ type: "pdf-url", url: `file://${path}` }),
              );
            }
          }
        }, 100);
      };

      state.watcher.on("change", debouncedFileChange);
      state.watcher.on("add", debouncedFileChange);
      state.watcher.on("unlink", () => {
        if (ws.readyState === WebSocket.OPEN && state.projectPath) {
          const tree = getFileTree(state.projectPath);
          ws.send(JSON.stringify({ type: "files", data: tree }));
        }
      });
    };

    const setupPty = (projectPath: string) => {
      if (state.ptyProcess) {
        state.ptyProcess.kill();
      }

      try {
        const isWindows = process.platform === "win32";
        const useCleanZsh = shell.endsWith("zsh");
        const shellArgs = useCleanZsh ? ["-f"] : isWindows ? [] : [];

        // Ensure PATH includes common locations for LaunchAgent environment
        const envPath = process.env.PATH || "";
        const additionalPaths =
          "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin";
        const fullPath = envPath.includes("/opt/homebrew/bin")
          ? envPath
          : `${additionalPaths}:${envPath}`;

        state.ptyProcess = pty.spawn(shell, shellArgs, {
          name: "xterm-256color",
          cols: 120,
          rows: 30,
          cwd: projectPath,
          env: {
            ...process.env,
            PATH: fullPath,
            TERM: "xterm-256color",
            COLORTERM: "truecolor",
          },
        });

        console.log(
          chalk.gray(
            `PTY spawned for ${projectPath} (pid: ${state.ptyProcess.pid})`,
          ),
        );

        if (useCleanZsh) {
          setTimeout(() => {
            state.ptyProcess?.write(
              'autoload -Uz compinit && compinit; PROMPT="%~ %# "; clear\n',
            );
          }, 50);
        }

        state.ptyProcess.onData((data: string) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "output", data }));
          }
        });

        state.ptyProcess.onExit(({ exitCode }: { exitCode: number }) => {
          console.log(chalk.gray(`PTY exited (code: ${exitCode})`));
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "exit", code: exitCode }));
          }
        });
      } catch (err) {
        console.error(
          chalk.yellow(`PTY spawn failed: ${(err as Error).message}`),
        );
        // PTY is optional - file operations will still work
      }
    };

    ws.on("message", (message: Buffer) => {
      try {
        const msg = JSON.parse(message.toString());

        switch (msg.type) {
          case "set-project": {
            // Expand ~ to home directory
            let inputPath = msg.path as string;
            if (inputPath.startsWith("~")) {
              inputPath = inputPath.replace(/^~/, homedir());
            }
            const projectPath = resolve(inputPath);
            if (!existsSync(projectPath)) {
              ws.send(
                JSON.stringify({
                  type: "error",
                  message: `Directory not found: ${projectPath}`,
                }),
              );
              break;
            }

            state.projectPath = projectPath;
            currentProjectPath = projectPath;
            console.log(chalk.blue(`Project set to: ${projectPath}`));

            // Setup watcher and PTY for the project
            setupWatcher(projectPath);
            setupPty(projectPath);

            // Send initial data
            const tree = getFileTree(projectPath);
            ws.send(JSON.stringify({ type: "files", data: tree }));

            const gitInfo = getGitInfo(projectPath);
            ws.send(JSON.stringify({ type: "git-info", data: gitInfo }));

            const gitStatus = getGitStatus(projectPath);
            ws.send(JSON.stringify({ type: "git-status", data: gitStatus }));

            const mainTex = findMainTexFile(projectPath);
            ws.send(
              JSON.stringify({
                type: "project-info",
                path: projectPath,
                mainFile: mainTex,
              }),
            );
            break;
          }

          case "input":
            state.ptyProcess?.write(msg.data);
            break;

          case "resize":
            if (msg.cols && msg.rows) {
              state.ptyProcess?.resize(msg.cols, msg.rows);
            }
            break;

          case "refresh-files": {
            if (!state.projectPath) break;
            const tree = getFileTree(state.projectPath);
            ws.send(JSON.stringify({ type: "files", data: tree }));
            break;
          }

          case "get-git-info": {
            if (!state.projectPath) break;
            const info = getGitInfo(state.projectPath);
            ws.send(JSON.stringify({ type: "git-info", data: info }));
            break;
          }

          case "read-file": {
            if (!state.projectPath) break;
            const content = readFile(state.projectPath, msg.path);
            if (content !== null) {
              ws.send(
                JSON.stringify({
                  type: "file-content",
                  path: msg.path,
                  content,
                }),
              );
            }
            break;
          }

          case "write-file": {
            if (!state.projectPath) break;
            const success = writeFile(state.projectPath, msg.path, msg.content);
            if (!success) {
              console.log(chalk.yellow(`Failed to write file: ${msg.path}`));
            }
            break;
          }

          case "get-pdf": {
            if (!state.projectPath) break;
            const pdfPath = findPdfFile(state.projectPath);
            if (pdfPath) {
              ws.send(
                JSON.stringify({ type: "pdf-url", url: `file://${pdfPath}` }),
              );
            }
            break;
          }

          case "git-status": {
            if (!state.projectPath) break;
            const status = getGitStatus(state.projectPath);
            ws.send(JSON.stringify({ type: "git-status", data: status }));
            break;
          }

          case "git-log": {
            if (!state.projectPath) break;
            const limit = msg.limit || 20;
            const entries = getGitLog(state.projectPath, limit);
            ws.send(JSON.stringify({ type: "git-log", data: entries }));
            break;
          }

          case "git-diff": {
            if (!state.projectPath) break;
            const diff = getGitDiff(state.projectPath, msg.file, msg.staged);
            ws.send(
              JSON.stringify({
                type: "git-diff",
                data: { file: msg.file, content: diff },
              }),
            );
            break;
          }

          case "git-add": {
            if (!state.projectPath) break;
            const addResult = gitAdd(state.projectPath, msg.files || []);
            ws.send(JSON.stringify({ type: "git-add-result", ...addResult }));
            if (addResult.success) {
              const status = getGitStatus(state.projectPath);
              ws.send(JSON.stringify({ type: "git-status", data: status }));
            }
            break;
          }

          case "git-commit": {
            if (!state.projectPath) break;
            const commitResult = gitCommit(state.projectPath, msg.message);
            ws.send(
              JSON.stringify({ type: "git-commit-result", ...commitResult }),
            );
            if (commitResult.success) {
              const status = getGitStatus(state.projectPath);
              ws.send(JSON.stringify({ type: "git-status", data: status }));
              const info = getGitInfo(state.projectPath);
              if (info) {
                ws.send(JSON.stringify({ type: "git-info", data: info }));
              }
            }
            break;
          }

          case "git-push": {
            if (!state.projectPath) break;
            const pushResult = gitPush(state.projectPath);
            ws.send(JSON.stringify({ type: "git-push-result", ...pushResult }));
            if (pushResult.success) {
              const status = getGitStatus(state.projectPath);
              ws.send(JSON.stringify({ type: "git-status", data: status }));
            }
            break;
          }

          case "git-pull": {
            if (!state.projectPath) break;
            const pullResult = gitPull(state.projectPath);
            ws.send(JSON.stringify({ type: "git-pull-result", ...pullResult }));
            if (pullResult.success && state.projectPath) {
              const tree = getFileTree(state.projectPath);
              ws.send(JSON.stringify({ type: "files", data: tree }));
              const status = getGitStatus(state.projectPath);
              ws.send(JSON.stringify({ type: "git-status", data: status }));
            }
            break;
          }

          case "git-init": {
            if (!state.projectPath) break;
            const initResult = gitInit(state.projectPath);
            ws.send(JSON.stringify({ type: "git-init-result", ...initResult }));
            if (initResult.success) {
              const info = getGitInfo(state.projectPath);
              ws.send(JSON.stringify({ type: "git-info", data: info }));
              const status = getGitStatus(state.projectPath);
              ws.send(JSON.stringify({ type: "git-status", data: status }));
            }
            break;
          }

          case "git-add-remote": {
            if (!state.projectPath) break;
            const url = msg.url as string;
            const remoteName = (msg.name as string) || "origin";
            try {
              execSync(`git remote add ${remoteName} "${url}"`, {
                cwd: state.projectPath,
                encoding: "utf-8",
              });
              ws.send(
                JSON.stringify({
                  type: "git-add-remote-result",
                  success: true,
                }),
              );
              const info = getGitInfo(state.projectPath);
              ws.send(JSON.stringify({ type: "git-info", data: info }));
              const status = getGitStatus(state.projectPath);
              ws.send(JSON.stringify({ type: "git-status", data: status }));
            } catch (err) {
              ws.send(
                JSON.stringify({
                  type: "git-add-remote-result",
                  success: false,
                  error: (err as Error).message,
                }),
              );
            }
            break;
          }

          case "git-clone": {
            const targetDir =
              msg.directory ||
              join(homedir(), "Documents", msg.repoName || "cloned-repo");
            const cloneResult = gitClone(msg.url, targetDir);
            ws.send(
              JSON.stringify({ type: "git-clone-result", ...cloneResult }),
            );
            break;
          }

          case "compile": {
            if (!state.projectPath) break;
            const file = msg.file || findMainTexFile(state.projectPath);
            if (!file) {
              ws.send(
                JSON.stringify({
                  type: "compile-result",
                  success: false,
                  error: "No .tex file found",
                }),
              );
              break;
            }

            const engine = msg.engine || "xelatex";
            const engineArg =
              engine === "xelatex"
                ? "-xelatex"
                : engine === "lualatex"
                  ? "-lualatex"
                  : "-pdf";

            ws.send(JSON.stringify({ type: "compile-start", file }));

            const latexmk = spawn(
              "latexmk",
              [
                engineArg,
                "-interaction=nonstopmode",
                "-file-line-error",
                "-synctex=1",
                file,
              ],
              {
                cwd: state.projectPath,
              },
            );

            let output = "";
            latexmk.stdout.on("data", (data) => {
              output += data.toString();
              ws.send(
                JSON.stringify({
                  type: "compile-output",
                  data: data.toString(),
                }),
              );
            });
            latexmk.stderr.on("data", (data) => {
              output += data.toString();
              ws.send(
                JSON.stringify({
                  type: "compile-output",
                  data: data.toString(),
                }),
              );
            });

            latexmk.on("close", (code) => {
              const success = code === 0;
              ws.send(
                JSON.stringify({
                  type: "compile-result",
                  success,
                  code,
                  output,
                }),
              );
              if (success && state.projectPath) {
                const pdfPath = findPdfFile(state.projectPath);
                if (pdfPath) {
                  ws.send(
                    JSON.stringify({
                      type: "pdf-url",
                      url: `file://${pdfPath}`,
                    }),
                  );
                }
              }
            });

            latexmk.on("error", (err) => {
              ws.send(
                JSON.stringify({
                  type: "compile-result",
                  success: false,
                  error: err.message,
                }),
              );
            });
            break;
          }

          default:
            console.log(chalk.yellow(`Unknown message type: ${msg.type}`));
        }
      } catch (err) {
        console.error(chalk.red("Failed to parse message:"), err);
      }
    });

    ws.on("close", () => {
      console.log(chalk.blue("Client disconnected"));
      state.watcher?.close();
      state.ptyProcess?.kill();
    });

    ws.on("error", (err) => {
      console.error(chalk.red("WebSocket error:"), err);
      state.watcher?.close();
      state.ptyProcess?.kill();
    });
  });

  wss.on("error", (err) => {
    console.error(chalk.red("Server error:"), err);
    process.exit(1);
  });

  process.on("SIGINT", () => {
    console.log(chalk.blue("\nShutting down daemon..."));
    wss.close();
    process.exit(0);
  });
}
