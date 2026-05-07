import type { Module, VerifyResult } from './types';

export const RENDERER_SCHEMA_VERSION = 1;

export interface ValidatorCheck {
  id: string;
  pass: boolean | null;
  detail: string;
  evidence?: unknown;
  fix_prompt: string | null;
  manual?: boolean;
}

export interface ValidatorResponse {
  tool: 'openclaw-mastery.verify_module';
  schema_version: number;
  module: number;
  checked_at: string;
  validator_version: string;
  platform: 'linux' | 'macos';
  checks: ValidatorCheck[];
}

export type ParseResult =
  | { ok: true; payload: ValidatorResponse }
  | { ok: false; reason: 'json_parse'; message: string }
  | { ok: false; reason: 'schema_too_new'; payload_version: number }
  | { ok: false; reason: 'schema_too_old'; payload_version: number }
  | { ok: false; reason: 'wrong_module'; expected: number; got: number }
  | { ok: false; reason: 'tool_not_found'; message: string }
  | { ok: false; reason: 'shape_invalid'; message: string };

const FENCE_RE = /^\s*```(?:json)?\s*([\s\S]*?)\s*```\s*$/;

function stripMarkdownFence(input: string): string {
  const match = input.match(FENCE_RE);
  return match?.[1] ?? input;
}

function looksLikeToolNotFound(input: string): boolean {
  const lower = input.toLowerCase();
  return (
    lower.includes('tool not found') ||
    lower.includes('skill not installed') ||
    lower.includes('no such skill') ||
    lower.includes('openclaw-mastery is not installed') ||
    lower.includes('skill openclaw-mastery not found')
  );
}

export function parseValidatorOutput(rawInput: string, expectedModuleNumber: number): ParseResult {
  const trimmed = rawInput.trim();
  const cleaned = stripMarkdownFence(trimmed);

  if (looksLikeToolNotFound(cleaned)) {
    return { ok: false, reason: 'tool_not_found', message: cleaned.slice(0, 300) };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    return { ok: false, reason: 'json_parse', message: e instanceof Error ? e.message : String(e) };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ok: false, reason: 'shape_invalid', message: 'expected a JSON object' };
  }

  const v = parsed as Partial<ValidatorResponse>;

  if (typeof v.schema_version !== 'number') {
    return { ok: false, reason: 'shape_invalid', message: 'missing or non-numeric schema_version' };
  }
  if (v.schema_version > RENDERER_SCHEMA_VERSION) {
    return { ok: false, reason: 'schema_too_new', payload_version: v.schema_version };
  }
  if (v.schema_version < RENDERER_SCHEMA_VERSION) {
    return { ok: false, reason: 'schema_too_old', payload_version: v.schema_version };
  }

  if (typeof v.module !== 'number') {
    return { ok: false, reason: 'shape_invalid', message: 'missing or non-numeric module' };
  }
  if (v.module !== expectedModuleNumber) {
    return { ok: false, reason: 'wrong_module', expected: expectedModuleNumber, got: v.module };
  }

  if (!Array.isArray(v.checks)) {
    return { ok: false, reason: 'shape_invalid', message: 'missing checks array' };
  }

  for (const check of v.checks) {
    if (!check || typeof check.id !== 'string') {
      return { ok: false, reason: 'shape_invalid', message: 'check entry missing id' };
    }
    if (check.pass !== true && check.pass !== false && check.pass !== null) {
      return {
        ok: false,
        reason: 'shape_invalid',
        message: `check "${check.id}": pass must be true, false, or null`,
      };
    }
  }

  return { ok: true, payload: v as ValidatorResponse };
}

export interface AppliedCheck {
  phaseId: string;
  stepId: string;
  checkId: string;
  result: VerifyResult;
}

export interface ApplyPlan {
  applied: AppliedCheck[];
  unknownIds: string[];
  skippedManual: string[];
}

export function planApply(module: Module, payload: ValidatorResponse): ApplyPlan {
  const lookup = new Map<string, { phaseId: string; stepId: string }>();
  for (const phase of module.phases) {
    for (const step of phase.steps) {
      if (!step.verify) continue;
      for (const check of step.verify.checks) {
        lookup.set(check.id, { phaseId: phase.id, stepId: step.id });
      }
    }
  }

  const applied: AppliedCheck[] = [];
  const unknownIds: string[] = [];
  const skippedManual: string[] = [];

  for (const check of payload.checks) {
    if (check.pass === null || check.manual === true) {
      skippedManual.push(check.id);
      continue;
    }
    const loc = lookup.get(check.id);
    if (!loc) {
      unknownIds.push(check.id);
      continue;
    }
    applied.push({
      phaseId: loc.phaseId,
      stepId: loc.stepId,
      checkId: check.id,
      result: {
        pass: check.pass,
        detail: check.detail,
        checkedAt: payload.checked_at,
        evidence: check.evidence,
      },
    });
  }

  return { applied, unknownIds, skippedManual };
}
