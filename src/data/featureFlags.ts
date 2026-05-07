const PASTE_VALIDATOR_ENABLED_MODULES = new Set<string>([
  'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10',
]);

export function isPasteValidatorEnabled(moduleId: string): boolean {
  return PASTE_VALIDATOR_ENABLED_MODULES.has(moduleId);
}

/**
 * Live `/tools/invoke` mode. Gated on Step 5 findings (CORS posture + scoped-token support).
 * Flip to `true` after running the probes in
 * `openclaw-mastery-validator/docs/step5-probe-and-findings.md` and confirming both assumptions hold.
 *
 * When `false`, the live-API UI is hidden entirely and the only path is paste-back.
 */
export const LIVE_API_ENABLED = false;
