"use client";
import React from 'react';
import { CheckCircle, Circle, Trophy } from 'lucide-react';
import { NavigationFooter } from '../ui/NavigationFooter';

interface ChecklistProps {
    currentModule: any;
    completedItems: Set<string>;
    toggleItem: (id: string) => void;
    progressPercentage: number;
    nextLabel: string | null;
    onNavigateNext: () => void;
    isVeryLastSection: boolean;
}

export const Checklist = ({
    currentModule,
    completedItems,
    toggleItem,
    progressPercentage,
    nextLabel,
    onNavigateNext,
    isVeryLastSection,
}: ChecklistProps) => {
    const isModuleComplete = progressPercentage === 100;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                            {currentModule.title.split(':')[0]} Completion
                        </h2>
                        <p className="text-slate-600">
                            Verify that all the following statements are true before concluding this module.
                        </p>
                    </div>
                    <div className="flex flex-col items-end min-w-[120px]">
                        <span className="text-3xl font-bold text-openclaw-red mb-1">
                            {progressPercentage}%
                        </span>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            <div
                                className="h-full bg-openclaw-red transition-all duration-500 ease-out"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Checklist items */}
                <div className="space-y-3">
                    {currentModule.checklistItems.map((item: any) => {
                        const isChecked = completedItems.has(item.id);
                        return (
                            <button
                                key={item.id}
                                onClick={() => toggleItem(item.id)}
                                className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all hover:shadow-sm ${
                                    isChecked
                                        ? 'bg-red-50 border-red-200 shadow-sm'
                                        : 'bg-white border-slate-200 hover:border-openclaw-red/30'
                                }`}
                            >
                                <div
                                    className={`flex-shrink-0 transition-colors ${
                                        isChecked ? 'text-openclaw-red' : 'text-slate-300'
                                    }`}
                                >
                                    {isChecked ? (
                                        <CheckCircle size={24} />
                                    ) : (
                                        <Circle size={24} />
                                    )}
                                </div>
                                <span
                                    className={`text-base ${
                                        isChecked
                                            ? 'text-slate-900 font-medium'
                                            : 'text-slate-600'
                                    }`}
                                >
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Completion celebration — only when all items are ticked */}
                {isModuleComplete && (
                    <div className="mt-8 p-6 bg-emerald-50 border border-emerald-200 rounded-xl animate-in zoom-in duration-300">
                        <div className="flex items-center gap-3 mb-2">
                            <Trophy size={22} className="text-emerald-500" />
                            <h3 className="text-lg font-bold text-emerald-800">
                                Module Complete!
                            </h3>
                        </div>
                        <p className="text-emerald-700 text-sm">
                            You've verified every requirement for{' '}
                            <strong>{currentModule.title.split(':')[0]}</strong>. You're ready to
                            move on.
                        </p>
                    </div>
                )}

                {/* Not yet complete nudge */}
                {!isModuleComplete && (
                    <p className="mt-6 text-sm text-slate-400 text-center">
                        {currentModule.checklistItems.length -
                            currentModule.checklistItems.filter((i: any) =>
                                completedItems.has(i.id),
                            ).length}{' '}
                        item
                        {currentModule.checklistItems.length -
                            currentModule.checklistItems.filter((i: any) =>
                                completedItems.has(i.id),
                            ).length !==
                        1
                            ? 's'
                            : ''}{' '}
                        remaining — check them off as you complete them.
                    </p>
                )}
            </div>

            {/* Navigation footer — always shows; button label adapts */}
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
