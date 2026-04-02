import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionIndicatorProps {
  isConnected: boolean;
  clawName?: string;
  onClickConnect: () => void;
  onClickDisconnect: () => void;
}

export const ConnectionIndicator = ({
  isConnected,
  clawName,
  onClickConnect,
  onClickDisconnect,
}: ConnectionIndicatorProps) => {
  if (isConnected && clawName) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-medium text-emerald-800 truncate">{clawName}</span>
        <button
          onClick={onClickDisconnect}
          className="text-xs text-emerald-600 hover:text-emerald-800 ml-auto"
          title="Disconnect"
        >
          <WifiOff size={12} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onClickConnect}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 transition-colors w-full"
    >
      <div className="w-2 h-2 rounded-full bg-red-400" />
      <span className="text-xs font-medium text-red-700">Connect Claw</span>
      <Wifi size={12} className="text-red-400 ml-auto" />
    </button>
  );
};
