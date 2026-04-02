import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export const CopyButton = ({ text, label }: { text: string; label?: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => {});
    };

    return (
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors shadow-sm"
          aria-label="Copy to clipboard"
        >
          {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
          {copied ? 'Copied' : (label || 'Copy')}
        </button>
    );
};
