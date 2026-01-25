# AGENTS.md - LMMs-Lab Writer

**Updated:** 2026-01-25 | **Branch:** main

## Overview

AI-native LaTeX editor. Tauri v2 desktop application - let Claude, Cursor, and Codex write your papers while you focus on research.

## Architecture

```
lmms-lab-writer/
├── apps/
│   ├── desktop/              # Tauri v2 desktop app
│   │   ├── src/              # Next.js frontend (static export)
│   │   │   ├── app/page.tsx  # Main editor page
│   │   │   ├── components/   # React components
│   │   │   └── lib/tauri/    # Tauri IPC hooks
│   │   └── src-tauri/        # Rust backend
│   │       └── src/commands/ # Tauri commands (fs, git, compile, terminal, opencode)
│   └── web/                  # Marketing website (Vercel)
│       ├── src/app/          # Next.js pages (landing, docs, auth)
│       ├── content/docs/     # MDX documentation
│       └── src/lib/supabase/ # Supabase auth client
├── packages/
│   └── shared/               # Shared TypeScript types
├── turbo.json
└── pnpm-workspace.yaml
```

## Key Files

### Desktop App

| Task             | Location                                              | Notes                                |
| ---------------- | ----------------------------------------------------- | ------------------------------------ |
| Main UI          | `apps/desktop/src/app/page.tsx`                       | Editor, file tree, panels            |
| State Management | `apps/desktop/src/lib/tauri/use-tauri-daemon.ts`      | Central Tauri IPC hook               |
| File Tree        | `apps/desktop/src/components/editor/file-tree.tsx`    | Project navigation                   |
| LaTeX Editor     | `apps/desktop/src/components/editor/latex-editor.tsx` | CodeMirror-based                     |
| Terminal         | `apps/desktop/src/components/editor/terminal.tsx`     | xterm.js + PTY                       |
| Rust Commands    | `apps/desktop/src-tauri/src/commands/`                | fs, git, compile, terminal, opencode |
| Shared Types     | `packages/shared/src/index.ts`                        | FileNode, GitStatus, etc.            |

### Website

| Task          | Location                             | Notes                        |
| ------------- | ------------------------------------ | ---------------------------- |
| Landing Page  | `apps/web/src/app/page.tsx`          | Hero, features, CTA          |
| Download Page | `apps/web/src/app/download/page.tsx` | Platform downloads           |
| Docs Index    | `apps/web/src/app/docs/page.tsx`     | Documentation navigation     |
| Auth Pages    | `apps/web/src/app/(auth)/`           | Login, signup                |
| Supabase      | `apps/web/src/lib/supabase/`         | Auth client (browser/server) |
| MDX Docs      | `apps/web/content/docs/`             | Documentation content        |

## Commands

```bash
# Development
pnpm tauri:dev                              # Run Tauri desktop app in dev mode
pnpm --filter @lmms-lab/writer-web dev      # Run website in dev mode

# Build
pnpm build                                  # Build all packages
pnpm tauri:build                            # Build desktop .app/.dmg
pnpm --filter @lmms-lab/writer-web build    # Build website

# Verify
cd apps/desktop/src-tauri && cargo check    # Check Rust
cd apps/web && pnpm tsc --noEmit            # Check website TypeScript
```

## Conventions

### TypeScript

- `noUncheckedIndexedAccess: true` - Array access returns `T | undefined`
- Strict mode. No `as any`, no `@ts-ignore`

### File Naming

- Files: `kebab-case.ts`
- Components: `PascalCase`
- Functions: `camelCase`

### Design System

Monochrome only. No colors, no rounded corners.

| Token      | Value     |
| ---------- | --------- |
| background | `#ffffff` |
| foreground | `#000000` |
| border     | `#e5e5e5` |
| muted      | `#666666` |

See `docs/DESIGN.md` for full design system documentation.

## Anti-Patterns

| Pattern                       | Why                                 |
| ----------------------------- | ----------------------------------- |
| `as any`, `@ts-ignore`        | Type safety is non-negotiable       |
| `rounded-*` classes           | Sharp corners only                  |
| Colors other than grayscale   | Monochrome design                   |
| `std::fs` in async Rust       | Use `tokio::fs` or `spawn_blocking` |
| `std::thread::sleep` in async | Use `tokio::time::sleep`            |

## Performance Guidelines

### Frontend (React/Next.js)

1. **State Management**: Split large state objects into smaller slices to prevent unnecessary re-renders
2. **Memoization**: Use `React.memo` for components that receive stable props
3. **Parallel I/O**: Use `Promise.all` for independent async operations
4. **Dynamic Imports**: Heavy components (Terminal, OpenCodePanel) should use `next/dynamic`

### Backend (Rust/Tauri)

1. **Async I/O**: Use `tokio::fs` instead of `std::fs` in async handlers
2. **Process Management**: Use `tokio::process::Command` instead of `std::process::Command`
3. **IPC Throttling**: Buffer high-frequency events (compile output, PTY) before emitting
4. **Parallel Git**: Run independent git commands with `tokio::join!`
