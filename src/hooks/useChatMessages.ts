import { useState, useCallback } from 'react';
import type { ChatMessage } from '../data/types';
import type { OpenClawClient } from '../api/openClawClient';

let messageIdCounter = 0;
function nextId(): string {
  return `msg-${++messageIdCounter}-${Date.now()}`;
}

export function useChatMessages(client: OpenClawClient | null) {
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
      if (!client || !client.isOpen()) return null;

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
    [client, addMessage],
  );

  const sendVerify = useCallback(
    async (prompt: string): Promise<Array<{ id: string; pass: boolean; detail: string }> | null> => {
      if (!client || !client.isOpen()) return null;

      setIsSending(true);
      try {
        const result = await client.sendVerify(prompt);
        if (result) return result.checks;

        // JSON parse failed — send again and show raw response in chat
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
    [client, addMessage],
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
