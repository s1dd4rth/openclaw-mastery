import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'openclawLiveApiSettings';

export interface LiveApiSettings {
  gatewayUrl: string;
  token: string;
  optedIn: boolean;
}

const EMPTY: LiveApiSettings = { gatewayUrl: '', token: '', optedIn: false };

export function useLiveApiSettings() {
  const [settings, setSettingsRaw] = useState<LiveApiSettings>(EMPTY);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<LiveApiSettings>;
        setSettingsRaw({ ...EMPTY, ...parsed });
      }
    } catch {
      // ignore corruption
    }
    setIsLoaded(true);
  }, []);

  const update = useCallback((next: Partial<LiveApiSettings>) => {
    setSettingsRaw(prev => {
      const merged = { ...prev, ...next };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {
        // quota or disabled
      }
      return merged;
    });
  }, []);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setSettingsRaw(EMPTY);
  }, []);

  const isConfigured =
    settings.optedIn && settings.gatewayUrl.trim().length > 0 && settings.token.trim().length > 0;

  return { settings, update, clear, isConfigured, isLoaded };
}
