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
