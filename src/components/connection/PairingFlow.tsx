import { useState } from 'react';
import { X, Loader2, Shield } from 'lucide-react';

interface PairingFlowProps {
  onConnect: (instanceUrl: string, token: string) => void;
  isConnecting: boolean;
  connectionError: string | null;
  onClose: () => void;
}

export const PairingFlow = ({
  onConnect,
  isConnecting,
  connectionError,
  onClose,
}: PairingFlowProps) => {
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url && token) {
      onConnect(url, token);
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
            <Shield size={20} className="text-openclaw-red mt-0.5 flex-shrink-0" />
            <div className="text-sm text-slate-600 space-y-2">
              <p className="font-medium text-slate-800">You need two things from Module 1</p>
              <p>
                Your <strong>gateway URL</strong> (e.g., <code className="bg-slate-200 px-1 py-0.5 rounded text-xs font-mono">http://your-vps-ip:18789</code>)
                and your <strong>gateway token</strong>.
              </p>
              <p className="text-xs text-slate-500">
                First time? Tell your Claw:{' '}
                <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">
                  Add this course app's origin to gateway.controlUi.allowedOrigins
                </code>{' '}
                and approve the device when prompted.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Gateway URL
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
              Gateway Token
            </label>
            <input
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="Your gateway auth token"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-openclaw-red/30 focus:border-openclaw-red"
            />
            <p className="text-xs text-slate-400 mt-1">
              Stored locally in your browser. Never sent anywhere except your own gateway.
            </p>
          </div>

          {connectionError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {connectionError}
            </p>
          )}

          <button
            type="submit"
            disabled={isConnecting || !url || !token}
            className="w-full py-2.5 bg-openclaw-red text-white rounded-lg font-semibold text-sm hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isConnecting ? (
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
