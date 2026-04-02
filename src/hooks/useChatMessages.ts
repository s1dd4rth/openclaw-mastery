import { useState, useCallback } from 'react';
import type { ChatMessage, ConnectionState } from '../data/types';
import { createOpenClawClient } from '../api/openClawClient';

let messageIdCounter = 0;
function nextId(): string {
  return `msg-${++messageIdCounter}-${Date.now()}`;
}

export function useChatMessages(connection: ConnectionState | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setMessages(prev => [
      ...prev,
      { ...msg, id: nextId(), timestamp: Date.now() },
    ]);
  }, []);

  const sendMessage = useCallback(
    async (
      content: string,
      options?: { auto?: boolean; stepTitle?: string; hidden?: boolean },
    ): Promise<string | null> => {
      if (!connection) return null;

      const client = createOpenClawClient(connection);

      // Add user message to chat (unless hidden)
      if (!options?.hidden) {
        addMessage({
          role: 'user',
          content,
          auto: options?.auto,
          stepTitle: options?.stepTitle,
        });
      }

      setIsSending(true);
      try {
        const response = await client.sendMessage(content);

        // Add assistant response (unless the caller hid the request)
        if (!options?.hidden) {
          addMessage({ role: 'assistant', content: response });
        }

        return response;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to reach your Claw';
        if (!options?.hidden) {
          addMessage({ role: 'assistant', content: `**Error:** ${errorMsg}` });
        }
        return null;
      } finally {
        setIsSending(false);
      }
    },
    [connection, addMessage],
  );

  const sendVerify = useCallback(
    async (prompt: string): Promise<Array<{ id: string; pass: boolean; detail: string }> | null> => {
      if (!connection) return null;

      const client = createOpenClawClient(connection);
      setIsSending(true);

      try {
        const result = await client.sendVerify(prompt);
        if (result) return result.checks;

        // JSON parse failed — show raw response in chat as fallback
        const raw = await client.sendMessage(prompt);
        addMessage({ role: 'assistant', content: raw });
        return null;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Verification failed';
        addMessage({ role: 'assistant', content: `**Verification error:** ${errorMsg}` });
        return null;
      } finally {
        setIsSending(false);
      }
    },
    [connection, addMessage],
  );

  const clearMessages = useCallback(() => setMessages([]), []);

  return {
    messages,
    isSending,
    sendMessage,
    sendVerify,
    clearMessages,
  };
}
