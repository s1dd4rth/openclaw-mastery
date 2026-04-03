import { useState } from 'react';
import { MODULES_DATA } from './data/modules';
import { useConnection } from './hooks/useConnection';
import { useStepProgress } from './hooks/useStepProgress';
import { useChatMessages } from './hooks/useChatMessages';
import { Sidebar } from './components/layout/Sidebar';
import { MobileGate } from './components/layout/MobileGate';
import { PairingFlow } from './components/connection/PairingFlow';
import { StepEngine } from './components/steps/StepEngine';
import { ValidationDashboard } from './components/validation/ValidationDashboard';
import { ChatPanel } from './components/chat/ChatPanel';
import type { VerifyResult } from './data/types';

export default function App() {
  // ── Connection ──────────────────────────────────────────────────────
  const {
    connection, isConnected, isConnecting, connectionError, isLoaded: connLoaded,
    client, connect, disconnect,
  } = useConnection();

  // ── Progress & Nav ──────────────────────────────────────────────────
  const {
    nav, userInputs, isLoaded: progressLoaded,
    getStepState, isStepComplete, setVerifyResults, skipStep,
    markStepComplete, setNav, saveUserInput, getModuleChecks,
  } = useStepProgress();

  // ── Chat ────────────────────────────────────────────────────────────
  const { messages, isSending, sendMessage, sendVerify, clearMessages } =
    useChatMessages(client);

  // ── UI state ────────────────────────────────────────────────────────
  const [moduleDropdownOpen, setModuleDropdownOpen] = useState(false);
  const [showPairing, setShowPairing] = useState(false);
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
      clearMessages();
    }
  };

  const handlePhaseChange = (phaseId: string) => {
    setNav({ phaseId, stepIndex: 0 });
  };

  const handleExecute = async (prompt: string, stepTitle: string) => {
    await sendMessage(prompt, { auto: true, stepTitle });
  };

  const handleRunChecks = async (
    stepId: string,
    checks: Array<{ id: string; verifyPrompt: string }>,
  ) => {
    const results: Record<string, VerifyResult> = {};
    for (const check of checks) {
      const checkResults = await sendVerify(check.verifyPrompt);
      if (checkResults) {
        for (const r of checkResults) {
          results[r.id] = { pass: r.pass, detail: r.detail, checkedAt: new Date().toISOString() };
        }
      } else {
        results[check.id] = { pass: false, detail: 'Verification returned non-JSON response. Check the chat panel.', checkedAt: new Date().toISOString() };
      }
    }
    setVerifyResults(nav.moduleId, nav.phaseId, stepId, results);
  };

  const handleFix = async (
    fixPrompt: string,
    stepId: string,
    checks: Array<{ id: string; verifyPrompt: string }>,
  ) => {
    await sendMessage(fixPrompt, { auto: true, stepTitle: 'Auto-fix' });
    await handleRunChecks(stepId, checks);
  };

  const handleRecheckSingle = async (
    stepId: string,
    checkId: string,
    verifyPrompt: string,
  ) => {
    await handleRunChecks(stepId, [{ id: checkId, verifyPrompt }]);
  };

  const handleValidateAll = async () => {
    for (const phase of currentModule.phases) {
      for (const step of phase.steps) {
        if (step.verify) {
          await handleRunChecks(
            step.id,
            step.verify.checks.map(c => ({ id: c.id, verifyPrompt: c.verifyPrompt })),
          );
        }
      }
    }
  };

  // ── Loading gate ────────────────────────────────────────────────────
  if (!connLoaded || !progressLoaded) {
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
    <>
      {showPairing && (
        <PairingFlow
          onConnect={connect}
          isConnecting={isConnecting}
          connectionError={connectionError}
          onClose={() => setShowPairing(false)}
        />
      )}

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
          isConnected={isConnected}
          clawName={connection?.clawName}
          onOpenPairing={() => setShowPairing(true)}
          onDisconnect={disconnect}
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
              isConnected={isConnected}
              isSending={isSending}
              onValidateAll={handleValidateAll}
              onFix={async (fixPrompt) => {
                await sendMessage(fixPrompt, { auto: true, stepTitle: 'Auto-fix' });
                await handleValidateAll();
              }}
              onRecheck={async (checkId) => {
                // Find the check and re-run it
                for (const phase of currentModule.phases) {
                  for (const step of phase.steps) {
                    const check = step.verify?.checks.find(c => c.id === checkId);
                    if (check) {
                      await handleRunChecks(step.id, [{ id: check.id, verifyPrompt: check.verifyPrompt }]);
                      return;
                    }
                  }
                }
              }}
            />
          ) : (
            <StepEngine
              steps={currentPhase.steps}
              currentIndex={nav.stepIndex}
              moduleId={nav.moduleId}
              phaseId={nav.phaseId}
              isConnected={isConnected}
              isSending={isSending}
              userInputs={userInputs}
              getVerifyResults={stepId =>
                getStepState(nav.moduleId, nav.phaseId, stepId)?.verifyResults
              }
              isStepComplete={stepId =>
                isStepComplete(nav.moduleId, nav.phaseId, stepId)
              }
              onExecute={handleExecute}
              onRunChecks={handleRunChecks}
              onFix={handleFix}
              onRecheckSingle={handleRecheckSingle}
              onSkip={stepId => skipStep(nav.moduleId, nav.phaseId, stepId)}
              onMarkComplete={stepId => markStepComplete(nav.moduleId, nav.phaseId, stepId)}
              onSaveInput={saveUserInput}
              onNavigateStep={index => setNav({ stepIndex: index })}
            />
          )}
        </main>

        {/* Chat panel */}
        <div className="app-chat">
          <ChatPanel
            messages={messages}
            isSending={isSending}
            isConnected={isConnected}
            clawName={connection?.clawName}
            onSendMessage={msg => sendMessage(msg)}
            onOpenPairing={() => setShowPairing(true)}
          />
        </div>
      </div>
    </>
  );
}
