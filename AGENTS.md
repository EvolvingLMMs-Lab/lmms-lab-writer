# AGENTS.md - LMMs-Lab Writer

**Updated:** 2026-02-08 | **Branch:** main

## Overview

AI-native LaTeX editor. Tauri v2 desktop application - let Claude, Cursor, Codex, and OpenCode write your papers while you focus on research. Local-first, cross-platform (macOS, Windows, Linux).

## Architecture

```
lmms-lab-writer/
├── apps/
│   ├── desktop/              # Tauri v2 desktop app
│   │   ├── src/              # Next.js frontend (React 19, static export)
│   │   │   ├── app/page.tsx  # Main editor page
│   │   │   ├── components/   # React components (40+ files)
│   │   │   │   ├── editor/   # Editor, file tree, terminal, diff, git panel
│   │   │   │   ├── opencode/ # AI chat panel, messages, tools, sessions
│   │   │   │   ├── auth/     # Login, deep-link, user dropdown
│   │   │   │   ├── latex/    # Compiler settings, install prompt, main file picker
│   │   │   │   └── ui/       # Shared UI (tabs, dialogs, toast, context menu, scroll)
│   │   │   └── lib/tauri/    # Tauri IPC hooks
│   │   └── src-tauri/        # Rust backend
│   │       └── src/commands/ # Tauri commands (fs, git, latex, terminal, opencode, auth)
│   ├── web/                  # Marketing website (Next.js 15, Vercel)
│   │   ├── src/app/          # Next.js pages (landing, docs, auth, download)
│   │   ├── content/docs/     # MDX documentation
│   │   └── src/lib/supabase/ # Supabase auth client
│   └── video/                # Marketing video (Remotion)
│       └── src/              # Video generation components
├── packages/
│   └── shared/               # Shared TypeScript types & utilities
│       └── src/index.ts      # FileNode, GitStatus, CompileResult, etc.
├── docs/                     # Project documentation
│   ├── DESIGN.md             # Design system (retro-terminal, monochrome + orange)
│   ├── MARKETING.md          # Marketing copy & launch strategy
│   ├── SCREENSHOT-GUIDE.md   # Asset capture guide
│   └── COPY-DAN-KOE.md      # Long-form copywriting
├── turbo.json
└── pnpm-workspace.yaml
```

## Key Files

### Desktop App

| Task             | Location                                              | Notes                                       |
| ---------------- | ----------------------------------------------------- | ------------------------------------------- |
| Main UI          | `apps/desktop/src/app/page.tsx`                       | Editor layout, panels, sidebar              |
| State Management | `apps/desktop/src/lib/tauri/use-tauri-daemon.ts`      | Central Tauri IPC hook (all backend calls)  |
| File Tree        | `apps/desktop/src/components/editor/file-tree.tsx`    | Project navigation, drag-and-drop           |
| LaTeX Editor     | `apps/desktop/src/components/editor/latex-editor.tsx` | CodeMirror 6 with syntax highlighting       |
| Monaco Editor    | `apps/desktop/src/components/editor/monaco-editor.tsx`| File editor with language detection         |
| Diff Editor      | `apps/desktop/src/components/editor/monaco-diff-editor.tsx` | Unified diff viewer                   |
| Terminal         | `apps/desktop/src/components/editor/terminal.tsx`     | xterm.js + PTY                              |
| Git Panel        | `apps/desktop/src/components/editor/sidebar-git-panel.tsx` | Git status, staging, commit            |
| Changes Review   | `apps/desktop/src/components/editor/changes-review-panel.tsx` | Review changes before commit        |
| Inline Diff      | `apps/desktop/src/components/editor/inline-diff-review.tsx` | Inline diff visualization            |
| GitHub Publish   | `apps/desktop/src/components/editor/github-publish-dialog.tsx` | Create GitHub repo & push          |
| OpenCode Panel   | `apps/desktop/src/components/opencode/opencode-panel.tsx` | AI chat interface                      |
| LaTeX Settings   | `apps/desktop/src/components/latex/latex-settings-dialog.tsx` | Compiler configuration             |
| LaTeX Install    | `apps/desktop/src/components/latex/latex-install-prompt.tsx` | Missing LaTeX detection              |
| Auth             | `apps/desktop/src/components/auth/`                   | Login, deep-link, user dropdown             |
| Shared Types     | `packages/shared/src/index.ts`                        | FileNode, GitStatus, CompileResult, etc.    |

### Rust Command Modules

| Module     | File                                                  | Key Commands                                     |
| ---------- | ----------------------------------------------------- | ------------------------------------------------ |
| `fs`       | `apps/desktop/src-tauri/src/commands/fs.rs`           | set_project_path, read_file, write_file, get_file_tree, watch_directory, create_file, rename_path, delete_path |
| `git`      | `apps/desktop/src-tauri/src/commands/git.rs`          | git_status, git_log, git_diff, git_commit, git_push, git_pull, git_clone, git_add, git_fetch, gh_check, gh_create_repo |
| `latex`    | `apps/desktop/src-tauri/src/commands/latex.rs`        | latex_compile, latex_detect_compilers, latex_detect_main_file, latex_clean_aux_files |
| `terminal` | `apps/desktop/src-tauri/src/commands/terminal.rs`     | spawn_pty, write_pty, resize_pty, kill_pty       |
| `opencode` | `apps/desktop/src-tauri/src/commands/opencode.rs`     | opencode_status, opencode_start, opencode_stop   |
| `auth`     | `apps/desktop/src-tauri/src/commands/auth.rs`         | start_auth_callback_server, get_auth_callback_port |
| `util`     | `apps/desktop/src-tauri/src/commands/util.rs`         | Shared utilities for path validation             |

### Website

| Task          | Location                             | Notes                        |
| ------------- | ------------------------------------ | ---------------------------- |
| Landing Page  | `apps/web/src/app/page.tsx`          | Hero, features, CTA          |
| Download Page | `apps/web/src/app/download/page.tsx` | Platform downloads           |
| Docs Index    | `apps/web/src/app/docs/page.tsx`     | Documentation navigation     |
| Auth Pages    | `apps/web/src/app/(auth)/`           | Login, signup                |
| Supabase      | `apps/web/src/lib/supabase/`         | Auth client (browser/server) |
| MDX Docs      | `apps/web/content/docs/`             | Quick start, installation    |

## Commands

```bash
# Development
pnpm tauri:dev                              # Run Tauri desktop app in dev mode
pnpm --filter @lmms-lab/writer-web dev      # Run website in dev mode

# Build
pnpm build                                  # Build all packages
pnpm tauri:build                            # Build desktop app (.app/.dmg/.exe/.deb)
pnpm --filter @lmms-lab/writer-web build    # Build website

# Verify
cd apps/desktop/src-tauri && cargo check    # Check Rust
cd apps/web && pnpm tsc --noEmit            # Check website TypeScript

# Lint & Format
pnpm lint                                   # ESLint check
pnpm lint:fix                               # ESLint auto-fix
pnpm format                                 # Prettier format
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

Retro-Terminal Fintech aesthetic. Monochrome + orange accent. No rounded corners.

| Token      | Value     |
| ---------- | --------- |
| background | `#f5f5f0` |
| foreground | `#000000` |
| accent     | `#ff5500` |
| border     | `#e5e5e5` |
| muted      | `#666666` |

**Button Style (Neo-Brutalism)**:

- Primary: `bg-accent text-white`, sharp corners, uppercase monospace
- Secondary: `bg-foreground text-white`, sharp corners
- Ghost: `border border-border`, hover with accent
- Use `btn btn-sm` classes with box-shadow offset effect
- NEVER use rounded corners

See `docs/DESIGN.md` for full design system documentation.

### Layout Alignment (OCD-Level Precision)

All visual elements must align perfectly across the site. Use consistent container patterns:

```
Standard Pattern (for sections, main content):
<section className="px-6">           // Padding OUTSIDE
  <div className="max-w-5xl mx-auto"> // Container INSIDE
    {content}
  </div>
</section>

For full-width elements with border (header, footer):
<header className="border-b border-border px-6">  // Padding on element
  <div className="max-w-5xl mx-auto">              // Container without px
    {content}
  </div>
</header>
```

**Rules:**

- `px-6` goes on the OUTER element, not inside `max-w-5xl`
- All pages use `max-w-5xl` for main container width
- Inner content can use `max-w-2xl`, `max-w-sm` etc. for reading width
- This ensures logo, content, and footer all share the same left/right edge

## Debugging (Tauri Desktop App)

**Always debug from dev mode** - don't waste time building. Dev mode has hot reload and DevTools.

### Quick Start Debug

```bash
# 1. Start dev mode (frontend + Tauri)
pnpm tauri:dev

# 2. Open DevTools in app:
#    macOS:   ⌥⌘I (or View → Toggle Developer Tools)
#    Windows: Ctrl+Shift+I
#    Linux:   Ctrl+Shift+I
# 3. Check Console tab for errors
```

### Diagnostic Commands

```bash
# Check frontend compiles
cd apps/desktop && pnpm tsc --noEmit

# Check Rust compiles
cd apps/desktop/src-tauri && cargo check

# Check dev server running (macOS/Linux)
lsof -i :3000

# Check dev server running (Windows)
netstat -ano | findstr :3000

# Kill stuck processes (macOS/Linux)
pkill -f "tauri" && pkill -f "next"

# Kill stuck processes (Windows)
taskkill /f /im "lmms-lab-writer.exe" 2>nul & taskkill /f /im "node.exe" /fi "WINDOWTITLE eq next" 2>nul
```

### Debug Layers (check in order)

| Layer               | Check                             | Tool                                  |
| ------------------- | --------------------------------- | ------------------------------------- |
| 1. Frontend (React) | Console errors, component renders | DevTools Console                      |
| 2. IPC Bridge       | `invoke()` calls, event listeners | DevTools Network + Console            |
| 3. Rust Backend     | Command execution, panics         | Terminal running `tauri dev`          |
| 4. Tauri Plugins    | Plugin init, permissions          | `src-tauri/capabilities/default.json` |

### Common Issues

| Symptom             | Likely Cause              | Fix                                                |
| ------------------- | ------------------------- | -------------------------------------------------- |
| Clicks do nothing   | JS error broke hydration  | Check Console for errors                           |
| Dialog doesn't open | Plugin permission missing | Check `capabilities/default.json`                  |
| IPC timeout         | Rust command panicked     | Check terminal for Rust errors                     |
| Stale UI            | Hot reload failed         | Restart `pnpm tauri:dev`                           |
| "invoke not found"  | Tauri API not loaded      | Check `withGlobalTauri: true` in `tauri.conf.json` |
| PTY not working     | Terminal spawn failed     | Check shell path exists (bash/cmd/powershell)      |

### Key Debug Files

| Issue Area         | Files to Check                                     |
| ------------------ | -------------------------------------------------- |
| UI/Click handlers  | `apps/desktop/src/app/page.tsx`                    |
| Tauri IPC hooks    | `apps/desktop/src/lib/tauri/use-tauri-daemon.ts`   |
| Rust commands      | `apps/desktop/src-tauri/src/commands/*.rs`         |
| Plugin permissions | `apps/desktop/src-tauri/capabilities/default.json` |
| Tauri config       | `apps/desktop/src-tauri/tauri.conf.json`           |

### Build Locations

```
macOS:   apps/desktop/src-tauri/target/release/bundle/macos/LMMs-Lab Writer.app
         apps/desktop/src-tauri/target/release/bundle/dmg/LMMs-Lab Writer_*.dmg
Windows: apps/desktop/src-tauri/target/release/bundle/nsis/LMMs-Lab Writer_*-setup.exe
Linux:   apps/desktop/src-tauri/target/release/bundle/appimage/LMMs-Lab Writer_*.AppImage
         apps/desktop/src-tauri/target/release/bundle/deb/lmms-lab-writer_*.deb
```

## Anti-Patterns

| Pattern                       | Why                                 |
| ----------------------------- | ----------------------------------- |
| `as any`, `@ts-ignore`        | Type safety is non-negotiable       |
| `rounded-*` classes           | Sharp corners only                  |
| Colors other than grayscale + orange | Monochrome + accent design   |
| `std::fs` in async Rust       | Use `tokio::fs` or `spawn_blocking` |
| `std::thread::sleep` in async | Use `tokio::time::sleep`            |
| `std::process::Command` in async | Use `tokio::process::Command`    |

## Performance Guidelines

### Frontend (React/Next.js)

1. **State Management**: Split large state objects into smaller slices to prevent unnecessary re-renders
2. **Memoization**: Use `React.memo` for components that receive stable props
3. **Parallel I/O**: Use `Promise.all` for independent async operations
4. **Dynamic Imports**: Heavy components (Terminal, OpenCodePanel, Monaco) should use `next/dynamic`

### Backend (Rust/Tauri)

1. **Async I/O**: Use `tokio::fs` instead of `std::fs` in async handlers
2. **Process Management**: Use `tokio::process::Command` instead of `std::process::Command`
3. **IPC Throttling**: Buffer high-frequency events (compile output, PTY) before emitting
4. **Parallel Git**: Run independent git commands with `tokio::join!`
5. **Path Validation**: All file operations must validate paths are within the project directory (see `util.rs`)
