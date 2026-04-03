import { useState, useCallback, useEffect, useRef } from 'react';
import type { ChatMessage } from '../data/types';
import type { OpenClawClient, HistoryMessage } from '../api/openClawClient';

let messageIdCounter = 0;
function nextId(): string {
  return `msg-${++messageIdCounter}-${Date.now()}`;
}

function historyToChat(raw: HistoryMessage[]): ChatMessage[] {
  return raw.map((m, i) => ({
    id: `history-${i}-${m.timestamp ?? i}`,
    role: (m.role === 'assistant' || m.role === 'user') ? m.role : 'assistant',
    content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
    timestamp: typeof m.timestamp === 'number'
      ? m.timestamp
      : typeof m.timestamp === 'string'
        ? Date.parse(m.timestamp) || Date.now()
        : Date.now(),
  }));
}

export function useChatMessages(client: OpenClawClient | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFetchingRef = useRef(false);

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setMessages(prev => [
      ...prev,
      { ...msg, id: nextId(), timestamp: Date.now() },
    ]);
  }, []);

  // Fetch history from the client and replace the messages array
  const fetchHistory = useCallback(async (c?: OpenClawClient | null) => {
    const target = c ?? client;
    if (!target || !target.isOpen()) return;
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setIsLoading(true);
    try {
      const raw = await target.getHistory();
      if (raw.length > 0) {
        setMessages(historyToChat(raw));
      }
    } catch (err) {
      console.error('[useChatMessages] fetchHistory error:', err);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, [client]);

  // Start polling every 5 seconds when connected
  const startPolling = useCallback(() => {
    if (pollRef.current) return; // already polling
    pollRef.current = setInterval(() => {
      fetchHistory();
    }, 5000);
  }, [fetchHistory]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Auto-start/stop polling based on client connection status
  useEffect(() => {
    if (client && client.isOpen()) {
      fetchHistory(client);
      startPolling();
    } else {
      stopPolling();
    }
    return () => {
      stopPolling();
    };
  }, [client, fetchHistory, startPolling, stopPolling]);

  const clearMessages = useCallback(() => setMessages([]), []);

  return {
    messages,
    isLoading,
    // Keep isSending as an alias for backwards compatibility with callers
    isSending: isLoading,
    fetchHistory,
    startPolling,
    stopPolling,
    addMessage,
    clearMessages,
  };
}
