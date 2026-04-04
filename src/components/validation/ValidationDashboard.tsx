import { ShieldCheck } from 'lucide-react';
import { CheckResult } from '../steps/CheckResult';

interface DashboardCheck {
  checkId: string;
  label: string;
  pass: boolean | null;
  detail: string;
  phaseTitle: string;
  failHint?: string;
  fixPrompt?: string;
}

interface ValidationDashboardProps {
  moduleTitle: string;
  total: number;
  passed: number;
  checks: DashboardCheck[];
  onToggleCheck: (checkId: string) => void;
}

export const ValidationDashboard = ({
  moduleTitle,
  total,
  passed,
  checks,
  onToggleCheck,
}: ValidationDashboardProps) => {
  // Group checks by phase
  const byPhase = new Map<string, DashboardCheck[]>();
  for (const check of checks) {
    const list = byPhase.get(check.phaseTitle) ?? [];
    list.push(check);
    byPhase.set(check.phaseTitle, list);
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-openclaw-border">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-extrabold text-openclaw-dark flex items-center gap-2 font-sans tracking-tight">
              <ShieldCheck size={24} className="text-openclaw-red" />
              Validation Dashboard
            </h2>
            <p className="text-sm font-medium text-openclaw-dark/40 mt-1">{moduleTitle}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-openclaw-red tabular-nums">
              {passed}/{total}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-openclaw-dark/30">checks passed</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-3 bg-openclaw-bg3 rounded-full overflow-hidden mb-10 border border-openclaw-border/50">
          <div
            className={`h-full transition-all duration-1000 ease-out rounded-full shadow-inner ${
              passed === total ? 'bg-emerald-500' : 'bg-openclaw-red'
            }`}
            style={{ width: total > 0 ? `${(passed / total) * 100}%` : '0%' }}
          />
        </div>

        {/* Checks by phase */}
        <div className="space-y-10">
          {Array.from(byPhase.entries()).map(([phaseTitle, phaseChecks]) => {
            const phasePassed = phaseChecks.filter(c => c.pass === true).length;
            return (
              <div key={phaseTitle} className="relative">
                <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="text-xs font-bold text-openclaw-dark/50 uppercase tracking-widest">Phase: {phaseTitle}</h3>
                  <span className="text-xs font-bold text-openclaw-dark/30 tabular-nums">
                    {phasePassed} / {phaseChecks.length}
                    {phasePassed === phaseChecks.length ? ' ✅' : ''}
                  </span>
                </div>
                <div className="grid gap-3">
                  {phaseChecks.map(check => (
                    <CheckResult
                      key={check.checkId}
                      label={check.label}
                      pass={check.pass}
                      detail={check.detail}
                      failHint={check.failHint}
                      fixPrompt={check.fixPrompt}
                      onToggle={() => onToggleCheck(check.checkId)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-openclaw-dark/40 italic font-medium mt-8 text-center bg-openclaw-bg3 py-2 rounded-lg">
          Click each check to toggle it pass/fail once you've verified it manually in Claw.
        </p>
      </div>
    </div>
  );
};
