# AGENTS.md - Web Package

**Generated:** 2026-01-24 | **Package:** @lmms-lab/writer-web

## Overview

Next.js 15 App Router frontend. React 19, Supabase, Tailwind CSS, CodeMirror 6. Manages real-time collaborative editing and local daemon bridge.

## Routing Structure

- **`(app)/`**: Main application logic. Protected by middleware.
  - `dashboard/`: Document listing, creation, and sharing.
  - `editor/[id]/`: Core editor interface.
- **`(auth)/`**: Public authentication flow.
  - `login/`, `signup/`: Supabase Auth entry points.
- **`api/`**: Server-side document operations and dev helpers.
- **`auth/callback/`**: Supabase PKCE callback handler.

## Middleware & Security

- **Session Sync**: Middleware uses `@supabase/ssr` to keep client/server sessions in sync via cookies.
- **Protected Routes**:
  - Redirects `/editor/*` and `/dashboard/*` to `/login` if unauthenticated.
  - Redirects `/login` and `/signup` to `/dashboard` if already authenticated.
- **Data Access**: Enforced via Supabase RLS policies. Server Components verify `getUser()` for identity.

## Component Patterns

- **Hydration Safety**: `CollaborativeEditor` is loaded via `next/dynamic` with `ssr: false` to prevent mismatch with CodeMirror.
- **Hybrid State**: Syncs local UI state (tabs, panel widths) via `localStorage` while document content syncs via Y.js/Supabase.
- **God Component**: `EditorPageClient` orchestrates the multi-pane editor layout.

## Key Components

- **`EditorPageClient`**: Manages complex layout, resizing, and daemon WebSocket lifecycle.
- **`CollaborativeEditor`**: CodeMirror 6 + Y.js integration. Handles remote cursors and presence.
- **`OpenCodePanel`**: AI chat interface for LaTeX assistance.
- **`FileTree`**: Navigates document files, supporting both cloud and local daemon modes.

## Complexity Hotspots

- **`editor-page-client.tsx`**: (~850 lines). High state density. Handles Git integration, terminal, and PDF preview.
- **`use-daemon.ts`**: Manages the persistent WebSocket connection to the local CLI agent.
- **`use-filesystem.ts`**: Complex state mapping between cloud DB and local disk.
