# AGENTS.md - LMMs-Lab Write

Guidelines for AI agents operating in this codebase.

## Project Overview

Collaborative LaTeX editing platform with real-time sync. Three packages:
- `packages/web` - Next.js 15 web app (React 19, Supabase, Y.js)
- `packages/cli` - Node.js CLI for local LaTeX compilation
- `packages/shared` - Shared types and utilities

## Build Commands

```bash
# Root - runs across all packages via Turborepo
pnpm build          # Build all packages
pnpm dev            # Dev mode all packages
pnpm lint           # Lint all packages
pnpm typecheck      # Type check all packages
pnpm format         # Format with Prettier
pnpm clean          # Clean build artifacts

# Single package
pnpm --filter web build
pnpm --filter web dev
pnpm --filter web typecheck
pnpm --filter cli build
pnpm --filter cli typecheck

# IMPORTANT: Always run before deploying
cd packages/web && pnpm build && pnpm typecheck
```

## Test Commands

No test framework configured yet. When adding tests:
```bash
# Future pattern
pnpm test                    # All tests
pnpm --filter web test       # Web tests only
pnpm test -- path/to/test    # Single test file
```

## Local Development

```bash
# Start web app on custom port
cd packages/web
pnpm dev -p 4355

# Environment variables required (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://zafyriojatnniyabkqrc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx  # Get from Supabase Dashboard
NEXT_PUBLIC_SITE_URL=http://localhost:4355
```

## Database Setup (Supabase)

Project ref: `zafyriojatnniyabkqrc`

```bash
# Option 1: Supabase CLI (requires login)
supabase login
supabase link --project-ref zafyriojatnniyabkqrc
supabase db push

# Option 2: SQL Editor (if CLI has issues with $$ syntax)
# Go to: https://supabase.com/dashboard/project/zafyriojatnniyabkqrc/sql/new
# Run: packages/web/supabase/migrations/20240123000000_initial_schema.sql
```

## Deployment

```bash
# Source token first
source ~/.zshrc

# Deploy to Vercel
cd packages/web
vercel --prod --token $VERCEL_TOKEN

# Verify deployment
curl -s -o /dev/null -w "%{http_code}" https://latex-writer.vercel.app
```

### Build-Fix Loop (for deployment issues)

```
REPEAT:
  1. Run `pnpm build && pnpm typecheck` locally first
  2. Run `vercel --prod --token $VERCEL_TOKEN`
  3. If build fails: fix errors, go to step 1
  4. If succeeds: verify with curl, check for 200
UNTIL: Build succeeds AND site returns 200
```

## Code Style

### TypeScript Configuration
- **Target**: ES2022
- **Module**: ESNext with bundler resolution
- **Strict mode**: Enabled
- **`noUncheckedIndexedAccess`**: Enabled - array access returns `T | undefined`

```typescript
// WRONG - will error
const item = items[0]
item.doSomething()

// CORRECT - handle undefined
const item = items[0]
if (item) item.doSomething()
// OR
const item = items[0]!  // Only if you're certain
```

### File Naming
- **Files**: `kebab-case.ts`, `kebab-case.tsx`
- **Components**: `PascalCase` (`CollaborativeEditor`)
- **Functions**: `camelCase` (`getDocuments`)
- **Types/Interfaces**: `PascalCase` (`Document`, `CompileResult`)
- **Constants**: `UPPER_SNAKE_CASE` (`DEFAULT_CLI_CONFIG`)

### Import Order
```typescript
// 1. External packages
import { spawn } from 'cross-spawn'
import chalk from 'chalk'

// 2. Next.js / React
import { NextResponse } from 'next/server'
import { useEffect, useState } from 'react'

// 3. Internal packages
import type { CompileResult } from '@latex-writer/shared'

// 4. Local imports with alias
import { createClient } from '@/lib/supabase/server'

// 5. Relative imports
import { SignOutButton } from './sign-out-button'
```

### Type Exports
Use `type` keyword for type-only exports/imports:
```typescript
import type { LaTeXEngine } from '@latex-writer/shared'
export type { Document, CompileResult }
```

### Component Structure
```typescript
'use client'  // Only if client-side interactivity needed

import { ... } from 'react'
// ... other imports

type Props = {
  documentId: string
  readOnly?: boolean
}

export function ComponentName({ documentId, readOnly = false }: Props) {
  // hooks first
  const [state, setState] = useState(false)
  
  // effects
  useEffect(() => { ... }, [])
  
  // handlers
  const handleClick = () => { ... }
  
  // render
  return (...)
}
```

### API Routes (Next.js App Router)
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  // Auth check first
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse body safely
  const body = await request.json().catch(() => ({}))
  
  // Database operation
  const { data, error } = await supabase.from('table').insert(...)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
```

## Error Handling

### Web Package
```typescript
// API routes - return JSON errors
return NextResponse.json({ error: 'Message' }, { status: 400 })

// Server components - use redirect or throw
if (!user) redirect('/login')

// Client components - use state
const [error, setError] = useState<string | null>(null)
```

### CLI Package
```typescript
import chalk from 'chalk'
import ora from 'ora'

// User-facing errors
console.error(chalk.red(`Error: ${message}`))

// Progress indicators
const spinner = ora('Compiling...').start()
spinner.succeed(chalk.green('Done'))
spinner.fail(chalk.red('Failed'))
```

## Design System

**Monochrome only** - no colors except grayscale.

### Tailwind Colors
```
background: #ffffff
foreground: #000000
border: #e5e5e5
muted: #666666
accent: #f5f5f5
```

### UI Principles
- No rounded corners (`rounded-none` or omit)
- Sharp borders (`border border-border`)
- High contrast (black on white)
- Minimal shadows
- Geist font family

```tsx
// CORRECT
<button className="border border-border px-4 py-2 hover:bg-accent">

// WRONG - no rounded corners, no colors
<button className="rounded-lg bg-blue-500 px-4 py-2">
```

## Path Aliases

| Package | Alias | Path |
|---------|-------|------|
| web | `@/*` | `./src/*` |
| cli | none | relative imports |
| shared | none | relative imports |

## Key Dependencies

### Web
- **Next.js 15** - App Router, Server Components
- **React 19** - with new features
- **Supabase** - Auth, PostgreSQL, Realtime
- **CodeMirror 6** - Editor
- **Y.js** - CRDT for real-time collaboration
- **Tailwind CSS** - Styling

### CLI
- **cac** - CLI argument parsing
- **chalk** - Terminal colors
- **ora** - Spinners
- **chokidar** - File watching
- **cross-spawn** - Process spawning

### CLI Templates

Located in `packages/cli/templates/`. Initialize with `latex-writer init -t <template>`:

| Template | Source | Description |
|----------|--------|-------------|
| `article` | Built-in | Simple LaTeX article |
| `thesis` | Built-in | Thesis/dissertation |
| `beamer` | Built-in | Presentation slides |
| `neurips` | Official NeurIPS 2024 | Conference paper |
| `iclr` | Official ICLR 2025 | Conference paper |
| `tech-report` | LMMs-Lab style | Tech report with metadata |

```bash
# Examples
latex-writer init -t neurips    # NeurIPS 2024 template
latex-writer init -t iclr       # ICLR 2025 template
latex-writer init -t tech-report # LMMs-Lab tech report
```

## Common Patterns

### Supabase Server Client
```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
```

### Protected Routes
Routes under `/editor/*` and `/dashboard/*` require auth (handled by middleware).

### Real-time Collaboration
Uses Y.js with custom Supabase provider at `@/lib/yjs/supabase-provider.ts`.

## Don'ts

- Don't use `as any` or `@ts-ignore`
- Don't add rounded corners to UI
- Don't use colors (except grayscale)
- Don't skip auth checks in API routes
- Don't commit `.env` files
- Don't add AI attribution to commits
