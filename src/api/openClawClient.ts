import type { ConnectionState } from '../data/types';

interface PairResponse {
  token: string;
  clawName: string;
}

interface VerifyCheckResult {
  id: string;
  pass: boolean;
  detail: string;
}

interface VerifyResponse {
  checks: VerifyCheckResult[];
}

export function createOpenClawClient(connection: ConnectionState) {
  const { instanceUrl, sessionToken } = connection;
  const baseUrl = instanceUrl.replace(/\/+$/, '');

  async function request(endpoint: string, body?: object): Promise<Response> {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      throw new Error(`OpenClaw API error: ${res.status} ${res.statusText}`);
    }
    return res;
  }

  return {
    async sendMessage(message: string): Promise<string> {
      const res = await request('/api/chat', { message });
      const data = await res.json();
      return data.response ?? data.message ?? JSON.stringify(data);
    },

    async ping(): Promise<boolean> {
      try {
        await request('/api/health');
        return true;
      } catch {
        return false;
      }
    },

    async sendVerify(prompt: string): Promise<VerifyResponse | null> {
      const response = await this.sendMessage(prompt);
      try {
        const parsed = JSON.parse(response);
        if (parsed.checks && Array.isArray(parsed.checks)) {
          return parsed as VerifyResponse;
        }
      } catch {
        // Not valid JSON
      }
      return null;
    },
  };
}

export async function pairWithInstance(
  instanceUrl: string,
  code: string,
): Promise<PairResponse> {
  const baseUrl = instanceUrl.replace(/\/+$/, '');
  const res = await fetch(`${baseUrl}/api/pair`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    throw new Error(
      res.status === 401
        ? 'Invalid or expired pairing code. Generate a new one with /pair in OpenClaw.'
        : `Pairing failed: ${res.status} ${res.statusText}`,
    );
  }
  return res.json();
}
