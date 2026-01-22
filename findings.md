# Findings & Decisions

## Requirements
- TypeScript project for local LaTeX compilation
- npm binary installable via `npm install -g latex-writer`
- macOS first, cross-platform later
- Next.js web app hosted on Vercel
- Supabase for authentication and database
- User registration with email verification
- Real-time collaborative editing sessions
- Session sharing similar to Overleaf
- Follow Brian's monochrome minimalist frontend design

## Research Findings

### PhD_Thesis LaTeX Setup (COMPLETE)
- **Engine**: XeLaTeX (verified from mythesis.log: XeTeX, Version 3.14159265-2.6-0.99999)
- **Build Tool**: latexmk (no Makefile or .latexmkrc - uses defaults)
- **Compile Command**: `latexmk -xelatex mythesis.tex`
- **Document Class**: Custom Thesis.cls based on book class
- **Bibliography**: natbib with unsrtnat style, stored in References/reference.bib
- **Key Packages**:
  - tikz & pgfplots for graphics
  - tcolorbox for custom "AIbox" styles
  - algorithm2e for pseudo-code
  - CJKutf8 for Chinese support
  - amsmath, amssymb, bm for math
  - hyperref for interactive PDFs
- **Structure**: Modular with \input for chapters from Chapters/ folder
- **Custom Macros**: Styles/mydefs.sty for project-specific definitions
- **Overleaf Sync**: Has .overleaf/settings.json for cloud builds

### Overleaf CE Architecture (COMPLETE)
**Core Architecture**: Service-oriented with OT (Operational Transformation)

**Document Synchronization**:
- Uses customized ShareJS (precursor to ShareDB)
- document-updater service is the central OT engine
- Documents stored as array of strings (lines)
- Conflict resolution via document-level Redis lock

**Multi-user Editing**:
1. **Ingestion**: real-time service receives WebSocket updates → pushes to Redis pendingUpdates list
2. **Processing**: document-updater pulls from list, applies OT under Redis lock
3. **Broadcast**: Publishes applied-ops via Redis Pub/Sub → real-time broadcasts to all clients

**WebSocket/Real-time**:
- Built on Socket.io
- Horizontally scalable with socket.io-redis
- Room-based: users join rooms by project_id, sub-rooms by doc_id
- Entry point: services/real-time/app/js/WebsocketController.js

**Database Schema**:
- **Redis (Hot)**: Active document state, version numbers, pending updates, locks
- **MongoDB (Metadata)**: Project structure, user profiles, settings
- **Docstore (Persistence)**: Long-term document storage
- Documents only flushed to persistent storage when project goes idle

**Auth & Permissions**:
- Sessions stored in Redis
- AuthorizationManager validates privilege levels (owner, collaborator, read-only)

**Key Files**:
- /tmp/overleaf-ce/services/document-updater/app/js/ShareJsDB.js
- /tmp/overleaf-ce/services/document-updater/app/js/UpdateManager.js
- /tmp/overleaf-ce/services/real-time/app/js/WebsocketController.js
- /tmp/overleaf-ce/services/web/app/src/models/Project.mjs

### Supabase Realtime (COMPLETE)
**Postgres CDC (Change Data Capture)**:
```javascript
const channel = supabase.channel('doc-changes')
channel.on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, (payload) => { ... })
```

**Presence API**:
```javascript
const presenceChannel = supabase.channel('doc:presence', { config: { presence: { key: userId } } })
presenceChannel.on('presence', { event: 'sync' }, () => { ... })
await presenceChannel.track({ user_id, username, online_at })
```

**Y.js Integration**: Use `@kamick/supabaseprovider` for CRDT sync

**RLS Patterns**:
- User-owned: `using (created_by = auth.uid())`
- Invite-based: Join with `doc_access` table
- Workspace-based: Join with `workspace_members`

### Vercel Deployment (COMPLETE)
**vercel.json**:
```json
{
  "functions": { "api/*": { "memory": 1024, "maxDuration": 30 } },
  "rewrites": [...],
  "headers": [...]
}
```

**Edge Runtime**:
```typescript
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const maxDuration = 300
```

**Supabase SSR Setup** (`@supabase/ssr`):
- `createServerClient()` for server components
- `createBrowserClient()` for client components
- Middleware required for session refresh

### npm CLI Packaging (COMPLETE)
**package.json bin field**:
```json
{ "bin": { "latex-writer": "./dist/cli.js" } }
```

**Shebang**: `#!/usr/bin/env node` at top of entry file

**tsup for bundling** (recommended):
```typescript
// tsup.config.ts
export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['esm'],
  target: 'node20',
  dts: true,
  banner: { js: '#!/usr/bin/env node' }
})
```

**CLI Framework**: `cac` (lightweight) or `commander`

**LaTeX execution**: Use `child_process.spawn()` with `latexmk`

## Technical Decisions (from Oracle consultation)
| Decision | Rationale |
|----------|-----------|
| **Y.js CRDT + Supabase Realtime** | Correct merges, offline-friendly, no OT server needed. Supabase Realtime as transport (broadcast + presence), Postgres as durable persistence |
| Turborepo monorepo | Shared types between CLI and web, unified build |
| pnpm package manager | Fast, disk efficient, workspace support |
| XeLaTeX as default engine | Matches PhD_Thesis setup, good Unicode support |
| latexmk for builds | Handles dependencies, incremental builds |
| Monaco/CodeMirror Editor | VSCode-like experience, LaTeX syntax support |
| tsup for CLI bundling | Zero-config esbuild, auto shebang, executable bit |
| cac for CLI framework | Lightweight, TypeScript-first |
| @supabase/ssr for auth | Modern SSR pattern, middleware session refresh |

## Architecture Decisions (from Oracle)
**Real-time Sync Strategy**: Y.js CRDT + Supabase Realtime
- Clients hold Y.Doc, broadcast updates on `doc:{id}` channel
- Server stores append-only `yjs_updates` table + periodic snapshots
- Compaction: Merge updates when count > 200, delete old rows

**Persistence Pattern**:
- `yjs_updates` table: `(id, document_id, created_at, is_snapshot, update bytea)`
- Bootstrap: Load latest snapshot + subsequent updates
- No live document state in serverless memory

**CLI Auth Pattern**: Web-based "Connect CLI" flow
- Web app issues one-time code
- CLI opens browser → user approves → CLI polls exchange endpoint
- Store refresh token in macOS Keychain (`keytar`)

**CLI Sync Pattern**: File-based (not CRDT)
- REST API with JWT auth
- Supabase Storage for file blobs
- Offline: Queue uploads, resolve conflicts with "copy-on-conflict"

## Issues Encountered
| Issue | Resolution |
|-------|------------|

## Resources
- PhD_Thesis: /Users/luodian/Github/PhD_Thesis
- Overleaf CE: /tmp/overleaf-ce
- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
- latexmk manual: https://mg.readthedocs.io/latexmk.html

## Visual/Browser Findings
- (Will be updated as research completes)

---
*Update this file after every 2 view/browser/search operations*
