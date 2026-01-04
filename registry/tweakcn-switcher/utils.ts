/// <reference lib="dom" />
/**
 * Utility functions for applying theme CSS variables
 */

import type { ThemeRegistryItem, ThemeRegistryCssVars } from "./types";

function applyCSSVariable(
  key: string,
  value: string,
  root: HTMLElement | null = typeof document !== "undefined" ? document.documentElement : null,
) {
  if (!root) return;
  // Use setProperty for CSS custom properties - more reliable than manipulating style attribute
  root.style.setProperty(`--${key}`, value);
}

/**
 * Remove all font links added by tweakcn-switcher
 */
function removeFontLinks() {
  if (typeof document === "undefined") return;
  const existing = document.querySelectorAll('link[data-tweakcn-switcher-font="true"]');
  existing.forEach((el: Element) => el.remove());
}

/**
 * Extract font family names from a font-family CSS value
 * Handles values like "Roboto, sans-serif" or '"Inter Variable", sans-serif'
 */
function extractFontNames(fontFamily: string): string[] {
  // Remove quotes and split by comma
  const fonts = fontFamily
    .split(",")
    .map((f) => f.trim().replace(/^["']|["']$/g, ""))
    .filter((f) => f && !f.match(/^(sans-serif|serif|monospace| cursive|fantasy)$/i));

  return fonts;
}

/**
 * Try to load a font from Google Fonts
 * Returns the Google Fonts URL if successful, null otherwise
 */
function getGoogleFontsUrl(fontName: string): string | null {
  // Remove spaces and special characters for Google Fonts API
  const normalizedName = fontName.replace(/\s+/g, "+").replace(/['"]/g, "").trim();

  if (!normalizedName) {
    return null;
  }

  // Google Fonts API URL
  return `https://fonts.googleapis.com/css2?family=${normalizedName}:wght@400;500;600;700&display=swap`;
}

/**
 * Load a font from Google Fonts URL
 */
function loadGoogleFont(url: string): Promise<void> {
  if (typeof document === "undefined") {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    // Check if link already exists
    const existing = document.querySelector(`link[href="${url}"]`);
    if (existing) {
      resolve();
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    link.setAttribute("data-tweakcn-switcher-font", "true");

    link.onload = () => resolve();
    link.onerror = () => {
      // Silently fail - let the dev handle it if needed
      resolve();
    };

    document.head.appendChild(link);
  });
}

/**
 * Try to load fonts from Google Fonts based on font-family value
 * This is best-effort - if it fails, the dev can handle it
 */
async function tryLoadFontsFromGoogleFonts(fontFamily: string): Promise<void> {
  if (typeof document === "undefined") {
    return;
  }

  const fontNames = extractFontNames(fontFamily);

  if (fontNames.length === 0) {
    return;
  }

  // Try to load each font from Google Fonts
  const loadPromises = fontNames.map((fontName) => {
    const googleFontsUrl = getGoogleFontsUrl(fontName);
    if (googleFontsUrl) {
      return loadGoogleFont(googleFontsUrl);
    }
    return Promise.resolve();
  });

  await Promise.all(loadPromises);
}

export async function applyThemeFromRegistry(
  registryItem: ThemeRegistryItem,
  mode: "light" | "dark" = "light",
) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  const { cssVars, css } = registryItem;

  // Remove existing font variable override styles
  const existingFontStyle = document.querySelector('style[data-tweakcn-switcher-font-vars="true"]');
  if (existingFontStyle) {
    existingFontStyle.remove();
  }

  // Apply theme-level variables (common to both light and dark)
  let fontSansValue: string | null = null;
  if (cssVars.theme) {
    Object.entries(cssVars.theme).forEach(([key, value]) => {
      applyCSSVariable(key, value, root);

      // Track font-sans value for special handling
      if (key === "font-sans" && value) {
        fontSansValue = value;
      }
    });
  }

  // Try to load fonts from Google Fonts if font-sans is set
  if (fontSansValue) {
    // Try to load from Google Fonts (best-effort, fails silently)
    await tryLoadFontsFromGoogleFonts(fontSansValue).catch(() => {
      // Silently fail - let the dev handle font loading if needed
    });

    // Inject a style to override Tailwind's @theme variable with higher specificity
    const fontStyle = document.createElement("style");
    fontStyle.setAttribute("data-tweakcn-switcher-font-vars", "true");
    // Escape any quotes in the font value for CSS
    const escapedFontValue = (fontSansValue as string).replace(/"/g, '\\"');
    fontStyle.textContent = `
      :root {
        --font-sans: ${escapedFontValue} !important;
      }
      html, body {
        font-family: ${escapedFontValue} !important;
      }
    `;
    document.head.appendChild(fontStyle);
  } else {
    // If no font-sans in theme, remove any inline font-family styles we may have set
    removeFontLinks();
    root.style.removeProperty("font-family");
    if (document.body) {
      document.body.style.removeProperty("font-family");
    }
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
    existing.forEach((el: Element) => el.remove());

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
  const data = await response.json();
  return data as ThemeRegistryItem;
}

export function extractThemeNameFromUrl(url: string): string {
  const match = url.match(/\/([^/]+)\.json$/);
  return match && match[1] ? match[1] : "custom-theme";
}

/**
 * Parses CSS code and converts it to a ThemeRegistryItem
 * Supports :root, .dark, and @theme inline selectors
 */
export function parseCssToThemeRegistryItem(
  css: string,
  name: string = "custom-css-theme",
): ThemeRegistryItem {
  const cssVars: ThemeRegistryCssVars = {
    theme: {},
    light: {},
    dark: {},
  };

  // Remove comments
  const cleanedCss = css.replace(/\/\*[\s\S]*?\*\//g, "");

  // Parse :root selector (light mode variables)
  const rootMatch = cleanedCss.match(/:root\s*\{([^}]+)\}/);
  if (rootMatch && rootMatch[1]) {
    const rootContent = rootMatch[1];
    const varMatches = rootContent.matchAll(/--([^:]+):\s*([^;]+);/g);
    for (const match of varMatches) {
      if (match[1] && match[2]) {
        const key = match[1].trim();
        const value = match[2].trim();
        // Determine if it's a theme-level variable or light mode variable
        // Theme-level variables are things like --radius, --font-*, --shadow-*, etc.
        if (
          key.startsWith("font-") ||
          key.startsWith("radius") ||
          key.startsWith("shadow") ||
          key.startsWith("tracking-") ||
          key.startsWith("spacing")
        ) {
          cssVars.theme![key] = value;
        } else {
          cssVars.light![key] = value;
        }
      }
    }
  }

  // Parse .dark selector (dark mode variables)
  const darkMatch = cleanedCss.match(/\.dark\s*\{([^}]+)\}/);
  if (darkMatch && darkMatch[1]) {
    const darkContent = darkMatch[1];
    const varMatches = darkContent.matchAll(/--([^:]+):\s*([^;]+);/g);
    for (const match of varMatches) {
      if (match[1] && match[2]) {
        const key = match[1].trim();
        const value = match[2].trim();
        // Dark mode variables (excluding theme-level ones)
        if (
          !key.startsWith("font-") &&
          !key.startsWith("radius") &&
          !key.startsWith("shadow") &&
          !key.startsWith("tracking-") &&
          !key.startsWith("spacing")
        ) {
          cssVars.dark![key] = value;
        }
      }
    }
  }

  // Parse @theme inline block if present
  const themeInlineMatch = cleanedCss.match(/@theme\s+inline\s*\{([^}]+)\}/);
  const cssLayerBase: Record<string, Record<string, string>> = {};
  if (themeInlineMatch && themeInlineMatch[1]) {
    const themeContent = themeInlineMatch[1];
    const varMatches = themeContent.matchAll(/--([^:]+):\s*([^;]+);/g);
    for (const match of varMatches) {
      if (match[1] && match[2]) {
        const key = match[1].trim();
        const value = match[2].trim();
        // These are typically color mappings, add to :root in @layer base
        if (!cssLayerBase[":root"]) {
          cssLayerBase[":root"] = {};
        }
        cssLayerBase[":root"][`--${key}`] = value;
      }
    }
  }

  return {
    name,
    type: "theme",
    cssVars,
    ...(Object.keys(cssLayerBase).length > 0 && {
      css: {
        "@layer base": cssLayerBase,
      },
    }),
  };
}

/**
 * Checks if a string is likely CSS code (contains CSS selectors or properties)
 */
export function isCssCode(input: string): boolean {
  const trimmed = input.trim();
  // If it's a valid URL, it's not CSS
  try {
    new URL(trimmed);
    return false;
  } catch {
    // Not a valid URL, check for CSS indicators
    return (
      trimmed.includes(":root") ||
      trimmed.includes(".dark") ||
      trimmed.includes("@theme") ||
      trimmed.includes("--") ||
      (trimmed.includes("{") && trimmed.includes("}") && trimmed.includes(":"))
    );
  }
}
