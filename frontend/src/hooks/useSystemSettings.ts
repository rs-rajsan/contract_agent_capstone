import { useState, useEffect, useCallback } from 'react';

interface SystemSettings {
  skipDiagnostics: boolean;
  heartbeatEnabled: boolean;
  heartbeatInterval: number;
  lastUpdated: string;
}

const STORAGE_KEY = 'aequitas-system-settings';

const DEFAULT_SETTINGS: SystemSettings = {
  skipDiagnostics: import.meta.env.VITE_SKIP_DIAGNOSTICS === 'true',
  heartbeatEnabled: true,
  heartbeatInterval: 30000,
  lastUpdated: new Date().toISOString(),
};

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      } catch (e) {
        console.error('Failed to parse system settings', e);
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Listen for changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setSettings(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateSetting = useCallback(<K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  const toggleDiagnostics = useCallback(() => {
    updateSetting('skipDiagnostics', !settings.skipDiagnostics);
  }, [settings.skipDiagnostics, updateSetting]);

  const toggleHeartbeat = useCallback(() => {
    updateSetting('heartbeatEnabled', !settings.heartbeatEnabled);
  }, [settings.heartbeatEnabled, updateSetting]);

  return {
    settings,
    updateSetting,
    toggleDiagnostics,
    toggleHeartbeat,
    isDiagnosticsEnabled: !settings.skipDiagnostics,
    isHeartbeatEnabled: settings.heartbeatEnabled,
  };
}
