import { CheckCircle, XCircle, Circle, Loader2 } from 'lucide-react';

interface CheckResultProps {
  label: string;
  pass: boolean | null;
  detail: string;
  failHint?: string;
  fixPrompt?: string;
  isConnected: boolean;
  isSending: boolean;
  onFix?: () => void;
  onRecheck?: () => void;
}

export const CheckResult = ({
  label,
  pass,
  detail,
  failHint,
  fixPrompt,
  isConnected,
  isSending,
  onFix,
  onRecheck,
}: CheckResultProps) => {
  const icon =
    pass === true ? <CheckCircle size={18} className="text-emerald-500" /> :
    pass === false ? <XCircle size={18} className="text-red-500" /> :
    <Circle size={18} className="text-slate-300" />;

  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        pass === true
          ? 'bg-emerald-50 border-emerald-200'
          : pass === false
          ? 'bg-red-50 border-red-200'
          : 'bg-white border-slate-200'
      }`}
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

          {/* Failure hint + actions */}
          {pass === false && (
            <div className="mt-2 space-y-2">
              {failHint && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                  {failHint}
                </p>
              )}
              <div className="flex gap-2">
                {fixPrompt && isConnected && onFix && (
                  <button
                    onClick={onFix}
                    disabled={isSending}
                    className="text-xs px-3 py-1 bg-openclaw-red text-white rounded font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    Fix This
                  </button>
                )}
                {isConnected && onRecheck && (
                  <button
                    onClick={onRecheck}
                    disabled={isSending}
                    className="text-xs px-3 py-1 bg-white border border-slate-300 text-slate-700 rounded font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    {isSending ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      'Re-check'
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
