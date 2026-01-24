# Lib Modules - Web Utilities

## Overview

Core utility modules for state management and external integrations. All modules follow the **State Mirroring** pattern: system state (WS/SSE/FS) is mirrored into React state via specialized hooks.

## Modules

### daemon/

WebSocket bridge to local CLI daemon (`ws://localhost:3001`).

- **Use when**: Document is in "Local Mode".
- **Hook**: `useDaemon`
- **Capabilities**: File tree synchronization, git status/operations, LaTeX compilation, PTY terminal management.

### filesystem/

Direct browser disk access via File System Access API.

- **Use when**: Browser-only file operations or as a fallback for daemon-less local editing.
- **Hook**: `useFileSystem`
- **Capabilities**: Directory handle management, recursive file node generation.

### opencode/

AI assistant integration via Server-Sent Events (SSE).

- **Use when**: Implementing chat interface or AI-driven code edits.
- **Hook**: `useOpenCode`
- **Pattern**: `OpenCodeClient` handles raw SSE stream; hook manages chat history and tool call execution state.

### supabase/

Supabase client factories for different environments.

- **`server.ts`**: Use in Server Components and API routes (handles cookies).
- **`client.ts`**: Use in Client Components.
- **`admin.ts`**: **SECURITY**: Uses `SERVICE_ROLE_KEY`. Only for background tasks/admin scripts. NEVER import in client-side code.

## Hook Pattern

Most modules export a `use*` hook that:

1. Initializes a singleton or connection on mount.
2. Synchronizes external events to local state.
3. Provides imperative methods for system interactions.
