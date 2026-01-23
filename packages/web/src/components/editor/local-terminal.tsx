'use client'

import { useEffect, useRef, useState, useCallback, type MutableRefObject } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'

type FileNode = {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileNode[]
}

type GitInfo = {
  branch: string
  isDirty: boolean
  lastCommit?: {
    hash: string
    message: string
    date: string
  }
}

type Props = {
  wsUrl?: string
  onFilesUpdate?: (files: FileNode[]) => void
  onConnectionChange?: (connected: boolean) => void
  onFileContent?: (path: string, content: string) => void
  onGitInfo?: (info: GitInfo) => void
  onPdfUrl?: (url: string) => void
  wsRef?: MutableRefObject<WebSocket | null>
  className?: string
}

export function LocalTerminal({
  wsUrl = 'ws://localhost:3001',
  onFilesUpdate,
  onConnectionChange,
  onFileContent,
  onGitInfo,
  onPdfUrl,
  wsRef: externalWsRef,
  className = '',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const internalWsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasShownWaitingMessageRef = useRef(false)
  const wasConnectedRef = useRef(false)

  const wsRef = externalWsRef || internalWsRef

  const [connected, setConnected] = useState(false)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      onConnectionChange?.(true)
      hasShownWaitingMessageRef.current = false
      
      if (wasConnectedRef.current) {
        terminalRef.current?.write('\x1b[32mReconnected to local daemon\x1b[0m\r\n')
      } else {
        terminalRef.current?.write('\x1b[32mConnected to local daemon\x1b[0m\r\n')
      }
      wasConnectedRef.current = true
      
      ws.send(JSON.stringify({ type: 'refresh-files' }))
      ws.send(JSON.stringify({ type: 'get-git-info' }))
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)

        switch (msg.type) {
          case 'output':
            terminalRef.current?.write(msg.data)
            break

          case 'files':
            onFilesUpdate?.(msg.data)
            break

          case 'file-content':
            onFileContent?.(msg.path, msg.content)
            break

          case 'git-info':
            onGitInfo?.(msg.data)
            break

          case 'pdf-url':
            onPdfUrl?.(msg.url)
            break

          case 'file-changed':
            if (msg.path) {
              ws.send(JSON.stringify({ type: 'read-file', path: msg.path }))
            }
            ws.send(JSON.stringify({ type: 'refresh-files' }))
            ws.send(JSON.stringify({ type: 'get-git-info' }))
            break

          case 'exit':
            terminalRef.current?.write(`\r\n\x1b[33mProcess exited (code: ${msg.code})\x1b[0m\r\n`)
            break
        }
      } catch {
        terminalRef.current?.write(event.data)
      }
    }

    ws.onclose = () => {
      setConnected(false)
      onConnectionChange?.(false)
      
      if (!hasShownWaitingMessageRef.current) {
        hasShownWaitingMessageRef.current = true
        terminalRef.current?.write('\r\n\x1b[90mWaiting for local daemon...\x1b[0m\r\n')
        terminalRef.current?.write('\x1b[90mRun \x1b[37mllw serve\x1b[90m in your project directory\x1b[0m\r\n')
      }

      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = setTimeout(() => {
        connect()
      }, 3000)
    }

    ws.onerror = () => {
      setConnected(false)
      onConnectionChange?.(false)
    }
  }, [wsUrl, wsRef, onFilesUpdate, onConnectionChange, onFileContent, onGitInfo, onPdfUrl])

  useEffect(() => {
    if (!containerRef.current) return

    const terminal = new Terminal({
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'block',
      theme: {
        background: '#ffffff',
        foreground: '#000000',
        cursor: '#000000',
        cursorAccent: '#ffffff',
        selectionBackground: '#e5e5e5',
        black: '#000000',
        red: '#000000',
        green: '#000000',
        yellow: '#000000',
        blue: '#000000',
        magenta: '#000000',
        cyan: '#000000',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#000000',
        brightGreen: '#000000',
        brightYellow: '#000000',
        brightBlue: '#000000',
        brightMagenta: '#000000',
        brightCyan: '#000000',
        brightWhite: '#ffffff',
      },
    })

    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()

    terminal.loadAddon(fitAddon)
    terminal.loadAddon(webLinksAddon)

    terminal.open(containerRef.current)
    fitAddon.fit()

    terminalRef.current = terminal
    fitAddonRef.current = fitAddon

    terminal.onData((data: string) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'input', data }))
      }
    })

    const resizeObserver = new ResizeObserver(() => {
      if (fitAddonRef.current && containerRef.current) {
        fitAddonRef.current.fit()

        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'resize',
              cols: terminal.cols,
              rows: terminal.rows,
            })
          )
        }
      }
    })
    resizeObserver.observe(containerRef.current)

    connect()

    return () => {
      resizeObserver.disconnect()
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      wsRef.current?.close()
      terminal.dispose()
    }
  }, [connect, wsRef])

  const handleRefreshFiles = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'refresh-files' }))
      wsRef.current.send(JSON.stringify({ type: 'get-git-info' }))
    }
  }, [wsRef])

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-white">
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`size-2 ${connected ? 'bg-black' : 'bg-muted'}`}
            title={connected ? 'Connected' : 'Disconnected'}
          />
          <span className="text-muted">Local Terminal</span>
        </div>
        <button
          onClick={handleRefreshFiles}
          className="text-xs text-muted hover:text-black transition-colors"
          title="Refresh file tree"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="square"
              strokeLinejoin="miter"
              strokeWidth={1.5}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      <div ref={containerRef} className="flex-1 min-h-0 bg-white p-3" />
    </div>
  )
}
