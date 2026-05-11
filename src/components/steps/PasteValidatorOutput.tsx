import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ClipboardPaste,
  AlertCircle,
  CheckCircle2,
  Download,
  RefreshCw,
  Globe,
  Loader2,
  ShieldAlert,
  X,
} from 'lucide-react';
import type { Module } from '../../data/types';
import {
  parseValidatorOutput,
  planApply,
  RENDERER_SCHEMA_VERSION,
  type ApplyPlan,
  type ParseResult,
  type ValidatorResponse,
} from '../../data/validator';
import { LIVE_API_ENABLED } from '../../data/featureFlags';
import { invokeLiveApi } from '../../data/liveApi';
import { useLiveApiSettings } from '../../hooks/useLiveApiSettings';
import { CodeBlock } from '../ui/CodeBlock';

interface PasteValidatorOutputProps {
  module: Module;
  moduleNumber: number;
  onApply: (plan: ApplyPlan) => void;
}

type FeedbackState =
  | { kind: 'idle' }
  | { kind: 'success'; appliedCount: number; failedCount: number; manualCount: number; unknownCount: number }
  | { kind: 'parse_error'; message: string }
  | { kind: 'schema_too_new'; payloadVersion: number }
  | { kind: 'schema_too_old'; payloadVersion: number }
  | { kind: 'wrong_module'; expected: number; got: number }
  | { kind: 'shape_invalid'; message: string }
  | { kind: 'install_required' }
  | { kind: 'live_loading' }
  | { kind: 'live_cors_or_network'; message: string }
  | { kind: 'live_http_error'; status: number; body: string }
  | { kind: 'live_unauthorized'; status: number };

export const PasteValidatorOutput = ({ module, moduleNumber, onApply }: PasteValidatorOutputProps) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState>({ kind: 'idle' });
  const [liveAdvancedOpen, setLiveAdvancedOpen] = useState(false);
  const liveSettings = useLiveApiSettings();

  // Shared: turn a ParseResult into feedback + apply side-effect on success.
  const processParseResult = (result: ParseResult): FeedbackState => {
    if (!result.ok) {
      switch (result.reason) {
        case 'json_parse':
          return { kind: 'parse_error', message: result.message };
        case 'schema_too_new':
          return { kind: 'schema_too_new', payloadVersion: result.payload_version };
        case 'schema_too_old':
          return { kind: 'schema_too_old', payloadVersion: result.payload_version };
        case 'wrong_module':
          return { kind: 'wrong_module', expected: result.expected, got: result.got };
        case 'shape_invalid':
          return { kind: 'shape_invalid', message: result.message };
        case 'tool_not_found':
          return { kind: 'install_required' };
      }
    }
    return applyAndSummarize(result.payload);
  };

  const applyAndSummarize = (payload: ValidatorResponse): FeedbackState => {
    const plan = planApply(module, payload);
    onApply(plan);
    const failedCount = plan.applied.filter(a => !a.result.pass).length;
    return {
      kind: 'success',
      appliedCount: plan.applied.length,
      failedCount,
      manualCount: plan.skippedManual.length,
      unknownCount: plan.unknownIds.length,
    };
  };

  const handleApply = () => {
    setFeedback(processParseResult(parseValidatorOutput(text, moduleNumber)));
  };

  const handleRunLive = async () => {
    if (!liveSettings.isConfigured) return;
    setFeedback({ kind: 'live_loading' });
    const live = await invokeLiveApi(
      liveSettings.settings.gatewayUrl,
      liveSettings.settings.token,
      moduleNumber,
    );
    if (!live.ok) {
      switch (live.reason) {
        case 'cors_or_network':
          setFeedback({ kind: 'live_cors_or_network', message: live.message });
          return;
        case 'unauthorized':
          setFeedback({ kind: 'live_unauthorized', status: live.status });
          return;
        case 'http_error':
          setFeedback({ kind: 'live_http_error', status: live.status, body: live.body });
          return;
      }
    }
    setFeedback(processParseResult(live.result));
  };

  return (
    <div className="rounded-2xl border border-openclaw-border bg-white shadow-sm overflow-hidden mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-6 py-4 hover:bg-openclaw-bg3/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <ClipboardPaste size={18} className="text-openclaw-red" />
          <div>
            <div className="text-sm font-bold text-openclaw-dark uppercase tracking-wider">
              Paste validator output
            </div>
            <div className="text-xs text-openclaw-dark/50 font-medium mt-0.5">
              Auto-verify deterministic checks for Module {moduleNumber}
            </div>
          </div>
        </div>
        {open ? (
          <ChevronDown size={18} className="text-openclaw-dark/40" />
        ) : (
          <ChevronRight size={18} className="text-openclaw-dark/40" />
        )}
      </button>

      {open && (
        <div className="px-6 py-5 border-t border-openclaw-border bg-openclaw-bg/30 space-y-4">
          <ol className="list-decimal pl-5 text-sm text-openclaw-dark/70 space-y-1.5 leading-relaxed">
            <li>
              In your Claw chat, run:{' '}
              <code className="bg-openclaw-dark text-emerald-200 px-2 py-0.5 rounded font-mono text-xs">
                Use openclaw-mastery to verify module {moduleNumber}
              </code>
            </li>
            <li>Copy the JSON output your Claw returns</li>
            <li>Paste it below and click Apply Results</li>
          </ol>

          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder='{"tool": "openclaw-mastery.verify_module", "schema_version": 1, ...}'
            className="w-full h-40 px-4 py-3 bg-white border border-openclaw-border rounded-lg text-xs font-mono text-openclaw-dark placeholder:text-openclaw-dark/20 focus:outline-none focus:ring-2 focus:ring-openclaw-red/10 focus:border-openclaw-red transition-all resize-y"
          />

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleApply}
                disabled={!text.trim() || feedback.kind === 'live_loading'}
                className="px-6 py-2.5 bg-openclaw-red text-white rounded-xl text-sm font-bold hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:scale-100 transition-all shadow-md shadow-openclaw-red/20"
              >
                Apply Results
              </button>

              {LIVE_API_ENABLED && liveSettings.isConfigured && (
                <button
                  onClick={handleRunLive}
                  disabled={feedback.kind === 'live_loading'}
                  className="flex items-center gap-2 px-5 py-2.5 bg-openclaw-dark text-white rounded-xl text-sm font-bold hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all shadow-md shadow-openclaw-dark/20"
                  title="Call the validator skill on your gateway directly, no copy/paste"
                >
                  {feedback.kind === 'live_loading' ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Running…
                    </>
                  ) : (
                    <>
                      <Globe size={16} /> Run live verify
                    </>
                  )}
                </button>
              )}
            </div>

            {feedback.kind !== 'idle' && (
              <div className="flex-1 min-w-0">{renderFeedback(feedback)}</div>
            )}
          </div>

          {LIVE_API_ENABLED && (
            <LiveApiAdvanced
              open={liveAdvancedOpen}
              setOpen={setLiveAdvancedOpen}
              settings={liveSettings.settings}
              isConfigured={liveSettings.isConfigured}
              update={liveSettings.update}
              clear={liveSettings.clear}
            />
          )}
        </div>
      )}
    </div>
  );
};

interface LiveApiAdvancedProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  settings: { gatewayUrl: string; token: string; optedIn: boolean };
  isConfigured: boolean;
  update: (next: Partial<{ gatewayUrl: string; token: string; optedIn: boolean }>) => void;
  clear: () => void;
}

function LiveApiAdvanced({ open, setOpen, settings, isConfigured, update, clear }: LiveApiAdvancedProps) {
  return (
    <div className="border-t border-openclaw-border pt-4 mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-openclaw-dark/50 hover:text-openclaw-dark/80 transition-colors"
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <Globe size={14} /> Live verification (advanced)
        {isConfigured && (
          <span className="ml-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 normal-case tracking-normal">
            configured
          </span>
        )}
      </button>

      {open && (
        <div className="mt-3 space-y-3 bg-amber-50/40 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <ShieldAlert size={16} className="text-amber-700 mt-0.5 flex-shrink-0" />
            <div className="text-[11px] text-amber-900 leading-relaxed">
              <strong>Security note:</strong> Live verification stores your gateway URL and a bearer token in this browser's localStorage. If your OpenClaw supports scoped tokens, use one limited to <code className="bg-amber-100 px-1 rounded">openclaw-mastery.*</code>. If only all-powerful tokens are available, anything that runs JavaScript on this domain can read it. Paste-back is the safer default.
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-openclaw-dark/60 uppercase tracking-wider mb-1">
              Gateway URL
            </label>
            <input
              type="text"
              value={settings.gatewayUrl}
              onChange={e => update({ gatewayUrl: e.target.value })}
              placeholder="https://your-vps.example.com"
              className="w-full px-3 py-2 bg-white border border-openclaw-border rounded-lg text-xs font-mono text-openclaw-dark placeholder:text-openclaw-dark/20 focus:outline-none focus:ring-2 focus:ring-openclaw-red/10 focus:border-openclaw-red"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-openclaw-dark/60 uppercase tracking-wider mb-1">
              Bearer token (scoped if possible)
            </label>
            <input
              type="password"
              value={settings.token}
              onChange={e => update({ token: e.target.value })}
              placeholder="paste your token (never logged, stays in this browser)"
              className="w-full px-3 py-2 bg-white border border-openclaw-border rounded-lg text-xs font-mono text-openclaw-dark placeholder:text-openclaw-dark/20 focus:outline-none focus:ring-2 focus:ring-openclaw-red/10 focus:border-openclaw-red"
              autoComplete="off"
            />
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.optedIn}
              onChange={e => update({ optedIn: e.target.checked })}
              className="mt-0.5 accent-openclaw-red"
            />
            <span className="text-[11px] text-openclaw-dark/80 leading-relaxed">
              I understand my token is stored in this browser's localStorage and accept the trade-off.
            </span>
          </label>

          {(settings.gatewayUrl || settings.token) && (
            <button
              onClick={clear}
              className="flex items-center gap-1 text-[11px] text-openclaw-dark/40 hover:text-openclaw-red transition-colors"
            >
              <X size={12} /> Clear stored settings
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function renderFeedback(f: Exclude<FeedbackState, { kind: 'idle' }>) {
  switch (f.kind) {
    case 'success': {
      const passedCount = f.appliedCount - f.failedCount;
      return (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-emerald-900 font-medium leading-relaxed">
              Applied {f.appliedCount} {f.appliedCount === 1 ? 'check' : 'checks'} ({passedCount} passed
              {f.failedCount > 0 ? `, ${f.failedCount} failed` : ''}).
              {f.manualCount > 0 && (
                <> {f.manualCount} manual {f.manualCount === 1 ? 'check stays' : 'checks stay'} for you to toggle.</>
              )}
              {f.unknownCount > 0 && (
                <> {f.unknownCount} unknown {f.unknownCount === 1 ? 'ID' : 'IDs'} skipped (validator may be newer than the web app).</>
              )}
            </div>
          </div>
        </div>
      );
    }
    case 'parse_error':
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-openclaw-red mt-0.5 flex-shrink-0" />
            <div className="text-xs text-red-900 font-medium leading-relaxed">
              <strong>Could not parse JSON:</strong> {f.message}. Make sure you copied the entire output (no surrounding chat text).
            </div>
          </div>
        </div>
      );
    case 'schema_too_new':
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <RefreshCw size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-900 font-medium leading-relaxed">
              <strong>Web app is older than your validator skill</strong> (got schema v{f.payloadVersion}, this app understands v{RENDERER_SCHEMA_VERSION}). Hard-refresh this page (Cmd+Shift+R / Ctrl+Shift+R) to pick up the latest course UI.
            </div>
          </div>
        </div>
      );
    case 'schema_too_old':
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Download size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-900 font-medium leading-relaxed">
              <strong>Validator skill is outdated</strong> (got schema v{f.payloadVersion}, this app expects v{RENDERER_SCHEMA_VERSION}). In your Claw, run:{' '}
              <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">
                openclaw skills upgrade openclaw-mastery
              </code>
            </div>
          </div>
        </div>
      );
    case 'wrong_module':
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-900 font-medium leading-relaxed">
              <strong>Wrong module:</strong> this output is for module {f.got}, but you're on module {f.expected}. Re-run the validator for module {f.expected}.
            </div>
          </div>
        </div>
      );
    case 'shape_invalid':
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-openclaw-red mt-0.5 flex-shrink-0" />
            <div className="text-xs text-red-900 font-medium leading-relaxed">
              <strong>Output shape is invalid:</strong> {f.message}.
            </div>
          </div>
        </div>
      );
    case 'install_required':
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Download size={16} className="text-openclaw-red mt-0.5 flex-shrink-0" />
            <div className="text-xs text-red-900 font-medium leading-relaxed">
              <strong>The openclaw-mastery skill is not installed.</strong> Install it first, then re-run verify:
              <CodeBlock className="bg-openclaw-dark text-emerald-200 px-3 py-2 rounded mt-2 font-mono text-[11px] overflow-x-auto">
                openclaw skills install https://github.com/s1dd4rth/openclaw-mastery-skill
              </CodeBlock>
            </div>
          </div>
        </div>
      );
    case 'live_loading':
      return (
        <div className="bg-openclaw-bg3 border border-openclaw-border rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Loader2 size={16} className="text-openclaw-dark/60 animate-spin" />
            <div className="text-xs text-openclaw-dark/70 font-medium">
              Calling validator on your gateway… (up to ~30s while it runs all checks)
            </div>
          </div>
        </div>
      );
    case 'live_cors_or_network':
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <ShieldAlert size={16} className="text-amber-700 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-900 font-medium leading-relaxed">
              <strong>Could not reach your gateway.</strong> Most likely CORS is blocking this origin, or the URL is wrong / unreachable from your browser. Use paste-back instead, or fix the gateway's CORS allowlist. <span className="text-amber-700/70">Detail: {f.message}</span>
            </div>
          </div>
        </div>
      );
    case 'live_unauthorized':
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <ShieldAlert size={16} className="text-openclaw-red mt-0.5 flex-shrink-0" />
            <div className="text-xs text-red-900 font-medium leading-relaxed">
              <strong>Gateway rejected the token (HTTP {f.status}).</strong> Token may be wrong, expired, or scoped to disallow this tool. Update the token in Live verification (advanced) or fall back to paste-back.
            </div>
          </div>
        </div>
      );
    case 'live_http_error':
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-openclaw-red mt-0.5 flex-shrink-0" />
            <div className="text-xs text-red-900 font-medium leading-relaxed">
              <strong>Gateway returned HTTP {f.status}.</strong> {f.body && <span className="block mt-1 text-red-800/70 font-mono text-[11px] break-all">{f.body.slice(0, 200)}</span>}
            </div>
          </div>
        </div>
      );
  }
}
