import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { ThemeProviderProps, UseThemeProps, TweakcnTheme } from "./types";
import { storage } from "./storage";
import { ThemeRegistry } from "./registry";
import { applyTheme } from "./applyTheme";

const ThemeContext = createContext<UseThemeProps | undefined>(undefined);

const SYSTEM_THEME = "system";
const LIGHT_THEME = "light";
const DARK_THEME = "dark";

export function ThemeProvider({
  children,
  defaultTheme = SYSTEM_THEME,
  storageKey = "tweakcn-theme",
  enableSystem = true,
  disableTransitionOnChange = false,
  themes = [LIGHT_THEME, DARK_THEME],
  attribute = "data-theme",
  value,
  nonce,
  scriptProps,
  registryUrl,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<string>(() => defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<string | undefined>();
  const [systemTheme, setSystemTheme] = useState<string | undefined>();
  const [loadedThemes, setLoadedThemes] = useState<Map<string, TweakcnTheme>>(
    new Map()
  );
  const [registry] = useState(() => new ThemeRegistry(registryUrl));

  // Get effective themes list
  const effectiveThemes = enableSystem ? [SYSTEM_THEME, ...themes] : themes;

  // Load theme from storage on mount
  useEffect(() => {
    const stored = storage.get(storageKey);
    if (stored && effectiveThemes.includes(stored)) {
      setThemeState(stored);
    }
  }, [storageKey, effectiveThemes]);

  // System theme detection
  useEffect(() => {
    if (!enableSystem) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const systemScheme = mediaQuery.matches ? DARK_THEME : LIGHT_THEME;
      setSystemTheme(systemScheme);
    };

    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [enableSystem]);

  // Resolve theme
  useEffect(() => {
    const resolveTheme = () => {
      if (theme === SYSTEM_THEME) {
        return systemTheme || LIGHT_THEME;
      }
      return theme;
    };

    setResolvedTheme(resolveTheme());
  }, [theme, systemTheme]);

  // Load and apply theme
  useEffect(() => {
    if (!resolvedTheme) return;

    const loadAndApplyTheme = async () => {
      // For built-in themes (light/dark), we don't need to fetch from registry
      if (resolvedTheme === LIGHT_THEME || resolvedTheme === DARK_THEME) {
        applyDOMAttributes(resolvedTheme);
        return;
      }

      // Check if theme is already loaded
      let themeData = loadedThemes.get(resolvedTheme) || null;

      if (!themeData) {
        // Fetch theme from registry
        themeData = await registry.fetchTheme(resolvedTheme);
        if (themeData) {
          setLoadedThemes((prev) =>
            new Map(prev).set(resolvedTheme, themeData!)
          );
        }
      }

      if (themeData) {
        // Determine color mode (check if this is a dark theme variant)
        const colorMode = resolvedTheme.includes("dark") ? "dark" : "light";

        if (disableTransitionOnChange) {
          disableAnimation();
        }

        applyTheme(themeData, colorMode);
        applyDOMAttributes(resolvedTheme);

        if (disableTransitionOnChange) {
          // Re-enable animations after a frame
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              enableAnimation();
            });
          });
        }
      }
    };

    loadAndApplyTheme();
  }, [resolvedTheme, loadedThemes, registry, disableTransitionOnChange]);

  const applyDOMAttributes = useCallback(
    (themeName: string) => {
      const root = document.documentElement;

      if (attribute === "class") {
        // Remove all theme classes
        effectiveThemes.forEach((t) => {
          const className = value?.[t] || t;
          root.classList.remove(className);
        });

        // Add current theme class
        const className = value?.[themeName] || themeName;
        root.classList.add(className);
      } else {
        // Set data attribute
        const attrValue = value?.[themeName] || themeName;
        root.setAttribute(attribute, attrValue);
      }
    },
    [attribute, value, effectiveThemes]
  );

  const setTheme = useCallback(
    (newTheme: string) => {
      setThemeState(newTheme);
      storage.set(storageKey, newTheme);
    },
    [storageKey]
  );

  const disableAnimation = () => {
    const css = `*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}`;
    const head = document.head;
    const style = document.createElement("style");
    style.appendChild(document.createTextNode(css));
    style.id = "disable-transitions";
    head.appendChild(style);
  };

  const enableAnimation = () => {
    const style = document.getElementById("disable-transitions");
    if (style) {
      style.remove();
    }
  };

  const contextValue: UseThemeProps = {
    theme,
    setTheme,
    resolvedTheme,
    systemTheme,
    themes: effectiveThemes,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
      <ThemeScript
        nonce={nonce}
        scriptProps={scriptProps}
        storageKey={storageKey}
        attribute={attribute}
        enableSystem={enableSystem}
        defaultTheme={defaultTheme}
        value={value}
        themes={effectiveThemes}
      />
    </ThemeContext.Provider>
  );
}

interface ThemeScriptProps {
  nonce?: string;
  scriptProps?: React.ScriptHTMLAttributes<HTMLScriptElement>;
  storageKey: string;
  attribute: string;
  enableSystem: boolean;
  defaultTheme: string;
  value?: Record<string, string>;
  themes: string[];
}

function ThemeScript({
  nonce,
  scriptProps,
  storageKey,
  attribute,
  enableSystem,
  defaultTheme,
  value,
  themes,
}: ThemeScriptProps) {
  // Script to prevent flash on page load
  const script = `
    (function() {
      try {
        var stored = localStorage.getItem('${storageKey}');
        var theme = stored || '${defaultTheme}';
        var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        
        if (theme === 'system' && ${enableSystem}) {
          theme = systemTheme;
        }
        
        var root = document.documentElement;
        var value = ${JSON.stringify(value)};
        var attrValue = value && value[theme] ? value[theme] : theme;
        
        if ('${attribute}' === 'class') {
          root.classList.add(attrValue);
        } else {
          root.setAttribute('${attribute}', attrValue);
        }
      } catch (e) {}
    })();
  `;

  return (
    <script
      {...scriptProps}
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}

export function useTheme(): UseThemeProps {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
