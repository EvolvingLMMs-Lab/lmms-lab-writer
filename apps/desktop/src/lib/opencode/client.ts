import type { Event, Message, Part, SessionInfo, SessionStatus } from "./types";

export type OpenCodeClientOptions = {
  baseUrl: string;
  directory?: string;
  onEvent?: (event: Event) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
};

export type OpenCodeStore = {
  connected: boolean;
  sessions: Map<string, SessionInfo>;
  messages: Map<string, Message[]>;
  parts: Map<string, Part[]>;
  status: Map<string, SessionStatus>;
};

export class OpenCodeClient {
  private baseUrl: string;
  private directory?: string;
  private eventSource: EventSource | null = null;
  private options: OpenCodeClientOptions;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private abortController: AbortController | null = null;

  public store: OpenCodeStore = {
    connected: false,
    sessions: new Map(),
    messages: new Map(),
    parts: new Map(),
    status: new Map(),
  };

  constructor(options: OpenCodeClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.directory = options.directory;
    this.options = options;
    this.abortController = new AbortController();
  }

  /**
   * Safely parse JSON response, with content-type validation
   * Returns null if the response is not valid JSON
   */
  private async safeParseJson<T>(
    response: Response,
    context: string,
  ): Promise<T | null> {
    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      // Try to get a preview of the response for debugging
      const text = await response.text();
      const preview = text.slice(0, 100);
      console.error(
        `[OpenCode] ${context}: Expected JSON but got ${contentType || "unknown content-type"}. Preview: ${preview}`,
      );
      return null;
    }
    try {
      return await response.json();
    } catch (err) {
      console.error(`[OpenCode] ${context}: Failed to parse JSON:`, err);
      return null;
    }
  }

  /**
   * Wait for the API to be ready by checking if /session returns JSON
   * Retries with exponential backoff
   */
  async waitForApiReady(maxRetries = 5, initialDelay = 500): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(
          `${this.baseUrl}/session${this.getQueryParams()}`,
          {
            headers: this.getHeaders(),
            signal: AbortSignal.timeout(2000),
          },
        );
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          console.log("[OpenCode] API is ready");
          return true;
        }
        console.log(
          `[OpenCode] API not ready yet (attempt ${i + 1}/${maxRetries}), got ${contentType}`,
        );
      } catch (err) {
        console.log(
          `[OpenCode] API check failed (attempt ${i + 1}/${maxRetries}):`,
          err,
        );
      }
      // Exponential backoff
      const delay = initialDelay * Math.pow(2, i);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    console.error("[OpenCode] API did not become ready after retries");
    return false;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (this.directory) {
      headers["x-opencode-directory"] = encodeURIComponent(this.directory);
    }
    return headers;
  }

  private getQueryParams(): string {
    if (!this.directory) return "";
    return `?directory=${encodeURIComponent(this.directory)}`;
  }

  private getSignal(): AbortSignal | undefined {
    return this.abortController?.signal;
  }

  connect(): void {
    if (this.eventSource) {
      this.eventSource.close();
    }

    const url = `${this.baseUrl}/event${this.getQueryParams()}`;

    try {
      new URL(url);
    } catch {
      this.options.onError?.(new Error(`Invalid URL: ${url}`));
      return;
    }

    try {
      this.eventSource = new EventSource(url);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create EventSource";
      this.options.onError?.(
        new Error(`Connection failed: ${message}. URL: ${url}`),
      );
      return;
    }

    this.eventSource.onopen = () => {
      this.store.connected = true;
      this.reconnectAttempts = 0;
      this.options.onConnect?.();
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as Event;
        this.handleEvent(data);
        this.options.onEvent?.(data);
      } catch (error) {
        console.error("Failed to parse event:", error);
      }
    };

    this.eventSource.onerror = () => {
      this.store.connected = false;
      this.options.onDisconnect?.();
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.options.onError?.(new Error("Max reconnection attempts reached"));
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  disconnect(): void {
    // Abort all pending fetch requests
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.store.connected = false;
  }

  private handleEvent(event: Event): void {
    switch (event.type) {
      case "server.connected":
        this.store.connected = true;
        break;

      case "session.updated":
        this.store.sessions.set(
          event.properties.info.id,
          event.properties.info,
        );
        break;

      case "session.deleted":
        this.store.sessions.delete(event.properties.info.id);
        this.store.messages.delete(event.properties.info.id);
        this.store.status.delete(event.properties.info.id);
        break;

      case "session.status":
        this.store.status.set(
          event.properties.sessionID,
          event.properties.status,
        );
        break;

      case "message.updated": {
        const msg = event.properties.info;
        if (!msg?.id || !msg?.sessionID) break;
        const messages = this.store.messages.get(msg.sessionID) || [];
        const existingIndex = messages.findIndex((m) => m?.id === msg.id);
        if (existingIndex >= 0) {
          messages[existingIndex] = msg;
        } else {
          messages.push(msg);
          messages.sort((a, b) => (a?.id || "").localeCompare(b?.id || ""));
        }
        this.store.messages.set(msg.sessionID, messages);
        break;
      }

      case "message.removed": {
        const messages =
          this.store.messages.get(event.properties.sessionID) || [];
        const filtered = messages.filter(
          (m) => m.id !== event.properties.messageID,
        );
        this.store.messages.set(event.properties.sessionID, filtered);
        break;
      }

      case "message.part.updated": {
        const part = event.properties.part;
        const key = `${part.sessionID}:${part.messageID}`;
        const parts = this.store.parts.get(key) || [];
        const existingIndex = parts.findIndex((p) => p.id === part.id);
        if (existingIndex >= 0) {
          parts[existingIndex] = part;
        } else {
          parts.push(part);
        }
        this.store.parts.set(key, parts);
        break;
      }

      case "message.part.removed": {
        const key = `${event.properties.sessionID}:${event.properties.messageID}`;
        const parts = this.store.parts.get(key) || [];
        const filtered = parts.filter((p) => p.id !== event.properties.partID);
        this.store.parts.set(key, filtered);
        break;
      }
    }
  }

  // REST API Methods

  async listSessions(): Promise<SessionInfo[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/session${this.getQueryParams()}`,
        {
          headers: this.getHeaders(),
          signal: this.getSignal(),
        },
      );
      if (!response.ok) {
        console.error(`Failed to list sessions: ${response.statusText}`);
        return [];
      }
      const data = await this.safeParseJson<SessionInfo[]>(
        response,
        "listSessions",
      );
      return Array.isArray(data) ? data : [];
    } catch (error) {
      if ((error as Error).name === "AbortError") return [];
      console.error("Failed to list sessions:", error);
      return [];
    }
  }

  async getSession(sessionID: string): Promise<SessionInfo> {
    const response = await fetch(
      `${this.baseUrl}/session/${sessionID}${this.getQueryParams()}`,
      {
        headers: this.getHeaders(),
        signal: this.getSignal(),
      },
    );
    if (!response.ok)
      throw new Error(`Failed to get session: ${response.statusText}`);
    const data = await this.safeParseJson<SessionInfo>(response, "getSession");
    if (!data) throw new Error("Invalid response from server (expected JSON)");
    return data;
  }

  async createSession(): Promise<SessionInfo> {
    const response = await fetch(
      `${this.baseUrl}/session${this.getQueryParams()}`,
      {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({}),
        signal: this.getSignal(),
      },
    );
    if (!response.ok)
      throw new Error(`Failed to create session: ${response.statusText}`);
    const data = await this.safeParseJson<SessionInfo>(
      response,
      "createSession",
    );
    if (!data) throw new Error("Invalid response from server (expected JSON)");
    return data;
  }

  async deleteSession(sessionID: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/session/${sessionID}${this.getQueryParams()}`,
      {
        method: "DELETE",
        headers: this.getHeaders(),
        signal: this.getSignal(),
      },
    );
    if (!response.ok)
      throw new Error(`Failed to delete session: ${response.statusText}`);
  }

  async getMessages(sessionID: string): Promise<Message[]> {
    const response = await fetch(
      `${this.baseUrl}/session/${sessionID}/message${this.getQueryParams()}`,
      {
        headers: this.getHeaders(),
        signal: this.getSignal(),
      },
    );
    if (!response.ok)
      throw new Error(`Failed to get messages: ${response.statusText}`);
    const data = await this.safeParseJson<unknown[]>(response, "getMessages");
    const items = Array.isArray(data) ? data : [];

    const messages: Message[] = [];
    for (const item of items) {
      if (item.info) {
        messages.push(item.info);
        if (item.parts && Array.isArray(item.parts)) {
          const key = `${sessionID}:${item.info.id}`;
          this.store.parts.set(key, item.parts);
        }
      }
    }

    this.store.messages.set(sessionID, messages);
    return messages;
  }

  async getParts(sessionID: string, messageID: string): Promise<Part[]> {
    const response = await fetch(
      `${this.baseUrl}/session/${sessionID}/message/${messageID}/part${this.getQueryParams()}`,
      {
        headers: this.getHeaders(),
        signal: this.getSignal(),
      },
    );
    if (!response.ok)
      throw new Error(`Failed to get parts: ${response.statusText}`);
    const data = await this.safeParseJson<Part[]>(response, "getParts");
    const parts = Array.isArray(data) ? data : [];
    this.store.parts.set(`${sessionID}:${messageID}`, parts);
    return parts;
  }

  async chat(
    sessionID: string,
    content: string,
    options?: {
      agent?: string;
      model?: { providerID: string; modelID: string };
    },
  ): Promise<void> {
    const body: Record<string, unknown> = {
      parts: [{ type: "text", text: content }],
      agent: options?.agent,
    };

    if (options?.model) {
      body.providerID = options.model.providerID;
      body.modelID = options.model.modelID;
    }

    const response = await fetch(
      `${this.baseUrl}/session/${sessionID}/message${this.getQueryParams()}`,
      {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(body),
        signal: this.getSignal(),
      },
    );
    if (!response.ok)
      throw new Error(`Failed to send message: ${response.statusText}`);
  }

  async abort(sessionID: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/session/${sessionID}/abort${this.getQueryParams()}`,
      {
        method: "POST",
        headers: this.getHeaders(),
        signal: this.getSignal(),
      },
    );
    if (!response.ok)
      throw new Error(`Failed to abort: ${response.statusText}`);
  }

  async getAgents(): Promise<
    { id: string; name: string; description?: string }[]
  > {
    try {
      const response = await fetch(
        `${this.baseUrl}/agent${this.getQueryParams()}`,
        {
          headers: this.getHeaders(),
          signal: this.getSignal(),
        },
      );
      if (!response.ok) {
        console.error(`Failed to get agents: ${response.statusText}`);
        return [];
      }
      const data = await this.safeParseJson<
        { id: string; name: string; description?: string }[]
      >(response, "getAgents");
      return Array.isArray(data) ? data : [];
    } catch (error) {
      if ((error as Error).name === "AbortError") return [];
      console.error("Failed to get agents:", error);
      return [];
    }
  }

  async getProviders(): Promise<
    { id: string; name: string; models: { id: string; name: string }[] }[]
  > {
    try {
      const response = await fetch(
        `${this.baseUrl}/provider${this.getQueryParams()}`,
        {
          headers: this.getHeaders(),
          signal: this.getSignal(),
        },
      );
      if (!response.ok) {
        console.error(`Failed to get providers: ${response.statusText}`);
        return [];
      }
      const data = await this.safeParseJson<{
        all?: unknown[];
        connected?: string[];
      }>(response, "getProviders");
      if (!data) return [];
      const allProviders = Array.isArray(data?.all) ? data.all : [];
      const connectedIds = new Set(
        Array.isArray(data?.connected) ? data.connected : [],
      );
      const connectedProviders = allProviders.filter(
        (p: Record<string, unknown>) => connectedIds.has(String(p?.id || "")),
      );
      return connectedProviders.map((provider: Record<string, unknown>) => {
        const modelsObj = provider?.models;
        const modelsArray =
          modelsObj &&
          typeof modelsObj === "object" &&
          !Array.isArray(modelsObj)
            ? Object.values(
                modelsObj as Record<string, { id: string; name: string }>,
              )
            : [];
        return {
          id: String(provider?.id || ""),
          name: String(provider?.name || ""),
          models: modelsArray.map((m) => ({
            id: String(m?.id || ""),
            name: String(m?.name || ""),
          })),
        };
      });
    } catch (error) {
      if ((error as Error).name === "AbortError") return [];
      console.error("Failed to get providers:", error);
      return [];
    }
  }
}

export function createOpenCodeClient(
  options: OpenCodeClientOptions,
): OpenCodeClient {
  return new OpenCodeClient(options);
}
