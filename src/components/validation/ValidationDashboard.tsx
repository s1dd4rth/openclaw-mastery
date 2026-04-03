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
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck size={22} className="text-openclaw-red" />
              Validation Dashboard
            </h2>
            <p className="text-sm text-slate-500 mt-1">{moduleTitle}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-openclaw-red">
              {passed}/{total}
            </div>
            <p className="text-xs text-slate-400">checks passed</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-6">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              passed === total ? 'bg-emerald-500' : 'bg-openclaw-red'
            }`}
            style={{ width: total > 0 ? `${(passed / total) * 100}%` : '0%' }}
          />
        </div>

        {/* Checks by phase */}
        {Array.from(byPhase.entries()).map(([phaseTitle, phaseChecks]) => {
          const phasePassed = phaseChecks.filter(c => c.pass === true).length;
          return (
            <div key={phaseTitle} className="mb-5 last:mb-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-700">Phase: {phaseTitle}</h3>
                <span className="text-xs font-medium text-slate-400">
                  {phasePassed}/{phaseChecks.length}
                  {phasePassed === phaseChecks.length ? ' ✅' : ''}
                </span>
              </div>
              <div className="space-y-2">
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

        <p className="text-xs text-slate-400 italic mt-4">
          Click each check to toggle it pass / fail once you've verified it manually in Claw.
        </p>
      </div>
    </div>
  );
};
