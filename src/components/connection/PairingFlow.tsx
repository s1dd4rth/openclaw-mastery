import { useState } from 'react';
import { X, Loader2, Terminal } from 'lucide-react';

interface PairingFlowProps {
  onPair: (instanceUrl: string, code: string) => Promise<void>;
  isPairing: boolean;
  pairingError: string | null;
  onClose: () => void;
}

export const PairingFlow = ({
  onPair,
  isPairing,
  pairingError,
  onClose,
}: PairingFlowProps) => {
  const [url, setUrl] = useState('');
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url && code) {
      onPair(url, code);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Connect Your Claw</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Instructions */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-start gap-3">
            <Terminal size={20} className="text-openclaw-red mt-0.5 flex-shrink-0" />
            <div className="text-sm text-slate-600">
              <p className="font-medium text-slate-800 mb-1">Step 1: Generate a pairing code</p>
              <p>
                Open your OpenClaw web chat and type{' '}
                <code className="bg-slate-200 px-1.5 py-0.5 rounded text-xs font-mono">/pair</code>.
                You'll get a 6-digit code and your instance URL.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Instance URL
            </label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://your-claw.example.com"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-openclaw-red/30 focus:border-openclaw-red"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Pairing Code
            </label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono tracking-widest text-center text-lg focus:outline-none focus:ring-2 focus:ring-openclaw-red/30 focus:border-openclaw-red"
            />
          </div>

          {pairingError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {pairingError}
            </p>
          )}

          <button
            type="submit"
            disabled={isPairing || !url || !code}
            className="w-full py-2.5 bg-openclaw-red text-white rounded-lg font-semibold text-sm hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isPairing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
