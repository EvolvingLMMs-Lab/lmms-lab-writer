# LaTeX Writer

A collaborative LaTeX editing platform with real-time sync, similar to Overleaf.

## Features

- **Real-time Collaboration** - Multiple users can edit the same document simultaneously using Y.js CRDT
- **LaTeX Editor** - CodeMirror-based editor with syntax highlighting
- **Document Sharing** - Invite collaborators via email or shareable links
- **Role-based Access** - Owner, Editor, and Viewer permissions
- **CLI Tool** - Local LaTeX compilation with `latexmk`

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Supabase (Auth, PostgreSQL, Realtime)
- **Editor**: CodeMirror 6
- **Collaboration**: Y.js CRDT + Supabase Realtime
- **Build**: Turborepo, pnpm, tsup

## Project Structure

```
latex-writer/
├── packages/
│   ├── cli/          # Command-line tool for local LaTeX compilation
│   ├── web/          # Next.js web application
│   └── shared/       # Shared types and utilities
├── turbo.json        # Turborepo configuration
└── pnpm-workspace.yaml
```

## Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Supabase account
- LaTeX distribution (for CLI: MacTeX, TeX Live, or MiKTeX)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Luodian/latex-writer.git
cd latex-writer
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the database migration:

```bash
# Copy the SQL from packages/web/supabase/migrations/20240123000000_initial_schema.sql
# and run it in Supabase SQL Editor
```

### 4. Configure environment variables

```bash
cd packages/web
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## CLI Usage

The CLI tool provides local LaTeX compilation:

```bash
# Install globally
cd packages/cli
pnpm build
npm link

# Commands
latex-writer compile main.tex    # Compile a LaTeX file
latex-writer watch main.tex      # Watch and recompile on changes
latex-writer init                # Initialize a new LaTeX project
latex-writer login               # Authenticate with the web service
latex-writer sync                # Sync project with cloud
```

## Scripts

```bash
# Development
pnpm dev              # Start all packages in dev mode
pnpm build            # Build all packages
pnpm typecheck        # Type check all packages

# Web app only
pnpm --filter web dev
pnpm --filter web build

# CLI only
pnpm --filter cli build
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Set root directory to `packages/web`
4. Add environment variables
5. Deploy

### Manual

```bash
cd packages/web
pnpm build
pnpm start
```

## Database Schema

The application uses the following main tables:

- `documents` - LaTeX documents
- `document_files` - Files within a document (for multi-file projects)
- `document_access` - User access permissions
- `share_invites` - Pending collaboration invites
- `yjs_updates` - Y.js CRDT updates for real-time sync

All tables have Row Level Security (RLS) policies enabled.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT
