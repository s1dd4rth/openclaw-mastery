# Progressive Learning Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform OpenClaw Mastery from a static document viewer into an interactive tutorial engine with learn/do/verify steps, embedded chat, and automated validation against the user's live OpenClaw instance.

**Architecture:** React SPA with a thin API client that connects to the user's OpenClaw instance via pairing code. Three-column layout (sidebar, step engine, chat panel). All state in localStorage. Graceful degradation to copy/manual mode when unpaired.

**Tech Stack:** React 19, Vite 8, Tailwind 4, TypeScript 6, ReactMarkdown, Lucide icons (all existing). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-04-02-progressive-learning-engine-design.md`

---

## File Structure

### New Files

```
src/
├── api/
│   └── openClawClient.ts          # API client: pair, sendMessage, ping
├── hooks/
│   ├── useConnection.ts            # Connection state, pairing, health checks
│   ├── useChatMessages.ts          # Chat message history (session-only)
│   └── useStepProgress.ts          # Step completion, verify results, user inputs
├── components/
│   ├── connection/
│   │   ├── PairingFlow.tsx         # Modal: enter URL + code, exchange for token
│   │   └── ConnectionIndicator.tsx # Green/red dot + Claw name
│   ├── steps/
│   │   ├── StepEngine.tsx          # Renders learn/do/verify for one step
│   │   ├── StepLearn.tsx           # Markdown learn content
│   │   ├── StepDo.tsx              # Execute/Copy button + user input
│   │   ├── StepVerify.tsx          # Check items with pass/fail/hint/fix
│   │   ├── CheckResult.tsx         # Single check item row
│   │   └── StepProgress.tsx        # Step counter + lock indicators
│   ├── chat/
│   │   ├── ChatPanel.tsx           # Right column: message list + input
│   │   └── ChatMessage.tsx         # Single message bubble (markdown)
│   ├── validation/
│   │   └── ValidationDashboard.tsx # Aggregated check results per module
│   └── layout/
│       └── MobileGate.tsx          # "Use a larger screen" message
└── data/
    └── types.ts                    # Module, Phase, Step, CheckItem types
```

### Modified Files

```
src/App.tsx                         # Three-column layout, connection context
src/components/layout/Sidebar.tsx   # Phases instead of sections, connection status
src/components/ui/NavigationFooter.tsx # Step-level nav
src/components/ui/CopyButton.tsx    # Kept, used by StepDo in unpaired mode
src/data/modules.ts                 # Restructured: phases + steps instead of sections
src/hooks/useProgress.ts            # Simplified: only useNavState kept, useProgress replaced
src/index.css                       # Three-column grid styles
```

### Removed Files (after migration)

```
src/components/sections/CourseContent.tsx   # Replaced by StepEngine
src/components/sections/Checklist.tsx       # Replaced by ValidationDashboard
src/components/sections/Troubleshooting.tsx # Eliminated, inline on failures
src/components/ui/InstructionViewer.tsx     # Replaced by StepEngine
src/components/ui/PromptCard.tsx            # Replaced by StepDo
```

---

## Task 1: Types and Data Model

**Files:**
- Create: `src/data/types.ts`
- Modify: `src/data/modules.ts`

This task defines the type system and restructures Module 1 as the proof-of-concept. Other modules follow the same pattern and get migrated in Task 10.

- [ ] **Step 1: Create the type definitions**

Create `src/data/types.ts`:

```typescript
import type { LucideIcon } from 'lucide-react';

export interface CheckItem {
  id: string;
  label: string;
  verifyPrompt: string;
  failHint?: string;
  fixPrompt?: string;
}

export interface Step {
  id: string;
  title: string;
  learn: string;
  do?: {
    prompt: string;
    instructionUrl?: string;
    requiresInput?: {
      label: string;
      placeholder: string;
      storeAs: string;
    };
  };
  verify?: {
    checks: CheckItem[];
  };
}

export interface Phase {
  id: string;
  title: string;
  icon: LucideIcon;
  steps: Step[];
}

export interface Module {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: LucideIcon;
  phases: Phase[];
}

export interface ConnectionState {
  instanceUrl: string;
  sessionToken: string;
  clawName: string;
  pairedAt: string;
}

export interface VerifyResult {
  pass: boolean;
  detail: string;
  checkedAt: string;
}

export interface StepState {
  completed: boolean;
  skipped: boolean;
  verifyResults?: Record<string, VerifyResult>;
}

export interface AppProgress {
  [moduleId: string]: {
    [phaseId: string]: {
      [stepId: string]: StepState;
    };
  };
}

export interface NavState {
  moduleId: string;
  phaseId: string;
  stepIndex: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  auto?: boolean;
  stepTitle?: string;
  hidden?: boolean;
}
```

- [ ] **Step 2: Restructure Module 1 in modules.ts**

Replace the Module 1 entry in `src/data/modules.ts`. Keep the old modules (2-10) as-is for now with a compatibility wrapper. The base URL for instruction files needs to match the Vite config `base: '/openclaw-mastery/'`.

Update `src/data/modules.ts` — replace the existing imports and Module 1 definition. Keep all other modules untouched. Add this at the top of the file:

```typescript
import type { Module } from './types';
import {
    CheckCircle, Server, Shield, AlertTriangle, BookOpen,
    Terminal, Link as LinkIcon, Workflow, Cpu, Database,
    Copy, Users, Rocket, Search, Mail
} from 'lucide-react';

const INSTRUCTION_BASE = '/openclaw-mastery/instructions/';

export const MODULES_DATA: Module[] = [
    {
        id: 'm1',
        title: "Module 1: Install and Secure Your Lobster",
        shortTitle: "Module 1: Install",
        description: "The three eras of AI tools and where OpenClaw sits. Learn the approach this course takes to keep you safe.",
        icon: Server,
        phases: [
            {
                id: 'deploy',
                title: 'Deploy',
                icon: Server,
                steps: [
                    {
                        id: 'm1-deploy-1',
                        title: 'Get Your API Key',
                        learn: 'OpenClaw needs an LLM API key to think. This is the brain behind your Claw. You will paste this key into your Hostinger dashboard during VPS setup.',
                        do: {
                            prompt: 'Read the instruction at ' + INSTRUCTION_BASE + 'day01-deploy.md and follow the steps for getting an API key and launching the VPS.',
                            instructionUrl: INSTRUCTION_BASE + 'day01-deploy.md',
                        },
                        verify: {
                            checks: [
                                {
                                    id: 'm1-d1-c1',
                                    label: 'Claw responds in the web chat',
                                    verifyPrompt: 'Check: can you respond to this message? Respond ONLY with: {"checks":[{"id":"m1-d1-c1","pass":true,"detail":"Claw is responsive"}]}',
                                    failHint: 'The gateway may need a restart. Go to your Hostinger dashboard and restart the VPS, or wait a minute and try again.',
                                    fixPrompt: 'Run: openclaw gateway restart',
                                },
                            ],
                        },
                    },
                    {
                        id: 'm1-deploy-2',
                        title: 'Give Your Claw a Name',
                        learn: 'A name makes your Claw feel like a collaborator, not a tool. It also helps when you add more agents later — each one needs a distinct identity.',
                        do: {
                            prompt: 'I want to give you a name. What name would you like? After we decide, update your configuration to use that name.',
                            requiresInput: {
                                label: 'What would you like to name your Claw?',
                                placeholder: 'e.g., Luna, Atlas, Echo...',
                                storeAs: 'clawName',
                            },
                        },
                        verify: {
                            checks: [
                                {
                                    id: 'm1-d2-c1',
                                    label: 'Claw has a name',
                                    verifyPrompt: 'What is your name? Respond ONLY with: {"checks":[{"id":"m1-d2-c1","pass":true,"detail":"My name is [NAME]"}]} — if you do not have a name set, respond with pass:false.',
                                    failHint: 'Ask your Claw to set a name in its configuration.',
                                },
                            ],
                        },
                    },
                ],
            },
            {
                id: 'security',
                title: 'Security',
                icon: Shield,
                steps: [
                    {
                        id: 'm1-sec-1',
                        title: 'Run the Security Audit',
                        learn: 'OpenClaw ships with a built-in security audit that checks your gateway, credentials, and network exposure. Running this first gives you a baseline before you start hardening.',
                        do: {
                            prompt: 'Read the instruction at ' + INSTRUCTION_BASE + 'day01-security.md and run the security audit. Report each check as PASS, FAIL, or EXPECTED.',
                            instructionUrl: INSTRUCTION_BASE + 'day01-security.md',
                        },
                        verify: {
                            checks: [
                                {
                                    id: 'm1-s1-c1',
                                    label: 'Security audit shows no critical failures',
                                    verifyPrompt: 'Run the openclaw security audit and report results. Respond ONLY with: {"checks":[{"id":"m1-s1-c1","pass":BOOL,"detail":"SUMMARY"}]} where pass is true if no CRITICAL failures exist.',
                                    failHint: 'Some fixes require a gateway restart before they take effect. Ask the Claw to restart with "openclaw gateway restart" and re-run the audit.',
                                    fixPrompt: 'Run openclaw gateway restart, then re-run the security audit and fix any critical failures.',
                                },
                            ],
                        },
                    },
                    {
                        id: 'm1-sec-2',
                        title: 'Bind Gateway to Localhost',
                        learn: 'Your gateway listens on 0.0.0.0 by default, meaning any device on the network can reach it. Binding to 127.0.0.1 restricts access to localhost only. This is critical because your gateway token is the only thing between the internet and your Claw.',
                        do: {
                            prompt: 'Bind the OpenClaw gateway to 127.0.0.1 with token auth enabled, then restart the gateway.',
                        },
                        verify: {
                            checks: [
                                {
                                    id: 'm1-s2-c1',
                                    label: 'Gateway bound to 127.0.0.1 with token auth enabled',
                                    verifyPrompt: 'Check your gateway configuration. Is it bound to 127.0.0.1 with token auth enabled? Respond ONLY with: {"checks":[{"id":"m1-s2-c1","pass":BOOL,"detail":"DETAILS"}]}',
                                    failHint: 'The gateway config file may need manual editing. Check ~/.openclaw/gateway.yml for the bind address.',
                                    fixPrompt: 'Update the gateway config to bind to 127.0.0.1 with token auth enabled, then restart with openclaw gateway restart.',
                                },
                            ],
                        },
                    },
                    {
                        id: 'm1-sec-3',
                        title: 'Lock Down Policies and Credentials',
                        learn: 'DM and group policies control who can message your Claw through connected channels. Restrictive policies prevent strangers from accessing your agent. Credential file permissions prevent other users on the VPS from reading your secrets.',
                        do: {
                            prompt: 'Set DM and group policies to restrictive. Ensure ~/.openclaw/credentials has permissions 700. Set heartbeat to 0m. Disable web search.',
                        },
                        verify: {
                            checks: [
                                {
                                    id: 'm1-s3-c1',
                                    label: 'DM and group policies are restrictive',
                                    verifyPrompt: 'Check DM and group message policies. Are they set to restrictive/deny-by-default? Respond ONLY with: {"checks":[{"id":"m1-s3-c1","pass":BOOL,"detail":"DETAILS"}]}',
                                    failHint: 'Ask your Claw to update the channel policies to deny-by-default.',
                                    fixPrompt: 'Set DM policy and group policy to restrictive/deny-by-default.',
                                },
                                {
                                    id: 'm1-s3-c2',
                                    label: '~/.openclaw/credentials has permissions 700',
                                    verifyPrompt: 'Check permissions on ~/.openclaw/credentials. Are they 700 (owner-only)? Respond ONLY with: {"checks":[{"id":"m1-s3-c2","pass":BOOL,"detail":"DETAILS"}]}',
                                    failHint: 'Run: chmod 700 ~/.openclaw/credentials',
                                    fixPrompt: 'Run: chmod 700 ~/.openclaw/credentials',
                                },
                                {
                                    id: 'm1-s3-c3',
                                    label: 'Heartbeat set to 0m',
                                    verifyPrompt: 'What is the current heartbeat interval? Respond ONLY with: {"checks":[{"id":"m1-s3-c3","pass":BOOL,"detail":"DETAILS"}]} where pass is true if heartbeat is 0m or disabled.',
                                    failHint: 'Ask your Claw to set the heartbeat interval to 0m.',
                                    fixPrompt: 'Set the heartbeat interval to 0m.',
                                },
                                {
                                    id: 'm1-s3-c4',
                                    label: 'Web search is disabled',
                                    verifyPrompt: 'Is web search currently enabled or disabled? Respond ONLY with: {"checks":[{"id":"m1-s3-c4","pass":BOOL,"detail":"DETAILS"}]} where pass is true if web search is disabled.',
                                    failHint: 'Ask your Claw to disable web search.',
                                    fixPrompt: 'Disable web search.',
                                },
                            ],
                        },
                    },
                ],
            },
            {
                id: 'validation',
                title: 'Validation',
                icon: CheckCircle,
                steps: [], // Empty: ValidationDashboard renders instead
            },
        ],
    },
    // Modules 2-10 will be migrated in Task 10. For now, they use a compatibility
    // wrapper that converts the old format to the new Phase/Step structure.
    // See the legacyToModule() function below.
];
```

Add a compatibility wrapper at the bottom of `modules.ts` for modules 2-10. This lets the app work with both old and new format modules during migration:

```typescript
// Legacy module data for modules 2-10 (to be migrated individually)
const LEGACY_MODULES = [
    // ... paste existing modules 2-10 here unchanged ...
];

function legacyToModule(legacy: any): Module {
    const phases: Phase[] = legacy.sections
        .filter((s: any) => s.id !== 'checklist' && s.id !== 'troubleshooting')
        .map((s: any) => ({
            id: s.id,
            title: s.title.replace('Phase ', '').replace('Module ', ''),
            icon: s.icon,
            steps: [{
                id: `${legacy.id}-${s.id}-legacy`,
                title: s.title,
                learn: 'Follow the instructions below to complete this phase.',
                do: { prompt: 'Follow the instructions for this phase.' },
            }],
        }));

    // Add validation phase with checks from legacy checklistItems
    phases.push({
        id: 'validation',
        title: 'Validation',
        icon: CheckCircle,
        steps: [],
    });

    return {
        id: legacy.id,
        title: legacy.title.replace(/^Day \d+/, (m: string) => 'Module' + m.slice(3)),
        shortTitle: legacy.shortTitle.replace(/^Day \d+/, (m: string) => 'Module' + m.slice(3)),
        description: legacy.description,
        icon: legacy.icon,
        phases,
    };
}

// Append legacy modules after the fully migrated ones
LEGACY_MODULES.forEach(m => MODULES_DATA.push(legacyToModule(m)));
```

- [ ] **Step 3: Verify the build compiles**

Run: `cd "/Users/siddarth/Openclaw Mastery" && npx vite build 2>&1 | tail -5`

Expected: Build succeeds (there will be unused import warnings, that's fine).

- [ ] **Step 4: Commit**

```bash
git add src/data/types.ts src/data/modules.ts
git commit -m "feat: add type system and restructure Module 1 data model"
```

---

## Task 2: OpenClaw API Client

**Files:**
- Create: `src/api/openClawClient.ts`

- [ ] **Step 1: Create the API client**

Create `src/api/openClawClient.ts`:

```typescript
import type { ConnectionState } from '../data/types';

interface PairResponse {
  token: string;
  clawName: string;
}

interface VerifyCheckResult {
  id: string;
  pass: boolean;
  detail: string;
}

interface VerifyResponse {
  checks: VerifyCheckResult[];
}

export function createOpenClawClient(connection: ConnectionState) {
  const { instanceUrl, sessionToken } = connection;

  const baseUrl = instanceUrl.replace(/\/+$/, '');

  async function request(endpoint: string, body?: object): Promise<Response> {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      throw new Error(`OpenClaw API error: ${res.status} ${res.statusText}`);
    }
    return res;
  }

  return {
    async sendMessage(message: string): Promise<string> {
      const res = await request('/api/chat', { message });
      const data = await res.json();
      return data.response ?? data.message ?? JSON.stringify(data);
    },

    async ping(): Promise<boolean> {
      try {
        await request('/api/health');
        return true;
      } catch {
        return false;
      }
    },

    async sendVerify(prompt: string): Promise<VerifyResponse | null> {
      const response = await this.sendMessage(prompt);
      try {
        const parsed = JSON.parse(response);
        if (parsed.checks && Array.isArray(parsed.checks)) {
          return parsed as VerifyResponse;
        }
      } catch {
        // Not valid JSON — caller handles fallback
      }
      return null;
    },
  };
}

export async function pairWithInstance(
  instanceUrl: string,
  code: string,
): Promise<PairResponse> {
  const baseUrl = instanceUrl.replace(/\/+$/, '');
  const res = await fetch(`${baseUrl}/api/pair`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    throw new Error(
      res.status === 401
        ? 'Invalid or expired pairing code. Generate a new one with /pair in OpenClaw.'
        : `Pairing failed: ${res.status} ${res.statusText}`,
    );
  }
  return res.json();
}
```

- [ ] **Step 2: Verify build**

Run: `cd "/Users/siddarth/Openclaw Mastery" && npx vite build 2>&1 | tail -5`

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/api/openClawClient.ts
git commit -m "feat: add OpenClaw API client (pair, sendMessage, verify, ping)"
```

---

## Task 3: Connection Hook and State

**Files:**
- Create: `src/hooks/useConnection.ts`

- [ ] **Step 1: Create the connection hook**

Create `src/hooks/useConnection.ts`:

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import type { ConnectionState } from '../data/types';
import { createOpenClawClient, pairWithInstance } from '../api/openClawClient';

const STORAGE_KEY = 'openclawConnection';
const HEALTH_INTERVAL_MS = 60_000;

function loadConnection(): ConnectionState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ConnectionState) : null;
  } catch {
    return null;
  }
}

function saveConnection(state: ConnectionState | null) {
  try {
    if (state) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // quota exceeded
  }
}

export function useConnection() {
  const [connection, setConnection] = useState<ConnectionState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isPairing, setIsPairing] = useState(false);
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const healthRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Rehydrate on mount
  useEffect(() => {
    const saved = loadConnection();
    if (saved) {
      setConnection(saved);
    }
    setIsLoaded(true);
  }, []);

  // Health check loop
  useEffect(() => {
    if (!connection) {
      setIsConnected(false);
      return;
    }

    const client = createOpenClawClient(connection);

    const check = async () => {
      const alive = await client.ping();
      setIsConnected(alive);
    };

    check(); // immediate check
    healthRef.current = setInterval(check, HEALTH_INTERVAL_MS);

    return () => {
      if (healthRef.current) clearInterval(healthRef.current);
    };
  }, [connection]);

  const pair = useCallback(async (instanceUrl: string, code: string) => {
    setIsPairing(true);
    setPairingError(null);
    try {
      const { token, clawName } = await pairWithInstance(instanceUrl, code);
      const state: ConnectionState = {
        instanceUrl,
        sessionToken: token,
        clawName,
        pairedAt: new Date().toISOString(),
      };
      setConnection(state);
      saveConnection(state);
      setIsConnected(true);
    } catch (err) {
      setPairingError(err instanceof Error ? err.message : 'Pairing failed');
    } finally {
      setIsPairing(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setConnection(null);
    setIsConnected(false);
    saveConnection(null);
  }, []);

  return {
    connection,
    isConnected,
    isPairing,
    pairingError,
    isLoaded,
    pair,
    disconnect,
  };
}
```

- [ ] **Step 2: Verify build**

Run: `cd "/Users/siddarth/Openclaw Mastery" && npx vite build 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useConnection.ts
git commit -m "feat: add useConnection hook with pairing and health checks"
```

---

## Task 4: Step Progress Hook

**Files:**
- Create: `src/hooks/useStepProgress.ts`

- [ ] **Step 1: Create the step progress hook**

Create `src/hooks/useStepProgress.ts`:

```typescript
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
```

- [ ] **Step 2: Verify build**

Run: `cd "/Users/siddarth/Openclaw Mastery" && npx vite build 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useStepProgress.ts
git commit -m "feat: add useStepProgress hook with verify results and nav state"
```

---

## Task 5: Chat Messages Hook

**Files:**
- Create: `src/hooks/useChatMessages.ts`

- [ ] **Step 1: Create the chat messages hook**

Create `src/hooks/useChatMessages.ts`:

```typescript
import { useState, useCallback } from 'react';
import type { ChatMessage, ConnectionState } from '../data/types';
import { createOpenClawClient } from '../api/openClawClient';

let messageIdCounter = 0;
function nextId(): string {
  return `msg-${++messageIdCounter}-${Date.now()}`;
}

export function useChatMessages(connection: ConnectionState | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setMessages(prev => [
      ...prev,
      { ...msg, id: nextId(), timestamp: Date.now() },
    ]);
  }, []);

  const sendMessage = useCallback(
    async (
      content: string,
      options?: { auto?: boolean; stepTitle?: string; hidden?: boolean },
    ): Promise<string | null> => {
      if (!connection) return null;

      const client = createOpenClawClient(connection);

      // Add user message to chat (unless hidden)
      if (!options?.hidden) {
        addMessage({
          role: 'user',
          content,
          auto: options?.auto,
          stepTitle: options?.stepTitle,
        });
      }

      setIsSending(true);
      try {
        const response = await client.sendMessage(content);

        // Add assistant response (unless the caller hid the request)
        if (!options?.hidden) {
          addMessage({ role: 'assistant', content: response });
        }

        return response;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to reach your Claw';
        if (!options?.hidden) {
          addMessage({ role: 'assistant', content: `**Error:** ${errorMsg}` });
        }
        return null;
      } finally {
        setIsSending(false);
      }
    },
    [connection, addMessage],
  );

  const sendVerify = useCallback(
    async (prompt: string): Promise<Array<{ id: string; pass: boolean; detail: string }> | null> => {
      if (!connection) return null;

      const client = createOpenClawClient(connection);
      setIsSending(true);

      try {
        const result = await client.sendVerify(prompt);
        if (result) return result.checks;

        // JSON parse failed — show raw response in chat as fallback
        const raw = await client.sendMessage(prompt);
        addMessage({ role: 'assistant', content: raw });
        return null;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Verification failed';
        addMessage({ role: 'assistant', content: `**Verification error:** ${errorMsg}` });
        return null;
      } finally {
        setIsSending(false);
      }
    },
    [connection, addMessage],
  );

  const clearMessages = useCallback(() => setMessages([]), []);

  return {
    messages,
    isSending,
    sendMessage,
    sendVerify,
    clearMessages,
  };
}
```

- [ ] **Step 2: Verify build**

Run: `cd "/Users/siddarth/Openclaw Mastery" && npx vite build 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useChatMessages.ts
git commit -m "feat: add useChatMessages hook with send, verify, and hidden messages"
```

---

## Task 6: Connection Components (PairingFlow + Indicator)

**Files:**
- Create: `src/components/connection/PairingFlow.tsx`
- Create: `src/components/connection/ConnectionIndicator.tsx`

- [ ] **Step 1: Create ConnectionIndicator**

Create `src/components/connection/ConnectionIndicator.tsx`:

```typescript
import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionIndicatorProps {
  isConnected: boolean;
  clawName?: string;
  onClickConnect: () => void;
  onClickDisconnect: () => void;
}

export const ConnectionIndicator = ({
  isConnected,
  clawName,
  onClickConnect,
  onClickDisconnect,
}: ConnectionIndicatorProps) => {
  if (isConnected && clawName) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-medium text-emerald-800 truncate">{clawName}</span>
        <button
          onClick={onClickDisconnect}
          className="text-xs text-emerald-600 hover:text-emerald-800 ml-auto"
          title="Disconnect"
        >
          <WifiOff size={12} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onClickConnect}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 transition-colors w-full"
    >
      <div className="w-2 h-2 rounded-full bg-red-400" />
      <span className="text-xs font-medium text-red-700">Connect Claw</span>
      <Wifi size={12} className="text-red-400 ml-auto" />
    </button>
  );
};
```

- [ ] **Step 2: Create PairingFlow**

Create `src/components/connection/PairingFlow.tsx`:

```typescript
import { useState } from 'react';
import { X, Loader2, Terminal } from 'lucide-react';

interface PairingFlowProps {
  onPair: (instanceUrl: string, code: string) => Promise<void>;
  isPairing: boolean;
  pairingError: string | null;
  onClose: () => void;
}

export const PairingFlow = ({
  onPair,
  isPairing,
  pairingError,
  onClose,
}: PairingFlowProps) => {
  const [url, setUrl] = useState('');
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url && code) {
      onPair(url, code);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Connect Your Claw</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Instructions */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-start gap-3">
            <Terminal size={20} className="text-openclaw-red mt-0.5 flex-shrink-0" />
            <div className="text-sm text-slate-600">
              <p className="font-medium text-slate-800 mb-1">Step 1: Generate a pairing code</p>
              <p>
                Open your OpenClaw web chat and type{' '}
                <code className="bg-slate-200 px-1.5 py-0.5 rounded text-xs font-mono">/pair</code>.
                You'll get a 6-digit code and your instance URL.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Instance URL
            </label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://your-claw.example.com"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-openclaw-red/30 focus:border-openclaw-red"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Pairing Code
            </label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono tracking-widest text-center text-lg focus:outline-none focus:ring-2 focus:ring-openclaw-red/30 focus:border-openclaw-red"
            />
          </div>

          {pairingError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {pairingError}
            </p>
          )}

          <button
            type="submit"
            disabled={isPairing || !url || !code}
            className="w-full py-2.5 bg-openclaw-red text-white rounded-lg font-semibold text-sm hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isPairing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Verify build**

Run: `cd "/Users/siddarth/Openclaw Mastery" && npx vite build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add src/components/connection/
git commit -m "feat: add PairingFlow modal and ConnectionIndicator"
```

---

## Task 7: Step Engine Components

**Files:**
- Create: `src/components/steps/StepLearn.tsx`
- Create: `src/components/steps/StepDo.tsx`
- Create: `src/components/steps/CheckResult.tsx`
- Create: `src/components/steps/StepVerify.tsx`
- Create: `src/components/steps/StepProgress.tsx`
- Create: `src/components/steps/StepEngine.tsx`

- [ ] **Step 1: Create StepLearn**

Create `src/components/steps/StepLearn.tsx`:

```typescript
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BookOpen } from 'lucide-react';

interface StepLearnProps {
  content: string;
}

export const StepLearn = ({ content }: StepLearnProps) => (
  <div className="flex gap-3">
    <BookOpen size={18} className="text-slate-400 mt-0.5 flex-shrink-0" />
    <div className="md-prose text-sm">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  </div>
);
```

- [ ] **Step 2: Create StepDo**

Create `src/components/steps/StepDo.tsx`:

```typescript
import { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { CopyButton } from '../ui/CopyButton';

interface StepDoProps {
  prompt: string;
  instructionUrl?: string;
  requiresInput?: {
    label: string;
    placeholder: string;
    storeAs: string;
  };
  isConnected: boolean;
  isSending: boolean;
  userInputs: Record<string, string>;
  onExecute: (fullPrompt: string) => void;
  onSaveInput: (key: string, value: string) => void;
}

export const StepDo = ({
  prompt,
  instructionUrl,
  requiresInput,
  isConnected,
  isSending,
  userInputs,
  onExecute,
  onSaveInput,
}: StepDoProps) => {
  const [inputValue, setInputValue] = useState(
    requiresInput ? (userInputs[requiresInput.storeAs] ?? '') : '',
  );

  const buildFullPrompt = (): string => {
    let full = prompt;
    if (instructionUrl) {
      full = `Read the instruction at ${instructionUrl} and follow it. ${prompt}`;
    }
    if (requiresInput && inputValue) {
      full = `${full} The user's answer: ${inputValue}`;
    }
    return full;
  };

  const handleExecute = () => {
    if (requiresInput && inputValue) {
      onSaveInput(requiresInput.storeAs, inputValue);
    }
    onExecute(buildFullPrompt());
  };

  return (
    <div className="space-y-3">
      {/* User input field if required */}
      {requiresInput && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {requiresInput.label}
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder={requiresInput.placeholder}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-openclaw-red/30 focus:border-openclaw-red"
          />
        </div>
      )}

      {/* Prompt display + action */}
      <div className="rounded-xl border-2 border-openclaw-red/20 bg-gradient-to-br from-red-50 to-rose-50 shadow-sm overflow-hidden">
        <div className="px-4 py-3 text-sm text-slate-700 font-mono leading-relaxed">
          {prompt}
        </div>
        <div className="flex items-center justify-end gap-2 px-4 py-2.5 bg-openclaw-red/10 border-t border-openclaw-red/15">
          {isConnected ? (
            <button
              onClick={handleExecute}
              disabled={isSending || (requiresInput && !inputValue)}
              className="flex items-center gap-2 px-4 py-2 bg-openclaw-red text-white rounded-lg text-sm font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play size={14} />
                  Execute
                </>
              )}
            </button>
          ) : (
            <CopyButton text={buildFullPrompt()} label="Copy Prompt" />
          )}
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Create CheckResult**

Create `src/components/steps/CheckResult.tsx`:

```typescript
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
```

- [ ] **Step 4: Create StepVerify**

Create `src/components/steps/StepVerify.tsx`:

```typescript
import { useState } from 'react';
import { ShieldCheck, Loader2, SkipForward } from 'lucide-react';
import type { CheckItem, VerifyResult } from '../../data/types';
import { CheckResult } from './CheckResult';

interface StepVerifyProps {
  checks: CheckItem[];
  results: Record<string, VerifyResult> | undefined;
  isConnected: boolean;
  isSending: boolean;
  onRunChecks: () => void;
  onFix: (fixPrompt: string) => void;
  onRecheckSingle: (checkId: string) => void;
  onSkip: () => void;
}

export const StepVerify = ({
  checks,
  results,
  isConnected,
  isSending,
  onRunChecks,
  onFix,
  onRecheckSingle,
  onSkip,
}: StepVerifyProps) => {
  const hasResults = results && Object.keys(results).length > 0;
  const allPassed = hasResults && checks.every(c => results[c.id]?.pass === true);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-slate-400" />
          <span className="text-sm font-semibold text-slate-700">Verify</span>
        </div>
        <div className="flex gap-2">
          {isConnected && (
            <button
              onClick={onRunChecks}
              disabled={isSending}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              {isSending ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Checking...
                </>
              ) : (
                'Check'
              )}
            </button>
          )}
          {!allPassed && (
            <button
              onClick={onSkip}
              className="flex items-center gap-1 px-2 py-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
              title="Skip verification"
            >
              <SkipForward size={12} />
              Skip
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {checks.map(check => (
          <CheckResult
            key={check.id}
            label={check.label}
            pass={results?.[check.id]?.pass ?? null}
            detail={results?.[check.id]?.detail ?? ''}
            failHint={check.failHint}
            fixPrompt={check.fixPrompt}
            isConnected={isConnected}
            isSending={isSending}
            onFix={check.fixPrompt ? () => onFix(check.fixPrompt!) : undefined}
            onRecheck={() => onRecheckSingle(check.id)}
          />
        ))}
      </div>

      {!isConnected && (
        <p className="text-xs text-slate-400 italic">
          Connect your Claw to auto-verify, or check these manually.
        </p>
      )}
    </div>
  );
};
```

- [ ] **Step 5: Create StepProgress**

Create `src/components/steps/StepProgress.tsx`:

```typescript
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
```

- [ ] **Step 6: Create StepEngine**

Create `src/components/steps/StepEngine.tsx`:

```typescript
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
  getVerifyResults: (stepId: string) => Record<string, VerifyResult> | undefined;
  isStepComplete: (stepId: string) => boolean;
  onExecute: (prompt: string, stepTitle: string) => void;
  onRunChecks: (stepId: string, checks: Array<{ id: string; verifyPrompt: string }>) => void;
  onFix: (fixPrompt: string, stepId: string, checks: Array<{ id: string; verifyPrompt: string }>) => void;
  onRecheckSingle: (stepId: string, checkId: string, verifyPrompt: string) => void;
  onSkip: (stepId: string) => void;
  onSaveInput: (key: string, value: string) => void;
  onNavigateStep: (index: number) => void;
}

export const StepEngine = ({
  steps,
  currentIndex,
  isConnected,
  isSending,
  userInputs,
  getVerifyResults,
  isStepComplete,
  onExecute,
  onRunChecks,
  onFix,
  onRecheckSingle,
  onSkip,
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
```

- [ ] **Step 7: Verify build**

Run: `cd "/Users/siddarth/Openclaw Mastery" && npx vite build 2>&1 | tail -5`

- [ ] **Step 8: Commit**

```bash
git add src/components/steps/
git commit -m "feat: add step engine components (learn, do, verify, progress)"
```

---

## Task 8: Chat Panel Components

**Files:**
- Create: `src/components/chat/ChatMessage.tsx`
- Create: `src/components/chat/ChatPanel.tsx`

- [ ] **Step 1: Create ChatMessage**

Create `src/components/chat/ChatMessage.tsx`:

```typescript
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  auto?: boolean;
  stepTitle?: string;
}

export const ChatMessage = ({ role, content, auto, stepTitle }: ChatMessageProps) => {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm ${
          isUser
            ? 'bg-openclaw-red text-white rounded-br-sm'
            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
        }`}
      >
        {isUser && auto && stepTitle && (
          <div className={`text-xs mb-1 ${isUser ? 'text-red-200' : 'text-slate-400'}`}>
            (auto, {stepTitle})
          </div>
        )}
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="md-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Create ChatPanel**

Create `src/components/chat/ChatPanel.tsx`:

```typescript
import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '../../data/types';
import { ChatMessage } from './ChatMessage';

interface ChatPanelProps {
  messages: ChatMessageType[];
  isSending: boolean;
  isConnected: boolean;
  clawName?: string;
  onSendMessage: (content: string) => void;
  onOpenPairing: () => void;
}

export const ChatPanel = ({
  messages,
  isSending,
  isConnected,
  clawName,
  onSendMessage,
  onOpenPairing,
}: ChatPanelProps) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isSending) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <MessageSquare size={32} className="text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-500 mb-1">Chat with your Claw</p>
        <p className="text-xs text-slate-400 mb-4">
          Connect your OpenClaw instance to unlock live chat, execute buttons, and auto-verification.
        </p>
        <button
          onClick={onOpenPairing}
          className="px-4 py-2 bg-openclaw-red text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
        >
          Connect Your Claw
        </button>
      </div>
    );
  }

  const visibleMessages = messages.filter(m => !m.hidden);

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {visibleMessages.length === 0 && (
          <div className="text-center text-slate-400 text-xs mt-8">
            <p>Connected to {clawName}.</p>
            <p className="mt-1">Execute a step or type a message to start.</p>
          </div>
        )}
        {visibleMessages.map(msg => (
          <ChatMessage
            key={msg.id}
            role={msg.role}
            content={msg.content}
            auto={msg.auto}
            stepTitle={msg.stepTitle}
          />
        ))}
        {isSending && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 rounded-bl-sm">
              <Loader2 size={16} className="animate-spin text-slate-400" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-openclaw-red/30 focus:border-openclaw-red"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="px-3 py-2 bg-openclaw-red text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};
```

- [ ] **Step 3: Verify build**

Run: `cd "/Users/siddarth/Openclaw Mastery" && npx vite build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add src/components/chat/
git commit -m "feat: add ChatPanel and ChatMessage components"
```

---

## Task 9: Validation Dashboard and Mobile Gate

**Files:**
- Create: `src/components/validation/ValidationDashboard.tsx`
- Create: `src/components/layout/MobileGate.tsx`

- [ ] **Step 1: Create ValidationDashboard**

Create `src/components/validation/ValidationDashboard.tsx`:

```typescript
import { ShieldCheck, Loader2 } from 'lucide-react';
import { CheckResult } from '../steps/CheckResult';

interface DashboardCheck {
  checkId: string;
  label: string;
  pass: boolean | null;
  detail: string;
  phaseTitle: string;
  failHint?: string;
  fixPrompt?: string;
}

interface ValidationDashboardProps {
  moduleTitle: string;
  total: number;
  passed: number;
  checks: DashboardCheck[];
  isConnected: boolean;
  isSending: boolean;
  onValidateAll: () => void;
  onFix: (fixPrompt: string) => void;
  onRecheck: (checkId: string) => void;
}

export const ValidationDashboard = ({
  moduleTitle,
  total,
  passed,
  checks,
  isConnected,
  isSending,
  onValidateAll,
  onFix,
  onRecheck,
}: ValidationDashboardProps) => {
  // Group checks by phase
  const byPhase = new Map<string, DashboardCheck[]>();
  for (const check of checks) {
    const list = byPhase.get(check.phaseTitle) ?? [];
    list.push(check);
    byPhase.set(check.phaseTitle, list);
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck size={22} className="text-openclaw-red" />
              Validation Dashboard
            </h2>
            <p className="text-sm text-slate-500 mt-1">{moduleTitle}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-openclaw-red">
              {passed}/{total}
            </div>
            <p className="text-xs text-slate-400">checks passed</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-6">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              passed === total ? 'bg-emerald-500' : 'bg-openclaw-red'
            }`}
            style={{ width: total > 0 ? `${(passed / total) * 100}%` : '0%' }}
          />
        </div>

        {/* Checks by phase */}
        {Array.from(byPhase.entries()).map(([phaseTitle, phaseChecks]) => {
          const phasePassed = phaseChecks.filter(c => c.pass === true).length;
          return (
            <div key={phaseTitle} className="mb-5 last:mb-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-700">Phase: {phaseTitle}</h3>
                <span className="text-xs font-medium text-slate-400">
                  {phasePassed}/{phaseChecks.length}
                  {phasePassed === phaseChecks.length ? ' ✅' : ''}
                </span>
              </div>
              <div className="space-y-2">
                {phaseChecks.map(check => (
                  <CheckResult
                    key={check.checkId}
                    label={check.label}
                    pass={check.pass}
                    detail={check.detail}
                    failHint={check.failHint}
                    fixPrompt={check.fixPrompt}
                    isConnected={isConnected}
                    isSending={isSending}
                    onFix={check.fixPrompt ? () => onFix(check.fixPrompt!) : undefined}
                    onRecheck={() => onRecheck(check.checkId)}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          {isConnected && (
            <button
              onClick={onValidateAll}
              disabled={isSending}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              {isSending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Validating...
                </>
              ) : (
                'Validate All'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Create MobileGate**

Create `src/components/layout/MobileGate.tsx`:

```typescript
import { Monitor } from 'lucide-react';

interface MobileGateProps {
  onContinueAnyway: () => void;
}

export const MobileGate = ({ onContinueAnyway }: MobileGateProps) => (
  <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
    <div className="max-w-sm text-center">
      <Monitor size={48} className="text-slate-300 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-slate-900 mb-3">
        Best on a Larger Screen
      </h2>
      <p className="text-sm text-slate-500 mb-6 leading-relaxed">
        This course involves configuring a VPS, running terminal commands, and
        working alongside your OpenClaw instance. Please open on a laptop or
        desktop for the best experience.
      </p>
      <button
        onClick={onContinueAnyway}
        className="text-sm text-slate-400 hover:text-slate-600 underline underline-offset-2 transition-colors"
      >
        Continue anyway
      </button>
    </div>
  </div>
);
```

- [ ] **Step 3: Verify build**

Run: `cd "/Users/siddarth/Openclaw Mastery" && npx vite build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add src/components/validation/ src/components/layout/MobileGate.tsx
git commit -m "feat: add ValidationDashboard and MobileGate components"
```

---

## Task 10: Rewire App.tsx (Three-Column Layout + Integration)

This is the largest task. It replaces the existing App.tsx with the three-column layout and wires all the new components together.

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Update index.css with three-column grid**

Add to the end of `src/index.css`:

```css
/* ── Three-column app layout ─────────────────────────────────────────── */
.app-layout {
  display: grid;
  grid-template-columns: 240px 1fr 320px;
  height: 100vh;
  overflow: hidden;
}

@media (max-width: 1023px) {
  .app-layout {
    grid-template-columns: 200px 1fr 280px;
  }
}

.app-sidebar {
  overflow-y: auto;
  border-right: 1px solid #e2e8f0;
}

.app-main {
  overflow-y: auto;
}

.app-chat {
  overflow: hidden;
  border-left: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
}
```

- [ ] **Step 2: Update Sidebar for phases**

Rewrite `src/components/layout/Sidebar.tsx` to use the new Module/Phase types. The sidebar shows:
- Logo header
- Module dropdown (same as before but with "Module N" titles)
- Phase list (instead of section list)
- Connection indicator
- Progress section

Replace the entire file content:

```typescript
import { useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, GraduationCap } from 'lucide-react';
import { MODULES_DATA } from '../../data/modules';
import type { Module } from '../../data/types';
import { LogoIcon } from '../ui/LogoIcon';
import { ConnectionIndicator } from '../connection/ConnectionIndicator';

interface SidebarProps {
  moduleDropdownOpen: boolean;
  setModuleDropdownOpen: (open: boolean) => void;
  activeModuleId: string;
  activePhaseId: string;
  onModuleChange: (moduleId: string) => void;
  onPhaseChange: (phaseId: string) => void;
  currentModule: Module;
  isConnected: boolean;
  clawName?: string;
  onOpenPairing: () => void;
  onDisconnect: () => void;
  completedModulesCount: number;
}

export const Sidebar = ({
  moduleDropdownOpen,
  setModuleDropdownOpen,
  activeModuleId,
  activePhaseId,
  onModuleChange,
  onPhaseChange,
  currentModule,
  isConnected,
  clawName,
  onOpenPairing,
  onDisconnect,
  completedModulesCount,
}: SidebarProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moduleDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setModuleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [moduleDropdownOpen, setModuleDropdownOpen]);

  return (
    <div className="app-sidebar flex flex-col bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 p-6 border-b border-slate-200">
        <LogoIcon className="w-8 h-8 flex-shrink-0" />
        <span className="text-xl tracking-tight text-slate-900 flex whitespace-nowrap">
          <span className="font-extrabold">OpenClaw</span>
          <span className="font-light ml-1 text-slate-500">Mastery</span>
        </span>
      </div>

      {/* Connection */}
      <div className="px-4 pt-4">
        <ConnectionIndicator
          isConnected={isConnected}
          clawName={clawName}
          onClickConnect={onOpenPairing}
          onClickDisconnect={onDisconnect}
        />
      </div>

      {/* Module Selector */}
      <div className="p-4 border-b border-slate-200 relative" ref={dropdownRef}>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
          Module
        </div>
        <button
          onClick={() => setModuleDropdownOpen(!moduleDropdownOpen)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-left shadow-sm hover:border-openclaw-red transition-colors"
        >
          <div className="flex items-center gap-2 truncate">
            <currentModule.icon size={16} className="text-openclaw-red flex-shrink-0" />
            <span className="font-medium text-sm truncate text-slate-900">
              {currentModule.shortTitle}
            </span>
          </div>
          <ChevronDown
            size={16}
            className={`text-slate-400 transition-transform ${moduleDropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {moduleDropdownOpen && (
          <div className="absolute top-full left-4 right-4 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-[60vh] overflow-y-auto py-1">
            {MODULES_DATA.map(mod => (
              <button
                key={mod.id}
                onClick={() => {
                  onModuleChange(mod.id);
                  setModuleDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-3 hover:bg-slate-50 transition-colors
                  ${activeModuleId === mod.id ? 'bg-red-50 text-openclaw-red font-medium' : 'text-slate-700'}
                `}
              >
                <mod.icon
                  size={16}
                  className={activeModuleId === mod.id ? 'text-openclaw-red' : 'text-slate-400'}
                />
                <span className="truncate">{mod.shortTitle}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Phase list */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-3 mt-2">
          Phases
        </div>
        {currentModule.phases.map(phase => {
          const Icon = phase.icon;
          const isActive = activePhaseId === phase.id;
          return (
            <button
              key={phase.id}
              onClick={() => onPhaseChange(phase.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left text-sm font-medium
                ${isActive
                  ? 'bg-openclaw-red text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
              `}
            >
              <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
              {phase.title}
              {isActive && <ChevronRight size={16} className="ml-auto opacity-50" />}
            </button>
          );
        })}
      </nav>

      {/* Course progress */}
      <div className="p-4 border-t border-slate-200">
        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <GraduationCap size={16} className="text-emerald-600 flex-shrink-0" />
              <div className="text-sm font-semibold text-emerald-900">Progress</div>
            </div>
            <div className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              {completedModulesCount}/{MODULES_DATA.length}
            </div>
          </div>
          <div className="w-full h-2.5 bg-emerald-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${Math.round((completedModulesCount / MODULES_DATA.length) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Rewrite App.tsx**

Replace the entire `src/App.tsx` with the three-column layout that wires everything together:

```typescript
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
    connection, isConnected, isPairing, pairingError, isLoaded: connLoaded,
    pair, disconnect,
  } = useConnection();

  // ── Progress & Nav ──────────────────────────────────────────────────
  const {
    nav, userInputs, isLoaded: progressLoaded,
    getStepState, isStepComplete, setVerifyResults, skipStep,
    markStepComplete, setNav, saveUserInput, getModuleChecks,
  } = useStepProgress();

  // ── Chat ────────────────────────────────────────────────────────────
  const { messages, isSending, sendMessage, sendVerify, clearMessages } =
    useChatMessages(connection);

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
          onPair={pair}
          isPairing={isPairing}
          pairingError={pairingError}
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
```

- [ ] **Step 4: Verify build**

Run: `cd "/Users/siddarth/Openclaw Mastery" && npx vite build 2>&1 | tail -5`

Expected: Build succeeds. There may be warnings about unused imports from old components (CourseContent, Checklist, etc.) — that's fine, we remove them next.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/layout/Sidebar.tsx src/index.css
git commit -m "feat: three-column layout with step engine, chat panel, and validation"
```

---

## Task 11: Remove Old Components

**Files:**
- Delete: `src/components/sections/CourseContent.tsx`
- Delete: `src/components/sections/Checklist.tsx`
- Delete: `src/components/sections/Troubleshooting.tsx`
- Delete: `src/components/ui/InstructionViewer.tsx`
- Delete: `src/components/ui/PromptCard.tsx`
- Modify: `src/hooks/useProgress.ts` (remove useProgress, keep only what's needed)
- Delete: `src/components/layout/Header.tsx` (mobile header no longer needed)

- [ ] **Step 1: Delete old component files**

```bash
cd "/Users/siddarth/Openclaw Mastery"
rm src/components/sections/CourseContent.tsx
rm src/components/sections/Checklist.tsx
rm src/components/sections/Troubleshooting.tsx
rm src/components/ui/InstructionViewer.tsx
rm src/components/ui/PromptCard.tsx
rm src/components/layout/Header.tsx
rmdir src/components/sections 2>/dev/null || true
```

- [ ] **Step 2: Clean up useProgress.ts**

Replace `src/hooks/useProgress.ts` — the old hooks are no longer used. Keep the file minimal or remove it entirely if nothing imports it. Check that `App.tsx` and other files don't import from it. The new hooks (`useConnection`, `useStepProgress`, `useChatMessages`) replace it.

Delete `src/hooks/useProgress.ts`:

```bash
rm src/hooks/useProgress.ts
```

- [ ] **Step 3: Verify build**

Run: `cd "/Users/siddarth/Openclaw Mastery" && npx vite build 2>&1 | tail -5`

Expected: Build succeeds with no errors. If there are import errors, fix them (likely stale imports in files that were already updated).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: remove old components replaced by step engine and validation"
```

---

## Task 12: Migrate Modules 2-10 Data

**Files:**
- Modify: `src/data/modules.ts`

This task converts the remaining 9 modules from the legacy format to the new Phase/Step structure. Each module needs its phases defined with proper learn/do/verify steps. Since the instruction files already exist, the migration is mechanical: map each section to a phase, each instruction mapping to a step.

- [ ] **Step 1: Migrate Module 2 (Identity)**

In `src/data/modules.ts`, replace the Module 2 legacy entry with a fully structured module. Follow the same pattern as Module 1: phases with steps containing learn/do/verify. Reference the existing instruction files via `instructionUrl`.

Use the existing `SECTION_REGISTRY` mappings from the old `CourseContent.tsx` (now deleted but we read it earlier) as a guide for what prompts and files to map:

- Phase: "The 4 Core Files" → 4 steps (SOUL.md, USER.md, MEMORY.md, AGENTS.md)
- Phase: "Configuration" → 1 step (finalize identity)
- Phase: "Validation" → empty steps (dashboard auto-generates)

Each step's `learn` field should be 2-4 sentences explaining why that file matters. The `do.prompt` should be the short trigger. The `verify.checks` should validate the file was created with the right content.

Repeat this pattern for all modules 2-10. This is a large data entry task but follows the exact same structure for every module.

- [ ] **Step 2: Remove the legacy compatibility wrapper**

Once all modules are migrated, remove the `LEGACY_MODULES` array and `legacyToModule()` function from `modules.ts`.

- [ ] **Step 3: Update all shortTitle prefixes**

Find-and-replace "Day N:" with "Module N:" in all shortTitle values.

- [ ] **Step 4: Verify build**

Run: `cd "/Users/siddarth/Openclaw Mastery" && npx vite build 2>&1 | tail -5`

- [ ] **Step 5: Commit**

```bash
git add src/data/modules.ts
git commit -m "feat: migrate all 10 modules to Phase/Step data model"
```

---

## Task 13: Final Polish and Verify

**Files:**
- Modify: `src/components/ui/NavigationFooter.tsx`
- Verify: full build and manual smoke test

- [ ] **Step 1: Update NavigationFooter for module-level navigation**

The NavigationFooter now needs to handle end-of-phase → next phase, and end-of-module → next module transitions. Update it to accept phase-level navigation props:

Update `src/components/ui/NavigationFooter.tsx` to work with the new nav model. It should show "Next Phase: [name]" at the end of a phase's last step, or "Next Module: [name]" at the end of a module.

The StepEngine already handles step-to-step navigation internally. The NavigationFooter is only needed at the phase/module boundary. Wire it in App.tsx below the StepEngine/ValidationDashboard.

- [ ] **Step 2: Full build verification**

```bash
cd "/Users/siddarth/Openclaw Mastery" && npx vite build 2>&1
```

Expected: Clean build, no errors, no warnings.

- [ ] **Step 3: Run dev server and smoke test**

```bash
cd "/Users/siddarth/Openclaw Mastery" && npx vite dev --port 5173 &
```

Open `http://localhost:5173/openclaw-mastery/` in the browser and verify:
- Three-column layout renders (sidebar, content, chat panel)
- Module 1 phases show in sidebar
- Steps render with learn/do/verify sections
- Copy buttons work when not paired
- Chat panel shows "Connect your Claw" prompt
- Validation Dashboard renders for the validation phase
- Module switching works via dropdown
- Mobile gate appears on narrow viewport

- [ ] **Step 4: Kill dev server**

```bash
kill %1 2>/dev/null || true
```

- [ ] **Step 5: Commit any polish fixes**

```bash
git add -A
git commit -m "chore: final polish and navigation wiring"
```

---

## Summary

| Task | What it builds | Files created/modified |
|------|---------------|----------------------|
| 1 | Types + Module 1 data | 2 files |
| 2 | API client | 1 file |
| 3 | Connection hook | 1 file |
| 4 | Step progress hook | 1 file |
| 5 | Chat messages hook | 1 file |
| 6 | Connection components | 2 files |
| 7 | Step engine (6 components) | 6 files |
| 8 | Chat panel (2 components) | 2 files |
| 9 | Validation + mobile gate | 2 files |
| 10 | App.tsx + Sidebar + CSS rewrite | 3 files |
| 11 | Remove old components | -7 files |
| 12 | Migrate modules 2-10 data | 1 file |
| 13 | Polish + verify | 1-2 files |

**Total: 13 tasks, ~22 new files, ~7 removed, ~4 modified.**

Each task has its own commit. Tasks 1-9 are independent and can be parallelized across worktrees (they create new files with no shared dependencies). Task 10 depends on all of 1-9. Tasks 11-13 are sequential after 10.
