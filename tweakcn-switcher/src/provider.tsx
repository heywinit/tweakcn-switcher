import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { applyTheme } from "./applyTheme";
import { readStorage, writeStorage } from "./storage";
import type { ThemeContextValue, ThemePreset } from "./types";

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string;
  presets?: ThemePreset[];
  storageKey?: string;
  disableTransitionOnChange?: boolean;
  enableStorage?: boolean;
  loader?: () => Promise<ThemePreset[]>;
}

const THEME_CONTEXT = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  presets = [],
  defaultTheme,
  storageKey = "tweakcn-theme",
  disableTransitionOnChange = true,
  enableStorage = true,
  loader,
}: ThemeProviderProps) {
  const initialPresetsMap = useMemo(
    () => Object.fromEntries(presets.map((p) => [p.name, p])),
    [presets]
  );
  const [themes, setThemes] =
    useState<Record<string, ThemePreset>>(initialPresetsMap);

  const mountedRef = useRef(false);
  const persistedTheme = enableStorage
    ? readStorage<string>(storageKey)
    : undefined;
  const initialTheme = persistedTheme || defaultTheme || presets[0]?.name;
  const [theme, setThemeState] = useState<string | undefined>(initialTheme);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const setTheme = useCallback(
    (name: string) => {
      setThemeState(name);
      if (enableStorage) writeStorage(storageKey, name);
    },
    [enableStorage, storageKey]
  );

  const registerTheme = useCallback(
    (presetOrArray: ThemePreset | ThemePreset[]) => {
      const arr = Array.isArray(presetOrArray)
        ? presetOrArray
        : [presetOrArray];
      setThemes((prev: Record<string, ThemePreset>) => {
        const next = { ...prev };
        for (const p of arr) {
          next[p.name] = p;
        }
        return next;
      });
    },
    []
  );

  // load remote presets once
  useEffect(() => {
    if (!loader) return;
    let cancelled = false;
    setIsLoading(true);
    loader()
      .then((incoming) => {
        if (cancelled) return;
        registerTheme(incoming);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loader, registerTheme]);

  // Apply theme whenever it changes or presets list mutate
  useEffect(() => {
    if (!theme) return;
    const preset = themes[theme];
    if (!preset) return;
    applyTheme(preset, {
      disableTransitions: mountedRef.current && disableTransitionOnChange,
    });
    mountedRef.current = true;
  }, [theme, themes, disableTransitionOnChange]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme: theme ? themes[theme] : undefined,
      themes,
      setTheme,
      registerTheme,
      isLoading,
    }),
    [theme, themes, setTheme, registerTheme, isLoading]
  );

  return (
    <THEME_CONTEXT.Provider value={value}>{children}</THEME_CONTEXT.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(THEME_CONTEXT);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
