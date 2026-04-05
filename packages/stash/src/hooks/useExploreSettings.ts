import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'stash_explore_settings';

export interface ExploreSettings {
  selectedTabs: string[]; // e.g. ['topList', 'latestNews', ...]
}

const DEFAULT_SETTINGS: ExploreSettings = {
  selectedTabs: ['topList'],
};

export function useExploreSettings() {
  const [settings, setSettings] = useState<ExploreSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ExploreSettings;
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  const saveSettings = useCallback((next: ExploreSettings) => {
    setSettings(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const toggleTab = useCallback((tab: string) => {
    setSettings(prev => {
      const isSelected = prev.selectedTabs.includes(tab);
      const next: ExploreSettings = {
        ...prev,
        selectedTabs: isSelected
          ? prev.selectedTabs.filter(t => t !== tab)
          : [...prev.selectedTabs, tab],
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return { settings, saveSettings, toggleTab };
}
