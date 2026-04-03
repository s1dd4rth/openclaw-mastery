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

  // Build WebSocket URL from the gateway URL the user provided.
  // The user may provide http(s) or ws(s) URLs. We normalize to ws(s).
  function getWsUrl(): string {
    let normalized = instanceUrl.trim().replace(/\/+$/, '');
    // Convert http(s) to ws(s)
    normalized = normalized
      .replace(/^https:\/\//, 'wss://')
      .replace(/^http:\/\//, 'ws://');
    // If no protocol, assume ws
    if (!normalized.startsWith('ws://') && !normalized.startsWith('wss://')) {
      normalized = `ws://${normalized}`;
    }
    return normalized;
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
        console.log('[OpenClaw] Connecting to:', wsUrl);
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('[OpenClaw] WebSocket open, sending handshake...');
          // Send connect handshake
          const connectReq: ProtocolRequest = {
            type: 'req',
            id: nextReqId(),
            method: 'connect',
            params: {
              minProtocol: 3,
              maxProtocol: 3,
              client: {
                id: 'cli',
                version: '1.0.0',
                platform: 'macos',
                mode: 'operator',
              },
              role: 'operator',
              scopes: ['operator.read', 'operator.write'],
              auth: { token: sessionToken },
            },
          };

          console.log('[OpenClaw] Connect request:', JSON.stringify(connectReq.params, null, 2));

          // Log ALL incoming messages for debugging
          const debugLog = (label: string, event: MessageEvent) => {
            console.log(`[OpenClaw ${label}]`, event.data);
          };

          // Listen for the hello-ok response
          const onFirstMessage = (event: MessageEvent) => {
            debugLog('handshake-response', event);
            let msg: ProtocolResponse;
            try {
              msg = JSON.parse(event.data);
            } catch {
              console.warn('[OpenClaw] Non-JSON response:', event.data);
              return;
            }

            if (msg.type === 'res' && msg.id === connectReq.id) {
              ws!.removeEventListener('message', onFirstMessage);
              if (msg.ok) {
                connected = true;
                ws!.onmessage = (e) => handleMessage(e.data);
                resolve();
              } else {
                console.error('[OpenClaw] Connection rejected:', JSON.stringify(msg, null, 2));
                const reason = msg.error?.details?.reason ?? 'Connection rejected';
                const code = msg.error?.details?.code ?? 'UNKNOWN';
                reject(new Error(`${reason} (${code})`));
              }
            } else {
              console.log('[OpenClaw] Unexpected message during handshake:', JSON.stringify(msg, null, 2));
            }
          };

          ws!.addEventListener('message', onFirstMessage);

          // Handle challenge event (server may send nonce first)
          const onChallenge = (event: MessageEvent) => {
            debugLog('challenge', event);
            let msg: ProtocolEvent;
            try {
              msg = JSON.parse(event.data);
            } catch {
              return;
            }
            if (msg.type === 'event' && msg.event === 'connect.challenge') {
              console.log('[OpenClaw] Received challenge, sending connect request...');
              ws!.removeEventListener('message', onChallenge);
              ws!.addEventListener('message', onFirstMessage);
              ws!.send(JSON.stringify(connectReq));
            }
          };

          // Wait for server challenge before sending connect
          ws!.addEventListener('message', onChallenge);
        };

        ws.onerror = (err) => {
          console.error('[OpenClaw] WebSocket error:', err);
          reject(new Error('Failed to connect to OpenClaw gateway'));
        };

        ws.onclose = (event) => {
          console.log('[OpenClaw] WebSocket closed:', event.code, event.reason);
          connected = false;
          // Reject all pending requests
          for (const [id, handler] of pending) {
            handler.reject(new Error('Connection closed'));
            pending.delete(id);
          }
        };

        // Timeout the entire connection attempt
        setTimeout(() => {
          if (!connected) {
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
