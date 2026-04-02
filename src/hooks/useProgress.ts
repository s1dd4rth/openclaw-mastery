"use client";
import { useState, useEffect } from 'react';

// ── Navigation state shape ────────────────────────────────────────────────────
interface PersistedNavState {
    moduleId: string;
    sectionId: string;
}

const NAV_STORAGE_KEY = 'openclawMasteryNavState';

// ── useProgress: checklist item toggles ──────────────────────────────────────
export const useProgress = (storageKey = 'openclawMasteryProgress') => {
    const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved) as string[];
                setCompletedItems(new Set(parsed));
            }
        } catch {
            // Silently handle corrupt or unexpectedly formatted data.
        }
        setIsLoaded(true);
    }, [storageKey]);

    const toggleItem = (id: string) => {
        setCompletedItems(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            if (isLoaded) {
                try {
                    localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
                } catch {
                    // Silently handle quota exceeded or access denied errors.
                }
            }

            return next;
        });
    };

    return { completedItems, toggleItem, isLoaded };
};

// ── useNavState: remembers the last module + section the user was on ──────────
export const useNavState = (defaultModuleId: string, defaultSectionId: string) => {
    const [activeModuleId, setActiveModuleIdRaw] = useState(defaultModuleId);
    const [activeSection, setActiveSectionRaw] = useState(defaultSectionId);
    const [isNavLoaded, setIsNavLoaded] = useState(false);

    // Rehydrate on first mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(NAV_STORAGE_KEY);
            if (saved) {
                const { moduleId, sectionId } = JSON.parse(saved) as PersistedNavState;
                if (moduleId) setActiveModuleIdRaw(moduleId);
                if (sectionId) setActiveSectionRaw(sectionId);
            }
        } catch {
            // Fall back to defaults silently.
        }
        setIsNavLoaded(true);
    }, []);

    // Persist every time navigation changes
    const persistNav = (moduleId: string, sectionId: string) => {
        try {
            const navState: PersistedNavState = { moduleId, sectionId };
            localStorage.setItem(NAV_STORAGE_KEY, JSON.stringify(navState));
        } catch {
            // Quota exceeded — degrade gracefully.
        }
    };

    const setActiveModuleId = (moduleId: string) => {
        setActiveModuleIdRaw(moduleId);
        persistNav(moduleId, activeSection);
    };

    const setActiveSection = (sectionId: string) => {
        setActiveSectionRaw(sectionId);
        persistNav(activeModuleId, sectionId);
    };

    /**
     * Atomically updates both module and section (e.g. when jumping to a new
     * module's first section) and persists in a single write.
     */
    const setModuleAndSection = (moduleId: string, sectionId: string) => {
        setActiveModuleIdRaw(moduleId);
        setActiveSectionRaw(sectionId);
        persistNav(moduleId, sectionId);
    };

    return {
        activeModuleId,
        activeSection,
        setActiveModuleId,
        setActiveSection,
        setModuleAndSection,
        isNavLoaded,
    };
};
