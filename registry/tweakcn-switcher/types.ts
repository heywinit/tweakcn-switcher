/**
 * Type definitions for shadcn/ui theme registry format
 */

export interface ThemeRegistryCssVars {
  theme?: Record<string, string>;
  light?: Record<string, string>;
  dark?: Record<string, string>;
}

export interface ThemeRegistryItem {
  $schema?: string;
  name: string;
  type: string;
  css?: {
    "@layer base"?: Record<string, Record<string, string>>;
  };
  cssVars: ThemeRegistryCssVars;
}

export interface ThemeOption {
  id: string;
  name: string;
  url: string;
  preview?: string;
}

export interface TweakcnSwitcherConfig {
  defaultThemes?: ThemeOption[];
  baseUrl?: string;
  persist?: boolean;
  storageKey?: string;
}

