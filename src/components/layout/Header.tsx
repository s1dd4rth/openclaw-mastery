"use client";
import React from 'react';
import { Menu, X } from 'lucide-react';
import { LogoIcon } from '../ui/LogoIcon';

interface HeaderProps {
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
}

export const Header = ({ mobileMenuOpen, setMobileMenuOpen }: HeaderProps) => {
    return (
        <div className="md:hidden flex items-center justify-between p-4 bg-white/70 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-20 shadow-sm">
            <div className="flex items-center gap-2 text-lg text-slate-900 tracking-tight">
                <LogoIcon className="w-7 h-7 flex-shrink-0" />
                <span className="flex whitespace-nowrap">
                    <span className="font-extrabold">OpenClaw</span>
                    <span className="font-light ml-1 text-slate-500">Mastery</span>
                </span>
            </div>
            <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 -mr-2 text-slate-500 hover:text-openclaw-red hover:bg-red-50 transition-colors rounded-md"
            >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
        </div>
    );
};
