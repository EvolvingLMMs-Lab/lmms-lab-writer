// OpenCode SDK Types (subset for API integration)

export type FileDiff = {
  file: string
  before: string
  after: string
  additions: number
  deletions: number
}

export type UserMessage = {
  id: string
  sessionID: string
  role: 'user'
  time: {
    created: number
  }
  summary?: {
    title?: string
    body?: string
    diffs: FileDiff[]
  }
  agent: string
  model: {
    providerID: string
    modelID: string
  }
}

export type AssistantMessage = {
  id: string
  sessionID: string
  role: 'assistant'
  time: {
    created: number
    completed?: number
  }
  error?: {
    name: string
    data: {
      message: string
    }
  }
  parentID: string
  modelID: string
  providerID: string
  agent: string
  cost: number
  tokens: {
    input: number
    output: number
    reasoning: number
    cache: {
      read: number
      write: number
    }
  }
}

export type Message = UserMessage | AssistantMessage

export type TextPart = {
  id: string
  sessionID: string
  messageID: string
  type: 'text'
  text: string
  synthetic?: boolean
}

export type ReasoningPart = {
  id: string
  sessionID: string
  messageID: string
  type: 'reasoning'
  text: string
}

export type FilePart = {
  id: string
  sessionID: string
  messageID: string
  type: 'file'
  mime: string
  filename?: string
  url: string
}

export type ToolStatePending = {
  status: 'pending'
  input: Record<string, unknown>
}

export type ToolStateRunning = {
  status: 'running'
  input: Record<string, unknown>
  title?: string
  metadata?: Record<string, unknown>
}

export type ToolStateCompleted = {
  status: 'completed'
  input: Record<string, unknown>
  output: string
  title: string
  metadata: Record<string, unknown>
}

export type ToolStateError = {
  status: 'error'
  input: Record<string, unknown>
  error: string
}

export type ToolState = ToolStatePending | ToolStateRunning | ToolStateCompleted | ToolStateError

export type ToolPart = {
  id: string
  sessionID: string
  messageID: string
  type: 'tool'
  callID: string
  tool: string
  state: ToolState
}

export type Part = TextPart | ReasoningPart | FilePart | ToolPart | {
  id: string
  sessionID: string
  messageID: string
  type: string
}

export type SessionInfo = {
  id: string
  title: string
  time: {
    created: number
    updated: number
  }
  share?: {
    url: string
  }
  revert?: {
    messageID: string
  }
  summary?: {
    files: number
  }
}

export type SessionStatus = 
  | { type: 'idle' }
  | { type: 'running' }
  | { type: 'retry'; message: string; attempt: number; next?: number }

export type Event = 
  | { type: 'server.connected'; properties: Record<string, unknown> }
  | { type: 'server.heartbeat'; properties: Record<string, unknown> }
  | { type: 'session.updated'; properties: { info: SessionInfo } }
  | { type: 'session.deleted'; properties: { info: SessionInfo } }
  | { type: 'session.status'; properties: { sessionID: string; status: SessionStatus } }
  | { type: 'message.updated'; properties: { info: Message } }
  | { type: 'message.removed'; properties: { sessionID: string; messageID: string } }
  | { type: 'message.part.updated'; properties: { part: Part; delta?: string } }
  | { type: 'message.part.removed'; properties: { sessionID: string; messageID: string; partID: string } }

export type ToolInfo = {
  icon: string
  title: string
  subtitle?: string
}

export function getToolInfo(tool: string, input: Record<string, unknown> = {}): ToolInfo {
  const getFilename = (path: string) => path.split('/').pop() || path

  switch (tool) {
    case 'read':
      return {
        icon: 'glasses',
        title: 'Reading',
        subtitle: input.filePath ? getFilename(input.filePath as string) : undefined,
      }
    case 'list':
      return {
        icon: 'list',
        title: 'Listing',
        subtitle: input.path ? getFilename(input.path as string) : undefined,
      }
    case 'glob':
      return {
        icon: 'search',
        title: 'Searching files',
        subtitle: input.pattern as string,
      }
    case 'grep':
      return {
        icon: 'search',
        title: 'Searching content',
        subtitle: input.pattern as string,
      }
    case 'webfetch':
      return {
        icon: 'globe',
        title: 'Fetching URL',
        subtitle: input.url as string,
      }
    case 'task':
      return {
        icon: 'bot',
        title: `Agent: ${input.subagent_type || 'task'}`,
        subtitle: input.description as string,
      }
    case 'bash':
      return {
        icon: 'terminal',
        title: 'Running command',
        subtitle: input.description as string,
      }
    case 'edit':
      return {
        icon: 'edit',
        title: 'Editing',
        subtitle: input.filePath ? getFilename(input.filePath as string) : undefined,
      }
    case 'write':
      return {
        icon: 'file-plus',
        title: 'Writing',
        subtitle: input.filePath ? getFilename(input.filePath as string) : undefined,
      }
    case 'todowrite':
      return {
        icon: 'checklist',
        title: 'Planning',
      }
    case 'todoread':
      return {
        icon: 'checklist',
        title: 'Reading todos',
      }
    default:
      return {
        icon: 'tool',
        title: tool,
      }
  }
}
