import { useState, useEffect, useCallback, useRef } from 'react';
import type { ConnectionState } from '../data/types';
import { createOpenClawClient, pairWithInstance } from '../api/openClawClient';

const STORAGE_KEY = 'openclawConnection';
const HEALTH_INTERVAL_MS = 60_000;

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
  const [isPairing, setIsPairing] = useState(false);
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const healthRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const saved = loadConnection();
    if (saved) {
      setConnection(saved);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!connection) {
      setIsConnected(false);
      return;
    }
    const client = createOpenClawClient(connection);
    const check = async () => {
      const alive = await client.ping();
      setIsConnected(alive);
    };
    check();
    healthRef.current = setInterval(check, HEALTH_INTERVAL_MS);
    return () => {
      if (healthRef.current) clearInterval(healthRef.current);
    };
  }, [connection]);

  const pair = useCallback(async (instanceUrl: string, code: string) => {
    setIsPairing(true);
    setPairingError(null);
    try {
      const { token, clawName } = await pairWithInstance(instanceUrl, code);
      const state: ConnectionState = {
        instanceUrl,
        sessionToken: token,
        clawName,
        pairedAt: new Date().toISOString(),
      };
      setConnection(state);
      saveConnection(state);
      setIsConnected(true);
    } catch (err) {
      setPairingError(err instanceof Error ? err.message : 'Pairing failed');
    } finally {
      setIsPairing(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setConnection(null);
    setIsConnected(false);
    saveConnection(null);
  }, []);

  return {
    connection,
    isConnected,
    isPairing,
    pairingError,
    isLoaded,
    pair,
    disconnect,
  };
}
