import chalk from 'chalk'
import open from 'open'
import ora from 'ora'
import { getConfig, setTokens, clearTokens, getToken } from '../config.js'

export async function login(): Promise<void> {
  const config = getConfig()
  const authUrl = `${config.apiUrl}/cli/auth`

  console.log(chalk.blue('Opening browser for authentication...'))
  console.log(chalk.gray(`If browser doesn\'t open, visit: ${authUrl}\n`))

  await open(authUrl)

  const spinner = ora('Waiting for authentication...').start()

  const pollInterval = 2000
  const maxAttempts = 60
  let attempts = 0

  const poll = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${config.apiUrl}/api/cli/poll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        const data = (await response.json()) as { accessToken: string; refreshToken: string; user: { email: string } }
        if (data.accessToken) {
          setTokens(data.accessToken, data.refreshToken)
          spinner.succeed(chalk.green(`Logged in as ${data.user.email}`))
          return true
        }
      }
    } catch {
    }

    attempts++
    if (attempts >= maxAttempts) {
      spinner.fail(chalk.red('Authentication timed out'))
      console.log(chalk.yellow('Please try again with: llw login'))
      return false
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval))
    return poll()
  }

  await poll()
}

export async function logout(): Promise<void> {
  const token = getToken()

  if (!token) {
    console.log(chalk.yellow('Not logged in.'))
    return
  }

  clearTokens()
  console.log(chalk.green('Logged out successfully.'))
}

export async function whoami(): Promise<void> {
  const config = getConfig()
  const token = getToken()

  if (!token) {
    console.log(chalk.yellow('Not logged in.'))
    console.log(chalk.gray('Run: llw login'))
    return
  }

  const spinner = ora('Fetching user info...').start()

  try {
    const response = await fetch(`${config.apiUrl}/api/cli/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      const user = (await response.json()) as { email: string; name?: string }
      spinner.succeed(chalk.green(`Logged in as ${user.name || user.email}`))
      console.log(chalk.gray(`  Email: ${user.email}`))
    } else if (response.status === 401) {
      spinner.fail(chalk.red('Session expired'))
      clearTokens()
      console.log(chalk.yellow('Please login again: llw login'))
    } else {
      spinner.fail(chalk.red('Failed to fetch user info'))
    }
  } catch (err) {
    spinner.fail(chalk.red('Failed to connect to server'))
    console.log(chalk.gray(`  ${(err as Error).message}`))
  }
}
