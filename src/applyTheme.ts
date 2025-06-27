import { TweakcnTheme } from "./types";

export function applyTheme(
  theme: TweakcnTheme,
  colorMode: "light" | "dark" = "light"
): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  // Apply theme variables (non-mode specific)
  if (theme.cssVars.theme) {
    Object.entries(theme.cssVars.theme).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
  }

  // Apply color mode specific variables
  const modeVars = theme.cssVars[colorMode];
  if (modeVars) {
    Object.entries(modeVars).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
  }

  // Apply CSS rules if present
  if (theme.css) {
    applyCustomCSS(theme.css, theme.name);
  }
}

function applyCustomCSS(css: TweakcnTheme["css"], themeName: string): void {
  if (!css) return;

  const styleId = `tweakcn-theme-${themeName}`;
  let styleElement = document.getElementById(styleId) as HTMLStyleElement;

  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = styleId;
    document.head.appendChild(styleElement);
  }

  let cssText = "";
  Object.entries(css).forEach(([selector, rules]) => {
    cssText += `${selector} {\n`;
    Object.entries(rules).forEach(([property, value]) => {
      cssText += `  ${property}: ${value};\n`;
    });
    cssText += "}\n";
  });

  styleElement.textContent = cssText;
}

export function removeTheme(themeName: string): void {
  if (typeof document === "undefined") return;

  const styleId = `tweakcn-theme-${themeName}`;
  const styleElement = document.getElementById(styleId);

  if (styleElement) {
    styleElement.remove();
  }
}

export function getSystemColorScheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
