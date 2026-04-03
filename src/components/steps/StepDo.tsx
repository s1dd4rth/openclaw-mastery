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
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {requiresInput.label}
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder={requiresInput.placeholder}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-openclaw-red/30 focus:border-openclaw-red"
          />
        </div>
      )}

      {/* Prompt display + action */}
      <div className="rounded-xl border-2 border-openclaw-red/20 bg-gradient-to-br from-red-50 to-rose-50 shadow-sm overflow-hidden">
        <div className="px-4 py-3 text-sm text-slate-700 font-mono leading-relaxed select-all">
          {prompt}
        </div>
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-openclaw-red/10 border-t border-openclaw-red/15">
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={handleCopyAndExecute}
              disabled={!!requiresInput && !inputValue}
              className="flex items-center gap-2 px-4 py-2 bg-openclaw-red text-white rounded-lg text-sm font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {copied ? (
                <>
                  <Check size={14} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={14} />
                  Copy &amp; Run in Claw
                </>
              )}
            </button>
            {copied && (
              <span className="text-xs text-emerald-700 font-medium">
                Now switch to your Claw's chat tab and paste it there.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
