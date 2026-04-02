import { useState, useEffect, useCallback } from 'react';
import type { AppProgress, NavState, StepState, VerifyResult } from '../data/types';
import { MODULES_DATA } from '../data/modules';

const PROGRESS_KEY = 'openclawProgress';
const NAV_KEY = 'openclawNav';
const INPUTS_KEY = 'openclawUserInputs';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded
  }
}

const defaultNav: NavState = {
  moduleId: MODULES_DATA[0]?.id ?? 'm1',
  phaseId: MODULES_DATA[0]?.phases[0]?.id ?? 'deploy',
  stepIndex: 0,
};

export function useStepProgress() {
  const [progress, setProgress] = useState<AppProgress>({});
  const [nav, setNavRaw] = useState<NavState>(defaultNav);
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Rehydrate
  useEffect(() => {
    setProgress(load(PROGRESS_KEY, {}));
    setUserInputs(load(INPUTS_KEY, {}));

    const savedNav = load<NavState | null>(NAV_KEY, null);
    if (savedNav) {
      // Validate against current module data
      const mod = MODULES_DATA.find(m => m.id === savedNav.moduleId);
      if (mod) {
        const phase = mod.phases.find(p => p.id === savedNav.phaseId);
        if (phase) {
          setNavRaw(savedNav);
        } else {
          setNavRaw({ ...savedNav, phaseId: mod.phases[0]?.id ?? '', stepIndex: 0 });
        }
      }
      // If module doesn't exist, keep defaults
    }

    setIsLoaded(true);
  }, []);

  // Persist on change
  useEffect(() => {
    if (isLoaded) save(PROGRESS_KEY, progress);
  }, [progress, isLoaded]);

  useEffect(() => {
    if (isLoaded) save(NAV_KEY, nav);
  }, [nav, isLoaded]);

  useEffect(() => {
    if (isLoaded) save(INPUTS_KEY, userInputs);
  }, [userInputs, isLoaded]);

  const getStepState = useCallback(
    (moduleId: string, phaseId: string, stepId: string): StepState | undefined => {
      return progress[moduleId]?.[phaseId]?.[stepId];
    },
    [progress],
  );

  const isStepComplete = useCallback(
    (moduleId: string, phaseId: string, stepId: string): boolean => {
      const state = getStepState(moduleId, phaseId, stepId);
      return state?.completed === true || state?.skipped === true;
    },
    [getStepState],
  );

  const setVerifyResults = useCallback(
    (moduleId: string, phaseId: string, stepId: string, results: Record<string, VerifyResult>) => {
      setProgress(prev => {
        const next = { ...prev };
        if (!next[moduleId]) next[moduleId] = {};
        if (!next[moduleId][phaseId]) next[moduleId][phaseId] = {};
        if (!next[moduleId][phaseId][stepId]) {
          next[moduleId][phaseId][stepId] = { completed: false, skipped: false };
        }

        const allPass = Object.values(results).every(r => r.pass);
        next[moduleId][phaseId][stepId] = {
          ...next[moduleId][phaseId][stepId],
          verifyResults: results,
          completed: allPass,
        };
        return next;
      });
    },
    [],
  );

  const skipStep = useCallback(
    (moduleId: string, phaseId: string, stepId: string) => {
      setProgress(prev => {
        const next = { ...prev };
        if (!next[moduleId]) next[moduleId] = {};
        if (!next[moduleId][phaseId]) next[moduleId][phaseId] = {};
        next[moduleId][phaseId][stepId] = {
          ...(next[moduleId][phaseId][stepId] ?? { completed: false, skipped: false }),
          skipped: true,
        };
        return next;
      });
    },
    [],
  );

  const markStepComplete = useCallback(
    (moduleId: string, phaseId: string, stepId: string) => {
      setProgress(prev => {
        const next = { ...prev };
        if (!next[moduleId]) next[moduleId] = {};
        if (!next[moduleId][phaseId]) next[moduleId][phaseId] = {};
        next[moduleId][phaseId][stepId] = {
          ...(next[moduleId][phaseId][stepId] ?? { completed: false, skipped: false }),
          completed: true,
        };
        return next;
      });
    },
    [],
  );

  const setNav = useCallback((update: Partial<NavState>) => {
    setNavRaw(prev => ({ ...prev, ...update }));
  }, []);

  const saveUserInput = useCallback((key: string, value: string) => {
    setUserInputs(prev => ({ ...prev, [key]: value }));
  }, []);

  const isResultStale = useCallback((checkedAt: string): boolean => {
    return Date.now() - new Date(checkedAt).getTime() > CACHE_TTL_MS;
  }, []);

  // Get all check results for a module (for ValidationDashboard)
  const getModuleChecks = useCallback(
    (moduleId: string) => {
      const mod = MODULES_DATA.find(m => m.id === moduleId);
      if (!mod) return { total: 0, passed: 0, checks: [] as Array<{ checkId: string; label: string; pass: boolean | null; detail: string; phaseTitle: string; failHint?: string; fixPrompt?: string }> };

      const checks: Array<{ checkId: string; label: string; pass: boolean | null; detail: string; phaseTitle: string; failHint?: string; fixPrompt?: string }> = [];

      for (const phase of mod.phases) {
        for (const step of phase.steps) {
          if (!step.verify) continue;
          for (const check of step.verify.checks) {
            const result = progress[moduleId]?.[phase.id]?.[step.id]?.verifyResults?.[check.id];
            checks.push({
              checkId: check.id,
              label: check.label,
              pass: result ? (isResultStale(result.checkedAt) ? null : result.pass) : null,
              detail: result?.detail ?? '',
              phaseTitle: phase.title,
              failHint: check.failHint,
              fixPrompt: check.fixPrompt,
            });
          }
        }
      }

      return {
        total: checks.length,
        passed: checks.filter(c => c.pass === true).length,
        checks,
      };
    },
    [progress, isResultStale],
  );

  return {
    progress,
    nav,
    userInputs,
    isLoaded,
    getStepState,
    isStepComplete,
    setVerifyResults,
    skipStep,
    markStepComplete,
    setNav,
    saveUserInput,
    getModuleChecks,
  };
}
