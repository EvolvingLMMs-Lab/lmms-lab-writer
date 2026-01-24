# Agentic LaTeX Writer - Implemented Features

## Overview

Agentic LaTeX Writer is an AI-native collaborative LaTeX editing platform. Let Claude, Cursor, and Codex write your papers while you focus on research.

## Core Features

### 1. Authentication System

- **Supabase Auth** - Email/password authentication
- **Dev Test Login** - One-click test login at `/dev/test-login` for development
- **Protected Routes** - Middleware protection for `/editor/*` and `/dashboard/*`

### 2. Document Management

- **Create Documents** - Create new LaTeX documents via dashboard
- **Document List** - View all owned and shared documents
- **Delete Documents** - Remove documents with accessible AlertDialog confirmation
- **Document Metadata** - Track creation date, last updated, ownership

### 3. Real-time Collaborative Editor

- **Y.js CRDT** - Conflict-free replicated data type for real-time sync
- **Supabase Provider** - Custom Y.js provider using Supabase Realtime
- **Awareness** - See collaborators currently editing (names, cursors)
- **Persistence** - Y.js updates stored in database, restored on page load
- **CodeMirror 6** - Modern editor with LaTeX syntax highlighting

### 4. Syntax Highlighting

- **LaTeX Language Mode** - Using `@codemirror/legacy-modes` stex mode
- **Monochrome Theme** - Consistent with design system (no colors)
- **Bracket Matching** - Highlight matching brackets
- **Line Numbers** - Visible line numbers in gutter
- **Active Line Highlight** - Highlight current line

### 5. Document Sharing

- **Share Modal** - Invite collaborators by email
- **Role-based Access** - Owner, Editor, Viewer permissions
- **Share Links** - Generate shareable links with tokens
- **Access Control** - RLS policies for document security

### 6. User Interface

- **Retro-Terminal Fintech Design** - See `docs/DESIGN.md` for full design system
- **Color Palette** - Warm gray background (#f5f5f0), black/white, orange accent (#ff5500)
- **Typography** - Monospace (Geist Mono) for data, sans-serif for headlines
- **Sharp Corners** - No rounded corners (design principle)
- **Orange Accent** - Single accent color for highlights, CTAs, active states
- **Black Pill Badges** - For status, labels, timestamps
- **Responsive Layout** - Mobile-friendly with `h-dvh` for Safari
- **Accessible Modals** - Focus trap, Escape key, ARIA labels

### 7. User Profile

- **Dashboard Profile** - Shows user email and avatar initial
- **Member Since** - Display account creation date

## Technical Implementation

### Database Schema (Supabase PostgreSQL)

- `documents` - Document metadata
- `document_files` - Multi-file support (future)
- `document_access` - User permissions
- `share_invites` - Pending invitations
- `yjs_updates` - Y.js CRDT updates (TEXT column for base64)

### Row Level Security (RLS)

- Security definer functions to prevent infinite recursion
- `has_document_access()` - Check if user has access
- `is_document_owner()` - Check if user owns document

### Key Files

```
packages/web/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── layout.tsx                  # Root layout with OG metadata
│   │   ├── globals.css                 # Global styles
│   │   ├── (auth)/                     # Auth pages (login, signup)
│   │   ├── (app)/
│   │   │   ├── dashboard/page.tsx      # Document list + profile
│   │   │   └── editor/[id]/            # Editor page
│   │   ├── api/
│   │   │   ├── documents/              # Document CRUD
│   │   │   └── dev/test-login/         # Dev-only test login
│   │   └── dev/test-login/             # Test login UI
│   ├── components/
│   │   ├── editor/
│   │   │   └── collaborative-editor.tsx # CodeMirror + Y.js
│   │   ├── sharing/
│   │   │   └── share-modal.tsx         # Share dialog
│   │   └── ui/
│   │       └── alert-dialog.tsx        # Accessible alert dialog
│   └── lib/
│       ├── supabase/                   # Supabase clients
│       ├── yjs/
│       │   └── supabase-provider.ts    # Y.js + Supabase Realtime
│       ├── templates.ts                # LaTeX templates
│       └── utils.ts                    # cn() utility
```

## CLI Features (packages/cli)

- `alw compile` - Compile LaTeX locally
- `alw watch` - Watch mode compilation
- `alw init` - Initialize from templates
- `alw login` - Authenticate with web service
- `alw sync` - Sync project with cloud

### Available Templates

- **Tech Report** - LMMs-Lab style technical report
- **NeurIPS 2024** - Conference submission format
- **ICLR 2025** - Conference submission format

## UI/UX Improvements Applied

- `h-screen` to `h-dvh` - Mobile Safari viewport fix
- `transition-all` to `transition-colors` - Performance
- Added `aria-label` to icon buttons - Accessibility
- Added `aria-hidden` to decorative icons
- Added `text-balance`/`text-pretty` - Typography
- `w-10 h-10` to `size-10` - Tailwind shorthand
- Focus trap + Escape key for modals
- AlertDialog instead of native `confirm()`
- OG metadata for social sharing

## Dependencies Added

- `clsx` - Conditional classnames
- `tailwind-merge` - Merge Tailwind classes
- `@codemirror/legacy-modes` - LaTeX syntax highlighting
- `y-protocols` - Y.js awareness protocol
