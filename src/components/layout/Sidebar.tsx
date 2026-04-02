"use client";
import React from 'react';
import { ChevronDown, ChevronRight, GraduationCap, ListChecks } from 'lucide-react';
import { MODULES_DATA } from '../../data/modules';
import { LogoIcon } from '../ui/LogoIcon';

interface SidebarProps {
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
    moduleDropdownOpen: boolean;
    setModuleDropdownOpen: (open: boolean) => void;
    activeModuleId: string;
    setActiveModuleId: (id: string) => void;
    activeSection: string;
    setActiveSection: (id: string) => void;
    currentModule: any;
    completedInCurrentModule: number;
    progressPercentage: number;
    completedModulesCount: number;
    totalModulesCount: number;
}

export const Sidebar = ({
    mobileMenuOpen,
    setMobileMenuOpen,
    moduleDropdownOpen,
    setModuleDropdownOpen,
    activeModuleId,
    setActiveModuleId,
    activeSection,
    setActiveSection,
    currentModule,
    completedInCurrentModule,
    progressPercentage,
    completedModulesCount,
    totalModulesCount
}: SidebarProps) => {
    const handleModuleSelect = (moduleId: string) => {
        setActiveModuleId(moduleId);
        setModuleDropdownOpen(false);
        setMobileMenuOpen(false);
    };

    return (
        <aside className={`
            fixed md:sticky top-0 left-0 z-10 w-72 h-screen bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out flex flex-col
            ${mobileMenuOpen ? 'translate-x-0 pt-16 md:pt-0' : '-translate-x-full md:translate-x-0'}
        `}>
            <div className="hidden md:flex items-center gap-3 p-6 border-b border-slate-200">
                <LogoIcon className="w-8 h-8 flex-shrink-0" />
                <span className="text-xl tracking-tight text-slate-900 flex whitespace-nowrap">
                    <span className="font-extrabold">OpenClaw</span>
                    <span className="font-light ml-1 text-slate-500">Mastery</span>
                </span>
            </div>

            {/* Module Selector */}
            <div className="p-4 border-b border-slate-200 relative">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
                    Select Module
                </div>
                <button
                    onClick={() => setModuleDropdownOpen(!moduleDropdownOpen)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-left shadow-sm hover:border-openclaw-red transition-colors"
                >
                    <div className="flex items-center gap-2 truncate">
                        {currentModule.icon && <currentModule.icon size={16} className="text-openclaw-red flex-shrink-0" />}
                        <span className="font-medium text-sm truncate text-slate-900">{currentModule.shortTitle}</span>
                    </div>
                    <ChevronDown size={16} className={`text-slate-400 transition-transform ${moduleDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {moduleDropdownOpen && (
                    <div className="absolute top-full left-4 right-4 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-[60vh] overflow-y-auto py-1">
                        {MODULES_DATA.map(module => (
                            <button
                                key={module.id}
                                onClick={() => handleModuleSelect(module.id)}
                                className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-3 hover:bg-slate-50 transition-colors
                                    ${activeModuleId === module.id ? 'bg-red-50 text-openclaw-red font-medium' : 'text-slate-700'}
                                `}
                            >
                                <module.icon size={16} className={activeModuleId === module.id ? 'text-openclaw-red' : 'text-slate-400'} />
                                <span className="truncate">{module.title}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-3 mt-2">
                    Sections
                </div>
                {currentModule.sections.map((section: any) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    return (
                        <button
                            key={section.id}
                            onClick={() => {
                                setActiveSection(section.id);
                                setMobileMenuOpen(false);
                            }}
                            className={`
                                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left text-sm font-medium
                                ${isActive
                                    ? 'bg-openclaw-red text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
                            `}
                        >
                            <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                            {section.title}
                            {isActive && <ChevronRight size={16} className="ml-auto opacity-50" />}
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-200 space-y-3">
                {/* Overall course progress — Emerald / green accent */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <GraduationCap size={16} className="text-emerald-600 flex-shrink-0" />
                            <div className="text-sm font-semibold text-emerald-900">Course Progress</div>
                        </div>
                        <div className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            {completedModulesCount}/{totalModulesCount}
                        </div>
                    </div>
                    <div className="w-full h-2.5 bg-emerald-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                            style={{ width: `${Math.round((completedModulesCount / totalModulesCount) * 100)}%` }}
                        />
                    </div>
                    <div className="text-xs text-emerald-600 mt-1.5">
                        {totalModulesCount - completedModulesCount} modules remaining
                    </div>
                </div>

                {/* Per-module task progress — OpenClaw red accent */}
                <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                            <ListChecks size={14} className="text-openclaw-red flex-shrink-0" />
                            <div className="text-xs font-semibold text-slate-700 truncate" title={`${currentModule.shortTitle} Tasks`}>
                                {currentModule.shortTitle}
                            </div>
                        </div>
                        <div className="text-xs font-bold text-openclaw-red tabular-nums flex-shrink-0">
                            {completedInCurrentModule}/{currentModule.checklistItems.length}
                        </div>
                    </div>
                    <div className="w-full h-1.5 bg-red-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-openclaw-red transition-all duration-500 rounded-full"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>
            </div>
        </aside>
    );
};
