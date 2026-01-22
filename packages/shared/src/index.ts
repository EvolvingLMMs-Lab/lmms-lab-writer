// Shared types and utilities for LaTeX Writer

// ============================================================================
// Document Types
// ============================================================================

export interface Document {
  id: string
  title: string
  created_at: string
  updated_at: string
  created_by: string
  workspace_id?: string
}

export interface DocumentFile {
  id: string
  document_id: string
  path: string
  storage_key: string
  sha256: string
  updated_at: string
}

export interface YjsUpdate {
  id: number
  document_id: string
  created_at: string
  is_snapshot: boolean
  update: Uint8Array
}

// ============================================================================
// User & Auth Types
// ============================================================================

export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
}

export interface Session {
  access_token: string
  refresh_token: string
  expires_at: number
  user: User
}

// ============================================================================
// Sharing & Permissions
// ============================================================================

export type DocumentRole = 'owner' | 'editor' | 'viewer'

export interface DocumentAccess {
  document_id: string
  user_id: string
  role: DocumentRole
  invited_by?: string
  created_at: string
}

export interface ShareInvite {
  id: string
  document_id: string
  email: string
  role: DocumentRole
  token: string
  expires_at: string
  created_by: string
}

// ============================================================================
// Presence & Collaboration
// ============================================================================

export interface PresenceState {
  user_id: string
  username: string
  color: string
  cursor?: CursorPosition
  selection?: SelectionRange
  online_at: string
}

export interface CursorPosition {
  line: number
  column: number
}

export interface SelectionRange {
  start: CursorPosition
  end: CursorPosition
}

// ============================================================================
// LaTeX Compilation
// ============================================================================

export type LaTeXEngine = 'pdflatex' | 'xelatex' | 'lualatex'

export interface CompileOptions {
  engine: LaTeXEngine
  mainFile: string
  outputDir?: string
  synctex?: boolean
  clean?: boolean
}

export interface CompileResult {
  success: boolean
  outputFile?: string
  logs: string
  warnings: string[]
  errors: CompileError[]
  duration: number
}

export interface CompileError {
  file: string
  line: number
  message: string
  type: 'error' | 'warning'
}

// ============================================================================
// CLI Config
// ============================================================================

export interface CLIConfig {
  apiUrl: string
  accessToken?: string
  refreshToken?: string
  defaultEngine: LaTeXEngine
  watchIgnore: string[]
}

export const DEFAULT_CLI_CONFIG: CLIConfig = {
  apiUrl: 'https://latex-writer.vercel.app',
  defaultEngine: 'xelatex',
  watchIgnore: [
    '*.aux',
    '*.bbl',
    '*.blg',
    '*.fdb_latexmk',
    '*.fls',
    '*.log',
    '*.out',
    '*.synctex.gz',
    '*.toc',
    '*.lof',
    '*.lot',
    '*.brf',
    '.git/**',
    'node_modules/**',
  ],
}

// ============================================================================
// API Types
// ============================================================================

export interface APIResponse<T = unknown> {
  data?: T
  error?: APIError
}

export interface APIError {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a random color for presence indicators
 */
export function generatePresenceColor(): string {
  const hue = Math.floor(Math.random() * 360)
  return `hsl(${hue}, 70%, 50%)`
}

/**
 * Calculate SHA256 hash of content (browser-compatible)
 */
export async function sha256(content: string | Uint8Array): Promise<string> {
  const encoder = new TextEncoder()
  const data: ArrayBuffer =
    typeof content === 'string'
      ? encoder.encode(content).buffer as ArrayBuffer
      : new Uint8Array(content).buffer as ArrayBuffer
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Parse LaTeX log file for errors and warnings
 */
export function parseLatexLog(log: string): {
  errors: CompileError[]
  warnings: string[]
} {
  const errors: CompileError[] = []
  const warnings: string[] = []

  const lines = log.split('\n')
  let currentFile = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!

    // Track current file
    const fileMatch = line.match(/^\(([^)]+\.tex)/)
    if (fileMatch) {
      currentFile = fileMatch[1]!
    }

    // Parse errors
    const errorMatch = line.match(/^! (.+)/)
    if (errorMatch) {
      // Look for line number in following lines
      let lineNum = 0
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const lineNumMatch = lines[j]?.match(/^l\.(\d+)/)
        if (lineNumMatch) {
          lineNum = parseInt(lineNumMatch[1]!, 10)
          break
        }
      }
      errors.push({
        file: currentFile,
        line: lineNum,
        message: errorMatch[1]!,
        type: 'error',
      })
    }

    // Parse warnings
    if (line.includes('Warning:')) {
      warnings.push(line.trim())
    }
  }

  return { errors, warnings }
}
