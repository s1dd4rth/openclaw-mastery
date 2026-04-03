import { useRef, useEffect } from 'react';
import { ExternalLink, MessageSquare, RefreshCw, Loader2 } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '../../data/types';
import { ChatMessage } from './ChatMessage';

interface ChatPanelProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  isConnected: boolean;
  clawName?: string;
  controlUiUrl: string;
  onOpenPairing: () => void;
  onRefresh: () => void;
}

export const ChatPanel = ({
  messages,
  isLoading,
  isConnected,
  clawName,
  controlUiUrl,
  onOpenPairing,
  onRefresh,
}: ChatPanelProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <MessageSquare size={32} className="text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-500 mb-1">Chat with your Claw</p>
        <p className="text-xs text-slate-400 mb-4">
          Connect your OpenClaw instance to unlock live chat, execute buttons, and auto-verification.
        </p>
        <button
          onClick={onOpenPairing}
          className="px-4 py-2 bg-openclaw-red text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
        >
          Connect Your Claw
        </button>
      </div>
    );
  }

  const visibleMessages = messages.filter(m => !m.hidden);

  return (
    <div className="flex flex-col h-full">
      {/* Header with Open Claw Chat + Refresh */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-white">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {clawName ? `${clawName} — Session` : 'Session History'}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh history"
            className="p-1.5 text-slate-400 hover:text-slate-600 disabled:opacity-40 transition-colors rounded"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <a
            href={controlUiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-openclaw-red text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors"
          >
            <ExternalLink size={12} />
            Open Claw Chat
          </a>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {visibleMessages.length === 0 && !isLoading && (
          <div className="text-center text-slate-400 text-xs mt-8">
            <p>Connected to {clawName ?? 'your Claw'}.</p>
            <p className="mt-1">Session history will appear here as you chat.</p>
            <p className="mt-1">Use "Open Claw Chat" to send messages.</p>
          </div>
        )}
        {visibleMessages.map(msg => (
          <ChatMessage
            key={msg.id}
            role={msg.role}
            content={msg.content}
            auto={msg.auto}
            stepTitle={msg.stepTitle}
          />
        ))}
        {isLoading && visibleMessages.length === 0 && (
          <div className="flex justify-center mt-8">
            <Loader2 size={16} className="animate-spin text-slate-400" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
