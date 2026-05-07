import { useState } from 'react';
import { Award, Copy, Check } from 'lucide-react';
import type { VerifyResult } from '../../data/types';

interface CompletionCodeBannerProps {
  /** All verify results for the M10 step. The banner picks out the `completion-code` entry. */
  results: Record<string, VerifyResult> | undefined;
}

function extractCode(results: Record<string, VerifyResult> | undefined): string | null {
  const entry = results?.['completion-code'];
  if (!entry || !entry.pass) return null;

  // Preferred: validator put the code in evidence.code
  const evidence = entry.evidence;
  if (evidence && typeof evidence === 'object' && 'code' in evidence) {
    const code = (evidence as { code: unknown }).code;
    if (typeof code === 'string' && code.length > 0) return code;
  }

  // Fallback: parse "Completion code: XYZ" out of detail
  const match = entry.detail.match(/completion code[:\s]+(\S+)/i);
  return match?.[1] ?? null;
}

export const CompletionCodeBanner = ({ results }: CompletionCodeBannerProps) => {
  const code = extractCode(results);
  const [copied, setCopied] = useState(false);

  if (!code) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // clipboard blocked; the code is still selectable in the page
    }
  };

  return (
    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm overflow-hidden mb-6 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="px-6 py-5 flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center flex-shrink-0">
          <Award size={24} className="text-emerald-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-[0.2em] mb-1">
            Completion code
          </div>
          <div className="font-mono text-xl text-openclaw-dark font-bold tracking-tight select-all break-all mb-2">
            {code}
          </div>
          <div className="text-xs text-openclaw-dark/60 font-medium leading-relaxed">
            Paste this into the last question of the Module 10 Google Form. The code is a deterministic hash of your per-module pass/fail tally — anyone with the same setup gets the same code.
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-sm flex-shrink-0"
        >
          {copied ? (
            <>
              <Check size={14} strokeWidth={3} /> Copied
            </>
          ) : (
            <>
              <Copy size={14} strokeWidth={2.5} /> Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
};
