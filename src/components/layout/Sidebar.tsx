import { useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, GraduationCap } from 'lucide-react';
import { MODULES_DATA } from '../../data/modules';
import type { Module } from '../../data/types';

interface SidebarProps {
  moduleDropdownOpen: boolean;
  setModuleDropdownOpen: (open: boolean) => void;
  activeModuleId: string;
  activePhaseId: string;
  onModuleChange: (moduleId: string) => void;
  onPhaseChange: (phaseId: string) => void;
  currentModule: Module;
  completedModulesCount: number;
}

export const Sidebar = ({
  moduleDropdownOpen,
  setModuleDropdownOpen,
  activeModuleId,
  activePhaseId,
  onModuleChange,
  onPhaseChange,
  currentModule,
  completedModulesCount,
}: SidebarProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moduleDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setModuleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [moduleDropdownOpen, setModuleDropdownOpen]);

  return (
    <div className="w-72 flex flex-col bg-white border-r border-openclaw-border h-full relative z-40">
      {/* Logo Section */}
      <div className="p-8 pb-6">
        <div className="flex flex-col gap-1">
          <div className="font-sans font-extrabold text-2xl tracking-tighter text-openclaw-dark select-none">
            Open<span className="text-openclaw-red">Claw</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-openclaw-red/30" />
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-openclaw-dark/30">Mastery Course</p>
          </div>
        </div>
      </div>

      {/* Module Selector */}
      <div className="px-4 pb-6 border-b border-openclaw-border relative" ref={dropdownRef}>
        <div className="text-[11px] font-bold text-openclaw-dark/40 uppercase tracking-[0.15em] mb-2 px-2">
          Course Module
        </div>
        <button
          onClick={() => setModuleDropdownOpen(!moduleDropdownOpen)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-openclaw-bg3 border border-openclaw-border rounded-xl text-left shadow-sm hover:border-openclaw-red transition-all duration-200"
        >
          <div className="flex items-center gap-2 truncate">
            <currentModule.icon size={16} className="text-openclaw-red flex-shrink-0" />
            <span className="font-semibold text-sm truncate text-openclaw-dark">
              {currentModule.shortTitle}
            </span>
          </div>
          <ChevronDown
            size={16}
            className={`text-openclaw-dark/40 transition-transform duration-200 ${moduleDropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {moduleDropdownOpen && (
          <div className="absolute top-full left-4 right-4 mt-2 bg-white border border-openclaw-border rounded-xl shadow-xl z-50 max-h-[60vh] overflow-y-auto py-1.5 animate-in fade-in slide-in-from-top-1">
            {MODULES_DATA.map(mod => (
              <button
                key={mod.id}
                onClick={() => {
                  onModuleChange(mod.id);
                  setModuleDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-3 hover:bg-openclaw-bg3 transition-colors
                  ${activeModuleId === mod.id ? 'bg-openclaw-bg3/50 text-openclaw-red font-semibold' : 'text-openclaw-dark/70'}
                `}
              >
                <mod.icon
                  size={16}
                  className={activeModuleId === mod.id ? 'text-openclaw-red' : 'text-openclaw-dark/30'}
                />
                <span className="truncate">{mod.shortTitle}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Phase list */}
      <nav className="flex-1 p-4 space-y-8 overflow-y-auto mt-4">
        <div className="space-y-3">
          <div className="px-2 flex items-center gap-2">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-openclaw-dark/40">
              Phases
            </h2>
          </div>
          <div className="space-y-1">
            {currentModule.phases.map(phase => {
              const Icon = phase.icon;
              const isActive = activePhaseId === phase.id;
              return (
                <button
                  key={phase.id}
                  onClick={() => onPhaseChange(phase.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left text-sm font-medium group relative
                    ${isActive
                      ? 'bg-openclaw-bg3 text-openclaw-dark shadow-sm'
                      : 'text-openclaw-dark/60 hover:bg-openclaw-bg3/50 hover:text-openclaw-dark'}
                  `}
                >
                  <Icon size={18} className={isActive ? 'text-openclaw-red' : 'text-openclaw-dark/30 group-hover:text-openclaw-dark/50'} />
                  <span className="truncate">{phase.title}</span>
                  {isActive && <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-openclaw-red rounded-r-full" />}
                  {isActive && <ChevronRight size={14} className="ml-auto opacity-40" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Extra Resources */}
        <div className="pt-4 border-t border-openclaw-border space-y-3">
          <div className="px-2 flex items-center gap-2">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-openclaw-dark/40">
              Resources
            </h2>
          </div>
          <div className="space-y-1">
            <a 
              href="https://s1dd4rth.github.io/openclaw-mastery/openclaw-unpacked.html" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-openclaw-dark/60 hover:bg-openclaw-bg3/50 hover:text-openclaw-dark transition-all duration-200 group"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-openclaw-dark/10 group-hover:bg-openclaw-dark/20 transition-colors" />
              <span className="text-sm font-medium tracking-tight">OpenClaw Unpacked</span>
              <span className="ml-auto text-[10px] text-openclaw-dark/30 group-hover:text-openclaw-dark/50 transition-colors">↗</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Course progress */}
      <div className="p-4 border-t border-slate-200">
        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <GraduationCap size={16} className="text-emerald-600 flex-shrink-0" />
              <div className="text-sm font-semibold text-emerald-900">Progress</div>
            </div>
            <div className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              {completedModulesCount}/{MODULES_DATA.length}
            </div>
          </div>
          <div className="w-full h-2.5 bg-emerald-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${Math.round((completedModulesCount / MODULES_DATA.length) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
