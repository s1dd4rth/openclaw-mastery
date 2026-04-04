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
    <div className="flex h-screen bg-openclaw-bg font-body overflow-hidden">
      {/* Top Navigation Bar (Exact Mirror of Unpacked) */}
      <nav className="fixed top-0 left-0 right-0 h-[48px] bg-openclaw-bg/92 backdrop-blur-[20px] border-b border-openclaw-border z-50 flex items-center px-[1.5rem] justify-between transition-all duration-300">
        <div className="flex items-center gap-[1.5rem]">
          <div className="font-sans font-extrabold text-[0.82rem] tracking-tighter text-openclaw-dark select-none">
            Open<span className="text-openclaw-red">Claw</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-4">
            {['Topology', 'Loop', 'Architecture', 'Channels', 'Plugins', 'Skills', 'Memory', 'Safety', 'Deploy'].map((link) => (
              <span key={link} className="text-[0.65rem] font-bold text-openclaw-dark/30 uppercase tracking-widest cursor-default">
                {link}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="https://s1dd4rth.github.io/openclaw-mastery/openclaw-unpacked.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[0.65rem] font-bold text-openclaw-dark/40 hover:text-openclaw-dark transition-all duration-200 uppercase tracking-tight flex items-center gap-1.5"
          >
            Architecture Guide <span className="opacity-40 text-[10px]">↗</span>
          </a>
        </div>
      </nav>

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
      <main className="flex-1 overflow-y-auto pt-[48px] px-6 md:px-12 lg:px-20">
        <div className="max-w-screen-xl mx-auto py-24">
          {/* Module Hero (Mirroring Unpacked) */}
          <header className="mb-24 flex flex-col items-center text-center relative">
            {/* Dynamic Background Glow */}
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(204,59,42,0.04)_0%,transparent_70%)] pointer-events-none -z-10" />

            <div className="flex flex-wrap items-center justify-center gap-3 mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
              <span className="font-mono text-[0.58rem] font-bold uppercase tracking-[1.5px] text-[#cc3b2a] bg-[#cc3b2a]/5 px-3 py-1.5 rounded-full border border-[#cc3b2a]/15">
                Module {MODULES_DATA.findIndex(m => m.id === nav.moduleId) + 1} · Internalized
              </span>
              <span className="font-mono text-[0.58rem] font-bold uppercase tracking-[1.5px] text-[#2d8f52] bg-[#2d8f52]/5 px-3 py-1.5 rounded-full border border-[#2d8f52]/15">
                {currentPhase.title} · Step {nav.stepIndex + 1}
              </span>
            </div>

            <div className="max-w-4xl space-y-8 mb-16">
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h1 className="text-6xl md:text-[5rem] font-extrabold text-openclaw-dark font-sans tracking-[-0.5px] leading-[1.05] mb-8">
                  {currentModule.title.split(' ').slice(0, -1).join(' ')} <br/>
                  <span className="text-openclaw-red">{currentModule.title.split(' ').slice(-1)}</span>
                </h1>
                <p className="text-xl font-medium text-openclaw-dark/50 max-w-[580px] mx-auto leading-[1.8]">
                  {currentModule.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className="flex flex-col items-center gap-2">
                <div className="text-2xl font-black text-openclaw-red">{(moduleChecks.passed / moduleChecks.total * 100).toFixed(0)}%</div>
                <div className="text-[0.55rem] font-bold text-openclaw-dark/30 uppercase tracking-[2px] font-mono">Mastery</div>
              </div>
              <div className="w-[1px] h-8 bg-openclaw-border" />
              <div className="flex flex-col items-center gap-2">
                <div className="text-2xl font-black text-openclaw-dark tabular-nums">{moduleChecks.passed}/{moduleChecks.total}</div>
                <div className="text-[0.55rem] font-bold text-openclaw-dark/30 uppercase tracking-[2px] font-mono">Checks</div>
              </div>
              <div className="w-[1px] h-8 bg-openclaw-border" />
              <div className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 rounded-xl bg-openclaw-bg3 flex items-center justify-center border border-openclaw-border">
                  <div className="w-3 h-3 rounded-full bg-openclaw-red animate-pulse shadow-[0_0_12px_rgba(204,59,42,0.3)]" />
                </div>
                <div>
                  <div className="text-[0.55rem] font-bold text-openclaw-dark/30 uppercase tracking-[2px] font-mono leading-none mb-1">Platform</div>
                  <div className="text-sm font-black text-openclaw-dark leading-none">Curriculum Live</div>
                </div>
              </div>
            </div>
            
            <div className="w-full h-[1px] bg-openclaw-border mt-20" />
          </header>

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
        </div>
      </main>
    </div>
  );
}
