# Task Plan: LaTeX Writer - Collaborative LaTeX Editor Platform

## Goal
Build a comprehensive LaTeX writing platform with: (1) TypeScript npm CLI for local LaTeX compilation on macOS, (2) Next.js web app hosted on Vercel with Supabase for auth/database, (3) Real-time collaborative editing similar to Overleaf.

## Current Phase
Phase 1

## Phases

### Phase 1: Requirements & Discovery
- [x] Understand PhD_Thesis LaTeX compilation setup
- [x] Clone and study Overleaf CE architecture
- [x] Research Supabase Realtime SDK for collaboration
- [x] Research Vercel deployment patterns
- [x] Research npm CLI packaging for macOS
- **Status:** in_progress

### Phase 2: Architecture & Planning
- [ ] Design monorepo structure (CLI + Web)
- [ ] Define database schema for documents, users, sessions
- [ ] Design real-time sync architecture (Supabase Realtime vs custom)
- [ ] Define API contracts between CLI and web service
- [ ] Document technical decisions
- **Status:** pending

### Phase 3: CLI Implementation
- [ ] Set up TypeScript CLI project with proper bin configuration
- [ ] Implement LaTeX compilation (latexmk/pdflatex/xelatex)
- [ ] Add file watching and incremental builds
- [ ] Implement auth flow (connect to Supabase)
- [ ] Add sync commands for project upload/download
- [ ] Test on macOS
- **Status:** pending

### Phase 4: Web App - Core Infrastructure
- [ ] Set up Next.js 14 with App Router
- [ ] Configure Supabase client (auth, database, realtime)
- [ ] Implement user registration and verification
- [ ] Set up Vercel deployment configuration
- [ ] Create database migrations (users, documents, sessions)
- **Status:** pending

### Phase 5: Web App - Editor & Collaboration
- [ ] Build Monaco/CodeMirror-based LaTeX editor
- [ ] Implement real-time document sync with Supabase Realtime
- [ ] Add presence indicators (who's editing)
- [ ] Implement cursor sharing
- [ ] Add PDF preview with auto-refresh
- **Status:** pending

### Phase 6: Web App - Session Sharing
- [ ] Implement document sharing (invite by email/link)
- [ ] Add permission levels (view/edit/admin)
- [ ] Build sharing UI components
- [ ] Add collaborative history/revision tracking
- **Status:** pending

### Phase 7: Integration & Polish
- [ ] Connect CLI to web service (sync, compile)
- [ ] Add compile-on-server capability
- [ ] Build unified authentication flow
- [ ] UI/UX polish following Brian's frontend design
- **Status:** pending

### Phase 8: Testing & Deployment
- [ ] End-to-end testing
- [ ] Performance testing for real-time sync
- [ ] Deploy to Vercel production
- [ ] Publish npm package
- [ ] Documentation
- **Status:** pending

## Key Questions
1. Which LaTeX engine to support? (pdflatex, xelatex, lualatex) - PhD_Thesis uses xelatex
2. Use Supabase Realtime vs custom WebSocket? - TBD based on Overleaf study
3. Operational Transform (OT) vs CRDT for conflict resolution? - TBD
4. How to handle large LaTeX projects with many files? - TBD
5. Server-side or client-side PDF compilation? - Both (CLI local, web server-side)

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Monorepo with Turborepo | Shared types between CLI and web, unified build process |
| Next.js 14 App Router | Latest patterns, server components for performance |
| Supabase for auth/database | Managed, Realtime built-in, good free tier |
| Vercel for hosting | Zero-config Next.js deployment, edge functions |
| TypeScript throughout | Type safety across CLI and web |
| macOS first for CLI | User's explicit requirement |
| latexmk for compilation | Standard, handles dependencies automatically |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|

## Notes
- PhD_Thesis uses XeLaTeX with latexmk
- Overleaf CE uses ShareDB for OT-based collaboration
- Focus on macOS first for CLI, but keep cross-platform in mind
- Follow Brian's monochrome minimalist design for web UI
