"use client";
import React from 'react';
import { InstructionViewer } from '../ui/InstructionViewer';
import { NavigationFooter } from '../ui/NavigationFooter';
import { PromptCard } from '../ui/PromptCard';

// ── Section content registry ────────────────────────────────────────────────
// Maps each module + section to ordered steps. Each step has:
//   - prompt    : the exact text the learner copies into OpenClaw
//   - filename  : the instruction file the agent reads from /public/instructions/
//   - label     : human-readable label shown on the InstructionViewer pill
//   - defaultOpen: whether the viewer starts expanded

interface StepEntry {
    /** Exact message the learner pastes into OpenClaw */
    prompt: string;
    /** Filename under /public/instructions/ */
    filename: string;
    /** Human-readable label for the InstructionViewer pill */
    label: string;
    /** Open the viewer by default */
    defaultOpen?: boolean;
}

type SectionRegistry = Record<string, Record<string, StepEntry[]>>;

// ADR: Prompts are kept co-located with their file mapping so a single edit
// here keeps the UI and the instruction files in sync. Avoids a separate
// data layer for what is essentially a small, static config.

const SECTION_REGISTRY: SectionRegistry = {
    // ── Day 1 ─────────────────────────────────────────────────────────────
    m1: {
        deploy: [
            {
                prompt: 'Run the Day 1 security verification now. Follow the instruction file step by step, report each check as PASS, FAIL, or EXPECTED, and fix anything that fails before moving on.',
                filename: 'day01-security.md',
                label: 'Day 1: Install & Secure Your Lobster',
                defaultOpen: true,
            },
        ],
        security: [
            {
                prompt: 'Run the Day 1 security verification now. Follow the instruction file step by step, report each check as PASS, FAIL, or EXPECTED, and fix anything that fails before moving on.',
                filename: 'day01-security.md',
                label: 'Day 1: Security Hardening',
                defaultOpen: true,
            },
        ],
    },

    // ── Day 2 ─────────────────────────────────────────────────────────────
    m2: {
        'four-files': [
            {
                prompt: 'Follow the Day 2 SOUL.md instruction file. Ask me the questions one at a time, then create the file.',
                filename: 'day02-create-soul.md',
                label: 'Create SOUL.md',
                defaultOpen: true,
            },
            {
                prompt: 'Follow the Day 2 USER.md instruction file. Ask me the questions one at a time, then create the file.',
                filename: 'day02-create-user.md',
                label: 'Create USER.md',
            },
            {
                prompt: 'Follow the Day 2 MEMORY.md instruction file and create the file.',
                filename: 'day02-create-memory.md',
                label: 'Create MEMORY.md',
            },
            {
                prompt: 'Follow the Day 2 AGENTS.md instruction file and create the file.',
                filename: 'day02-create-agents.md',
                label: 'Create AGENTS.md',
            },
        ],
        configuration: [
            {
                prompt: 'Follow the Day 2 finalize-identity instruction file. Verify everything is complete and give me a final report.',
                filename: 'day02-finalize-identity.md',
                label: 'Finalize Identity Configuration',
                defaultOpen: true,
            },
        ],
    },

    // ── Day 3 ─────────────────────────────────────────────────────────────
    m3: {
        build: [
            {
                prompt: 'Follow the Day 3 connect-telegram instruction file. Ask me for what you need, then set up the channel.',
                filename: 'day03-connect-telegram.md',
                label: 'Day 3: Connect Telegram',
                defaultOpen: true,
            },
        ],
    },

    // ── Day 4 ─────────────────────────────────────────────────────────────
    m4: {
        build: [
            {
                prompt: 'Follow the Day 4 daily-reflection-cron instruction file. Ask me for what you need, then create the cron job.',
                filename: 'day04-daily-reflection-cron.md',
                label: 'Day 4: Daily Reflection Cron Job',
                defaultOpen: true,
            },
        ],
    },

    // ── Day 5 ─────────────────────────────────────────────────────────────
    m5: {
        build: [
            {
                prompt: 'Follow the Day 5 install-document-summary instruction file. Inspect the skill first, then install it for this workspace.',
                filename: 'day05-install-document-summary.md',
                label: 'Install document-summary Skill',
                defaultOpen: true,
            },
            {
                prompt: 'Follow the Day 5 create-quick-note-skill instruction file. Create the skill exactly as described and report back when done.',
                filename: 'day05-create-quick-note-skill.md',
                label: 'Create quick-note Skill',
            },
            {
                prompt: 'Follow the Day 5 finalize-skills instruction file. Run the verification and give me a PASS/FAIL report for each item.',
                filename: 'day05-finalize-skills.md',
                label: 'Finalize & Verify Skills',
            },
        ],
    },

    // ── Day 6 ─────────────────────────────────────────────────────────────
    m6: {
        build: [
            {
                prompt: 'Follow the Day 6 install-imap-smtp instruction file. Inspect the imap-smtp-email skill first, ask me for my Gmail address and App Password, and then install and configure the skill.',
                filename: 'day06-install-imap-smtp.md',
                label: 'Install imap-smtp-email',
                defaultOpen: true,
            },
            {
                prompt: 'Follow the Day 6 create-email-triage instruction file. Tell me what you are about to create and wait for my confirmation. Then build the skill, add the Email Security Protocols to AGENTS.md, and create the morning cron job.',
                filename: 'day06-create-email-triage.md',
                label: 'Create email-triage Skill',
            },
            {
                prompt: 'Follow the Day 6 finalize-inbox instruction file. Run the verification and give me a PASS/FAIL report for each checklist item.',
                filename: 'day06-finalize-inbox.md',
                label: 'Finalize & Verify Inbox Setup',
            },
        ],
    },

    // ── Day 7 ─────────────────────────────────────────────────────────────
    m7: {
        build: [
            {
                prompt: 'Follow the Day 7 configure-web-search instruction file. Ask me for my Brave Search API key, then configure the tool.',
                filename: 'day07-configure-web-search.md',
                label: 'Configure Web Search',
                defaultOpen: true,
            },
            {
                prompt: 'Follow the Day 7 create-research-brief instruction file. Create the skill exactly as described and report back when done.',
                filename: 'day07-create-research-brief.md',
                label: 'Create research-brief Skill',
            },
        ],
    },

    // ── Day 8 ─────────────────────────────────────────────────────────────
    m8: {
        build: [
            {
                prompt: 'Follow the Day 8 configure-outbound-email instruction file. Walk me through adding SMTP settings and send me a test email.',
                filename: 'day08-configure-outbound-email.md',
                label: 'Configure Outbound Email (SMTP)',
                defaultOpen: true,
            },
            {
                prompt: 'Follow the Day 8 create-follow-up-email instruction file. Create the skill exactly as described, then give me the trigger phrase.',
                filename: 'day08-create-follow-up-email.md',
                label: 'Create follow-up-email Skill',
            },
            {
                prompt: 'Follow the Day 8 finalize-outbound-email instruction file. Run the verification and give me a PASS/FAIL report for each item.',
                filename: 'day08-finalize-outbound-email.md',
                label: 'Finalize & Verify Outbound Email',
            },
        ],
    },

    // ── Day 9 ─────────────────────────────────────────────────────────────
    m9: {
        build: [
            {
                prompt: 'Follow the Day 9 create-writer-agent instruction file. Tell me what you are about to do, wait for my confirmation, then set up the writer agent.',
                filename: 'day09-create-writer-agent.md',
                label: 'Create the Writer Agent',
                defaultOpen: true,
            },
            {
                prompt: 'Follow the Day 9 enable-teamwork instruction file. Enable agent-to-agent communication and confirm it works.',
                filename: 'day09-enable-teamwork.md',
                label: 'Enable Agent-to-Agent Teamwork',
            },
        ],
    },

    // ── Day 10 ────────────────────────────────────────────────────────────
    m10: {
        build: [
            {
                prompt: 'Follow the Day 10 course-verification instruction file. Run the full verification across all days and give me a day-by-day PASS/FAIL report.',
                filename: 'day10-course-verification.md',
                label: 'Day 10: Course Verification',
                defaultOpen: true,
            },
        ],
    },
};

// ── Props ────────────────────────────────────────────────────────────────────

interface CourseContentProps {
    activeModuleId: string;
    activeSection: string;
    currentModule: { title: string };
    nextLabel: string | null;
    onNavigateNext: () => void;
    isVeryLastSection: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

export const CourseContent = ({
    activeModuleId,
    activeSection,
    nextLabel,
    onNavigateNext,
    isVeryLastSection,
}: CourseContentProps) => {
    const moduleRegistry = SECTION_REGISTRY[activeModuleId];
    const steps = moduleRegistry?.[activeSection] ?? [];
    const totalSteps = steps.length;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {steps.length === 0 ? (
                // Graceful fallback — should never appear for registered sections
                <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 text-center text-slate-500">
                    <p className="text-sm">
                        No steps mapped for{' '}
                        <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                            {activeModuleId}/{activeSection}
                        </code>
                        .
                    </p>
                </div>
            ) : (
                steps.map((step, index) => (
                    <div key={step.filename} className="space-y-3">
                        {/* Step number heading when there are multiple steps */}
                        {totalSteps > 1 && (
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-openclaw-red text-white text-xs font-bold flex-shrink-0">
                                    {index + 1}
                                </span>
                                <span className="text-sm font-semibold text-slate-700">
                                    {step.label}
                                </span>
                            </div>
                        )}

                        {/* Copy-paste prompt card */}
                        <PromptCard
                            prompt={step.prompt}
                            stepLabel={totalSteps > 1 ? `Step ${index + 1} of ${totalSteps}` : undefined}
                        />

                        {/* Expandable instruction details */}
                        <InstructionViewer
                            filename={step.filename}
                            label={step.label}
                            prompt={step.prompt}
                            defaultOpen={step.defaultOpen ?? false}
                        />
                    </div>
                ))
            )}

            {/* Navigation footer */}
            {nextLabel !== null && (
                <NavigationFooter
                    nextLabel={nextLabel}
                    onNext={onNavigateNext}
                />
            )}
            {isVeryLastSection && (
                <NavigationFooter
                    nextLabel=""
                    onNext={onNavigateNext}
                    isFinalModuleComplete
                />
            )}
        </div>
    );
};
