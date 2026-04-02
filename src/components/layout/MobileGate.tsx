import { Monitor } from 'lucide-react';

interface MobileGateProps {
  onContinueAnyway: () => void;
}

export const MobileGate = ({ onContinueAnyway }: MobileGateProps) => (
  <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
    <div className="max-w-sm text-center">
      <Monitor size={48} className="text-slate-300 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-slate-900 mb-3">
        Best on a Larger Screen
      </h2>
      <p className="text-sm text-slate-500 mb-6 leading-relaxed">
        This course involves configuring a VPS, running terminal commands, and
        working alongside your OpenClaw instance. Please open on a laptop or
        desktop for the best experience.
      </p>
      <button
        onClick={onContinueAnyway}
        className="text-sm text-slate-400 hover:text-slate-600 underline underline-offset-2 transition-colors"
      >
        Continue anyway
      </button>
    </div>
  </div>
);
