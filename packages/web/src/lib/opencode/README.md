# OpenCode Integration

This module provides integration with [OpenCode](https://github.com/sst/opencode) - an AI coding assistant.

## Setup

1. Install OpenCode globally:
   ```bash
   npm install -g opencode
   ```

2. Start the OpenCode web server:
   ```bash
   opencode web --port 4096
   ```

3. Open the LaTeX Writer editor and switch to the "OpenCode" tab in the right panel.

4. Click "Connect" to establish connection with the OpenCode server.

## Usage

Once connected:

1. Click "New Session" to start a new conversation
2. Type your message in the input box and press Enter (or click Send)
3. OpenCode will respond with text and may use tools to read/write files
4. Click "Stop" to abort a running request

## Architecture

```
packages/web/src/lib/opencode/
├── index.ts          # Re-exports all modules
├── types.ts          # TypeScript types for OpenCode API
├── client.ts         # API client with SSE and REST support
├── use-opencode.ts   # React hook for state management
└── README.md         # This file

packages/web/src/components/opencode/
└── opencode-panel.tsx  # Main UI component
```

### API Client (`client.ts`)

- Connects to OpenCode server via Server-Sent Events (SSE) at `/event`
- Makes REST calls to `/session`, `/session/{id}/chat`, `/session/{id}/abort`
- Manages local state for sessions, messages, and parts
- Auto-reconnects on connection loss

### React Hook (`use-opencode.ts`)

- Wraps the API client for React components
- Provides state: `connected`, `connecting`, `error`, `sessions`, `messages`, `parts`, `status`
- Provides actions: `connect`, `disconnect`, `createSession`, `selectSession`, `sendMessage`, `abort`

### Types (`types.ts`)

Key types:
- `Message` - User or Assistant message
- `Part` - Content parts (text, tool, reasoning, file)
- `ToolPart` - Tool call with status (pending, running, completed, error)
- `SessionInfo` - Session metadata
- `SessionStatus` - Current session state (idle, running, retry)
- `Event` - SSE event types from the server

## Configuration

The OpenCode panel accepts these props:

```typescript
type Props = {
  className?: string
  baseUrl?: string    // Default: 'http://localhost:4096'
  directory?: string  // Working directory for OpenCode
}
```

To change the server URL, modify the `baseUrl` prop in `editor-page-client.tsx`:

```tsx
<DynamicOpenCodePanel
  baseUrl="http://localhost:4096"
  className="h-full"
/>
```

## Troubleshooting

**Connection failed**
- Ensure OpenCode server is running: `opencode web --port 4096`
- Check that port 4096 is not blocked by firewall
- Verify the baseUrl matches the server port

**No response from AI**
- Check OpenCode server logs for errors
- Ensure you have valid API keys configured in OpenCode
- Try creating a new session

**Tools not working**
- OpenCode needs access to the file system
- Ensure the working directory is correct
