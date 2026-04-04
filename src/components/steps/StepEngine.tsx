import type { Step, VerifyResult } from '../../data/types';
import { StepLearn } from './StepLearn';
import { StepDo } from './StepDo';
import { StepVerify } from './StepVerify';
import { StepProgress } from './StepProgress';

interface StepEngineProps {
  steps: Step[];
  currentIndex: number;
  moduleId: string;
  phaseId: string;
  userInputs: Record<string, string>;
  getVerifyResults: (stepId: string) => Record<string, VerifyResult> | undefined;
  isStepComplete: (stepId: string) => boolean;
  onExecute: (prompt: string, stepTitle: string) => void;
  onToggleCheck: (stepId: string, checkId: string) => void;
  onSkip: (stepId: string) => void;
  onMarkComplete: (stepId: string) => void;
  onSaveInput: (key: string, value: string) => void;
  onNavigateStep: (index: number) => void;
}

export const StepEngine = ({
  steps,
  currentIndex,
  userInputs,
  getVerifyResults,
  isStepComplete,
  onExecute,
  onToggleCheck,
  onSkip,
  onMarkComplete,
  onSaveInput,
  onNavigateStep,
}: StepEngineProps) => {
  const completedSteps = steps.map(s => isStepComplete(s.id));
  const step = steps[currentIndex];

  if (!step) return null;

  const isLocked = currentIndex > 0 && !completedSteps[currentIndex - 1];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <StepProgress
        totalSteps={steps.length}
        currentIndex={currentIndex}
        completedSteps={completedSteps}
      />

      {isLocked ? (
        <div className="bg-openclaw-bg3 rounded-xl p-10 text-center border border-openclaw-border">
          <p className="text-openclaw-dark/40 text-sm font-medium">
            Complete the previous step to unlock this one.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Step title */}
          <div className="flex items-baseline gap-4 border-b border-openclaw-border pb-4">
            <span className="text-4xl font-black text-openclaw-red opacity-20 tabular-nums leading-none">
              {String(currentIndex + 1).padStart(2, '0')}
            </span>
            <h3 className="text-xl font-bold text-openclaw-dark tracking-tight font-sans">
              {step.title}
            </h3>
          </div>

          {/* Learn */}
          <div className="bg-openclaw-bg2 rounded-2xl p-8 border border-openclaw-border shadow-sm">
            <StepLearn content={step.learn} />
          </div>

          {/* Do */}
          {step.do && (
            <StepDo
              prompt={step.do.prompt}
              instructionUrl={step.do.instructionUrl}
              requiresInput={step.do.requiresInput}
              userInputs={userInputs}
              onExecute={prompt => onExecute(prompt, step.title)}
              onSaveInput={onSaveInput}
            />
          )}

          {/* Verify */}
          {step.verify && (
            <StepVerify
              checks={step.verify.checks}
              results={getVerifyResults(step.id)}
              onToggleCheck={(checkId) => onToggleCheck(step.id, checkId)}
              onSkip={() => onSkip(step.id)}
            />
          )}

          {/* Mark as done button for learn-only steps (no do/verify) */}
          {!step.do && !step.verify && !completedSteps[currentIndex] && (
            <button
              onClick={() => onMarkComplete(step.id)}
              className="w-full py-4 bg-openclaw-red text-white rounded-xl font-bold text-sm hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md shadow-openclaw-red/20"
            >
              I've done this — continue
            </button>
          )}

          {/* Navigation between steps */}
          {(completedSteps[currentIndex] || isStepComplete(step.id)) && currentIndex < steps.length - 1 && (
            <button
              onClick={() => onNavigateStep(currentIndex + 1)}
              className="w-full py-4 bg-openclaw-dark text-white rounded-xl font-bold text-sm hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md shadow-openclaw-dark/10"
            >
              Next Step: {steps[currentIndex + 1]?.title}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
