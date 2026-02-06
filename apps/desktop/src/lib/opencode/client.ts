import type { Event, Message, Part, SessionInfo, SessionStatus } from "./types";

export function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") return true;
  if (error instanceof Error && error.name === "AbortError") return true;
  return false;
}

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
    if (!this.abortController || this.abortController.signal.aborted) {
      this.abortController = new AbortController();
    }

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
        console.log(
          "[OpenCode Client] Raw event received:",
          event.data.slice(0, 200),
        );
        const data = JSON.parse(event.data) as Event;
        console.log("[OpenCode Client] Parsed event:", data.type);
        this.handleEvent(data);
        this.options.onEvent?.(data);
      } catch (error) {
        console.error(
          "[OpenCode Client] Failed to parse event:",
          error,
          event.data,
        );
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
      this.abortController.abort(
        new DOMException("OpenCode client disconnected", "AbortError"),
      );
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
    console.log("[OpenCode Client] handleEvent:", event.type);

    switch (event.type) {
      case "server.connected":
        console.log("[OpenCode Client] Server connected");
        this.store.connected = true;
        break;

      case "session.updated":
        console.log(
          "[OpenCode Client] Session updated:",
          event.properties.info.id,
        );
        this.store.sessions.set(
          event.properties.info.id,
          event.properties.info,
        );
        break;

      case "session.deleted":
        console.log(
          "[OpenCode Client] Session deleted:",
          event.properties.info.id,
        );
        this.store.sessions.delete(event.properties.info.id);
        this.store.messages.delete(event.properties.info.id);
        this.store.status.delete(event.properties.info.id);
        break;

      case "session.status":
        console.log("[OpenCode Client] Session status:", {
          sessionID: event.properties.sessionID,
          status: event.properties.status,
        });
        this.store.status.set(
          event.properties.sessionID,
          event.properties.status,
        );
        break;

      case "session.error":
        console.error("[OpenCode Client] Session error:", {
          sessionID: (event.properties as { sessionID?: string }).sessionID,
          error: (event.properties as { error?: unknown }).error,
        });
        break;

      case "message.updated": {
        const msg = event.properties.info;
        console.log("[OpenCode Client] Message updated:", {
          id: msg?.id,
          sessionID: msg?.sessionID,
          role: msg?.role,
        });
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
        console.log(
          "[OpenCode Client] Message removed:",
          event.properties.messageID,
        );
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
        console.log("[OpenCode Client] Part updated:", {
          id: part.id,
          type: part.type,
          messageID: part.messageID,
          tool: (part as { tool?: string }).tool,
          status: (part as { state?: { status?: string } }).state?.status,
        });
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
        console.log("[OpenCode Client] Part removed:", event.properties.partID);
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
      if (isAbortError(error)) return [];
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
      const typedItem = item as { info?: Message; parts?: Part[] };
      if (typedItem.info) {
        messages.push(typedItem.info);
        if (typedItem.parts && Array.isArray(typedItem.parts)) {
          const key = `${sessionID}:${typedItem.info.id}`;
          this.store.parts.set(key, typedItem.parts);
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
      files?: { url: string; mime: string; filename?: string }[];
    },
  ): Promise<void> {
    const parts: { type: string; text?: string; url?: string; mime?: string; filename?: string }[] = [];

    // Add file parts first (images)
    if (options?.files && options.files.length > 0) {
      for (const file of options.files) {
        parts.push({
          type: "file",
          url: file.url,
          mime: file.mime,
          filename: file.filename,
        });
      }
    }

    // Add text part
    if (content.trim()) {
      parts.push({ type: "text", text: content });
    }

    const body: Record<string, unknown> = {
      parts,
      agent: options?.agent,
    };

    // OpenCode expects model as a nested object, not flat providerID/modelID
    if (options?.model) {
      body.model = {
        providerID: options.model.providerID,
        modelID: options.model.modelID,
      };
    }

    const url = `${this.baseUrl}/session/${sessionID}/message${this.getQueryParams()}`;
    console.log("[OpenCode Client] chat request:", {
      url,
      sessionID,
      content: content.slice(0, 50),
      agent: options?.agent,
      model: options?.model,
      fullBody: body,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
      signal: this.getSignal(),
    });

    console.log("[OpenCode Client] chat response:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("[OpenCode Client] chat error response:", errorText);
      throw new Error(
        `Failed to send message: ${response.statusText} - ${errorText}`,
      );
    }

    // Try to read response body for debugging
    const responseText = await response.text().catch(() => "");
    console.log(
      "[OpenCode Client] chat response body:",
      responseText.slice(0, 200),
    );
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

  async answerQuestion(
    requestID: string,
    answers: string[][],
  ): Promise<void> {
    console.log("[OpenCode Client] answerQuestion:", { requestID, answers });
    const response = await fetch(
      `${this.baseUrl}/question/${requestID}/reply${this.getQueryParams()}`,
      {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ answers }),
        signal: this.getSignal(),
      },
    );
    console.log("[OpenCode Client] answerQuestion response:", {
      status: response.status,
      ok: response.ok,
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`Failed to answer question: ${response.statusText} - ${errorText}`);
    }
  }

  async getAgents(): Promise<
    { id: string; name: string; description?: string }[]
  > {
    try {
      const url = `${this.baseUrl}/agent${this.getQueryParams()}`;
      console.log("[OpenCode Client] getAgents request:", url);
      const response = await fetch(url, {
        headers: this.getHeaders(),
        signal: this.getSignal(),
      });
      console.log("[OpenCode Client] getAgents response:", {
        status: response.status,
        ok: response.ok,
      });
      if (!response.ok) {
        console.error(`Failed to get agents: ${response.statusText}`);
        return [];
      }
      const data = await this.safeParseJson<unknown>(response, "getAgents");
      console.log("[OpenCode Client] getAgents raw data:", data);

      // Handle different response formats
      // Some versions return array directly, others return { agents: [...] }
      let agents: unknown[];
      if (Array.isArray(data)) {
        agents = data;
      } else if (
        data &&
        typeof data === "object" &&
        "agents" in data &&
        Array.isArray((data as { agents: unknown[] }).agents)
      ) {
        agents = (data as { agents: unknown[] }).agents;
      } else if (data && typeof data === "object") {
        // If it's an object with id/name, it might be a single agent
        const obj = data as Record<string, unknown>;
        if (obj.id && obj.name) {
          agents = [obj];
        } else {
          // Try to extract values if it's a map-like object
          agents = Object.values(obj).filter(
            (v) =>
              v && typeof v === "object" && (v as Record<string, unknown>).id,
          );
        }
      } else {
        agents = [];
      }

      console.log("[OpenCode Client] getAgents parsed:", agents);
      // OpenCode agents use 'name' as identifier, not 'id'
      return agents
        .map((a) => {
          const obj = a as Record<string, unknown>;
          const name = String(obj?.name || "");
          return {
            id: String(obj?.id || name), // Use name as id if no id field
            name: name,
            description: obj?.description as string | undefined,
          };
        })
        .filter((a) => a.id && !(a as Record<string, unknown>).hidden);
    } catch (error) {
      if (isAbortError(error)) return [];
      console.error("Failed to get agents:", error);
      return [];
    }
  }

  async getProviders(): Promise<
    {
      id: string;
      name: string;
      models: {
        id: string;
        name: string;
        options?: { max?: boolean; reasoning?: boolean };
      }[];
    }[]
  > {
    try {
      const url = `${this.baseUrl}/provider${this.getQueryParams()}`;
      console.log("[OpenCode Client] getProviders request:", url);
      const response = await fetch(url, {
        headers: this.getHeaders(),
        signal: this.getSignal(),
      });
      console.log("[OpenCode Client] getProviders response:", {
        status: response.status,
        ok: response.ok,
      });
      if (!response.ok) {
        console.error(`Failed to get providers: ${response.statusText}`);
        return [];
      }
      const data = await this.safeParseJson<{
        all?: unknown[];
        connected?: string[];
      }>(response, "getProviders");
      console.log("[OpenCode Client] getProviders raw data:", {
        all: data?.all?.length,
        connected: data?.connected,
      });
      if (!data) return [];
      const allProviders = (Array.isArray(data?.all) ? data.all : []) as Record<
        string,
        unknown
      >[];
      const connectedIds = new Set(
        Array.isArray(data?.connected) ? data.connected : [],
      );
      console.log(
        "[OpenCode Client] Connected provider IDs:",
        Array.from(connectedIds),
      );

      const connectedProviders = allProviders.filter((p) =>
        connectedIds.has(String(p?.id || "")),
      );
      const result = connectedProviders.map((provider) => {
        const modelsObj = provider?.models;
        const modelsArray =
          modelsObj &&
          typeof modelsObj === "object" &&
          !Array.isArray(modelsObj)
            ? Object.values(
                modelsObj as Record<
                  string,
                  {
                    id: string;
                    name: string;
                    options?: { max?: boolean; reasoning?: boolean };
                  }
                >,
              )
            : [];
        return {
          id: String(provider?.id || ""),
          name: String(provider?.name || ""),
          models: modelsArray.map((m) => ({
            id: String(m?.id || ""),
            name: String(m?.name || ""),
            options: m?.options,
          })),
        };
      });
      console.log(
        "[OpenCode Client] getProviders result:",
        result.map((p) => ({
          id: p.id,
          name: p.name,
          modelCount: p.models.length,
          models: p.models.map((m) => ({ id: m.id, options: m.options })),
        })),
      );
      return result;
    } catch (error) {
      if (isAbortError(error)) return [];
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
