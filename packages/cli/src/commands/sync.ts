import chalk from 'chalk'
import ora from 'ora'
import { getConfig, getToken } from '../config.js'

interface SyncOptions {
  push?: boolean
  pull?: boolean
}

export async function sync(options: SyncOptions): Promise<void> {
  const config = getConfig()
  const token = getToken()

  if (!token) {
    console.log(chalk.yellow('Not logged in.'))
    console.log(chalk.gray('Run: latex-writer login'))
    return
  }

  if (!options.push && !options.pull) {
    console.log(chalk.yellow('Please specify --push or --pull'))
    console.log(chalk.gray('\nExamples:'))
    console.log(chalk.gray('  latex-writer sync --push   # Upload local changes'))
    console.log(chalk.gray('  latex-writer sync --pull   # Download remote changes'))
    return
  }

  const spinner = ora(options.push ? 'Pushing changes...' : 'Pulling changes...').start()

  try {
    const endpoint = options.push ? '/api/cli/sync/push' : '/api/cli/sync/pull'
    const response = await fetch(`${config.apiUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cwd: process.cwd(),
      }),
    })

    if (response.ok) {
      const result = (await response.json()) as { message: string; files?: string[] }
      spinner.succeed(chalk.green(result.message))
      if (result.files && result.files.length > 0) {
        console.log(chalk.gray('\nSynced files:'))
        result.files.forEach((f) => console.log(chalk.gray(`  - ${f}`)))
      }
    } else if (response.status === 401) {
      spinner.fail(chalk.red('Session expired'))
      console.log(chalk.yellow('Please login again: latex-writer login'))
    } else {
      const error = (await response.json()) as { message: string }
      spinner.fail(chalk.red(`Sync failed: ${error.message}`))
    }
  } catch (err) {
    spinner.fail(chalk.red('Failed to connect to server'))
    console.log(chalk.gray(`  ${(err as Error).message}`))
  }
}
