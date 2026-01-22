import { cac } from 'cac'
import chalk from 'chalk'
import { compile } from './commands/compile.js'
import { watch } from './commands/watch.js'
import { init } from './commands/init.js'
import { login, logout, whoami } from './commands/auth.js'
import { sync } from './commands/sync.js'

const cli = cac('latex-writer')

cli
  .command('[file]', 'Compile a LaTeX document')
  .option('-e, --engine <engine>', 'LaTeX engine (pdflatex, xelatex, lualatex)', { default: 'xelatex' })
  .option('-o, --output <dir>', 'Output directory')
  .option('-w, --watch', 'Watch for changes and recompile')
  .option('--synctex', 'Generate SyncTeX file', { default: true })
  .option('--clean', 'Clean auxiliary files after compilation')
  .action(async (file: string | undefined, options) => {
    if (!file) {
      cli.outputHelp()
      return
    }

    if (options.watch) {
      await watch(file, options)
    } else {
      await compile(file, options)
    }
  })

cli
  .command('init', 'Initialize a new LaTeX project')
  .option('-t, --template <template>', 'Project template (article, thesis, beamer, neurips, iclr, tech-report)', { default: 'article' })
  .action(async (options) => {
    await init(options)
  })

cli
  .command('watch <file>', 'Watch and compile on changes')
  .option('-e, --engine <engine>', 'LaTeX engine', { default: 'xelatex' })
  .action(async (file: string, options) => {
    await watch(file, options)
  })

cli
  .command('login', 'Login to LaTeX Writer')
  .action(async () => {
    await login()
  })

cli
  .command('logout', 'Logout from LaTeX Writer')
  .action(async () => {
    await logout()
  })

cli
  .command('whoami', 'Show current logged in user')
  .action(async () => {
    await whoami()
  })

cli
  .command('sync', 'Sync project with LaTeX Writer')
  .option('--push', 'Push local changes to remote')
  .option('--pull', 'Pull remote changes to local')
  .action(async (options) => {
    await sync(options)
  })

cli.help()
cli.version('0.1.0')

cli.parse()

process.on('unhandledRejection', (err) => {
  console.error(chalk.red('Error:'), err)
  process.exit(1)
})
