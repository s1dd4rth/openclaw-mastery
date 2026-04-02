import { Lock, Check, Circle } from 'lucide-react';

interface StepProgressProps {
  totalSteps: number;
  currentIndex: number;
  completedSteps: boolean[];
}

export const StepProgress = ({
  totalSteps,
  currentIndex,
  completedSteps,
}: StepProgressProps) => {
  if (totalSteps <= 1) return null;

  return (
    <div className="flex items-center gap-1 mb-4">
      {Array.from({ length: totalSteps }, (_, i) => {
        const isComplete = completedSteps[i];
        const isCurrent = i === currentIndex;
        const isLocked = i > currentIndex && !completedSteps[i - 1] && i > 0;

        return (
          <div key={i} className="flex items-center">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                isCurrent
                  ? 'bg-openclaw-red text-white'
                  : isComplete
                  ? 'bg-emerald-100 text-emerald-600'
                  : isLocked
                  ? 'bg-slate-100 text-slate-300'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {isComplete ? (
                <Check size={14} />
              ) : isLocked ? (
                <Lock size={10} />
              ) : (
                i + 1
              )}
            </div>
            {i < totalSteps - 1 && (
              <div
                className={`w-6 h-0.5 ${
                  isComplete ? 'bg-emerald-300' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
