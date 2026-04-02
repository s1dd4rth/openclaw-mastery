"use client";
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { NavigationFooter } from '../ui/NavigationFooter';

interface TroubleshootingProps {
    currentModule: any;
    nextLabel: string | null;
    onNavigateNext: () => void;
    isVeryLastSection: boolean;
}

export const Troubleshooting = ({
    currentModule,
    nextLabel,
    onNavigateNext,
    isVeryLastSection,
}: TroubleshootingProps) => {
    const hasItems =
        currentModule.troubleshootingItems &&
        currentModule.troubleshootingItems.length > 0;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Troubleshooting</h2>
                <p className="text-slate-600 mb-6">
                    Common issues and their resolutions for this module.
                </p>

                {hasItems ? (
                    <div className="grid gap-4">
                        {currentModule.troubleshootingItems.map(
                            (item: any, index: number) => (
                                <div
                                    key={index}
                                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:shadow-sm transition-shadow"
                                >
                                    <h3 className="font-semibold text-slate-900 flex items-start gap-3 mb-2">
                                        <AlertTriangle
                                            size={18}
                                            className="text-amber-500 mt-0.5 flex-shrink-0"
                                        />
                                        {item.issue}
                                    </h3>
                                    <p className="text-slate-600 pl-7 text-sm leading-relaxed">
                                        {item.solution}
                                    </p>
                                </div>
                            ),
                        )}
                    </div>
                ) : (
                    <p className="text-center text-slate-400 py-8">
                        No common troubleshooting steps documented for this module yet.
                    </p>
                )}
            </div>

            {/* Linear navigation */}
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
