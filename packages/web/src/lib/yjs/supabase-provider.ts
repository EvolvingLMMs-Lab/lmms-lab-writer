import * as Y from 'yjs'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'

type YjsUpdate = {
  update: string
  is_snapshot: boolean
}

type BroadcastPayload = {
  sender: string
  update?: string
  state?: AwarenessState
}

type AwarenessState = {
  user?: {
    id: string
    name: string
    color: string
  }
  cursor?: {
    anchor: number
    head: number
  }
}

type ProviderOptions = {
  documentId: string
  filePath?: string
  userId?: string
  userName?: string
}

export class SupabaseProvider {
  private doc: Y.Doc
  private supabase: SupabaseClient
  private channel: RealtimeChannel | null = null
  private documentId: string
  private filePath: string
  private userId: string
  private userName: string
  private awareness: Map<string, AwarenessState> = new Map()
  private connected = false
  private destroyed = false
  private pendingUpdates: Uint8Array[] = []
  private flushTimeout: NodeJS.Timeout | null = null
  
  constructor(doc: Y.Doc, options: ProviderOptions) {
    this.doc = doc
    this.supabase = createClient()
    this.documentId = options.documentId
    this.filePath = options.filePath || 'main.tex'
    this.userId = options.userId || crypto.randomUUID()
    this.userName = options.userName || 'Anonymous'
    
    this.doc.on('update', this.handleLocalUpdate.bind(this))
    this.connect()
  }

  private async connect() {
    if (this.destroyed) return

    await this.loadInitialState()
    this.setupRealtimeChannel()
  }

  private async loadInitialState() {
    const { data, error } = await this.supabase
      .from('yjs_updates')
      .select('update, is_snapshot')
      .eq('document_id', this.documentId)
      .eq('file_path', this.filePath)
      .order('id', { ascending: true })

    if (error) {
      console.error('Failed to load Y.js state:', error)
      return
    }

    if (data && data.length > 0) {
      const latestSnapshotIndex = (data as YjsUpdate[]).map((d: YjsUpdate) => d.is_snapshot).lastIndexOf(true)
      const relevantUpdates = latestSnapshotIndex >= 0 
        ? data.slice(latestSnapshotIndex) 
        : data

      Y.transact(this.doc, () => {
        for (const row of relevantUpdates) {
          const update = this.decodeBase64(row.update)
          Y.applyUpdate(this.doc, update)
        }
      })
    }
  }

  private setupRealtimeChannel() {
    const channelName = `doc:${this.documentId}:${this.filePath}`
    
    this.channel = this.supabase.channel(channelName, {
      config: { broadcast: { self: false } }
    })

    this.channel
      .on('broadcast', { event: 'yjs-update' }, ({ payload }: { payload: BroadcastPayload }) => {
        if (payload.sender !== this.userId && payload.update) {
          const update = this.decodeBase64(payload.update)
          Y.applyUpdate(this.doc, update)
        }
      })
      .on('broadcast', { event: 'awareness' }, ({ payload }: { payload: BroadcastPayload }) => {
        if (payload.sender !== this.userId && payload.state) {
          this.awareness.set(payload.sender, payload.state)
          this.onAwarenessChange()
        }
      })
      .on('presence', { event: 'sync' }, () => {
        this.connected = true
        this.broadcastAwareness()
      })
      .on('presence', { event: 'leave' }, ({ key }: { key: string }) => {
        this.awareness.delete(key)
        this.onAwarenessChange()
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await this.channel?.track({ user_id: this.userId })
        }
      })
  }

  private handleLocalUpdate(update: Uint8Array, origin: unknown) {
    if (origin === 'remote' || this.destroyed) return

    this.pendingUpdates.push(update)
    
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout)
    }
    
    this.flushTimeout = setTimeout(() => {
      this.flushUpdates()
    }, 100)
  }

  private async flushUpdates() {
    if (this.pendingUpdates.length === 0 || this.destroyed) return

    const mergedUpdate = Y.mergeUpdates(this.pendingUpdates)
    this.pendingUpdates = []

    const encodedUpdate = this.encodeBase64(mergedUpdate)

    this.channel?.send({
      type: 'broadcast',
      event: 'yjs-update',
      payload: { sender: this.userId, update: encodedUpdate }
    })

    await this.supabase
      .from('yjs_updates')
      .insert({
        document_id: this.documentId,
        file_path: this.filePath,
        update: encodedUpdate,
        is_snapshot: false
      })
  }

  setAwareness(state: Partial<AwarenessState>) {
    const currentState = this.awareness.get(this.userId) || {}
    const newState = { ...currentState, ...state }
    this.awareness.set(this.userId, newState)
    this.broadcastAwareness()
  }

  private broadcastAwareness() {
    const state = this.awareness.get(this.userId)
    if (!state || !this.channel) return

    this.channel.send({
      type: 'broadcast',
      event: 'awareness',
      payload: { sender: this.userId, state }
    })
  }

  getAwareness(): Map<string, AwarenessState> {
    return this.awareness
  }

  private onAwarenessChange() {}

  onAwarenessUpdate(callback: (awareness: Map<string, AwarenessState>) => void) {
    this.onAwarenessChange = () => callback(this.awareness)
  }

  private encodeBase64(data: Uint8Array): string {
    return btoa(String.fromCharCode(...data))
  }

  private decodeBase64(str: string): Uint8Array {
    return Uint8Array.from(atob(str), c => c.charCodeAt(0))
  }

  destroy() {
    this.destroyed = true
    
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout)
      this.flushUpdates()
    }

    this.channel?.unsubscribe()
    this.channel = null
    this.doc.off('update', this.handleLocalUpdate.bind(this))
  }
}
