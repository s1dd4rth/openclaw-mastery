import { Lock, Check } from 'lucide-react';

interface StepProgressProps {
  totalSteps: number;
  currentIndex: number;
  completedSteps: boolean[];
  onNavigateStep?: (index: number) => void;
}

export const StepProgress = ({
  totalSteps,
  currentIndex,
  completedSteps,
  onNavigateStep,
}: StepProgressProps) => {
  if (totalSteps <= 1) return null;

  return (
    <div className="flex items-center gap-1 mb-4">
      {Array.from({ length: totalSteps }, (_, i) => {
        const isComplete = completedSteps[i];
        const isCurrent = i === currentIndex;
        // Locked: any step beyond the first that hasn't been reached yet
        // (previous step not complete and we're not already on this one).
        const isLocked = i > 0 && !completedSteps[i - 1] && !isCurrent;
        const isClickable = !isLocked && !!onNavigateStep && !isCurrent;

        const baseClasses = `w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300 ${
          isCurrent
            ? 'bg-openclaw-red text-white shadow-lg shadow-openclaw-red/20 scale-110'
            : isComplete
            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
            : isLocked
            ? 'bg-openclaw-bg3 text-openclaw-dark/20 border border-openclaw-border'
            : 'bg-openclaw-bg3 text-openclaw-dark/40 border border-openclaw-border'
        }`;

        const interactiveClasses = isClickable
          ? ' cursor-pointer hover:scale-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-openclaw-red/30'
          : '';

        const content = isComplete ? (
          <Check size={16} strokeWidth={3} />
        ) : isLocked ? (
          <Lock size={12} strokeWidth={3} />
        ) : (
          i + 1
        );

        return (
          <div key={i} className="flex items-center">
            {isClickable ? (
              <button
                type="button"
                onClick={() => onNavigateStep!(i)}
                className={baseClasses + interactiveClasses}
                aria-label={`Go to step ${i + 1}${isComplete ? ' (completed)' : ''}`}
                title={`Go to step ${i + 1}`}
              >
                {content}
              </button>
            ) : (
              <div
                className={baseClasses}
                aria-label={
                  isCurrent
                    ? `Step ${i + 1} (current)`
                    : isLocked
                    ? `Step ${i + 1} (locked — complete previous step first)`
                    : `Step ${i + 1}`
                }
                title={isLocked ? 'Complete the previous step to unlock' : undefined}
              >
                {content}
              </div>
            )}
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
