import { ReactNode, ScriptHTMLAttributes } from "react";

export interface TweakcnTheme {
  $schema?: string;
  name: string;
  type: string;
  css?: {
    [key: string]: {
      [property: string]: any;
    };
  };
  cssVars: {
    theme?: {
      [key: string]: string;
    };
    light?: {
      [key: string]: string;
    };
    dark?: {
      [key: string]: string;
    };
    [key: string]:
      | {
          [key: string]: string;
        }
      | undefined;
  };
}

export interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: string;
  storageKey?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  themes?: string[];
  attribute?: string;
  value?: Record<string, string>;
  nonce?: string;
  scriptProps?: ScriptHTMLAttributes<HTMLScriptElement>;
  registryUrl?: string;
}

export interface UseThemeProps {
  theme: string | undefined;
  setTheme: (theme: string) => void;
  resolvedTheme: string | undefined;
  systemTheme: string | undefined;
  themes: string[];
  forcedTheme?: string;
}
