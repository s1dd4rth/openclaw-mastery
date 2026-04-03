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

// ── Device keypair management ───────────────────────────────────────────────
// Generate and persist an ECDSA P-256 keypair in localStorage.
// device.id = SHA-256 hex of the raw public key bytes.

const DEVICE_KEY = 'openclawDeviceKeys';

interface StoredDevice {
  id: string;
  publicKeyB64: string;
  privateKeyJwk: JsonWebKey;
}

async function getOrCreateDevice(): Promise<StoredDevice> {
  // Check localStorage for existing keypair
  try {
    const raw = localStorage.getItem(DEVICE_KEY);
    if (raw) return JSON.parse(raw) as StoredDevice;
  } catch { /* regenerate */ }

  // Generate new ECDSA P-256 keypair
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true, // extractable
    ['sign', 'verify'],
  );

  // Export public key as raw bytes for fingerprinting
  const pubRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  const pubB64 = btoa(String.fromCharCode(...new Uint8Array(pubRaw)));

  // device.id = SHA-256 hex of raw public key
  const hashBuf = await crypto.subtle.digest('SHA-256', pubRaw);
  const deviceId = Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Export private key as JWK for storage
  const privJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

  const stored: StoredDevice = { id: deviceId, publicKeyB64: pubB64, privateKeyJwk: privJwk };

  try {
    localStorage.setItem(DEVICE_KEY, JSON.stringify(stored));
  } catch { /* quota exceeded */ }

  return stored;
}

async function signNonce(device: StoredDevice, nonce: string): Promise<string> {
  // Re-import private key for signing
  const privateKey = await crypto.subtle.importKey(
    'jwk',
    device.privateKeyJwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );

  // Sign the nonce bytes
  const data = new TextEncoder().encode(nonce);
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    data,
  );

  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

// ── Client factory ──────────────────────────────────────────────────────────

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
              console.log('[OpenClaw] Got challenge, connecting without device auth...');

              // Connect with read-only first (no device fields)
              // Then use web.login.start/wait to upgrade to write scopes
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
                },
              };

              console.log('[OpenClaw] Sending connect (no device, will try web.login after)...');
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

    async tryWebLogin(): Promise<boolean> {
      try {
        console.log('[OpenClaw] Attempting web.login.start...');
        const startRes = await sendRequest('web.login.start', {});
        console.log('[OpenClaw] web.login.start response:', JSON.stringify(startRes, null, 2));

        if (!startRes.ok) {
          console.log('[OpenClaw] web.login.start failed:', (startRes.error as any)?.message);
          return false;
        }

        console.log('[OpenClaw] Waiting for web.login approval...');
        const waitRes = await sendRequest('web.login.wait', {});
        console.log('[OpenClaw] web.login.wait response:', JSON.stringify(waitRes, null, 2));
        return waitRes.ok;
      } catch (e) {
        console.error('[OpenClaw] web.login error:', e);
        return false;
      }
    },

    async sendMessage(message: string): Promise<string> {
      console.log('[OpenClaw] Sending message:', message.slice(0, 100));

      // Try chat.send first
      console.log('[OpenClaw] Trying chat.send...');
      const res = await sendRequest('chat.send', { message, sessionKey: mainSessionKey });

      if (res.ok) {
        console.log('[OpenClaw] chat.send succeeded');
        const payload = res.payload ?? {};
        return (payload.response ?? payload.message ?? payload.text ?? payload.content ?? JSON.stringify(payload)) as string;
      }

      const errMsg = (res.error as any)?.message ?? 'failed';
      console.log('[OpenClaw] chat.send failed:', errMsg);

      // If scope error, try web login to upgrade
      if (errMsg.includes('scope')) {
        console.log('[OpenClaw] Scope error — attempting web.login to upgrade...');
        const loginOk = await this.tryWebLogin();
        if (loginOk) {
          // Retry after login
          console.log('[OpenClaw] Web login succeeded, retrying chat.send...');
          const retry = await sendRequest('chat.send', { message, sessionKey: mainSessionKey });
          if (retry.ok) {
            const payload = retry.payload ?? {};
            return (payload.response ?? payload.message ?? payload.text ?? payload.content ?? JSON.stringify(payload)) as string;
          }
        }
      }

      throw new Error(errMsg);
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
