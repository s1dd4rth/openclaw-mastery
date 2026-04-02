import { useState, useEffect, useCallback, useRef } from 'react';
import type { ConnectionState } from '../data/types';
import { createOpenClawClient, type OpenClawClient } from '../api/openClawClient';

const STORAGE_KEY = 'openclawConnection';

function loadConnection(): ConnectionState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ConnectionState) : null;
  } catch {
    return null;
  }
}

function saveConnection(state: ConnectionState | null) {
  try {
    if (state) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // quota exceeded
  }
}

export function useConnection() {
  const [connection, setConnection] = useState<ConnectionState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const clientRef = useRef<OpenClawClient | null>(null);

  // Rehydrate on mount
  useEffect(() => {
    const saved = loadConnection();
    if (saved) {
      setConnection(saved);
    }
    setIsLoaded(true);
  }, []);

  // Connect WebSocket when connection state is set
  useEffect(() => {
    if (!connection) {
      setIsConnected(false);
      return;
    }

    const client = createOpenClawClient(connection);
    clientRef.current = client;

    let cancelled = false;

    (async () => {
      try {
        await client.connect();
        if (!cancelled) {
          setIsConnected(true);
          setConnectionError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setIsConnected(false);
          setConnectionError(err instanceof Error ? err.message : 'Connection failed');
        }
      }
    })();

    return () => {
      cancelled = true;
      client.disconnect();
      clientRef.current = null;
      setIsConnected(false);
    };
  }, [connection]);

  const connect = useCallback(async (instanceUrl: string, token: string) => {
    setIsConnecting(true);
    setConnectionError(null);

    const state: ConnectionState = {
      instanceUrl,
      sessionToken: token,
      clawName: '',
      pairedAt: new Date().toISOString(),
    };

    // Try connecting before saving to validate the URL + token
    const testClient = createOpenClawClient(state);
    try {
      await testClient.connect();
      testClient.disconnect();
      // Connection works — save and set state (the useEffect will reconnect)
      setConnection(state);
      saveConnection(state);
    } catch (err) {
      setConnectionError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
    clientRef.current = null;
    setConnection(null);
    setIsConnected(false);
    saveConnection(null);
  }, []);

  return {
    connection,
    isConnected,
    isConnecting,
    connectionError,
    isLoaded,
    client: clientRef.current,
    connect,
    disconnect,
  };
}
