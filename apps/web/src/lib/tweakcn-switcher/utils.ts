/**
 * Utility functions for applying theme CSS variables
 */

import type { ThemeRegistryItem } from "./types";

function applyCSSVariable(
  key: string,
  value: string,
  root: HTMLElement = document.documentElement,
) {
  // Use setProperty for CSS custom properties
  root.style.setProperty(`--${key}`, value);
}

export function applyThemeFromRegistry(
  registryItem: ThemeRegistryItem,
  mode: "light" | "dark" = "light",
) {
  const root = document.documentElement;
  const { cssVars, css } = registryItem;

  // Apply theme-level variables (common to both light and dark)
  if (cssVars.theme) {
    Object.entries(cssVars.theme).forEach(([key, value]) => {
      applyCSSVariable(key, value, root);
    });
  }

  // Apply mode-specific variables
  const modeVars = cssVars[mode];
  if (modeVars) {
    Object.entries(modeVars).forEach(([key, value]) => {
      applyCSSVariable(key, value, root);
    });
  }

  // Apply CSS layer base styles if present
  if (css?.["@layer base"]) {
    // Remove existing style elements
    const existing = document.querySelectorAll('style[data-tweakcn-switcher="true"]');
    existing.forEach((el) => el.remove());

    const baseStyles = css["@layer base"];
    const styleElement = document.createElement("style");
    styleElement.setAttribute("data-tweakcn-switcher", "true");

    // Combine all selectors into one style element
    const styleContent = Object.entries(baseStyles)
      .map(([selector, styles]) => {
        const props = Object.entries(styles)
          .map(([prop, val]) => `${prop}: ${val};`)
          .join(" ");
        return `${selector} { ${props} }`;
      })
      .join("\n");

    styleElement.textContent = `@layer base {\n${styleContent}\n}`;
    document.head.appendChild(styleElement);
  }

  if (mode === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export async function fetchThemeFromUrl(url: string): Promise<ThemeRegistryItem> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch theme: ${response.statusText}`);
  }
  return response.json();
}

export function extractThemeNameFromUrl(url: string): string {
  const match = url.match(/\/([^/]+)\.json$/);
  return match ? match[1] : "custom-theme";
}
