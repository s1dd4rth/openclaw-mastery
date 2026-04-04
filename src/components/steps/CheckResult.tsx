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
    pass === true ? <CheckCircle size={20} className="text-emerald-500" /> :
    pass === false ? <XCircle size={20} className="text-openclaw-red" /> :
    <Circle size={20} className="text-openclaw-dark/10" />;

  return (
    <div
      onClick={onToggle}
      role={onToggle ? 'button' : undefined}
      tabIndex={onToggle ? 0 : undefined}
      onKeyDown={onToggle ? (e) => { if (e.key === 'Enter' || e.key === ' ') onToggle(); } : undefined}
      className={`rounded-2xl border p-4 transition-all duration-200 ${
        pass === true
          ? 'bg-emerald-50/50 border-emerald-100 shadow-sm'
          : pass === false
          ? 'bg-red-50/50 border-red-100 shadow-sm'
          : 'bg-white border-openclaw-border hover:border-openclaw-dark/20'
      } ${onToggle ? 'cursor-pointer select-none group' : ''}`}
    >
      <div className="flex items-start gap-4">
        <div className="mt-0.5 flex-shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold tracking-tight ${
            pass === true ? 'text-emerald-700' : 
            pass === false ? 'text-openclaw-red' : 
            'text-openclaw-dark/80'
          }`}>
            {label}
          </p>
          {detail && (
            <p className="text-xs text-openclaw-dark/50 mt-1 font-medium leading-relaxed">{detail}</p>
          )}

          {/* Failure hint */}
          {pass === false && failHint && (
            <div className="mt-3">
              <p className="text-[11px] text-[#7c2d12] bg-[#fffafa] border border-red-100 rounded-lg px-3 py-2 font-medium leading-relaxed">
                <span className="font-bold mr-1">Hint:</span> {failHint}
              </p>
            </div>
          )}
        </div>
        {onToggle && (
          <div className="text-[10px] font-bold uppercase tracking-wider text-openclaw-dark/20 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            toggle
          </div>
        )}
      </div>
    </div>
  );
};
