import { spawn } from 'cross-spawn'
import chalk from 'chalk'
import ora from 'ora'
import { resolve, dirname, basename } from 'path'
import { existsSync } from 'fs'
import type { LaTeXEngine, CompileResult } from '@latex-writer/shared'
import { parseLatexLog } from '@latex-writer/shared'

interface CompileOptions {
  engine: LaTeXEngine
  output?: string
  synctex?: boolean
  clean?: boolean
}

export async function compile(
  file: string,
  options: CompileOptions
): Promise<CompileResult> {
  const startTime = Date.now()
  const filePath = resolve(process.cwd(), file)

  if (!existsSync(filePath)) {
    console.error(chalk.red(`File not found: ${file}`))
    process.exit(1)
  }

  const dir = dirname(filePath)
  const filename = basename(filePath)
  const spinner = ora(`Compiling ${filename} with ${options.engine}...`).start()

  const args = buildLatexmkArgs(filename, options)

  return new Promise((resolvePromise) => {
    let stdout = ''
    let stderr = ''

    const proc = spawn('latexmk', args, {
      cwd: dir,
      stdio: ['inherit', 'pipe', 'pipe'],
    })

    proc.stdout?.on('data', (data) => {
      stdout += data.toString()
    })

    proc.stderr?.on('data', (data) => {
      stderr += data.toString()
    })

    proc.on('close', (code) => {
      const duration = Date.now() - startTime
      const logs = stdout + stderr
      const { errors, warnings } = parseLatexLog(logs)

      if (code === 0) {
        spinner.succeed(
          chalk.green(`Compiled successfully in ${(duration / 1000).toFixed(2)}s`)
        )

        if (warnings.length > 0) {
          console.log(chalk.yellow(`\n${warnings.length} warning(s):`))
          warnings.slice(0, 5).forEach((w) => console.log(chalk.yellow(`  - ${w}`)))
          if (warnings.length > 5) {
            console.log(chalk.yellow(`  ... and ${warnings.length - 5} more`))
          }
        }

        const outputFile = filePath.replace(/\.tex$/, '.pdf')
        resolvePromise({
          success: true,
          outputFile,
          logs,
          warnings,
          errors: [],
          duration,
        })
      } else {
        spinner.fail(chalk.red('Compilation failed'))

        if (errors.length > 0) {
          console.log(chalk.red(`\n${errors.length} error(s):`))
          errors.forEach((e) => {
            console.log(chalk.red(`  ${e.file}:${e.line}: ${e.message}`))
          })
        } else {
          console.log(chalk.red('\nCheck the log file for details.'))
        }

        resolvePromise({
          success: false,
          logs,
          warnings,
          errors,
          duration,
        })
      }
    })

    proc.on('error', (err) => {
      spinner.fail(chalk.red('Failed to run latexmk'))
      console.error(chalk.red(`Error: ${err.message}`))
      console.log(
        chalk.yellow(
          '\nMake sure LaTeX is installed. On macOS, install MacTeX:\n' +
            '  brew install --cask mactex\n' +
            'Or install BasicTeX:\n' +
            '  brew install --cask basictex'
        )
      )
      resolvePromise({
        success: false,
        logs: err.message,
        warnings: [],
        errors: [{ file, line: 0, message: err.message, type: 'error' }],
        duration: Date.now() - startTime,
      })
    })
  })
}

function buildLatexmkArgs(filename: string, options: CompileOptions): string[] {
  const args: string[] = []

  switch (options.engine) {
    case 'xelatex':
      args.push('-xelatex')
      break
    case 'lualatex':
      args.push('-lualatex')
      break
    case 'pdflatex':
    default:
      args.push('-pdf')
      break
  }

  if (options.synctex) {
    args.push('-synctex=1')
  }

  args.push('-interaction=nonstopmode')
  args.push('-file-line-error')

  if (options.output) {
    args.push(`-outdir=${options.output}`)
  }

  if (options.clean) {
    args.push('-c')
  }

  args.push(filename)

  return args
}
