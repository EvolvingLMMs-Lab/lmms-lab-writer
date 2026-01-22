import chokidar from 'chokidar'
import chalk from 'chalk'
import { resolve, dirname, relative } from 'path'
import { existsSync } from 'fs'
import type { LaTeXEngine } from '@latex-writer/shared'
import { DEFAULT_CLI_CONFIG } from '@latex-writer/shared'
import { compile } from './compile.js'

interface WatchOptions {
  engine: LaTeXEngine
  output?: string
  synctex?: boolean
}

export async function watch(file: string, options: WatchOptions): Promise<void> {
  const filePath = resolve(process.cwd(), file)

  if (!existsSync(filePath)) {
    console.error(chalk.red(`File not found: ${file}`))
    process.exit(1)
  }

  const dir = dirname(filePath)

  console.log(chalk.blue(`Watching ${file} for changes...`))
  console.log(chalk.gray(`Engine: ${options.engine}`))
  console.log(chalk.gray(`Press Ctrl+C to stop\n`))

  await compile(file, { ...options, clean: false })

  let compiling = false
  let pendingCompile = false

  const runCompile = async () => {
    if (compiling) {
      pendingCompile = true
      return
    }

    compiling = true
    console.log(chalk.gray(`\n[${new Date().toLocaleTimeString()}] Change detected, recompiling...`))

    await compile(file, { ...options, clean: false })

    compiling = false

    if (pendingCompile) {
      pendingCompile = false
      await runCompile()
    }
  }

  const watcher = chokidar.watch(dir, {
    ignored: DEFAULT_CLI_CONFIG.watchIgnore,
    persistent: true,
    ignoreInitial: true,
  })

  watcher.on('change', (changedPath) => {
    const relPath = relative(dir, changedPath)
    if (relPath.endsWith('.tex') || relPath.endsWith('.bib') || relPath.endsWith('.cls') || relPath.endsWith('.sty')) {
      console.log(chalk.gray(`File changed: ${relPath}`))
      runCompile()
    }
  })

  watcher.on('add', (addedPath) => {
    const relPath = relative(dir, addedPath)
    if (relPath.endsWith('.tex') || relPath.endsWith('.bib')) {
      console.log(chalk.gray(`File added: ${relPath}`))
      runCompile()
    }
  })

  process.on('SIGINT', () => {
    console.log(chalk.blue('\nStopping watch mode...'))
    watcher.close()
    process.exit(0)
  })
}
