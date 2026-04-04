import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface StepDoProps {
  prompt: string;
  instructionUrl?: string;
  requiresInput?: {
    label: string;
    placeholder: string;
    storeAs: string;
  };
  userInputs: Record<string, string>;
  onExecute: (fullPrompt: string) => void;
  onSaveInput: (key: string, value: string) => void;
}

export const StepDo = ({
  prompt,
  instructionUrl,
  requiresInput,
  userInputs,
  onExecute,
  onSaveInput,
}: StepDoProps) => {
  const [inputValue, setInputValue] = useState(
    requiresInput ? (userInputs[requiresInput.storeAs] ?? '') : '',
  );
  const [copied, setCopied] = useState(false);

  const buildFullPrompt = (): string => {
    let full = prompt;
    if (instructionUrl) {
      full = `Read the instruction at ${instructionUrl} and follow it. ${prompt}`;
    }
    if (requiresInput && inputValue) {
      full = `${full} The user's answer: ${inputValue}`;
    }
    return full;
  };

  const handleCopyAndExecute = async () => {
    if (requiresInput && inputValue) {
      onSaveInput(requiresInput.storeAs, inputValue);
    }
    const fullPrompt = buildFullPrompt();

    try {
      await navigator.clipboard.writeText(fullPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 5000);
    } catch {
      // fallback: user can manually select the prompt text
    }

    onExecute(fullPrompt);
  };

  return (
    <div className="space-y-3">
      {/* User input field if required */}
      {requiresInput && (
        <div className="bg-openclaw-bg3 p-4 rounded-xl border border-openclaw-border mb-4">
          <label className="block text-[11px] font-bold text-openclaw-dark/50 uppercase tracking-wider mb-2 px-1">
            {requiresInput.label}
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder={requiresInput.placeholder}
            className="w-full px-4 py-3 bg-white border border-openclaw-border rounded-lg text-sm font-medium text-openclaw-dark placeholder:text-openclaw-dark/20 focus:outline-none focus:ring-2 focus:ring-openclaw-red/10 focus:border-openclaw-red transition-all"
          />
        </div>
      )}

      {/* Prompt display + action */}
      <div className="rounded-2xl border border-openclaw-border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-5 text-sm text-openclaw-dark/80 font-mono leading-relaxed select-all bg-openclaw-bg/30">
          {prompt}
        </div>
        <div className="flex items-center justify-between gap-3 px-6 py-4 bg-openclaw-bg3 border-t border-openclaw-border">
          <div className="flex flex-wrap items-center gap-4 w-full">
            <button
              onClick={handleCopyAndExecute}
              disabled={!!requiresInput && !inputValue}
              className="flex items-center gap-2 px-6 py-2.5 bg-openclaw-red text-white rounded-xl text-sm font-bold hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:grayscale disabled:scale-100 transition-all shadow-md shadow-openclaw-red/20"
            >
              {copied ? (
                <>
                  <Check size={16} strokeWidth={3} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={16} strokeWidth={2.5} />
                  Copy &amp; Paste to Claw
                </>
              )}
            </button>
            {copied && (
              <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full animate-in fade-in slide-in-from-left-2">
                Now switch to your Claw's chat tab and paste it there.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
