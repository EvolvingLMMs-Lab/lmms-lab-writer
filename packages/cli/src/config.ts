import Conf from 'conf'
import type { CLIConfig } from '@latex-writer/shared'
import { DEFAULT_CLI_CONFIG } from '@latex-writer/shared'

const config = new Conf<CLIConfig>({
  projectName: 'latex-writer',
  defaults: DEFAULT_CLI_CONFIG,
})

export function getConfig(): CLIConfig {
  return config.store
}

export function setConfig(key: keyof CLIConfig, value: unknown): void {
  config.set(key, value)
}

export function getToken(): string | undefined {
  return config.get('accessToken')
}

export function setTokens(accessToken: string, refreshToken: string): void {
  config.set('accessToken', accessToken)
  config.set('refreshToken', refreshToken)
}

export function clearTokens(): void {
  config.delete('accessToken')
  config.delete('refreshToken')
}
