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
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                isCurrent
                  ? 'bg-openclaw-red text-white shadow-lg shadow-openclaw-red/20 scale-110'
                  : isComplete
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  : isLocked
                  ? 'bg-openclaw-bg3 text-openclaw-dark/20 border border-openclaw-border'
                  : 'bg-openclaw-bg3 text-openclaw-dark/40 border border-openclaw-border'
              }`}
            >
              {isComplete ? (
                <Check size={16} strokeWidth={3} />
              ) : isLocked ? (
                <Lock size={12} strokeWidth={3} />
              ) : (
                i + 1
              )}
            </div>
            {i < totalSteps - 1 && (
              <div
                className={`w-8 h-[2px] transition-colors duration-500 ${
                  isComplete ? 'bg-emerald-500/30' : 'bg-openclaw-border'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
