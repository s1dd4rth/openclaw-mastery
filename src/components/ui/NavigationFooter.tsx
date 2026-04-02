"use client";
import React from 'react';
import { ArrowRight, CheckCircle2, Trophy } from 'lucide-react';

interface NavigationFooterProps {
    /** Label for the primary forward CTA (e.g. "Module 2 Checklist") */
    nextLabel: string;
    /** Primary CTA click handler */
    onNext: () => void;
    /** Optional: show the "module complete" celebration variant */
    isFinalModuleComplete?: boolean;
}

/**
 * Shown at the bottom of every course section to guide the learner to
 * the next logical step.  Design principle: always one clear affordance,
 * never two competing buttons.
 */
export const NavigationFooter = ({
    nextLabel,
    onNext,
    isFinalModuleComplete,
}: NavigationFooterProps) => {
    if (isFinalModuleComplete) {
        return (
            <div className="mt-10 pt-8 border-t border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-8 text-center">
                    <Trophy size={40} className="text-emerald-500 mx-auto mb-3" />
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">
                        Course Complete! 🎉
                    </h3>
                    <p className="text-slate-600 max-w-sm mx-auto mb-6">
                        You've built a private, self-hosted AI agent from scratch. Submit the
                        assessment form to claim your completion record.
                    </p>
                    <a
                        href="https://docs.google.com/forms/d/e/1FAIpQLSeoR5wfheIkD0hCaf3eYmJ6s8aNMbylfJ00hi6djlkpIuF1FA/viewform"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-emerald-500 text-white rounded-xl font-semibold text-base shadow-lg shadow-emerald-200 hover:bg-emerald-600 active:scale-95 transition-all"
                    >
                        Submit Assessment
                        <ArrowRight size={18} />
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-10 pt-8 border-t border-slate-200 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Breadcrumb hint */}
            <div className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle2 size={16} className="text-slate-300" />
                <span>When you're ready</span>
            </div>

            {/* Primary CTA */}
            <button
                id={`nav-next-${nextLabel.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={onNext}
                className="
                    group inline-flex items-center gap-2.5
                    px-6 py-3 rounded-xl font-semibold text-sm text-white
                    bg-openclaw-red shadow-md shadow-red-200
                    hover:shadow-lg hover:shadow-red-200 hover:-translate-y-0.5
                    active:translate-y-0 active:shadow-sm
                    transition-all duration-200
                "
            >
                <span>Next: {nextLabel}</span>
                <ArrowRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform duration-200"
                />
            </button>
        </div>
    );
};
