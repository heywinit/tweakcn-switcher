export type ThemeTokens = Record<string, string>;

export interface ThemePreset {
  name: string;
  tokens: ThemeTokens;
  label?: string;
  meta?: Record<string, unknown>;
}

export interface ThemeContextValue {
  theme?: string;
  resolvedTheme?: ThemePreset;
  themes: Record<string, ThemePreset>;
  setTheme: (theme: string) => void;
  registerTheme: (theme: ThemePreset | ThemePreset[]) => void;
  isLoading: boolean;
}
