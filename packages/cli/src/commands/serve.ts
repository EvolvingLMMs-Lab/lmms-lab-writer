import { WebSocketServer, WebSocket } from 'ws'
import pty from 'node-pty'
import chalk from 'chalk'
import chokidar from 'chokidar'
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs'
import { join, extname } from 'path'
import { execSync } from 'child_process'

interface ServeOptions {
  port: number
  shell?: string
  raw?: boolean
}

interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileNode[]
}

interface GitInfo {
  branch: string
  isDirty: boolean
  lastCommit?: {
    hash: string
    message: string
    date: string
  }
}

function getFileTree(dir: string, basePath: string = ''): FileNode[] {
  const entries = readdirSync(dir, { withFileTypes: true })
  const nodes: FileNode[] = []

  const ignoredDirs = new Set([
    'node_modules',
    '.git',
    '.next',
    'dist',
    'build',
    '__pycache__',
    '.cache',
    'out',
  ])

  const ignoredExtensions = new Set(['.aux', '.log', '.out', '.toc', '.lof', '.lot', '.fls', '.fdb_latexmk', '.synctex.gz', '.bbl', '.blg'])

  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.latexmkrc') continue
    if (ignoredDirs.has(entry.name)) continue

    const fullPath = join(dir, entry.name)
    const relativePath = join(basePath, entry.name)

    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        path: relativePath,
        type: 'directory',
        children: getFileTree(fullPath, relativePath),
      })
    } else {
      const ext = entry.name.slice(entry.name.lastIndexOf('.'))
      if (ignoredExtensions.has(ext)) continue

      nodes.push({
        name: entry.name,
        path: relativePath,
        type: 'file',
      })
    }
  }

  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

function getGitInfo(cwd: string): GitInfo | null {
  try {
    const gitDir = join(cwd, '.git')
    if (!existsSync(gitDir)) return null

    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd, encoding: 'utf-8' }).trim()
    const statusOutput = execSync('git status --porcelain', { cwd, encoding: 'utf-8' })
    const isDirty = statusOutput.trim().length > 0

    let lastCommit: GitInfo['lastCommit'] | undefined
    try {
      const hash = execSync('git rev-parse --short HEAD', { cwd, encoding: 'utf-8' }).trim()
      const message = execSync('git log -1 --format=%s', { cwd, encoding: 'utf-8' }).trim()
      const date = execSync('git log -1 --format=%ci', { cwd, encoding: 'utf-8' }).trim()
      lastCommit = { hash, message, date }
    } catch {
      // No commits yet
    }

    return { branch, isDirty, lastCommit }
  } catch {
    return null
  }
}

function readFile(cwd: string, relativePath: string): string | null {
  try {
    const fullPath = join(cwd, relativePath)
    if (!existsSync(fullPath)) return null
    return readFileSync(fullPath, 'utf-8')
  } catch {
    return null
  }
}

function writeFile(cwd: string, relativePath: string, content: string): boolean {
  try {
    const fullPath = join(cwd, relativePath)
    writeFileSync(fullPath, content, 'utf-8')
    return true
  } catch {
    return false
  }
}

function findPdfFile(cwd: string): string | null {
  try {
    const entries = readdirSync(cwd, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.pdf')) {
        return join(cwd, entry.name)
      }
    }
    return null
  } catch {
    return null
  }
}

export async function serve(options: ServeOptions): Promise<void> {
  const port = options.port
  const shell = options.shell || process.env.SHELL || '/bin/zsh'
  const raw = options.raw || false
  const cwd = process.cwd()

  const wss = new WebSocketServer({ port })

  console.log(chalk.green(`\nLMMs-Lab Writer daemon started`))
  console.log(chalk.gray(`  WebSocket: ws://localhost:${port}`))
  console.log(chalk.gray(`  Shell: ${shell}${raw ? ' (raw mode)' : ' (clean mode)'}`))
  console.log(chalk.gray(`  Working directory: ${cwd}`))
  console.log(chalk.gray(`\nPress Ctrl+C to stop\n`))

  wss.on('connection', (ws: WebSocket) => {
    console.log(chalk.blue('Client connected'))

    const fileTree = getFileTree(cwd)
    ws.send(JSON.stringify({ type: 'files', data: fileTree }))

    const gitInfo = getGitInfo(cwd)
    if (gitInfo) {
      ws.send(JSON.stringify({ type: 'git-info', data: gitInfo }))
    }

    const watcher = chokidar.watch(cwd, {
      ignored: [
        /(^|[\/\\])\../,
        '**/node_modules/**',
        '**/.git/**',
        '**/*.aux',
        '**/*.log',
        '**/*.out',
        '**/*.toc',
        '**/*.fls',
        '**/*.fdb_latexmk',
        '**/*.synctex.gz',
        '**/*.bbl',
        '**/*.blg',
      ],
      persistent: true,
      ignoreInitial: true,
    })

    let debounceTimer: NodeJS.Timeout | null = null
    const debouncedFileChange = (path: string) => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        const relativePath = path.replace(cwd + '/', '')
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'file-changed', path: relativePath }))

          if (path.endsWith('.pdf')) {
            ws.send(JSON.stringify({ type: 'pdf-url', url: `file://${path}` }))
          }
        }
      }, 100)
    }

    watcher.on('change', debouncedFileChange)
    watcher.on('add', debouncedFileChange)
    watcher.on('unlink', () => {
      if (ws.readyState === WebSocket.OPEN) {
        const tree = getFileTree(cwd)
        ws.send(JSON.stringify({ type: 'files', data: tree }))
      }
    })

    const useCleanZsh = shell.endsWith('zsh') && !raw
    const ptyProcess = pty.spawn(shell, useCleanZsh ? ['-f'] : [], {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
      },
    })

    console.log(chalk.gray(`PTY spawned (pid: ${ptyProcess.pid})`))

    if (useCleanZsh) {
      setTimeout(() => {
        ptyProcess.write('autoload -Uz compinit && compinit; PROMPT="%~ %# "; clear\n')
      }, 50)
    }

    ptyProcess.onData((data: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'output', data }))
      }
    })

    ptyProcess.onExit(({ exitCode }: { exitCode: number }) => {
      console.log(chalk.gray(`PTY exited (code: ${exitCode})`))
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'exit', code: exitCode }))
      }
    })

    ws.on('message', (message: Buffer) => {
      try {
        const msg = JSON.parse(message.toString())

        switch (msg.type) {
          case 'input':
            ptyProcess.write(msg.data)
            break

          case 'resize':
            if (msg.cols && msg.rows) {
              ptyProcess.resize(msg.cols, msg.rows)
            }
            break

          case 'refresh-files': {
            const tree = getFileTree(cwd)
            ws.send(JSON.stringify({ type: 'files', data: tree }))
            break
          }

          case 'get-git-info': {
            const info = getGitInfo(cwd)
            if (info) {
              ws.send(JSON.stringify({ type: 'git-info', data: info }))
            }
            break
          }

          case 'read-file': {
            const content = readFile(cwd, msg.path)
            if (content !== null) {
              ws.send(JSON.stringify({ type: 'file-content', path: msg.path, content }))
            }
            break
          }

          case 'write-file': {
            const success = writeFile(cwd, msg.path, msg.content)
            if (!success) {
              console.log(chalk.yellow(`Failed to write file: ${msg.path}`))
            }
            break
          }

          case 'get-pdf': {
            const pdfPath = findPdfFile(cwd)
            if (pdfPath) {
              ws.send(JSON.stringify({ type: 'pdf-url', url: `file://${pdfPath}` }))
            }
            break
          }

          default:
            console.log(chalk.yellow(`Unknown message type: ${msg.type}`))
        }
      } catch (err) {
        console.error(chalk.red('Failed to parse message:'), err)
      }
    })

    ws.on('close', () => {
      console.log(chalk.blue('Client disconnected'))
      watcher.close()
      ptyProcess.kill()
    })

    ws.on('error', (err) => {
      console.error(chalk.red('WebSocket error:'), err)
      watcher.close()
      ptyProcess.kill()
    })
  })

  wss.on('error', (err) => {
    console.error(chalk.red('Server error:'), err)
    process.exit(1)
  })

  process.on('SIGINT', () => {
    console.log(chalk.blue('\nShutting down daemon...'))
    wss.close()
    process.exit(0)
  })
}
