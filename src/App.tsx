"use client";
import React, { useState } from 'react';
import { MODULES_DATA } from './data/modules';
import { useProgress, useNavState } from './hooks/useProgress';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { CourseContent } from './components/sections/CourseContent';
import { Checklist } from './components/sections/Checklist';
import { Troubleshooting } from './components/sections/Troubleshooting';

export default function App() {
    // ── Top-level navigation state (persisted to localStorage) ──────────────
    const {
        activeModuleId,
        activeSection,
        setActiveModuleId,
        setActiveSection,
        setModuleAndSection,
        isNavLoaded,
    } = useNavState(MODULES_DATA[0]!.id, MODULES_DATA[0]!.sections[0]!.id);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [moduleDropdownOpen, setModuleDropdownOpen] = useState(false);

    // ── Progress (localStorage) ─────────────────────────────────────────────
    const { completedItems, toggleItem, isLoaded } = useProgress('openclawMasteryProgress');

    const currentModule = MODULES_DATA.find(m => m.id === activeModuleId) || MODULES_DATA[0]!;

    // ── Module switch: always reset to first section ────────────────────────
    const handleModuleChange = (moduleId: string) => {
        const targetModule = MODULES_DATA.find(m => m.id === moduleId);
        if (targetModule) {
            // Atomic write so both module + section are persisted together
            setModuleAndSection(moduleId, targetModule.sections[0]!.id);
        }
    };

    // ── Per-module checklist progress ───────────────────────────────────────
    const completedInCurrentModule =
        currentModule?.checklistItems?.filter((item: { id: string }) =>
            completedItems.has(item.id),
        ).length ?? 0;

    const progressPercentage =
        Math.round((completedInCurrentModule / (currentModule?.checklistItems?.length || 1)) * 100) || 0;

    // A module is "complete" when every checklist item is ticked.
    const completedModulesCount = MODULES_DATA.filter(
        module =>
            module.checklistItems.length > 0 &&
            module.checklistItems.every((item: { id: string }) => completedItems.has(item.id)),
    ).length;

    // ── Linear "next" navigation ─────────────────────────────────────────────
    /**
     * Navigate to the next section within the current module, or — if this
     * is the last section — jump to the first section of the next module.
     * At the very last section of the very last module, this is a no-op
     * (the completion screen renders instead).
     */
    const navigateNext = () => {
        const sections = currentModule.sections;
        const currentSectionIndex = sections.findIndex((s: any) => s.id === activeSection);
        const nextSectionInModule = sections[currentSectionIndex + 1];

        if (nextSectionInModule) {
            // Advance within the same module — persists single field
            setActiveSection(nextSectionInModule.id);
        } else {
            // Cross module boundary — atomic write
            const currentModuleIndex = MODULES_DATA.findIndex(m => m.id === activeModuleId);
            const nextModule = MODULES_DATA[currentModuleIndex + 1];
            if (nextModule) {
                setModuleAndSection(nextModule.id, nextModule.sections[0]!.id);
            }
            // If no next module → end of course; completion card renders instead
        }
    };

    /**
     * Returns the human-readable label for the next step, used as the CTA
     * button text.  Falls back to the next module name when crossing a
     * module boundary, and returns null only at the very end of the course.
     */
    const getNextLabel = (): string | null => {
        const sections = currentModule.sections;
        const currentSectionIndex = sections.findIndex((s: any) => s.id === activeSection);
        const nextSectionInModule = sections[currentSectionIndex + 1];

        if (nextSectionInModule) {
            return nextSectionInModule.title;
        }

        const currentModuleIndex = MODULES_DATA.findIndex(m => m.id === activeModuleId);
        const nextModule = MODULES_DATA[currentModuleIndex + 1];
        if (nextModule) {
            return nextModule.shortTitle;
        }

        return null; // end of course
    };

    const nextLabel = getNextLabel();
    const isVeryLastSection =
        nextLabel === null &&
        completedModulesCount === MODULES_DATA.length;

    // ── Content renderer ─────────────────────────────────────────────────────
    const renderContent = () => {
        const navProps = {
            nextLabel,
            onNavigateNext: navigateNext,
            isVeryLastSection,
        };

        if (activeSection === 'checklist') {
            return (
                <Checklist
                    currentModule={currentModule}
                    completedItems={completedItems}
                    toggleItem={toggleItem}
                    progressPercentage={progressPercentage}
                    {...navProps}
                />
            );
        }

        if (activeSection === 'troubleshooting') {
            return (
                <Troubleshooting
                    currentModule={currentModule}
                    {...navProps}
                />
            );
        }

        return (
            <CourseContent
                activeModuleId={activeModuleId}
                activeSection={activeSection}
                currentModule={currentModule}
                {...navProps}
            />
        );
    };

    // ── Loading gate — wait for both checklist + nav to rehydrate ────────────
    if (!isLoaded || !isNavLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center text-slate-500">
                Loading mastery curriculum...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent font-sans text-slate-900 flex flex-col md:flex-row">
            <Header
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
            />

            <Sidebar
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
                moduleDropdownOpen={moduleDropdownOpen}
                setModuleDropdownOpen={setModuleDropdownOpen}
                activeModuleId={activeModuleId}
                setActiveModuleId={handleModuleChange}
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                currentModule={currentModule}
                completedInCurrentModule={completedInCurrentModule}
                progressPercentage={progressPercentage}
                completedModulesCount={completedModulesCount}
                totalModulesCount={MODULES_DATA.length}
            />

            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 overflow-y-auto">
                {/* Module Header */}
                <div className="mb-8">
                    <div className="text-sm font-semibold text-openclaw-red mb-2 tracking-wide uppercase">
                        {currentModule.shortTitle}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight leading-tight">
                        {currentModule.title}
                    </h1>
                    <p className="text-lg text-slate-600 max-w-3xl leading-relaxed">
                        {currentModule.description}
                    </p>
                </div>

                {/* Section content with nav footer injected */}
                {renderContent()}
            </main>
        </div>
    );
}