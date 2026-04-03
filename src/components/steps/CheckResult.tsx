import { CheckCircle, XCircle, Circle } from 'lucide-react';

interface CheckResultProps {
  label: string;
  pass: boolean | null;
  detail: string;
  failHint?: string;
  fixPrompt?: string;
  onToggle?: () => void;
}

export const CheckResult = ({
  label,
  pass,
  detail,
  failHint,
  onToggle,
}: CheckResultProps) => {
  const icon =
    pass === true ? <CheckCircle size={18} className="text-emerald-500" /> :
    pass === false ? <XCircle size={18} className="text-red-500" /> :
    <Circle size={18} className="text-slate-300" />;

  return (
    <div
      onClick={onToggle}
      role={onToggle ? 'button' : undefined}
      tabIndex={onToggle ? 0 : undefined}
      onKeyDown={onToggle ? (e) => { if (e.key === 'Enter' || e.key === ' ') onToggle(); } : undefined}
      className={`rounded-lg border p-3 transition-colors ${
        pass === true
          ? 'bg-emerald-50 border-emerald-200'
          : pass === false
          ? 'bg-red-50 border-red-200'
          : 'bg-white border-slate-200'
      } ${onToggle ? 'cursor-pointer hover:opacity-80 select-none' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${pass === false ? 'text-red-800' : 'text-slate-800'}`}>
            {label}
          </p>
          {detail && (
            <p className="text-xs text-slate-500 mt-0.5">{detail}</p>
          )}

          {/* Failure hint */}
          {pass === false && failHint && (
            <div className="mt-2">
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                {failHint}
              </p>
            </div>
          )}
        </div>
        {onToggle && (
          <div className="text-xs text-slate-400 flex-shrink-0 mt-0.5">
            click to toggle
          </div>
        )}
      </div>
    </div>
  );
};
