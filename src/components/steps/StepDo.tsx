import { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
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
  onExecute,
  onSaveInput,
}: StepDoProps) => {
  const [inputValue, setInputValue] = useState(
    requiresInput ? (userInputs[requiresInput.storeAs] ?? '') : '',
  );

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

  const handleExecute = () => {
    if (requiresInput && inputValue) {
      onSaveInput(requiresInput.storeAs, inputValue);
    }
    onExecute(buildFullPrompt());
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
        <div className="flex items-center justify-end gap-2 px-4 py-2.5 bg-openclaw-red/10 border-t border-openclaw-red/15">
          {isConnected ? (
            <button
              onClick={handleExecute}
              disabled={isSending || (requiresInput && !inputValue)}
              className="flex items-center gap-2 px-4 py-2 bg-openclaw-red text-white rounded-lg text-sm font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play size={14} />
                  Execute
                </>
              )}
            </button>
          ) : (
            <CopyButton text={buildFullPrompt()} label="Copy Prompt" />
          )}
        </div>
      </div>
    </div>
  );
};
