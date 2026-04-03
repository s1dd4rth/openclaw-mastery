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

export interface HistoryMessage {
  role: string;
  content: string;
  timestamp?: number | string;
  [key: string]: unknown;
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
  sendRequest(method: string, params: Record<string, unknown>): Promise<ProtocolResponse>;
  getHistory(): Promise<HistoryMessage[]>;
  sendVerify(): Promise<VerifyResponse | null>;
  getControlUiUrl(): string;
  onEvent(handler: (event: ProtocolEvent) => void): void;
}

// ── Client factory ──────────────────────────────────────────────────────────

export function createOpenClawClient(connection: ConnectionState): OpenClawClient {
  const { instanceUrl, sessionToken, password } = connection;

  let ws: WebSocket | null = null;
  let connected = false;
  let mainSessionKey = 'agent:main:main'; // default, updated from hello-ok
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

  // Build the Control UI URL for this gateway (token in fragment, not query string)
  function buildControlUiUrl(): string {
    let normalized = instanceUrl.trim().replace(/\/+$/, '');
    // Ensure https:// prefix
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = `https://${normalized}`;
    }
    return `${normalized}/#token=${sessionToken}`;
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
          console.log('[OpenClaw] WebSocket open, waiting for challenge...');

          ws!.onmessage = (event) => {
            console.log('[OpenClaw] Message:', event.data);

            let msg: Record<string, unknown>;
            try {
              msg = JSON.parse(event.data);
            } catch {
              console.warn('[OpenClaw] Non-JSON message:', event.data);
              return;
            }

            // Step 1: Respond to the challenge with a connect request
            if (msg.type === 'event' && msg.event === 'connect.challenge') {
              console.log('[OpenClaw] Got challenge, connecting without device auth...');

              const connectReq: ProtocolRequest = {
                type: 'req',
                id: nextReqId(),
                method: 'connect',
                params: {
                  minProtocol: 3,
                  maxProtocol: 3,
                  client: {
                    id: 'cli',
                    version: '2026.3.28',
                    platform: 'macos',
                    mode: 'cli',
                  },
                  role: 'operator',
                  scopes: ['operator.admin', 'operator.read', 'operator.write', 'operator.approvals', 'operator.pairing'],
                  auth: {
                    ...(sessionToken ? { token: sessionToken } : {}),
                    ...(password ? { password } : {}),
                  },
                },
              };

              console.log('[OpenClaw] Sending connect request...');
              ws!.send(JSON.stringify(connectReq));
              return;
            }

            // Step 2: Handle the connect response
            if (msg.type === 'res') {
              const res = msg as unknown as ProtocolResponse;
              if (res.ok) {
                console.log('[OpenClaw] Connected!');
                // Extract session info from snapshot
                const payload = res.payload as any;
                const snapshot = payload?.snapshot;
                if (snapshot?.sessionDefaults?.mainSessionKey) {
                  mainSessionKey = snapshot.sessionDefaults.mainSessionKey;
                }
                // Log what scopes/auth we actually received
                console.log('[OpenClaw] Session key:', mainSessionKey);
                console.log('[OpenClaw] Auth info:', JSON.stringify(payload?.auth, null, 2));
                console.log('[OpenClaw] Auth mode:', snapshot?.authMode);
                if (!settled) {
                  settled = true;
                  connected = true;
                  ws!.onmessage = (e) => handleMessage(e.data);
                  resolve();
                }
              } else {
                console.error('[OpenClaw] Rejected:', JSON.stringify(res.error, null, 2));
                if (!settled) {
                  settled = true;
                  const reason = (res.error as any)?.message ?? (res.error as any)?.details?.reason ?? 'Connection rejected';
                  reject(new Error(reason));
                }
              }
              return;
            }

            // Any other message type during handshake
            console.log('[OpenClaw] Unhandled during handshake:', JSON.stringify(msg, null, 2));
          };
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

    sendRequest,

    // Fetch recent session history via read-only chat.history
    async getHistory(): Promise<HistoryMessage[]> {
      try {
        console.log('[OpenClaw] Fetching chat history, sessionKey:', mainSessionKey);
        const res = await sendRequest('chat.history', { sessionKey: mainSessionKey, limit: 50 });
        console.log('[OpenClaw] chat.history response:', JSON.stringify(res, null, 2));

        if (!res.ok) {
          console.warn('[OpenClaw] chat.history failed:', res.error);
          return [];
        }

        // The payload format is unknown — handle gracefully
        const payload = res.payload as any;
        if (Array.isArray(payload)) {
          return payload as HistoryMessage[];
        }
        if (payload?.messages && Array.isArray(payload.messages)) {
          return payload.messages as HistoryMessage[];
        }
        if (payload?.history && Array.isArray(payload.history)) {
          return payload.history as HistoryMessage[];
        }
        if (payload?.items && Array.isArray(payload.items)) {
          return payload.items as HistoryMessage[];
        }
        console.warn('[OpenClaw] Unexpected chat.history payload shape:', payload);
        return [];
      } catch (err) {
        console.error('[OpenClaw] getHistory error:', err);
        return [];
      }
    },

    // Read chat history and look for verification results (JSON with a "checks" array)
    async sendVerify(): Promise<VerifyResponse | null> {
      try {
        const messages = await this.getHistory();
        // Walk messages from newest to oldest looking for a checks JSON payload
        for (let i = messages.length - 1; i >= 0; i--) {
          const msg = messages[i];
          const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
          // Look for embedded JSON with a checks array
          const jsonMatch = content.match(/\{[\s\S]*"checks"[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0]);
              if (parsed.checks && Array.isArray(parsed.checks)) {
                console.log('[OpenClaw] Found verify response in history:', parsed);
                return parsed as VerifyResponse;
              }
            } catch {
              // Not valid JSON — continue searching
            }
          }
        }
        console.log('[OpenClaw] No verify JSON found in recent history');
        return null;
      } catch (err) {
        console.error('[OpenClaw] sendVerify error:', err);
        return null;
      }
    },

    getControlUiUrl(): string {
      return buildControlUiUrl();
    },

    onEvent(handler: (event: ProtocolEvent) => void) {
      eventHandler = handler;
    },
  };
}
