/**
 * Hook for managing shadcn/ui theme switching
 */

import { useState, useEffect, useCallback } from "react";
import type { ThemeRegistryItem, ThemeOption, TweakcnSwitcherConfig } from "./types";
import { applyThemeFromRegistry, fetchThemeFromUrl, extractThemeNameFromUrl } from "./utils";

export interface UseTweakcnSwitcherReturn {
  currentTheme: ThemeOption | null;
  themes: ThemeOption[];
  isLoading: boolean;
  error: string | null;
  applyTheme: (url: string) => Promise<void>;
  applyThemeOption: (theme: ThemeOption) => Promise<void>;
  addTheme: (url: string, name?: string) => Promise<ThemeOption | null>;
  removeTheme: (themeId: string) => void;
  mode: "light" | "dark";
  setMode: (mode: "light" | "dark") => void;
}

const DEFAULT_STORAGE_KEY = "tweakcn-switcher-theme";

export function useTweakcnSwitcher(config: TweakcnSwitcherConfig = {}): UseTweakcnSwitcherReturn {
  const { defaultThemes = [], persist = true, storageKey = DEFAULT_STORAGE_KEY } = config;

  const [themes, setThemes] = useState<ThemeOption[]>(defaultThemes);
  const [currentTheme, setCurrentTheme] = useState<ThemeOption | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"light" | "dark">("light");
  const [currentRegistryItem, setCurrentRegistryItem] = useState<ThemeRegistryItem | null>(null);

  const applyTheme = useCallback(
    async (url: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const registryItem = await fetchThemeFromUrl(url);
        setCurrentRegistryItem(registryItem);
        applyThemeFromRegistry(registryItem, mode);

        // Find or create theme option
        const themeName = registryItem.name || extractThemeNameFromUrl(url);
        const themeId = `theme-${themeName}`;

        setThemes((prev) => {
          let themeOption = prev.find((t) => t.url === url);
          if (!themeOption) {
            themeOption = {
              id: themeId,
              name: themeName,
              url,
            };
            const updated = [...prev, themeOption];
            setCurrentTheme(themeOption);
            return updated;
          }
          setCurrentTheme(themeOption);
          return prev;
        });

        // Persist if enabled
        if (persist) {
          localStorage.setItem(storageKey, JSON.stringify({ url, mode, name: themeName }));
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to apply theme";
        setError(errorMessage);
        console.error("Failed to apply theme:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [mode, persist, storageKey],
  );

  // Load persisted theme on mount
  useEffect(() => {
    if (persist) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const savedTheme = JSON.parse(saved);
          if (savedTheme.mode) {
            setMode(savedTheme.mode);
          }
          if (savedTheme.url) {
            // Apply theme after mode is set
            setTimeout(() => {
              applyTheme(savedTheme.url).catch(console.error);
            }, 0);
          }
        } catch (e) {
          console.error("Failed to load saved theme:", e);
        }
      }
    }
  }, [persist, storageKey, applyTheme]);

  // Apply mode changes to current theme
  useEffect(() => {
    if (currentRegistryItem) {
      applyThemeFromRegistry(currentRegistryItem, mode);
    }
  }, [mode, currentRegistryItem]);

  const applyThemeOption = useCallback(
    async (theme: ThemeOption) => {
      await applyTheme(theme.url);
    },
    [applyTheme],
  );

  const addTheme = useCallback(async (url: string, name?: string): Promise<ThemeOption | null> => {
    try {
      const registryItem = await fetchThemeFromUrl(url);
      const themeName = name || registryItem.name || extractThemeNameFromUrl(url);
      const themeId = `theme-${themeName}`;

      const newTheme: ThemeOption = {
        id: themeId,
        name: themeName,
        url,
      };

      setThemes((prev) => {
        if (prev.some((t) => t.url === url)) {
          return prev;
        }
        return [...prev, newTheme];
      });

      return newTheme;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add theme";
      setError(errorMessage);
      throw err;
    }
  }, []);

  const removeTheme = useCallback(
    (themeId: string) => {
      setThemes((prev) => prev.filter((t) => t.id !== themeId));
      if (currentTheme?.id === themeId) {
        setCurrentTheme(null);
        setCurrentRegistryItem(null);
        if (persist) {
          localStorage.removeItem(storageKey);
        }
      }
    },
    [currentTheme, persist, storageKey],
  );

  return {
    currentTheme,
    themes,
    isLoading,
    error,
    applyTheme,
    applyThemeOption,
    addTheme,
    removeTheme,
    mode,
    setMode,
  };
}
