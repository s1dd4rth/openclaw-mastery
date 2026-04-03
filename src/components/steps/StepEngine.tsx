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
  isConnected: boolean;
  isSending: boolean;
  userInputs: Record<string, string>;
  controlUiUrl: string;
  getVerifyResults: (stepId: string) => Record<string, VerifyResult> | undefined;
  isStepComplete: (stepId: string) => boolean;
  onExecute: (prompt: string, stepTitle: string) => void;
  onRunChecks: (stepId: string, checks: Array<{ id: string; verifyPrompt: string }>) => void;
  onFix: (fixPrompt: string, stepId: string, checks: Array<{ id: string; verifyPrompt: string }>) => void;
  onRecheckSingle: (stepId: string, checkId: string, verifyPrompt: string) => void;
  onSkip: (stepId: string) => void;
  onMarkComplete: (stepId: string) => void;
  onSaveInput: (key: string, value: string) => void;
  onNavigateStep: (index: number) => void;
}

export const StepEngine = ({
  steps,
  currentIndex,
  isConnected,
  isSending,
  userInputs,
  controlUiUrl,
  getVerifyResults,
  isStepComplete,
  onExecute,
  onRunChecks,
  onFix,
  onRecheckSingle,
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
        <div className="bg-slate-50 rounded-xl p-8 text-center border border-slate-200">
          <p className="text-slate-400 text-sm">
            Complete the previous step to unlock this one.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Step title */}
          <h3 className="text-lg font-bold text-slate-900">
            Step {currentIndex + 1}: {step.title}
          </h3>

          {/* Learn */}
          <StepLearn content={step.learn} />

          {/* Do */}
          {step.do && (
            <StepDo
              prompt={step.do.prompt}
              instructionUrl={step.do.instructionUrl}
              requiresInput={step.do.requiresInput}
              isConnected={isConnected}
              isSending={isSending}
              userInputs={userInputs}
              controlUiUrl={controlUiUrl}
              onExecute={prompt => onExecute(prompt, step.title)}
              onSaveInput={onSaveInput}
            />
          )}

          {/* Verify */}
          {step.verify && (
            <StepVerify
              checks={step.verify.checks}
              results={getVerifyResults(step.id)}
              isConnected={isConnected}
              isSending={isSending}
              onRunChecks={() =>
                onRunChecks(
                  step.id,
                  step.verify!.checks.map(c => ({ id: c.id, verifyPrompt: c.verifyPrompt })),
                )
              }
              onFix={fixPrompt =>
                onFix(
                  fixPrompt,
                  step.id,
                  step.verify!.checks.map(c => ({ id: c.id, verifyPrompt: c.verifyPrompt })),
                )
              }
              onRecheckSingle={(checkId: string) => {
                const check = step.verify!.checks.find(c => c.id === checkId);
                if (check) onRecheckSingle(step.id, checkId, check.verifyPrompt);
              }}
              onSkip={() => onSkip(step.id)}
            />
          )}

          {/* Mark as done button for learn-only steps (no do/verify) */}
          {!step.do && !step.verify && !completedSteps[currentIndex] && (
            <button
              onClick={() => onMarkComplete(step.id)}
              className="w-full py-3 bg-openclaw-red text-white rounded-xl font-semibold text-sm hover:bg-red-600 transition-colors"
            >
              I've done this — continue
            </button>
          )}

          {/* Navigation between steps */}
          {completedSteps[currentIndex] && currentIndex < steps.length - 1 && (
            <button
              onClick={() => onNavigateStep(currentIndex + 1)}
              className="w-full py-3 bg-emerald-500 text-white rounded-xl font-semibold text-sm hover:bg-emerald-600 transition-colors"
            >
              Next Step: {steps[currentIndex + 1]?.title}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
