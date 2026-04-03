import { useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { CopyButton } from '../ui/CopyButton';

interface StepDoProps {
  prompt: string;
  instructionUrl?: string;
  requiresInput?: {
    label: string;
    placeholder: string;
    storeAs: string;
  };
  isConnected: boolean;
  isSending: boolean;
  userInputs: Record<string, string>;
  controlUiUrl: string;
  onExecute: (fullPrompt: string) => void;
  onSaveInput: (key: string, value: string) => void;
}

export const StepDo = ({
  prompt,
  instructionUrl,
  requiresInput,
  isConnected,
  isSending,
  userInputs,
  controlUiUrl,
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

  const handleExecute = async () => {
    if (requiresInput && inputValue) {
      onSaveInput(requiresInput.storeAs, inputValue);
    }
    const fullPrompt = buildFullPrompt();

    // Copy prompt to clipboard
    try {
      await navigator.clipboard.writeText(fullPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Clipboard write failed — still open the Control UI
    }

    // Open the Control UI in a new tab
    window.open(controlUiUrl, '_blank');

    // Also notify the parent (for any side-effects like logging)
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
        <div className="px-4 py-3 text-sm text-slate-700 font-mono leading-relaxed">
          {prompt}
        </div>
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-openclaw-red/10 border-t border-openclaw-red/15">
          {isConnected ? (
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={handleExecute}
                disabled={isSending || (!!requiresInput && !inputValue)}
                className="flex items-center gap-2 px-4 py-2 bg-openclaw-red text-white rounded-lg text-sm font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Opening...
                  </>
                ) : (
                  <>
                    <ExternalLink size={14} />
                    Execute
                  </>
                )}
              </button>
              {copied && (
                <span className="text-xs text-emerald-700 font-medium">
                  Prompt copied! Paste it in your Claw's chat window that just opened.
                </span>
              )}
            </div>
          ) : (
            <CopyButton text={buildFullPrompt()} label="Copy Prompt" />
          )}
        </div>
      </div>
    </div>
  );
};
