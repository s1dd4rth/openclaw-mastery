import { useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, GraduationCap } from 'lucide-react';
import { MODULES_DATA } from '../../data/modules';
import type { Module } from '../../data/types';
import { LogoIcon } from '../ui/LogoIcon';
import { ConnectionIndicator } from '../connection/ConnectionIndicator';

interface SidebarProps {
  moduleDropdownOpen: boolean;
  setModuleDropdownOpen: (open: boolean) => void;
  activeModuleId: string;
  activePhaseId: string;
  onModuleChange: (moduleId: string) => void;
  onPhaseChange: (phaseId: string) => void;
  currentModule: Module;
  isConnected: boolean;
  clawName?: string;
  onOpenPairing: () => void;
  onDisconnect: () => void;
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
  isConnected,
  clawName,
  onOpenPairing,
  onDisconnect,
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
    <div className="app-sidebar flex flex-col bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 p-6 border-b border-slate-200">
        <LogoIcon className="w-8 h-8 flex-shrink-0" />
        <span className="text-xl tracking-tight text-slate-900 flex whitespace-nowrap">
          <span className="font-extrabold">OpenClaw</span>
          <span className="font-light ml-1 text-slate-500">Mastery</span>
        </span>
      </div>

      {/* Connection */}
      <div className="px-4 pt-4">
        <ConnectionIndicator
          isConnected={isConnected}
          clawName={clawName}
          onClickConnect={onOpenPairing}
          onClickDisconnect={onDisconnect}
        />
      </div>

      {/* Module Selector */}
      <div className="p-4 border-b border-slate-200 relative" ref={dropdownRef}>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
          Module
        </div>
        <button
          onClick={() => setModuleDropdownOpen(!moduleDropdownOpen)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-left shadow-sm hover:border-openclaw-red transition-colors"
        >
          <div className="flex items-center gap-2 truncate">
            <currentModule.icon size={16} className="text-openclaw-red flex-shrink-0" />
            <span className="font-medium text-sm truncate text-slate-900">
              {currentModule.shortTitle}
            </span>
          </div>
          <ChevronDown
            size={16}
            className={`text-slate-400 transition-transform ${moduleDropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {moduleDropdownOpen && (
          <div className="absolute top-full left-4 right-4 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-[60vh] overflow-y-auto py-1">
            {MODULES_DATA.map(mod => (
              <button
                key={mod.id}
                onClick={() => {
                  onModuleChange(mod.id);
                  setModuleDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-3 hover:bg-slate-50 transition-colors
                  ${activeModuleId === mod.id ? 'bg-red-50 text-openclaw-red font-medium' : 'text-slate-700'}
                `}
              >
                <mod.icon
                  size={16}
                  className={activeModuleId === mod.id ? 'text-openclaw-red' : 'text-slate-400'}
                />
                <span className="truncate">{mod.shortTitle}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Phase list */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-3 mt-2">
          Phases
        </div>
        {currentModule.phases.map(phase => {
          const Icon = phase.icon;
          const isActive = activePhaseId === phase.id;
          return (
            <button
              key={phase.id}
              onClick={() => onPhaseChange(phase.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left text-sm font-medium
                ${isActive
                  ? 'bg-openclaw-red text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
              `}
            >
              <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
              {phase.title}
              {isActive && <ChevronRight size={16} className="ml-auto opacity-50" />}
            </button>
          );
        })}
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
