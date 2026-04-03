import { useState } from 'react';
import { MODULES_DATA } from './data/modules';
import { useStepProgress } from './hooks/useStepProgress';
import { Sidebar } from './components/layout/Sidebar';
import { MobileGate } from './components/layout/MobileGate';
import { StepEngine } from './components/steps/StepEngine';
import { ValidationDashboard } from './components/validation/ValidationDashboard';

export default function App() {
  // ── Progress & Nav ──────────────────────────────────────────────────
  const {
    nav, userInputs, isLoaded: progressLoaded,
    getStepState, isStepComplete, setVerifyResults, skipStep,
    markStepComplete, setNav, saveUserInput, getModuleChecks,
  } = useStepProgress();

  // ── UI state ────────────────────────────────────────────────────────
  const [moduleDropdownOpen, setModuleDropdownOpen] = useState(false);
  const [mobileOverride, setMobileOverride] = useState(false);

  // ── Derived ─────────────────────────────────────────────────────────
  const currentModule = MODULES_DATA.find(m => m.id === nav.moduleId) ?? MODULES_DATA[0]!;
  const currentPhase = currentModule.phases.find(p => p.id === nav.phaseId) ?? currentModule.phases[0]!;
  const isValidationPhase = currentPhase.id === 'validation';

  const completedModulesCount = MODULES_DATA.filter(mod => {
    const { total, passed } = getModuleChecks(mod.id);
    return total > 0 && passed === total;
  }).length;

  // ── Handlers ────────────────────────────────────────────────────────
  const handleModuleChange = (moduleId: string) => {
    const mod = MODULES_DATA.find(m => m.id === moduleId);
    if (mod) {
      setNav({ moduleId, phaseId: mod.phases[0]?.id ?? '', stepIndex: 0 });
    }
  };

  const handlePhaseChange = (phaseId: string) => {
    setNav({ phaseId, stepIndex: 0 });
  };

  const handleExecute = (_prompt: string, _stepTitle: string) => {
    // No-op: user copies the prompt and pastes it in Claw manually
  };

  // Toggle a single check's pass state (manual verification)
  const handleToggleCheck = (
    moduleId: string,
    phaseId: string,
    stepId: string,
    checkId: string,
  ) => {
    const currentResults = getStepState(moduleId, phaseId, stepId)?.verifyResults ?? {};
    const currentPass = currentResults[checkId]?.pass ?? null;
    const newPass = currentPass !== true; // null → true, false → true, true → false

    const updatedResults = {
      ...currentResults,
      [checkId]: {
        pass: newPass,
        detail: newPass ? 'Manually marked as passed.' : 'Manually marked as failed.',
        checkedAt: new Date().toISOString(),
      },
    };

    setVerifyResults(moduleId, phaseId, stepId, updatedResults);
  };

  // Toggle a check from the ValidationDashboard — find which step owns it
  const handleToggleDashboardCheck = (checkId: string) => {
    for (const phase of currentModule.phases) {
      for (const step of phase.steps) {
        const found = step.verify?.checks.find(c => c.id === checkId);
        if (found) {
          handleToggleCheck(nav.moduleId, phase.id, step.id, checkId);
          return;
        }
      }
    }
  };

  // ── Loading gate ────────────────────────────────────────────────────
  if (!progressLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading mastery curriculum...
      </div>
    );
  }

  // ── Mobile gate ─────────────────────────────────────────────────────
  if (typeof window !== 'undefined' && window.innerWidth < 768 && !mobileOverride) {
    return <MobileGate onContinueAnyway={() => setMobileOverride(true)} />;
  }

  // ── Module check data (for dashboard) ───────────────────────────────
  const moduleChecks = getModuleChecks(nav.moduleId);

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar
        moduleDropdownOpen={moduleDropdownOpen}
        setModuleDropdownOpen={setModuleDropdownOpen}
        activeModuleId={nav.moduleId}
        activePhaseId={nav.phaseId}
        onModuleChange={handleModuleChange}
        onPhaseChange={handlePhaseChange}
        currentModule={currentModule}
        completedModulesCount={completedModulesCount}
      />

      {/* Main content */}
      <main className="app-main p-6 md:p-8">
        {/* Module header */}
        <div className="mb-8">
          <div className="text-sm font-semibold text-openclaw-red mb-2 tracking-wide uppercase">
            {currentModule.shortTitle}
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight leading-tight">
            {currentModule.title}
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl leading-relaxed">
            {currentModule.description}
          </p>
        </div>

        {/* Phase title */}
        {!isValidationPhase && (
          <h2 className="text-xl font-bold text-slate-800 mb-6">
            Phase: {currentPhase.title}
          </h2>
        )}

        {/* Content */}
        {isValidationPhase ? (
          <ValidationDashboard
            moduleTitle={currentModule.title}
            total={moduleChecks.total}
            passed={moduleChecks.passed}
            checks={moduleChecks.checks}
            onToggleCheck={handleToggleDashboardCheck}
          />
        ) : (
          <StepEngine
            steps={currentPhase.steps}
            currentIndex={nav.stepIndex}
            moduleId={nav.moduleId}
            phaseId={nav.phaseId}
            userInputs={userInputs}
            getVerifyResults={stepId =>
              getStepState(nav.moduleId, nav.phaseId, stepId)?.verifyResults
            }
            isStepComplete={stepId =>
              isStepComplete(nav.moduleId, nav.phaseId, stepId)
            }
            onExecute={handleExecute}
            onToggleCheck={(stepId, checkId) =>
              handleToggleCheck(nav.moduleId, nav.phaseId, stepId, checkId)
            }
            onSkip={stepId => skipStep(nav.moduleId, nav.phaseId, stepId)}
            onMarkComplete={stepId => markStepComplete(nav.moduleId, nav.phaseId, stepId)}
            onSaveInput={saveUserInput}
            onNavigateStep={index => setNav({ stepIndex: index })}
          />
        )}
      </main>
    </div>
  );
}
