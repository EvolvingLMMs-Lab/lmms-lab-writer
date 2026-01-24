# AGENTS.md - Agentic LaTeX Writer

**Generated:** 2026-01-24 | **Commit:** 2b1dfaa | **Branch:** main

## Overview

AI-native LaTeX editing platform. Let Claude, Cursor, and Codex write your papers while you focus on research. Web editor (Next.js 15) + local CLI daemon for compilation. Real-time sync via Supabase + optional local file bridge.

## Structure

```
agentic-latex-writer/
├── packages/
│   ├── web/          # Next.js 15 App Router - see packages/web/AGENTS.md
│   ├── cli/          # Node CLI daemon - see packages/cli/AGENTS.md
│   └── shared/       # Types: Document, CompileResult, GitStatus
├── turbo.json        # Task orchestration (build depends on ^build)
└── pnpm-workspace.yaml
```

## Where to Look

| Task             | Location                                  | Notes                                               |
| ---------------- | ----------------------------------------- | --------------------------------------------------- |
| Editor UI        | `packages/web/src/app/(app)/editor/[id]/` | God component: `editor-page-client.tsx` (848 lines) |
| Dashboard        | `packages/web/src/app/(app)/dashboard/`   | Document list, sharing                              |
| API routes       | `packages/web/src/app/api/`               | Supabase + auth checks                              |
| CLI daemon       | `packages/cli/src/commands/serve.ts`      | WebSocket server (750 lines)                        |
| Shared types     | `packages/shared/src/index.ts`            | Domain model for both packages                      |
| Supabase clients | `packages/web/src/lib/supabase/`          | server.ts, client.ts, admin.ts                      |
| Local FS bridge  | `packages/web/src/lib/daemon/`            | useDaemon hook                                      |
| DB schema        | `packages/web/supabase/migrations/`       | RLS policies defined here                           |

## Architecture

```
┌─────────────┐     WebSocket      ┌─────────────┐
│  Web App    │ ◄─────────────────► │  CLI Daemon │
│  (Next.js)  │   ws://localhost:3001   │  (Node.js)  │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │ REST/Realtime                    │ Local FS
       ▼                                  ▼
┌─────────────┐                    ┌─────────────┐
│  Supabase   │                    │  latexmk    │
│  (Cloud)    │                    │  git, pty   │
└─────────────┘                    └─────────────┘
```

**Key flows:**

- Cloud-only: Web ↔ Supabase (documents, auth, presence)
- Local mode: Web ↔ CLI daemon ↔ local files + latexmk

## Commands

**AI Agents: Do NOT start dev servers. Only use build commands for verification.**

```bash
# Verify changes (use this, not dev)
pnpm build && pnpm typecheck

# Development (human use only)
pnpm dev              # All packages
pnpm --filter web dev -p 4355  # Web on port 4355

# Deploy
cd packages/web && vercel --prod --token $VERCEL_TOKEN

# CLI daemon (for local compilation)
cd packages/cli && pnpm dev  # or: llw serve
```

## Conventions

### TypeScript

- **`noUncheckedIndexedAccess: true`** - Array access returns `T | undefined`. Handle it.
- Strict mode enabled. No `as any`, no `@ts-ignore`.

### File Naming

- Files: `kebab-case.ts`
- Components: `PascalCase`
- Functions: `camelCase`

### Import Order

1. External (`cross-spawn`, `chalk`)
2. Next.js/React
3. Internal packages (`@agentic-latex-writer/shared`)
4. Local aliases (`@/lib/...`)
5. Relative (`./component`)

### Supabase Pattern

```typescript
// Server components / API routes
const supabase = await createClient(); // from @/lib/supabase/server
const {
  data: { user },
} = await supabase.auth.getUser(); // NOT getSession()

// Client components
const supabase = createClient(); // from @/lib/supabase/client
```

## Design System

**Monochrome only.** No exceptions.

| Token      | Value     |
| ---------- | --------- |
| background | `#ffffff` |
| foreground | `#000000` |
| border     | `#e5e5e5` |
| muted      | `#666666` |
| accent     | `#f5f5f5` |

```tsx
// CORRECT
<button className="border border-border px-4 py-2 hover:bg-accent">

// WRONG - no rounded, no colors
<button className="rounded-lg bg-blue-500">
```

### Keyboard Shortcut Style (`<kbd>`)

Use the global `kbd` element for keyboard shortcuts. Styled in `globals.css`:

```css
kbd {
  @apply inline-flex items-center justify-center gap-1 px-2 py-1 text-xs font-mono;
  @apply bg-white border border-neutral-300 text-neutral-700;
  box-shadow:
    0 1px 0 1px rgba(0, 0, 0, 0.04),
    0 2px 0 rgba(0, 0, 0, 0.06),
    inset 0 -1px 0 rgba(0, 0, 0, 0.04);
}
```

Usage:

```tsx
// Single key
<kbd>K</kbd>

// Key combination - use multiple kbd elements
<kbd>⌘</kbd> <kbd>K</kbd>

// Or single kbd with gap
<kbd>⌘ K</kbd>
```

Visual: Light background, subtle 3D pressed effect via layered box-shadow. No rounded corners.

### Button Style (`.btn`)

Buttons use a 3D shadow effect with press animation. Styled in `globals.css`:

```css
.btn {
  @apply px-6 py-3 font-mono text-sm uppercase tracking-wider border border-black;
  box-shadow: 3px 3px 0 0 rgba(0, 0, 0, 1);
}

.btn:hover {
  box-shadow: 2px 2px 0 0 rgba(0, 0, 0, 1);
  transform: translate(1px, 1px);
}

.btn:active {
  box-shadow: 0 0 0 0 rgba(0, 0, 0, 1);
  transform: translate(3px, 3px);
}
```

Variants:

| Class            | Use Case                                 |
| ---------------- | ---------------------------------------- |
| `.btn-primary`   | Black bg, white text - main actions      |
| `.btn-secondary` | White bg, black text - secondary actions |
| `.btn-sm`        | Smaller padding, 2px shadow              |
| `.btn-icon`      | Icon-only buttons                        |
| `.btn-outline`   | No shadow, border only                   |

Usage:

```tsx
<button className="btn btn-primary">Save</button>
<button className="btn btn-sm btn-secondary">Cancel</button>
```

Visual: Hard offset black shadow creates 3D depth. Press animation moves button toward shadow origin.

## Anti-Patterns (Forbidden)

| Pattern                          | Why                                     |
| -------------------------------- | --------------------------------------- |
| `as any`, `@ts-ignore`           | Type safety is non-negotiable           |
| `rounded-*` classes              | Sharp corners only                      |
| Colors other than grayscale      | Monochrome design                       |
| Skip auth in API routes          | Security hole                           |
| `getSession()` for user identity | Use `getUser()` - validates with server |
| AI attribution in commits        | No "Co-Authored-By: Claude"             |
| Empty catch blocks               | Handle errors properly                  |

## Gotchas

1. **Array access**: `items[0]` returns `T | undefined` - always check
2. **Daemon required for local mode**: Web editor can work cloud-only, but local compilation needs `llw serve` running
3. **Vercel deploy**: `vercel.json` escapes to monorepo root (`cd ../..`) - intentional
4. **No tests**: Zero automated tests currently. Manual dev helpers only at `/dev/test-login`
5. **HACK in editor**: `editor-page-client.tsx:185` - manual path resolution for browser FS (browser limitation)

## Complexity Hotspots

| File                                        | Lines | What It Does                             |
| ------------------------------------------- | ----- | ---------------------------------------- |
| `packages/web/.../editor-page-client.tsx`   | 848   | Editor orchestrator - 15+ useState hooks |
| `packages/cli/src/commands/serve.ts`        | 750   | Daemon - git/pty/file watching           |
| `packages/web/.../opencode-panel.tsx`       | 443   | AI chat panel                            |
| `packages/web/.../collaborative-editor.tsx` | 359   | CodeMirror + Supabase presence           |

## Subdirectory Docs

- `packages/web/AGENTS.md` - Next.js app specifics
- `packages/cli/AGENTS.md` - CLI daemon specifics
- `packages/web/src/lib/AGENTS.md` - Utility modules (daemon, supabase, filesystem, opencode)
