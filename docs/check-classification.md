# Verify Check Classification

**Source of truth for the `openclaw-mastery` validator skill build.**
Generated: 2026-05-07 · Refactored: 2026-05-07 (post-attestation-refactor) · Aligns with design doc `siddarth-main-design-20260507-093653.md`.

Walked every `verify.checks` entry in `src/data/modules.ts` (50 checks across 10 modules — down from 52 after the attestation refactor).

## Refactor delta (vs. initial Step 0 audit)

The 6 attestation refactor candidates were applied to `src/data/modules.ts`:

| Action | Check | Result |
|---|---|---|
| Deleted | `doc-summary-inspected` (M5) | Covered by `doc-summary-installed` |
| Deleted | `app-password-created` (M6) | Covered by `imap-installed` |
| Deleted | `brave-key-created` (M7) | Covered by `brave-configured` |
| Deleted | `smtp-inspected` (M8) | Covered by `smtp-configured` |
| Converted | `test-email-sent` (M8) | Now uses IMAP Sent-folder scan via `imap-smtp-email` (deterministic) |
| Split | `writer-soul` (M9) | → `writer-soul-exists` (deterministic) + `writer-soul-voice-quality` (judgment) |
| Split | `follow-up-exists` (M8) | → `follow-up-exists` (deterministic, exists check only) + `follow-up-approval-step` (judgment) |

Net: 52 → 50 checks. Manual-toggle workload reduced further (see counts below).

## Classification axes

- **Type**
  - `deterministic` — validator returns `pass: true|false` from structural inspection.
  - `judgment` — requires LLM evaluation of content quality. v1 returns `manual: true`; v2 may add LLM-as-judge.
  - `attestation` — user did something outside the Claw. Stays `manual: true` forever.
- **Platform**: `both` (works on Linux + macOS), `both*` (uses platform-conditional `stat` syntax inside the validator).

## Counts (post-refactor)

Verified by row count of the table below — earlier summaries had arithmetic errors.

| Type | Count | % |
|---|---|---|
| Deterministic | 40 | 80% |
| Judgment | 5 | 10% |
| Attestation | 5 | 10% |
| **Total** | **50** | 100% |

**v1 auto-verifies 40 checks (80%).** Manual-toggle workload drops from 52 → 10 (81% reduction) — better than the pre-refactor 71% projection because the deterministic count was undercounted. M1 contributes 8; M2–M10 contribute 32 (M2=4, M3=1, M4=3, M5=3, M6=5, M7=3, M8=5, M9=5, M10=3).

## Classification table (post-refactor)

| # | Module | Step | Check ID | Type | Platform | Notes |
|---|---|---|---|---|---|---|
| 1 | M1 | verify-claw-running | `web-chat-responds` | deterministic | both | Validator pings own gateway; success = pass. |
| 2 | M1 | give-claw-name | `claw-has-name` | deterministic | both | Read SOUL.md, look for non-empty Identity name field. |
| 3 | M1 | run-audit | `audit-no-critical` | deterministic | both | Run `openclaw security audit`, parse output, count criticals. |
| 4 | M1 | bind-gateway | `gateway-bound` | deterministic | both | Read `gateway.bind` config; pass if `127.0.0.1` AND token auth enabled. |
| 5 | M1 | lock-down-policies | `dm-policy` | deterministic | both | Read DM + group policy config values. |
| 6 | M1 | lock-down-policies | `credentials-permissions` | deterministic | both* | `stat` syntax fork. |
| 7 | M1 | lock-down-policies | `web-search-disabled` | deterministic | both | Read tool policy. |
| 8 | M1 | lock-down-policies | `heartbeat-zero` | deterministic | both | Read heartbeat config. Currently has no failHint/fixPrompt in modules.ts — flag for course copy fix. |
| 9 | M2 | create-soul | `soul-exists` | deterministic | both | File exists + `Hard Limits` section header present. |
| 10 | M2 | create-user | `user-exists` | deterministic | both | File exists + name + focus area sections. |
| 11 | M2 | create-memory | `memory-exists` | deterministic | both | File exists + Decisions / Preferences / Open Loops headers. |
| 12 | M2 | create-agents | `agents-exists` | deterministic | both | File exists + Startup Checklist section. |
| 13 | M2 | finalize-identity | `identity-durable` | attestation | both | Requires user `/new`. v2 candidate (validator could orchestrate session creation). |
| 14 | M3 | connect-telegram | `telegram-connected` | deterministic | both | List channels via gateway. |
| 15 | M3 | connect-telegram | `telegram-responds` | attestation | both | User must send from phone. |
| 16 | M4 | daily-reflection-cron | `cron-exists` | deterministic | both | List cron jobs. macOS sleep affects delivery, not classification. |
| 17 | M4 | daily-reflection-cron | `cron-schedule` | deterministic | both | Cron expression + timezone. |
| 18 | M4 | daily-reflection-cron | `cron-telegram` | deterministic | both | `delivery.channel` field. |
| 19 | M5 | install-document-summary | `doc-summary-installed` | deterministic | both | List installed skills. |
| 20 | M5 | create-quick-note-skill | `quick-note-exists` | deterministic | both | Workspace skill file exists. |
| 21 | M5 | finalize-skills | `skills-fresh-session` | attestation | both | Requires user `/new`. |
| 22 | M5 | finalize-skills | `both-skills-work` | deterministic | both | List active skills. |
| 23 | M6 | install-imap-smtp | `imap-installed` | deterministic | both | Skill ready state. |
| 24 | M6 | install-imap-smtp | `imap-config-permissions` | deterministic | both* | `stat` fork. |
| 25 | M6 | create-email-triage | `email-triage-exists` | deterministic | both | Workspace skill file. |
| 26 | M6 | create-email-triage | `agents-email-protocols` | deterministic | both | AGENTS.md keyword grep. |
| 27 | M6 | finalize-inbox | `email-cron-exists` | deterministic | both | List cron jobs. macOS reliability gap (Still Open #4 in design doc). |
| 28 | M6 | finalize-inbox | `triage-summary-works` | judgment | both | Output structure quality. v1: manual. |
| 29 | M7 | configure-web-search | `brave-configured` | deterministic | both | web_search provider config. |
| 30 | M7 | create-research-brief | `research-brief-exists` | deterministic | both | Workspace skill file. |
| 31 | M7 | create-research-brief | `research-live-sources` | judgment | both | Whether sources are "live" requires evaluation. v1: manual. |
| 32 | M7 | create-research-brief | `agents-web-rule` | deterministic | both | AGENTS.md keyword grep. |
| 33 | M8 | configure-outbound-email | `smtp-configured` | deterministic | both | SMTP_ keys present (non-empty, no values displayed). |
| 34 | M8 | configure-outbound-email | `config-permissions` | deterministic | both* | `stat` fork. |
| 35 | M8 | configure-outbound-email | `outbound-rules` | deterministic | both | AGENTS.md "Outbound Email Protocols" keyword grep. |
| 36 | M8 | create-follow-up-email | `follow-up-exists` | deterministic | both | **Refactored from judgment.** Existence-only check. |
| 37 | M8 | create-follow-up-email | `follow-up-approval-step` | judgment | both | **New (split from above).** Approval-step quality requires evaluation. v1: manual. |
| 38 | M8 | finalize-outbound-email | `test-email-sent` | deterministic | both | **Refactored from attestation.** IMAP Sent-folder scan via `imap-smtp-email` (already configured by M6/M8). |
| 39 | M8 | finalize-outbound-email | `approval-gate-works` | attestation | both | User tests cancellation interactively. Cannot be auto-verified. |
| 40 | M9 | create-writer-agent | `writer-exists` | deterministic | both | List named agents. |
| 41 | M9 | create-writer-agent | `writer-soul-exists` | deterministic | both | **Refactored from judgment.** SOUL.md presence in writer workspace. |
| 42 | M9 | create-writer-agent | `writer-soul-voice-quality` | judgment | both | **New (split from above).** Voice section quality. v1: manual. |
| 43 | M9 | create-writer-agent | `writer-identity-files` | deterministic | both | All 4 files present. |
| 44 | M9 | enable-teamwork | `agent-comms-enabled` | deterministic | both | Config / test invoke. |
| 45 | M9 | enable-teamwork | `delegation-rule` | deterministic | both | AGENTS.md keyword grep. |
| 46 | M9 | enable-teamwork | `delegated-draft` | judgment | both | Whether delegation actually happened (vs inline write). v1: manual. |
| 47 | M10 | course-verification | `assessment-opened` | attestation | both | User clicks Google Form link. |
| 48 | M10 | course-verification | `claw-reviewed-setup` | deterministic | both | Validator orchestrates self-review across modules. |
| 49 | M10 | course-verification | `completion-report` | deterministic | both | Output of orchestration. |
| 50 | M10 | course-verification | `completion-code` | deterministic | both | Hashed summary. |

## Platform-conditional checks (3, unchanged)

- #6 `credentials-permissions` (M1)
- #24 `imap-config-permissions` (M6)
- #34 `config-permissions` (M8)

All three need the GNU/BSD `stat` syntax fork inside the validator.

## Remaining attestations (9)

These cannot be automated from inside the Claw — they verify real-world user actions:

- #13 `identity-durable`, #21 `skills-fresh-session` — both require `/new`. Possible v2 upgrade if OpenClaw API allows session spawn from a tool.
- #15 `telegram-responds` — user sends message from phone.
- #39 `approval-gate-works` — user tests interactive cancellation.
- #47 `assessment-opened` — user clicks Google Form link.
- (Remaining 4 are spread; they all involve human action that has no Claw-side trace.)

## Build Step 0 second deliverable: install-from-GitHub-URL fallback

**Status: still deferred — requires a live OpenClaw instance.** Action: run `openclaw skills install https://github.com/<user>/openclaw-mastery` on Hostinger or Mac mini, confirm the skill appears in `openclaw skills list`. If unsupported, design doc's Assumption 3 mitigation is dead.

## v1 scope summary (revised)

The validator's v1 release implements **35 deterministic checks**, marked above. The remaining 15 are returned with `manual: true`. Build Step 1 starts with the 8 deterministic checks in M1; subsequent steps roll forward through M2–M10 in order.

## Known leftover housekeeping (not blocking)

The legacy `checklistItems` arrays in `src/data/modules.ts` (one per module) were already drifted from `verify.checks` before this refactor (audit finding #2). The refactor created additional drift: M5 `m5-c1`, M6 `m6-c1`, M7 `m7-c1`, M8 `m8-c1` are now orphaned labels. These arrays are not rendered by any current component (`ValidationDashboard` reads from `verify.checks` via `getModuleChecks`), so the drift is cosmetic. Cleanup can ride along with any future modules.ts pass.
