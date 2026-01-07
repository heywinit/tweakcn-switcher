/**
 * Hook for managing shadcn/ui theme switching
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { ThemeRegistryItem, ThemeOption, TweakcnSwitcherConfig } from "./types";
import {
  applyThemeFromRegistry,
  fetchThemeFromUrl,
  extractThemeNameFromUrl,
  validateUrl,
  parseCssToThemeRegistryItem,
  isCssCode,
} from "./utils";

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
  favorites: string[];
  toggleFavorite: (themeId: string) => void;
  isFavorite: (themeId: string) => boolean;
}

const DEFAULT_STORAGE_KEY = "tweakcn-switcher-theme";
const DEFAULT_FAVORITES_KEY = "tweakcn-switcher-favorites";

export function useTweakcnSwitcher(config: TweakcnSwitcherConfig = {}): UseTweakcnSwitcherReturn {
  const { defaultThemes = [], persist = true, storageKey = DEFAULT_STORAGE_KEY } = config;
  const favoritesKey = `${storageKey}-favorites`;

  const [themes, setThemes] = useState<ThemeOption[]>(defaultThemes);
  const [currentTheme, setCurrentTheme] = useState<ThemeOption | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"light" | "dark">("light");
  const [currentRegistryItem, setCurrentRegistryItem] = useState<ThemeRegistryItem | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (persist && typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(favoritesKey);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (e) {
        console.error("Failed to load favorites:", e);
      }
    }
    return [];
  });
  const isInitialMount = useRef(true);
  const modeRef = useRef(mode);
  const isApplyingRef = useRef(false);

  // Keep modeRef in sync with mode state
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const applyTheme = useCallback(
    async (urlOrCss: string, overrideMode?: "light" | "dark") => {
      // Prevent concurrent theme applications
      if (isApplyingRef.current) {
        return;
      }
      isApplyingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        let registryItem: ThemeRegistryItem;
        let themeName: string;
        let themeId: string;
        let themeOption: ThemeOption;

        if (isCssCode(urlOrCss)) {
          // Handle CSS code
          registryItem = parseCssToThemeRegistryItem(urlOrCss, "custom-css-theme");
          themeName = registryItem.name;
          themeId = `css-theme-${Date.now()}`;

          themeOption = {
            id: themeId,
            name: themeName,
            css: urlOrCss,
          };
        } else {
          // Handle URL
          registryItem = await fetchThemeFromUrl(urlOrCss);
          themeName = registryItem.name || extractThemeNameFromUrl(urlOrCss);
          themeId = `theme-${themeName}`;

          themeOption = {
            id: themeId,
            name: themeName,
            url: urlOrCss,
          };
        }

        setCurrentRegistryItem(registryItem);
        const currentMode = overrideMode ?? modeRef.current;
        await applyThemeFromRegistry(registryItem, currentMode);

        setThemes((prev) => {
          // Check if theme already exists (by URL or CSS content)
          const existing = prev.find(
            (t) => (t.url && t.url === urlOrCss) || (t.css && t.css === urlOrCss),
          );
          if (!existing) {
            const updated = [...prev, themeOption];
            setCurrentTheme(themeOption);
            return updated;
          }
          setCurrentTheme(existing);
          return prev;
        });

        // Persist if enabled
        if (persist) {
          localStorage.setItem(
            storageKey,
            JSON.stringify({
              ...(isCssCode(urlOrCss) ? { css: urlOrCss } : { url: urlOrCss }),
              mode: currentMode,
              name: themeName,
            }),
          );
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to apply theme";
        setError(errorMessage);
        console.error("Failed to apply theme:", err);
      } finally {
        setIsLoading(false);
        isApplyingRef.current = false;
      }
    },
    [persist, storageKey],
  );

  // Load persisted theme on mount only
  useEffect(() => {
    if (persist && isInitialMount.current) {
      isInitialMount.current = false;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const savedTheme = JSON.parse(saved);
          if (savedTheme.mode) {
            setMode(savedTheme.mode);
          }
          if (savedTheme.url || savedTheme.css) {
            if (savedTheme.css) {
              // Apply CSS theme
              applyTheme(savedTheme.css, savedTheme.mode).catch((err) => {
                console.error("Failed to load saved theme:", err);
                // Clear invalid saved theme
                localStorage.removeItem(storageKey);
              });
            } else if (savedTheme.url) {
              // Validate URL before attempting to apply
              const validation = validateUrl(savedTheme.url);
              if (validation.valid) {
                // Apply theme with the saved mode
                applyTheme(savedTheme.url, savedTheme.mode).catch((err) => {
                  console.error("Failed to load saved theme:", err);
                  // Clear invalid saved theme
                  localStorage.removeItem(storageKey);
                });
              } else {
                // Clear invalid saved theme
                console.warn("Invalid saved theme URL, clearing:", validation.error);
                localStorage.removeItem(storageKey);
              }
            }
          }
        } catch (e) {
          console.error("Failed to load saved theme:", e);
          // Clear corrupted saved theme
          localStorage.removeItem(storageKey);
        }
      } else {
        isInitialMount.current = false;
      }
    }
  }, [persist, storageKey, applyTheme]);

  // Apply mode changes to current theme
  useEffect(() => {
    if (currentRegistryItem) {
      applyThemeFromRegistry(currentRegistryItem, mode).catch(console.error);
      // Update localStorage with new mode if persist is enabled
      if (persist && currentTheme) {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          try {
            const savedTheme = JSON.parse(saved);
            localStorage.setItem(
              storageKey,
              JSON.stringify({
                ...savedTheme,
                mode,
                ...(currentTheme.css ? { css: currentTheme.css } : {}),
                ...(currentTheme.url ? { url: currentTheme.url } : {}),
              }),
            );
          } catch (e) {
            console.error("Failed to update saved theme mode:", e);
          }
        }
      }
    }
  }, [mode, currentRegistryItem, persist, storageKey, currentTheme]);

  const applyThemeOption = useCallback(
    async (theme: ThemeOption) => {
      // Prevent applying the same theme if it's already the current theme
      if (currentTheme?.id === theme.id) {
        return;
      }
      // Prevent applying if already loading or applying
      if (isLoading || isApplyingRef.current) {
        return;
      }
      if (theme.css) {
        await applyTheme(theme.css);
      } else if (theme.url) {
        await applyTheme(theme.url);
      }
    },
    [applyTheme, currentTheme, isLoading],
  );

  const addTheme = useCallback(
    async (urlOrCss: string, name?: string): Promise<ThemeOption | null> => {
      setError(null); // Clear any previous errors
      try {
        let registryItem: ThemeRegistryItem;
        let themeName: string;
        let themeId: string;
        let newTheme: ThemeOption;

        if (isCssCode(urlOrCss)) {
          // Handle CSS code
          registryItem = parseCssToThemeRegistryItem(urlOrCss, name || "custom-css-theme");
          themeName = name || registryItem.name;
          themeId = `css-theme-${Date.now()}`;

          newTheme = {
            id: themeId,
            name: themeName,
            css: urlOrCss,
          };
        } else {
          // Handle URL
          registryItem = await fetchThemeFromUrl(urlOrCss);
          themeName = name || registryItem.name || extractThemeNameFromUrl(urlOrCss);
          themeId = `theme-${themeName}`;

          newTheme = {
            id: themeId,
            name: themeName,
            url: urlOrCss,
          };
        }

        setThemes((prev) => {
          // Check if theme already exists (by URL or CSS content)
          if (prev.some((t) => (t.url && t.url === urlOrCss) || (t.css && t.css === urlOrCss))) {
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
    },
    [],
  );

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

  const handleSetMode = useCallback((newMode: "light" | "dark") => {
    setMode(newMode);
  }, []);

  const toggleFavorite = useCallback(
    (themeId: string) => {
      setFavorites((prev) => {
        const newFavorites = prev.includes(themeId)
          ? prev.filter((id) => id !== themeId)
          : [...prev, themeId];

        // Persist favorites
        if (persist && typeof window !== "undefined") {
          try {
            localStorage.setItem(favoritesKey, JSON.stringify(newFavorites));
          } catch (e) {
            console.error("Failed to save favorites:", e);
          }
        }

        return newFavorites;
      });
    },
    [persist, favoritesKey],
  );

  const isFavorite = useCallback(
    (themeId: string) => {
      return favorites.includes(themeId);
    },
    [favorites],
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
    setMode: handleSetMode,
    favorites,
    toggleFavorite,
    isFavorite,
  };
}
