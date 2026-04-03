import type { ConnectionState } from '../data/types';

// ── Protocol types ──────────────────────────────────────────────────────────

interface ProtocolRequest {
  type: 'req';
  id: string;
  method: string;
  params: Record<string, unknown>;
}

interface ProtocolResponse {
  type: 'res';
  id: string;
  ok: boolean;
  payload?: Record<string, unknown>;
  error?: { details: { code: string; reason: string } };
}

interface ProtocolEvent {
  type: 'event';
  event: string;
  payload: Record<string, unknown>;
  seq?: number;
}

type ProtocolMessage = ProtocolResponse | ProtocolEvent;

export interface VerifyCheckResult {
  id: string;
  pass: boolean;
  detail: string;
}

export interface VerifyResponse {
  checks: VerifyCheckResult[];
}

// ── WebSocket client ────────────────────────────────────────────────────────

let requestCounter = 0;
function nextReqId(): string {
  return `mastery-${++requestCounter}-${Date.now()}`;
}

export interface OpenClawClient {
  connect(): Promise<void>;
  disconnect(): void;
  isOpen(): boolean;
  sendMessage(message: string): Promise<string>;
  sendVerify(prompt: string): Promise<VerifyResponse | null>;
  onEvent(handler: (event: ProtocolEvent) => void): void;
}

export function createOpenClawClient(connection: ConnectionState): OpenClawClient {
  const { instanceUrl, sessionToken } = connection;

  let ws: WebSocket | null = null;
  let connected = false;
  const pending = new Map<string, {
    resolve: (value: ProtocolResponse) => void;
    reject: (reason: Error) => void;
  }>();
  let eventHandler: ((event: ProtocolEvent) => void) | null = null;

  // Build WebSocket URL with /ws path, token, and clientInfo query params.
  function getWsUrl(): string {
    let normalized = instanceUrl.trim().replace(/\/+$/, '');
    // Convert http(s) to ws(s)
    normalized = normalized
      .replace(/^https:\/\//, 'wss://')
      .replace(/^http:\/\//, 'ws://');
    if (!normalized.startsWith('ws://') && !normalized.startsWith('wss://')) {
      normalized = `wss://${normalized}`;
    }

    // Build clientInfo payload
    const clientInfo = {
      client: {
        id: 'custom-app',
        mode: 'control',
        platform: 'web',
        role: 'admin',
        scopes: ['all'],
      },
    };
    const clientInfoB64 = btoa(JSON.stringify(clientInfo));

    // Append /ws path + query params
    return `${normalized}/ws?token=${encodeURIComponent(sessionToken)}&clientInfo=${clientInfoB64}`;
  }

  function handleMessage(data: string) {
    let msg: ProtocolMessage;
    try {
      msg = JSON.parse(data);
    } catch {
      return;
    }

    if (msg.type === 'res') {
      const handler = pending.get(msg.id);
      if (handler) {
        pending.delete(msg.id);
        handler.resolve(msg);
      }
    } else if (msg.type === 'event') {
      eventHandler?.(msg);
    }
  }

  function sendRequest(method: string, params: Record<string, unknown>): Promise<ProtocolResponse> {
    return new Promise((resolve, reject) => {
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        reject(new Error('Not connected to OpenClaw'));
        return;
      }

      const id = nextReqId();
      const req: ProtocolRequest = { type: 'req', id, method, params };

      pending.set(id, { resolve, reject });

      // Timeout after 60 seconds
      setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id);
          reject(new Error(`Request ${method} timed out`));
        }
      }, 60_000);

      ws.send(JSON.stringify(req));
    });
  }

  return {
    connect(): Promise<void> {
      return new Promise((resolve, reject) => {
        const wsUrl = getWsUrl();
        console.log('[OpenClaw] Connecting to:', wsUrl.replace(/token=[^&]+/, 'token=***'));
        ws = new WebSocket(wsUrl);

        let settled = false;

        ws.onopen = () => {
          console.log('[OpenClaw] WebSocket open (auth via query params)');

          // With query param auth, the connection may be ready immediately.
          // Listen for any initial server message to confirm.
          ws!.onmessage = (event) => {
            console.log('[OpenClaw] Message:', event.data);
            handleMessage(event.data);

            // If we get any message and haven't settled, we're connected
            if (!settled) {
              settled = true;
              connected = true;
              resolve();
            }
          };

          // If no message comes within 3s, assume connected (some gateways
          // don't send an initial message with query param auth)
          setTimeout(() => {
            if (!settled && ws?.readyState === WebSocket.OPEN) {
              console.log('[OpenClaw] No initial message, assuming connected');
              settled = true;
              connected = true;
              resolve();
            }
          }, 3000);
        };

        ws.onerror = (err) => {
          console.error('[OpenClaw] WebSocket error:', err);
          if (!settled) {
            settled = true;
            reject(new Error('Failed to connect to OpenClaw gateway'));
          }
        };

        ws.onclose = (event) => {
          console.log('[OpenClaw] WebSocket closed:', event.code, event.reason);
          connected = false;
          if (!settled) {
            settled = true;
            reject(new Error(event.reason || 'Connection closed unexpectedly'));
          }
          for (const [id, handler] of pending) {
            handler.reject(new Error('Connection closed'));
            pending.delete(id);
          }
        };

        // Timeout the entire connection attempt
        setTimeout(() => {
          if (!settled) {
            settled = true;
            ws?.close();
            reject(new Error('Connection timed out'));
          }
        }, 15_000);
      });
    },

    disconnect() {
      connected = false;
      ws?.close();
      ws = null;
    },

    isOpen(): boolean {
      return connected && ws?.readyState === WebSocket.OPEN;
    },

    async sendMessage(message: string): Promise<string> {
      const res = await sendRequest('chat.send', { message });
      if (!res.ok) {
        throw new Error(res.error?.details?.reason ?? 'chat.send failed');
      }
      // Extract the response text from the payload
      const payload = res.payload ?? {};
      return (payload.response ?? payload.message ?? payload.text ?? JSON.stringify(payload)) as string;
    },

    async sendVerify(prompt: string): Promise<VerifyResponse | null> {
      const response = await this.sendMessage(prompt);
      try {
        const parsed = JSON.parse(response);
        if (parsed.checks && Array.isArray(parsed.checks)) {
          return parsed as VerifyResponse;
        }
      } catch {
        // Not valid JSON — caller handles fallback
      }
      return null;
    },

    onEvent(handler: (event: ProtocolEvent) => void) {
      eventHandler = handler;
    },
  };
}
