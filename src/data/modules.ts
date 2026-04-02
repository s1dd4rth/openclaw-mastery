import {
    CheckCircle,
    Server,
    Shield,
    AlertTriangle,
    BookOpen,
    Terminal,
    Link as LinkIcon,
    Workflow,
    Cpu,
    Database,
    Copy,
    Users,
    Rocket,
    Search,
    Mail,
    ShieldCheck,
    Key,
} from 'lucide-react';
import type { Module as BaseModule, Phase } from './types';

export const INSTRUCTION_BASE = '/openclaw-mastery/instructions/';

// ── Legacy compatibility shim ─────────────────────────────────────────────────
// Components from the pre-migration codebase (Checklist, Troubleshooting,
// Sidebar, App) still reference .sections / .checklistItems /
// .troubleshootingItems on the module object. This extended type carries those
// optional fields alongside the new Phase/Step structure so everything compiles
// during migration without touching existing component files.

export interface LegacySection {
    id: string;
    title: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
}

export interface LegacyChecklistItem {
    id: string;
    label: string;
}

export interface LegacyTroubleshootingItem {
    issue: string;
    solution: string;
}

export type Module = BaseModule & {
    sections?: LegacySection[];
    checklistItems?: LegacyChecklistItem[];
    troubleshootingItems?: LegacyTroubleshootingItem[];
};

// ── Module 1: Install and Secure Your Lobster ────────────────────────────────

const m1: Module = {
    id: 'm1',
    title: 'Module 1: Install and Secure Your Lobster',
    shortTitle: 'Module 1: Install',
    description:
        'The three eras of AI tools and where OpenClaw sits. Learn the approach this course takes to keep you safe.',
    icon: Server,
    phases: [
        {
            id: 'deploy',
            title: 'Phase 1: Deploy',
            icon: Server,
            steps: [
                {
                    id: 'get-api-key',
                    title: 'Get Your API Key',
                    learn:
                        'OpenClaw connects to an AI model provider — OpenAI, Anthropic, or another compatible service — through an API key. This key is the credential that lets your self-hosted gateway make requests on your behalf. Keeping it secret is critical: anyone who has it can run up charges on your account.',
                    do: {
                        prompt:
                            'Open your AI provider dashboard, generate a new API key scoped to this project, and paste it into the OpenClaw setup wizard when prompted.',
                        instructionUrl: `${INSTRUCTION_BASE}m1-get-api-key.md`,
                        requiresInput: {
                            label: 'Your OpenClaw instance URL',
                            placeholder: 'https://your-vps-ip:4000',
                            storeAs: 'instanceUrl',
                        },
                    },
                    verify: {
                        checks: [
                            {
                                id: 'api-key-stored',
                                label: 'API key is stored in OpenClaw',
                                verifyPrompt:
                                    'Run: openclaw config show | grep PROVIDER_KEY and respond with JSON: { "pass": true/false, "detail": "what you saw" }',
                                failHint:
                                    'The key may not have been saved. Re-open the setup wizard and re-enter it.',
                                fixPrompt:
                                    'Open the OpenClaw setup wizard again and re-enter your API key when asked.',
                            },
                            {
                                id: 'web-chat-responds',
                                label: 'Claw responds in the web chat',
                                verifyPrompt:
                                    'Send "hello" in the web chat UI. Respond with JSON: { "pass": true/false, "detail": "what the Claw replied" }',
                                failHint:
                                    'If there is no response, the gateway may not have started. Restart it from your Hostinger dashboard.',
                                fixPrompt:
                                    'Ask the Claw: "openclaw gateway restart" then test the chat again.',
                            },
                        ],
                    },
                },
                {
                    id: 'give-claw-name',
                    title: 'Give Claw a Name',
                    learn:
                        'Naming your Claw is more than cosmetic: it sets the agent identity used in logs, Telegram messages, and multi-agent routing. A consistent name makes it easy to tell at a glance which agent sent a message or wrote a file. It also gives the agent a sense of self that improves its consistency in long conversations.',
                    do: {
                        prompt:
                            'Tell your Claw its name by typing: "Your name is [Name]. Update your identity settings now." Confirm it echoes the name back.',
                        instructionUrl: `${INSTRUCTION_BASE}m1-give-claw-name.md`,
                    },
                    verify: {
                        checks: [
                            {
                                id: 'claw-has-name',
                                label: 'Claw has a name',
                                verifyPrompt:
                                    'Ask the Claw: "What is your name?" Respond with JSON: { "pass": true/false, "detail": "the name it gave" }',
                                failHint:
                                    'The name may not have been persisted. Try asking it to save its name to SOUL.md.',
                                fixPrompt:
                                    'Tell the Claw: "Save your name to SOUL.md under the Identity section now."',
                            },
                        ],
                    },
                },
            ],
        },
        {
            id: 'security',
            title: 'Phase 2: Security',
            icon: Shield,
            steps: [
                {
                    id: 'run-audit',
                    title: 'Run Security Audit',
                    learn:
                        'OpenClaw ships with a built-in security audit that scans your gateway configuration for common weaknesses: open ports, world-readable credential files, missing token auth, and more. Running the audit before anything else gives you a baseline and catches problems introduced during install. You want zero critical failures before moving on.',
                    do: {
                        prompt:
                            'In the web chat, type: "Run the OpenClaw security audit and fix any critical failures." Wait for it to finish and show you the results.',
                        instructionUrl: `${INSTRUCTION_BASE}m1-security-audit.md`,
                    },
                    verify: {
                        checks: [
                            {
                                id: 'audit-no-critical',
                                label: 'Security audit shows no critical failures',
                                verifyPrompt:
                                    'Ask the Claw: "Show me the last security audit summary." Respond with JSON: { "pass": true/false, "detail": "critical count and any failing checks" }',
                                failHint:
                                    'Some fixes require a gateway restart before they apply. Ask the Claw to restart the gateway and re-run the audit.',
                                fixPrompt:
                                    'Ask the Claw: "Restart the gateway and run the security audit again."',
                            },
                        ],
                    },
                },
                {
                    id: 'bind-gateway',
                    title: 'Bind Gateway to Localhost',
                    learn:
                        'By default, some gateway configurations listen on 0.0.0.0, which exposes your AI gateway to the public internet on that port. Binding to 127.0.0.1 means only processes running on the same machine can reach it directly — the reverse proxy (nginx or Hostinger\'s built-in) is the only public-facing entry point. This is a critical hardening step.',
                    do: {
                        prompt:
                            'Tell the Claw: "Bind the gateway to 127.0.0.1 and enable token authentication. Confirm when done."',
                        instructionUrl: `${INSTRUCTION_BASE}m1-bind-gateway.md`,
                    },
                    verify: {
                        checks: [
                            {
                                id: 'gateway-bound',
                                label: 'Gateway bound to 127.0.0.1 with token auth enabled',
                                verifyPrompt:
                                    'Run: ss -tlnp | grep 4000 and respond with JSON: { "pass": true/false, "detail": "the address shown (127.0.0.1 or 0.0.0.0)" }',
                                failHint:
                                    'If it shows 0.0.0.0, the bind setting was not applied. Ask the Claw to update gateway.bind in the config and restart.',
                                fixPrompt:
                                    'Ask the Claw: "Set gateway.bind to 127.0.0.1 in the config file and restart the gateway."',
                            },
                        ],
                    },
                },
                {
                    id: 'lock-down-policies',
                    title: 'Lock Down Policies',
                    learn:
                        'OpenClaw\'s policy settings control what the agent is allowed to do without explicit permission: send DMs, join groups, store credentials in channels, run web searches. Tightening these policies to deny-by-default means the agent must ask before acting on sensitive operations — giving you control over its blast radius. This is especially important before connecting any external channels.',
                    do: {
                        prompt:
                            'Tell the Claw: "Set DM and group policies to restrictive, disable web search, set credentials.permissions to 700, and set heartbeat to 0m. Confirm each change."',
                        instructionUrl: `${INSTRUCTION_BASE}m1-policies.md`,
                    },
                    verify: {
                        checks: [
                            {
                                id: 'dm-policy',
                                label: 'DM and group policies are restrictive',
                                verifyPrompt:
                                    'Ask the Claw: "Show me the current DM and group policy settings." Respond with JSON: { "pass": true/false, "detail": "the policy values shown" }',
                                failHint:
                                    'Policies may not have saved. Ask the Claw to show the raw policy config file.',
                                fixPrompt:
                                    'Ask the Claw: "Open the policy config and set dm_policy and group_policy to restricted."',
                            },
                            {
                                id: 'credentials-permissions',
                                label: '~/.openclaw/credentials has permissions 700',
                                verifyPrompt:
                                    'Run: stat -c "%a" ~/.openclaw/credentials and respond with JSON: { "pass": true/false, "detail": "the permissions value shown" }',
                                failHint:
                                    'The credentials file is readable by other users. Run chmod 700 ~/.openclaw/credentials.',
                                fixPrompt:
                                    'Ask the Claw: "chmod 700 ~/.openclaw/credentials and verify the permissions."',
                            },
                            {
                                id: 'web-search-disabled',
                                label: 'Web search is disabled',
                                verifyPrompt:
                                    'Ask the Claw: "Is web search enabled or disabled right now?" Respond with JSON: { "pass": true/false, "detail": "what it said" }',
                                failHint:
                                    'Web search defaults to enabled. Ask the Claw to disable it in the tool policy settings.',
                                fixPrompt:
                                    'Ask the Claw: "Disable web search in the tool policy settings and confirm."',
                            },
                            {
                                id: 'heartbeat-zero',
                                label: 'Heartbeat set to 0m',
                                verifyPrompt:
                                    'Ask the Claw: "What is the current heartbeat setting?" Respond with JSON: { "pass": true/false, "detail": "the value shown" }',
                            },
                        ],
                    },
                },
            ],
        },
        {
            id: 'validation',
            title: 'Phase 3: Validation',
            icon: CheckCircle,
            steps: [],
        },
    ],
    // Legacy compatibility — mirrors old sections list so Sidebar nav renders
    // correctly until it is migrated to the new Phase/Step engine.
    sections: [
        { id: 'deploy', title: 'Phase 1: Deploy', icon: Server },
        { id: 'security', title: 'Phase 2: Security', icon: Shield },
        { id: 'checklist', title: 'Module 1 Checklist', icon: CheckCircle },
        { id: 'troubleshooting', title: 'Troubleshooting', icon: AlertTriangle },
    ],
    checklistItems: [
        { id: 'm1-c1', label: 'Claw responds in the web chat' },
        { id: 'm1-c2', label: 'OpenClaw security audit shows no critical failures' },
        { id: 'm1-c3', label: 'Gateway bound to 127.0.0.1 with token auth enabled' },
        { id: 'm1-c4', label: 'DM and group policies are restrictive' },
        { id: 'm1-c5', label: '~/.openclaw/credentials has permissions 700' },
        { id: 'm1-c6', label: 'Heartbeat set to 0m' },
        { id: 'm1-c7', label: 'No channels have stored credentials yet' },
        { id: 'm1-c8', label: 'Web search is disabled' },
        { id: 'm1-c9', label: 'Claw has a name' },
    ],
    troubleshootingItems: [
        {
            issue: 'Claw does not respond in the web chat',
            solution: 'The gateway may need a restart. Go to your Hostinger dashboard and restart the VPS, or wait a minute and try again.',
        },
        {
            issue: 'Security audit shows failures after the Claw tried to fix them',
            solution: 'Some fixes require a gateway restart before they take effect. Ask the Claw to restart with "openclaw gateway restart" and re-run the audit.',
        },
        {
            issue: 'Claw gives generic responses and does not run the checks',
            solution: 'It may not have access to claw-instructions-security.md. Try pasting the contents of the file directly into the web chat instead.',
        },
        {
            issue: 'Firewall shows as FAIL',
            solution: 'This is expected inside a Docker container. Hostinger manages the firewall at the host level.',
        },
        {
            issue: 'Port on 0.0.0.0 in the 60000+ range',
            solution: "This is the Control UI port that Hostinger's proxy uses to reach your Claw. It is expected and safe.",
        },
        {
            issue: 'Claw asks about risk posture',
            solution: 'Choose "VPS Hardened". This gives you deny-by-default settings and the tightest configuration.',
        },
    ],
};

// ── Legacy format converter (modules 2-10) ───────────────────────────────────

interface LegacyModuleRaw {
    id: string;
    title: string;
    shortTitle: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    sections: LegacySection[];
    checklistItems: LegacyChecklistItem[];
    troubleshootingItems: LegacyTroubleshootingItem[];
}

function legacyToModule(lm: LegacyModuleRaw): Module {
    const contentSections = lm.sections.filter(
        s => s.id !== 'checklist' && s.id !== 'troubleshooting',
    );

    const moduleNum = lm.id.replace('m', '');

    const phases: Phase[] = contentSections.map(section => ({
        id: section.id,
        title: section.title.replace(/^Day\s+\d+/i, `Module ${moduleNum}`),
        icon: section.icon as import('./types').Phase['icon'],
        steps: [
            {
                id: `${section.id}-legacy`,
                title: section.title.replace(/^Day\s+\d+/i, `Module ${moduleNum}`),
                learn:
                    'Follow the instructions in this section to complete this part of the module.',
            },
        ],
    }));

    // Append a validation phase so the new engine has somewhere to render completion
    phases.push({
        id: 'validation',
        title: 'Validation',
        icon: CheckCircle,
        steps: [],
    });

    return {
        id: lm.id,
        title: lm.title.replace(/^Day\s+(\d+)/i, 'Module $1'),
        shortTitle: lm.shortTitle.replace(/^Day\s+(\d+)/i, 'Module $1'),
        description: lm.description,
        icon: lm.icon as Module['icon'],
        phases,
        // Legacy compatibility — used by Checklist / Troubleshooting / Sidebar
        // components until they are migrated to the new Phase/Step engine.
        sections: lm.sections,
        checklistItems: lm.checklistItems,
        troubleshootingItems: lm.troubleshootingItems,
    };
}

// ── Raw legacy data for modules 2-10 ─────────────────────────────────────────

const LEGACY_MODULES: LegacyModuleRaw[] = [
    {
        id: 'm2',
        title: 'Day 2: Make It Personal',
        shortTitle: 'Day 2: Identity',
        description:
            'What SOUL.md, USER.md, AGENTS.md, and MEMORY.md each do. Learn to write rules that produce consistent behavior.',
        icon: Terminal,
        sections: [
            { id: 'four-files', title: 'The 4 Core Files', icon: BookOpen },
            { id: 'configuration', title: 'Configuration Steps', icon: Terminal },
            { id: 'checklist', title: 'Module 2 Checklist', icon: CheckCircle },
            { id: 'troubleshooting', title: 'Troubleshooting', icon: AlertTriangle },
        ],
        checklistItems: [
            { id: 'm2-c1', label: 'SOUL.md is configured with core directives and hard limits' },
            { id: 'm2-c2', label: 'USER.md contains appropriate user context (name, focus)' },
            { id: 'm2-c3', label: 'AGENTS.md defines default behavior and startup checklist' },
            { id: 'm2-c4', label: 'MEMORY.md is initialized for long-term storage' },
        ],
        troubleshootingItems: [
            {
                issue: 'Claw forgets instructions from SOUL.md during long conversations',
                solution:
                    'Your files might be exceeding the 2,500-word size budget. Keep core files concise so they retain high attention weight.',
            },
            {
                issue: 'Claw acts out of character or violates boundaries',
                solution:
                    'Ensure boundaries in SOUL.md are written as absolute rules (e.g., "Never output credentials") rather than vague suggestions.',
            },
        ],
    },
    {
        id: 'm3',
        title: 'Day 3: Connect a Channel',
        shortTitle: 'Day 3: Channel',
        description:
            'How connecting a messaging app turns your Claw into something you reach from your phone. Understand pairing mode boundaries.',
        icon: LinkIcon,
        sections: [
            { id: 'build', title: 'Build Guide', icon: LinkIcon },
            { id: 'checklist', title: 'Module 3 Checklist', icon: CheckCircle },
            { id: 'troubleshooting', title: 'Troubleshooting', icon: AlertTriangle },
        ],
        checklistItems: [
            { id: 'm3-c1', label: 'Messaging channel (e.g. Telegram) is connected' },
            { id: 'm3-c2', label: 'Claw responds to direct messages on mobile' },
        ],
        troubleshootingItems: [
            {
                issue: 'The channel pairing code expires before you enter it',
                solution:
                    'Go back to the Channels menu in OpenClaw and generate a fresh pairing code. Codes expire quickly, so have the app ready before you start.',
            },
            {
                issue: 'Claw responds in web chat but not Telegram',
                solution:
                    'In OpenClaw settings, check that the channel is listed as active. If pairing shows as pending, remove it and re-pair.',
            },
        ],
    },
    {
        id: 'm4',
        title: 'Day 4: Make It Proactive',
        shortTitle: 'Day 4: Proactive',
        description:
            'How your server runs tasks while you sleep. Turn plain English instructions into scheduled cron behavior.',
        icon: Workflow,
        sections: [
            { id: 'build', title: 'Build Guide', icon: Workflow },
            { id: 'checklist', title: 'Module 4 Checklist', icon: CheckCircle },
            { id: 'troubleshooting', title: 'Troubleshooting', icon: AlertTriangle },
        ],
        checklistItems: [
            { id: 'm4-c1', label: 'A recurring cron job exists for the daily reflection' },
            { id: 'm4-c2', label: 'The schedule matches your chosen daily time' },
            { id: 'm4-c3', label: 'The job timezone matches your timezone' },
            { id: 'm4-c4', label: 'The job is bound to the current session' },
            { id: 'm4-c5', label: 'delivery.channel is set to telegram' },
            { id: 'm4-c6', label: 'delivery.to is set to your Telegram recipient/chat ID' },
        ],
        troubleshootingItems: [
            {
                issue: 'No message arrives when you try a manual run',
                solution:
                    "Ask the Claw to check the cron job's delivery target and confirm it used the job itself for the test, not a separate one-off message.",
            },
            {
                issue: 'The reflection arrives, but your reply is not saved',
                solution:
                    "Ask the Claw to confirm the job is bound to the current session and that the reflection prompt told it to save your next reply to today's journal file.",
            },
            {
                issue: 'The job runs at the wrong time',
                solution:
                    'Ask the Claw to inspect the cron expression and timezone together. Most timing mistakes come from one of those two being wrong.',
            },
            {
                issue: 'You start getting duplicate reflections',
                solution:
                    'Ask the Claw to list the active cron jobs and look for an older reflection job that should be disabled or removed.',
            },
        ],
    },
    {
        id: 'm5',
        title: 'Day 5: Give It Skills',
        shortTitle: 'Day 5: Skills',
        description:
            'What skills are and how they compare to MCP. Configure progressive disclosure to keep agents accurate.',
        icon: Cpu,
        sections: [
            { id: 'build', title: 'Build Guide', icon: Cpu },
            { id: 'checklist', title: 'Module 5 Checklist', icon: CheckCircle },
            { id: 'troubleshooting', title: 'Troubleshooting', icon: AlertTriangle },
        ],
        checklistItems: [
            { id: 'm5-c1', label: 'document-summary was inspected before install' },
            { id: 'm5-c2', label: 'document-summary was installed for this workspace' },
            {
                id: 'm5-c3',
                label: 'quick-note exists as a custom workspace skill with its own SKILL.md',
            },
            {
                id: 'm5-c4',
                label: 'quick-note can classify notes and track open loops when needed',
            },
            { id: 'm5-c5', label: 'You know the exact trigger or request to use for both skills' },
            {
                id: 'm5-c6',
                label: 'You started a fresh OpenClaw session with /new before testing the new skills',
            },
            {
                id: 'm5-c7',
                label: 'Both skills are scoped to this agent unless you chose otherwise',
            },
        ],
        troubleshootingItems: [
            {
                issue: 'The Claw starts doing everything in one shot',
                solution:
                    'Tell it to stop and stay inside the current Day 5 step. The point is to inspect, install, create, and verify in sequence.',
            },
            {
                issue: 'The inspection feels vague',
                solution:
                    'Ask it to explain document-summary in plain English: what it does, what should trigger it, and what it depends on.',
            },
            {
                issue: 'The skill does not seem available yet',
                solution: 'Type /new in OpenClaw to start a fresh session, then test again.',
            },
        ],
    },
    {
        id: 'm6',
        title: 'Day 6: Tame Your Inbox',
        shortTitle: 'Day 6: Inbox',
        description:
            'How your Claw connects to email safely. Design triage categories and implement read-only protections.',
        icon: Mail,
        sections: [
            { id: 'build', title: 'Build Guide', icon: Mail },
            { id: 'checklist', title: 'Module 6 Checklist', icon: CheckCircle },
            { id: 'troubleshooting', title: 'Troubleshooting', icon: AlertTriangle },
        ],
        checklistItems: [
            { id: 'm6-c1', label: 'A personal Gmail App Password was created' },
            { id: 'm6-c2', label: 'imap-smtp-email was inspected before install' },
            {
                id: 'm6-c3',
                label: 'imap-smtp-email was installed from ClawHub for this workspace',
            },
            {
                id: 'm6-c4',
                label: 'Gmail IMAP settings were stored in ~/.config/imap-smtp-email/.env',
            },
            {
                id: 'm6-c5',
                label: '~/.config/imap-smtp-email/.env permissions are owner-only',
            },
            { id: 'm6-c6', label: 'SMTP settings are still left for Day 8' },
            { id: 'm6-c7', label: 'email-triage exists as a workspace skill' },
            { id: 'm6-c8', label: 'AGENTS.md includes email security protocols' },
            { id: 'm6-c9', label: 'A recurring cron job exists for the morning Gmail summary' },
            {
                id: 'm6-c10',
                label: 'Your Claw can return a structured Gmail triage summary',
            },
            {
                id: 'm6-c11',
                label: 'Your Claw flags prompt-injection text instead of following it',
            },
        ],
        troubleshootingItems: [
            {
                issue: "You can't find App Passwords in your Google account",
                solution:
                    'Check the official Google help page. The common blockers are missing 2-Step Verification, a work/school Google account, or Advanced Protection. Use a personal Gmail account for this day.',
            },
            {
                issue: 'Gmail says the password is wrong',
                solution:
                    'Use the 16-digit App Password, not your regular Gmail password. If you already closed the Google dialog, generate a new App Password.',
            },
            {
                issue: 'The skill can read Gmail, but the send side also looks configured',
                solution:
                    'Day 6 keeps SMTP out of scope. Ask your Claw to open ~/.config/imap-smtp-email/.env and confirm that the SMTP_ values are still absent.',
            },
            {
                issue: 'The morning summary does not arrive',
                solution:
                    "Ask your Claw to inspect the cron job's schedule, timezone, session target, and Telegram delivery target together.",
            },
        ],
    },
    {
        id: 'm7',
        title: 'Day 7: Make It Research',
        shortTitle: 'Day 7: Research',
        description:
            'What live web search adds to OpenClaw. Navigate differences between search vs fetch, avoiding injection risks.',
        icon: Search,
        sections: [
            { id: 'build', title: 'Build Guide', icon: Search },
            { id: 'checklist', title: 'Module 7 Checklist', icon: CheckCircle },
            { id: 'troubleshooting', title: 'Troubleshooting', icon: AlertTriangle },
        ],
        checklistItems: [
            { id: 'm7-c1', label: 'You created a Brave Search API key' },
            {
                id: 'm7-c2',
                label: 'The built-in web_search tool is configured to use provider brave',
            },
            { id: 'm7-c3', label: 'research-brief exists as a workspace skill' },
            {
                id: 'm7-c4',
                label: 'Your Claw can answer a current question with live sources through that skill',
            },
            {
                id: 'm7-c5',
                label: 'Your workspace AGENTS.md includes a short rule for treating web content as data',
            },
            {
                id: 'm7-c6',
                label: 'You started a fresh OpenClaw session with /new before testing the new skill',
            },
        ],
        troubleshootingItems: [
            {
                issue: 'The Claw starts talking about Playwright or the browser',
                solution: 'Tell it that Day 7 is web_search only.',
            },
            {
                issue: 'The answer still feels like training data',
                solution:
                    'Make the prompt time-bound. Ask for "the past 7 days", "this week", or "published after [date]".',
            },
            {
                issue: 'The skill does not seem to trigger',
                solution: 'Type /new in OpenClaw, then test again.',
            },
            {
                issue: 'The Claw asks you to run shell commands',
                solution: 'Tell it to configure the tool itself and keep the setup inside chat.',
            },
        ],
    },
    {
        id: 'm8',
        title: 'Day 8: Let It Write',
        shortTitle: 'Day 8: Write',
        description:
            'Move from internal workspace writes to external impacts. Set up approval gates for sending emails safely.',
        icon: Copy,
        sections: [
            { id: 'build', title: 'Build Guide', icon: Copy },
            { id: 'checklist', title: 'Module 8 Checklist', icon: CheckCircle },
            { id: 'troubleshooting', title: 'Troubleshooting', icon: AlertTriangle },
        ],
        checklistItems: [
            {
                id: 'm8-c1',
                label: 'imap-smtp-email was inspected for the send workflow before any changes',
            },
            {
                id: 'm8-c2',
                label: 'Gmail SMTP settings were added to ~/.config/imap-smtp-email/.env',
            },
            { id: 'm8-c3', label: 'The config file permissions are still owner-only' },
            { id: 'm8-c4', label: 'Outbound email rules added to AGENTS.md' },
            { id: 'm8-c5', label: 'Test email sent to yourself and received' },
            { id: 'm8-c6', label: 'Approval gate cancellation verified (no email sent on cancel)' },
            { id: 'm8-c7', label: 'follow-up-email workspace skill created' },
            {
                id: 'm8-c8',
                label: 'You started a fresh OpenClaw session with /new before testing the new skill',
            },
        ],
        troubleshootingItems: [
            {
                issue: 'The Claw starts replying or forwarding instead of composing a new email',
                solution:
                    'Tell it that Day 8 is compose-only. Reply and forward are out of scope for this lesson.',
            },
            {
                issue: 'SMTP authentication fails',
                solution:
                    'Use the same Gmail App Password from Day 6. If Google rejects it, generate a new App Password and have your Claw update both the IMAP and SMTP values in ~/.config/imap-smtp-email/.env.',
            },
            {
                issue: 'The draft sends without showing you the full email first',
                solution:
                    'Ask the Claw to inspect AGENTS.md and confirm that Outbound Email Protocols requires showing the full draft and waiting for approval before every send.',
            },
            {
                issue: 'The test email does not arrive',
                solution:
                    "Check spam first. If it is not there, ask the Claw to verify that SMTP_FROM matches your Gmail address and that imap-smtp-email still reports ready: true.",
            },
        ],
    },
    {
        id: 'm9',
        title: 'Day 9: Give It a Team',
        shortTitle: 'Day 9: Team',
        description:
            "How sub-agents work. Run multiple specialized 'brains' on one gateway communicating securely together.",
        icon: Users,
        sections: [
            { id: 'build', title: 'Build Guide', icon: Users },
            { id: 'checklist', title: 'Module 9 Checklist', icon: CheckCircle },
            { id: 'troubleshooting', title: 'Troubleshooting', icon: AlertTriangle },
        ],
        checklistItems: [
            { id: 'm9-c1', label: 'A writer named agent exists' },
            {
                id: 'm9-c2',
                label: 'The writer uses gpt-5.4 or claude-sonnet-4.6, chosen from the same provider family as the main setup',
            },
            {
                id: 'm9-c3',
                label: 'The writer workspace has a detailed SOUL.md tuned for long-form writing',
            },
            {
                id: 'm9-c4',
                label: 'The writer workspace has USER.md, AGENTS.md, and MEMORY.md',
            },
            {
                id: 'm9-c5',
                label: 'Agent-to-agent communication is enabled between main and writer',
            },
            {
                id: 'm9-c6',
                label: 'The main workspace has a short delegation rule for long-form writing',
            },
            { id: 'm9-c7', label: 'A writer-only test produced a convincing draft' },
            { id: 'm9-c8', label: 'A delegated draft came back through the main Claw' },
            { id: 'm9-c9', label: 'A revision request made a round trip through the writer' },
        ],
        troubleshootingItems: [
            {
                issue: 'The main Claw writes the draft itself',
                solution:
                    'Ask more directly: "Use the writer agent for this draft." If it still writes the piece itself, ask it to show you the long-form delegation rule it added to the main workspace AGENTS.md.',
            },
            {
                issue: 'The writer sounds generic',
                solution:
                    'Ask the Claw to show you the writer SOUL.md and tighten the voice section. Small changes there have a large effect on output.',
            },
            {
                issue: 'The chat stops accepting follow-up messages after a writer run',
                solution:
                    'Use the session switcher at the top of the chat window. Click any other agent or sub-agent, then click main again and continue in the same conversation.',
            },
            {
                issue: 'Costs feel high',
                solution:
                    'A named writer uses a capable model every time it drafts. Keep the writer for work that actually benefits from voice and structure.',
            },
        ],
    },
    {
        id: 'm10',
        title: 'Day 10: What Comes Next',
        shortTitle: 'Day 10: Next',
        description:
            'A look back at what you built across ten days. Learn how to keep improving your Claw and what to build next.',
        icon: Rocket,
        sections: [
            { id: 'build', title: 'Build Guide', icon: Rocket },
            { id: 'checklist', title: 'Module 10 Checklist', icon: CheckCircle },
            { id: 'troubleshooting', title: 'Troubleshooting', icon: AlertTriangle },
        ],
        checklistItems: [
            { id: 'm10-c1', label: 'You opened the assessment form' },
            { id: 'm10-c2', label: 'Your Claw reviewed the setup across the course' },
            { id: 'm10-c3', label: 'You got a day-by-day completion report' },
            { id: 'm10-c4', label: 'You got an optional completion code from your Claw' },
            {
                id: 'm10-c5',
                label: 'You know that the code belongs in the last question of the Google form',
            },
            {
                id: 'm10-c6',
                label: 'You know which day to revisit first if anything was incomplete',
            },
        ],
        troubleshootingItems: [
            {
                issue: 'The Claw says a day failed even though you built it',
                solution:
                    'Ask it to explain exactly what it checked for that day. Day 10 should judge the visible setup, not whether you remember doing the step.',
            },
            {
                issue: 'The completion code looks wrong',
                solution:
                    'Ask the Claw to repeat the score and show the day-by-day pass or fail list again. The code should match that score.',
            },
            {
                issue: 'Your setup is only partially complete',
                solution:
                    'That is fine. Submit the assessment anyway. The optional code is there to summarize what your Claw found, not to block you.',
            },
        ],
    },
];

// ── Assemble and export ───────────────────────────────────────────────────────

export const MODULES_DATA: Module[] = [
    m1,
    ...LEGACY_MODULES.map(legacyToModule),
];
