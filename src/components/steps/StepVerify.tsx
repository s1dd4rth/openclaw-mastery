import { ShieldCheck, SkipForward } from 'lucide-react';
import type { CheckItem, VerifyResult } from '../../data/types';
import { CheckResult } from './CheckResult';

interface StepVerifyProps {
  checks: CheckItem[];
  results: Record<string, VerifyResult> | undefined;
  onToggleCheck: (checkId: string) => void;
  onSkip: () => void;
}

export const StepVerify = ({
  checks,
  results,
  onToggleCheck,
  onSkip,
}: StepVerifyProps) => {
  const hasResults = results && Object.keys(results).length > 0;
  const allPassed = hasResults && checks.every(c => results[c.id]?.pass === true);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-openclaw-dark/30" />
          <span className="text-sm font-bold text-openclaw-dark uppercase tracking-widest">Verify</span>
        </div>
        <div className="flex gap-2">
          {!allPassed && (
            <button
              onClick={onSkip}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-openclaw-dark/40 hover:text-openclaw-red transition-colors bg-openclaw-bg3 rounded-full border border-openclaw-border"
              title="Skip verification"
            >
              <SkipForward size={12} />
              Skip
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-3">
        {checks.map(check => (
          <CheckResult
            key={check.id}
            label={check.label}
            pass={results?.[check.id]?.pass ?? null}
            detail={results?.[check.id]?.detail ?? ''}
            failHint={check.failHint}
            fixPrompt={check.fixPrompt}
            onToggle={() => onToggleCheck(check.id)}
          />
        ))}
      </div>

      <p className="text-[11px] text-openclaw-dark/40 italic font-medium px-1">
        Click each check to toggle it pass/fail once you've verified it manually in Claw.
      </p>
    </div>
  );
};
