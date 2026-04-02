"use client";
import React from 'react';
import { CopyButton } from './CopyButton';
import { MessageSquare } from 'lucide-react';

interface PromptCardProps {
    /** The exact text the learner pastes into OpenClaw */
    prompt: string;
    /** Step number label, e.g. "Step 1 of 3" */
    stepLabel?: string;
}

/**
 * Renders a visually distinct card containing the exact prompt the learner
 * should copy and paste into their OpenClaw chat.
 *
 * Design intent: make it impossible to miss — the learner should never have
 * to hunt for what to type.
 */
export const PromptCard = ({ prompt, stepLabel }: PromptCardProps) => (
    <div className="rounded-xl border-2 border-openclaw-red/20 bg-gradient-to-br from-red-50 to-rose-50 shadow-sm overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-openclaw-red/10 border-b border-openclaw-red/15">
            <div className="flex items-center gap-2">
                <MessageSquare size={15} className="text-openclaw-red flex-shrink-0" />
                <span className="text-xs font-bold uppercase tracking-widest text-openclaw-red">
                    Paste into OpenClaw
                </span>
                {stepLabel && (
                    <span className="text-xs text-red-400 font-medium ml-1">
                        · {stepLabel}
                    </span>
                )}
            </div>
            <CopyButton text={prompt} />
        </div>

        {/* Prompt text */}
        <pre
            className="px-5 py-4 text-sm text-slate-800 font-mono leading-relaxed whitespace-pre-wrap break-words select-all"
            style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
        >
            {prompt}
        </pre>
    </div>
);
