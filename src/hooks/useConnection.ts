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

  // Single connection effect — connects when connection state exists
  useEffect(() => {
    if (!connection) {
      setIsConnected(false);
      setIsConnecting(false);
      clientRef.current = null;
      return;
    }

    const client = createOpenClawClient(connection);
    clientRef.current = client;
    let cancelled = false;

    setIsConnecting(true);
    setConnectionError(null);

    client.connect().then(() => {
      if (!cancelled) {
        console.log('[useConnection] Connected successfully');
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionError(null);
      }
    }).catch((err) => {
      if (!cancelled) {
        console.error('[useConnection] Connection failed:', err);
        setIsConnected(false);
        setIsConnecting(false);
        setConnectionError(err instanceof Error ? err.message : 'Connection failed');
      }
    });

    return () => {
      cancelled = true;
      client.disconnect();
      clientRef.current = null;
    };
  }, [connection]);

  // Save and connect — no test connection, just set state and let the effect handle it
  const connect = useCallback((instanceUrl: string, token: string, password?: string) => {
    const state: ConnectionState = {
      instanceUrl,
      sessionToken: token,
      ...(password ? { password } : {}),
      clawName: '',
      pairedAt: new Date().toISOString(),
    };
    saveConnection(state);
    setConnection(state);
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
