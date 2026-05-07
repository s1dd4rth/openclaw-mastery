import { parseValidatorOutput, type ParseResult } from './validator';

export type LiveApiResult =
  | { ok: true; result: ParseResult; rawResponse: string }
  | { ok: false; reason: 'cors_or_network'; message: string }
  | { ok: false; reason: 'http_error'; status: number; body: string }
  | { ok: false; reason: 'unauthorized'; status: number };

export interface InvokeOptions {
  signal?: AbortSignal;
  /** Default 30s. Long enough for the validator skill to run all checks for a module. */
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 30_000;

export async function invokeLiveApi(
  gatewayUrl: string,
  token: string,
  moduleNumber: number,
  opts: InvokeOptions = {},
): Promise<LiveApiResult> {
  const baseUrl = gatewayUrl.trim().replace(/\/+$/, '');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  if (opts.signal) {
    opts.signal.addEventListener('abort', () => controller.abort());
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/tools/invoke`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'openclaw-mastery.verify_module',
        args: { module: moduleNumber },
      }),
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timeout);
    return {
      ok: false,
      reason: 'cors_or_network',
      message: e instanceof Error ? e.message : String(e),
    };
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 401 || response.status === 403) {
    return { ok: false, reason: 'unauthorized', status: response.status };
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    return { ok: false, reason: 'http_error', status: response.status, body: body.slice(0, 500) };
  }

  const text = await response.text();
  return { ok: true, result: parseValidatorOutput(text, moduleNumber), rawResponse: text };
}
