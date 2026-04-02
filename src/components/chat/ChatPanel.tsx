import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '../../data/types';
import { ChatMessage } from './ChatMessage';

interface ChatPanelProps {
  messages: ChatMessageType[];
  isSending: boolean;
  isConnected: boolean;
  clawName?: string;
  onSendMessage: (content: string) => void;
  onOpenPairing: () => void;
}

export const ChatPanel = ({
  messages,
  isSending,
  isConnected,
  clawName,
  onSendMessage,
  onOpenPairing,
}: ChatPanelProps) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isSending) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

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
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {visibleMessages.length === 0 && (
          <div className="text-center text-slate-400 text-xs mt-8">
            <p>Connected to {clawName}.</p>
            <p className="mt-1">Execute a step or type a message to start.</p>
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
        {isSending && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 rounded-bl-sm">
              <Loader2 size={16} className="animate-spin text-slate-400" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-openclaw-red/30 focus:border-openclaw-red"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="px-3 py-2 bg-openclaw-red text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};
