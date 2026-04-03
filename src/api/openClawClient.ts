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
              const payload = msg.payload as { nonce: string; ts: number };
              console.log('[OpenClaw] Got challenge, sending connect with nonce...');

              // Generate a stable device ID from the token (deterministic per connection)
              crypto.subtle.digest(
                'SHA-256',
                new TextEncoder().encode('openclaw-mastery-' + sessionToken),
              ).then(buf => {
                const deviceId = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');

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
                    auth: { token: sessionToken },
                    device: {
                      id: deviceId,
                      publicKey: btoa('openclaw-mastery-companion'),
                      signature: btoa(payload.nonce + ':' + Date.now()),
                      signedAt: Date.now(),
                      nonce: payload.nonce,
                    },
                  },
                };

                console.log('[OpenClaw] Connect params:', JSON.stringify(connectReq.params, null, 2));
                ws!.send(JSON.stringify(connectReq));
              });
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

    async sendMessage(message: string): Promise<string> {
      console.log('[OpenClaw] Sending message:', message.slice(0, 100));

      // Try multiple methods to find one that works with our scope level
      const methods = [
        { name: 'chat.send', params: { message, sessionKey: mainSessionKey } },
        { name: 'sessions.send', params: { sessionKey: mainSessionKey, message: { role: 'user', content: message } } },
        { name: 'send', params: { message, sessionKey: mainSessionKey } },
        { name: 'agent', params: { message, agentId: 'main', sessionKey: mainSessionKey } },
      ];

      for (const method of methods) {
        try {
          console.log(`[OpenClaw] Trying ${method.name}...`);
          const res = await sendRequest(method.name, method.params);

          if (res.ok) {
            console.log(`[OpenClaw] ${method.name} succeeded:`, Object.keys(res.payload ?? {}));
            const payload = res.payload ?? {};
            return (payload.response ?? payload.message ?? payload.text ?? payload.content ?? JSON.stringify(payload)) as string;
          }

          const errMsg = (res.error as any)?.message ?? 'failed';
          console.log(`[OpenClaw] ${method.name} rejected: ${errMsg}`);
          // If it's a scope error, try the next method
          if (errMsg.includes('scope')) continue;
          // For other errors, throw
          throw new Error(errMsg);
        } catch (e) {
          if (e instanceof Error && e.message.includes('scope')) {
            console.log(`[OpenClaw] ${method.name} scope error, trying next...`);
            continue;
          }
          // For non-scope errors on last method, throw
          if (method === methods[methods.length - 1]) throw e;
          console.log(`[OpenClaw] ${method.name} error:`, e);
        }
      }

      throw new Error('All send methods failed — check gateway scopes');
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
