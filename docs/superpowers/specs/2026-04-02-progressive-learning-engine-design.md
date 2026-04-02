# OpenClaw Mastery v2: Progressive Learning Engine

**Date:** 2026-04-02
**Status:** Approved
**Branch:** main

## Problem

The current course app is a static document viewer with manual checkboxes. Two critical failures:

1. **Checklists are meaningless.** Users tick boxes without the app verifying anything. No accountability, no real learning signal.
2. **Prompts get blocked.** When users copy long instruction payloads into OpenClaw, the model flags them as prompt injection. The previous workaround ("SYSTEM OVERRIDE / I am your authenticated owner") normalized dangerous security patterns in a course that teaches security.
3. **Context switching kills flow.** Users constantly jump between the course site and OpenClaw's chat window, losing focus and context.
4. **Instruction files are too dense.** A wall of markdown with no structure. Users paste and hope, without understanding what each step does or why.

## Solution

Transform the app from a document viewer into an interactive tutorial engine connected to the user's live OpenClaw instance.

### Core Concepts

**Hierarchy:** Module → Phase → Step

- **Module** (10 total): The big units. "Module 1: Install and Secure Your Lobster."
- **Phase**: Sub-units within a module. "Phase: Deploy", "Phase: Security."
- **Step**: The atomic learning unit. Each step has three parts: Learn, Do, Verify.

**Connection model:** The course app connects to the user's OpenClaw instance via a one-time pairing code flow. Once paired, the app can send prompts, run verification checks, and display live chat, all without the user leaving the course.

**Prompt delivery:** Instead of pasting giant instruction payloads, the app sends short trigger prompts to OpenClaw along with a URL to the full instruction file (hosted on GitHub Pages). OpenClaw fetches and reads the URL itself. Short owner-level prompt = no injection concerns.

## Architecture

### System Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│  Browser (Course App)                                            │
│                                                                  │
│  ┌─ Sidebar ─┐  ┌─── Step Engine ────┐  ┌──── Chat Panel ───┐  │
│  │           │  │                     │  │                    │  │
│  │ Module ▼  │  │  📖 Learn           │  │  🟢 Connected      │  │
│  │           │  │  Short explanation   │  │                    │  │
│  │ Phases:   │  │  of why this matters │  │  Message history   │  │
│  │ · Deploy  │  │                     │  │  (markdown-        │  │
│  │ · Security│  │  ▶ Do               │  │   rendered)        │  │
│  │ · Valid.  │  │  [Execute] ─────────│──│──▶ Sent to Claw   │  │
│  │           │  │                     │  │                    │  │
│  │ Progress  │  │  ✓ Verify           │  │  User can also     │  │
│  │ ████░░ 60%│  │  ✅ Check passed    │  │  type freely       │  │
│  │           │  │  ❌ Check failed    │  │                    │  │
│  │           │  │     hint + [Fix]    │  │  [Type here...]    │  │
│  └───────────┘  └─────────────────────┘  └────────────────────┘  │
│                          │                        ▲               │
│                          │   API calls            │               │
│                          ▼                        │               │
│                   ┌──────────────┐                │               │
│                   │ Connection   │────────────────┘               │
│                   │ Manager      │                                │
│                   │ (pair, send, │                                │
│                   │  verify,     │                                │
│                   │  health)     │                                │
│                   └──────┬───────┘                                │
└──────────────────────────┼───────────────────────────────────────┘
                           │ HTTPS
                           ▼
                   ┌──────────────────┐
                   │  User's OpenClaw │
                   │  Instance (VPS)  │
                   │                  │
                   │  Chat API        │
                   │  (send message,  │
                   │   get response)  │
                   └──────────────────┘
```

### Three-Column Layout

Desktop and tablet only. Mobile shows a gate screen asking the user to switch to a larger device, with a "Continue anyway" escape hatch to a simplified single-column view (copy buttons, manual mode).

```
DESKTOP (1024px+)
┌──────────┬────────────────────┬───────────────┐
│ Sidebar  │  Course Content    │  Chat Panel   │
│  240px   │  flexible          │  320px        │
└──────────┴────────────────────┴───────────────┘

TABLET (768-1023px)
┌──────────┬────────────────────┬───────────────┐
│ Sidebar  │  Course Content    │  Chat Panel   │
│  200px   │  flexible          │  280px        │
└──────────┴────────────────────┴───────────────┘
```

## Connection & Auth

### Pairing Flow

```
1. User clicks "Connect Your Claw" in the course app
2. App shows instructions: "Type /pair in your OpenClaw chat"
3. User types /pair in OpenClaw → gets a 6-digit code + instance URL
4. User enters the code + URL in the course app
5. App exchanges the code for a session token via the OpenClaw API
6. Token stored in localStorage. Connection established.
```

**Connection state** is stored in localStorage:

```typescript
interface ConnectionState {
  instanceUrl: string;
  sessionToken: string;
  clawName: string;       // display name from pairing
  pairedAt: string;       // ISO timestamp
}
```

**Connection indicator:** Green dot = connected, red = disconnected. Health check pings the instance every 60 seconds when the tab is active.

**Before pairing:** The app works in "offline mode" with copy buttons and manual checklists. Pairing unlocks execute buttons, auto-validation, and the live chat panel.

## The Step Engine

### Step Data Model

```typescript
interface Step {
  id: string;
  title: string;
  learn: string;              // markdown, rendered inline (2-4 sentences)
  do?: {
    prompt: string;           // short trigger sent to OpenClaw
    instructionUrl?: string;  // full instruction file URL (OpenClaw fetches)
    requiresInput?: {
      label: string;
      placeholder: string;
      storeAs: string;        // key to remember value for later steps
    };
  };
  verify?: {
    checks: CheckItem[];
  };
}

interface CheckItem {
  id: string;
  label: string;
  verifyPrompt: string;       // sent to OpenClaw, expects JSON response
  failHint?: string;          // shown inline on failure
  fixPrompt?: string;         // sent to OpenClaw on "Fix This"
}
```

### Step Behavior

1. **Learn** is always visible. Short explanation of why this step matters.
2. **Do** has an Execute button (paired) or Copy button (unpaired). Execute sends the short prompt + instruction URL to OpenClaw. The user watches the response in the chat panel.
3. **Verify** has a Check button. Sends a structured prompt expecting JSON response. Each check item shows pass/fail inline.
4. **Next step is locked** until verify passes or the user clicks "Skip verification."
5. **Failed checks** show the `failHint` inline and a "Fix This" button (if `fixPrompt` exists). Fix This sends the remediation prompt, then auto-re-runs verification.

### Prompt Delivery

When the user clicks Execute:

```
App sends to OpenClaw API:
"Read the instruction at https://<pages-url>/instructions/day01-deploy.md
and follow step 3: Bind the gateway to 127.0.0.1 and restart."
```

OpenClaw fetches the URL, reads the full instructions, executes. The user sees the response stream in the chat panel. No giant payload, no injection wrapper.

### Verification Protocol

When the user clicks Check:

```
App sends to OpenClaw API:
"Check the following and respond in JSON format:
1. Is the gateway bound to 127.0.0.1? (check: gateway_bound)
2. Was the gateway restarted? (check: gateway_restarted)

Respond ONLY with: {\"checks\": [{\"id\": \"gateway_bound\", \"pass\": true/false, \"detail\": \"...\"}, ...]}"
```

App parses JSON response, updates check items visually. If response is not valid JSON, falls back to showing raw response in chat panel and marking checks as "manual review needed."

### Auto-Fix Flow

```
Verify fails → failHint + [Fix This] shown
  → User clicks Fix This
  → App sends fixPrompt to OpenClaw
  → OpenClaw executes the fix
  → App auto-re-runs verification
  → Check turns green (or shows updated failure)
```

## Validation Dashboard

The Checklist phase is replaced by a **Validation Dashboard** that aggregates all verify results from the module's phases.

```
┌─────────────────────────────────────────────────┐
│  Module 1 Validation Dashboard                  │
│                                                 │
│  Phase: Deploy                     3/3 ✅       │
│  ├── ✅ Claw responds in web chat               │
│  ├── ✅ SSH access confirmed                    │
│  └── ✅ Claw has a name                         │
│                                                 │
│  Phase: Security                   5/6 ⚠️       │
│  ├── ✅ Security audit — no critical failures   │
│  ├── ✅ Gateway bound to 127.0.0.1              │
│  ├── ❌ Credentials permissions not 700         │
│  │      Common cause: ...                       │
│  │      [Fix This] [Re-check]                   │
│  ├── ✅ Heartbeat set to 0m                     │
│  └── ✅ Web search disabled                     │
│                                                 │
│  Overall: 8/9 checks passed                     │
│  [Validate All]              [Continue Anyway →]│
└─────────────────────────────────────────────────┘
```

**"Validate All"** runs every check for the module in sequence with a progress indicator.

**Results are cached in localStorage.** Cached results show without re-running. "Re-check" forces a fresh validation. Cache invalidates after 24 hours or when the user re-runs a step's Do action.

**No separate Troubleshooting phase.** Troubleshooting guidance appears inline at the point of failure via `failHint` on each CheckItem.

## Chat Panel

A lightweight wrapper around OpenClaw's chat API.

**Capabilities:**
- Send messages (from Execute buttons or user typing)
- Display responses (markdown-rendered, streaming if API supports it)
- Show connection status with Claw's name
- Maintain conversation history for the current session (not persisted)

**Behavior:**
- Messages from Execute buttons are tagged `(auto, Step N)` to distinguish from manual messages
- Verify request/response pairs are hidden from chat (results show in step UI instead). If JSON parsing fails, raw response falls through to chat as fallback.
- User can type freely at any time for questions, debugging, or conversation
- Chat history clears on page refresh (source of truth is OpenClaw's own history)

## State Management

All state lives in localStorage:

```typescript
interface AppState {
  connection?: ConnectionState;

  progress: {
    [moduleId: string]: {
      [phaseId: string]: {
        [stepId: string]: {
          completed: boolean;
          skipped: boolean;
          verifyResults?: {
            [checkId: string]: {
              pass: boolean;
              detail: string;
              checkedAt: string;  // ISO timestamp, for cache invalidation
            };
          };
        };
      };
    };
  };

  userInputs: {
    [key: string]: string;  // remembered across steps, e.g. "timezone"
  };

  nav: {
    moduleId: string;
    phaseId: string;
    stepIndex: number;
  };
}
```

### Offline / Unpaired Degradation

| Feature              | Paired              | Unpaired                     |
|----------------------|---------------------|------------------------------|
| Learn content        | Visible             | Visible                      |
| Execute button       | Sends to OpenClaw   | Becomes Copy button          |
| Chat panel           | Live chat           | "Connect your Claw" prompt   |
| Verify checks        | Auto-validated      | Manual toggle (fallback)     |
| Fix This             | Sends fix prompt    | Shows hint text only         |
| Validation Dashboard | Auto-aggregated     | Manual checkboxes (fallback) |

## Data Model Migration

### What changes

| Current | New | Notes |
|---------|-----|-------|
| `sections` array in module | `phases` array | Renamed, same concept |
| `SECTION_REGISTRY` | Eliminated | Step data lives in module definition |
| `checklistItems` array | Eliminated | Auto-generated from verify checks |
| `troubleshootingItems` array | Eliminated | Mapped to `failHint` on CheckItem |
| `shortTitle` with "Day N" prefix | Updated | "Module N" prefix |
| Instruction `.md` files | Kept | Still hosted at public URLs, consumed by OpenClaw |

### What stays the same

- React / Vite / Tailwind stack
- GitHub Pages deployment
- localStorage for persistence
- `public/instructions/*.md` files (now fetched by OpenClaw, not rendered in-app)
- Lucide icons

## Components

### New Components

| Component | Purpose |
|-----------|---------|
| `PairingFlow` | One-time connection setup modal |
| `StepEngine` | Renders learn/do/verify for a single step |
| `StepProgress` | Step counter and lock indicators |
| `ChatPanel` | Live chat with OpenClaw instance |
| `ChatMessage` | Single message bubble (markdown-rendered) |
| `ConnectionIndicator` | Green/red dot with Claw name |
| `ValidationDashboard` | Aggregated check results per module |
| `CheckResult` | Single check item with pass/fail/hint/fix |
| `ExecuteButton` | Sends prompt to OpenClaw (falls back to Copy) |
| `VerifyButton` | Runs verification checks |
| `MobileGate` | "Please use a larger screen" message |
| `UserInputField` | Collects input before Execute (e.g., timezone) |

### Modified Components

| Component | Changes |
|-----------|---------|
| `App.tsx` | Three-column layout, connection state management |
| `Sidebar` | Phases instead of sections, connection status |
| `NavigationFooter` | Step-level navigation instead of section-level |

### Removed Components

| Component | Reason |
|-----------|--------|
| `InstructionViewer` | Replaced by StepEngine (learn content is inline) |
| `PromptCard` | Replaced by ExecuteButton within StepEngine |
| `Checklist` | Replaced by ValidationDashboard |
| `Troubleshooting` | Eliminated, guidance is inline on check failures |
| `CourseContent` | Replaced by StepEngine |

## API Integration

The app needs a thin API client for communicating with OpenClaw. Exact endpoints depend on what OpenClaw exposes (to be confirmed), but the client needs these capabilities:

```typescript
interface OpenClawClient {
  // Exchange pairing code for session token
  pair(instanceUrl: string, code: string): Promise<{ token: string; clawName: string }>;

  // Send a chat message, get response (streaming optional)
  sendMessage(message: string): Promise<string>;

  // Health check
  ping(): Promise<boolean>;
}
```

Verification and execute both use `sendMessage` with different prompts. The app handles parsing verification JSON responses.

**CORS consideration:** The user's OpenClaw instance is on a different origin than GitHub Pages. The OpenClaw API must include appropriate CORS headers, or the app needs to instruct users to configure CORS during the pairing setup.

## NOT in scope

- **Mobile-optimized experience:** Gate screen with "Continue anyway" escape hatch. No engineering investment in mobile chat or mobile three-column layout.
- **Chat history persistence:** Clears on refresh. OpenClaw is the source of truth.
- **Multi-instance support:** One OpenClaw connection at a time.
- **Offline-first / PWA:** Requires connection for the core experience.
- **User accounts or server-side state:** Stays fully static, all state in localStorage.
- **Restructuring instruction markdown files into step format:** Content migration is a separate effort from the engineering work. The architecture supports it, but the 22 files need to be manually decomposed into steps.
