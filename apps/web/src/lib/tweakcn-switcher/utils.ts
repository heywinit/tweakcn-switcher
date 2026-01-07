/**
 * Utility functions for applying theme CSS variables
 */

import type { ThemeRegistryItem, ThemeRegistryCssVars } from "./types";

function applyCSSVariable(
  key: string,
  value: string,
  root: HTMLElement = document.documentElement,
) {
  // Use setProperty for CSS custom properties
  root.style.setProperty(`--${key}`, value);
}

/**
 * Remove all font links added by tweakcn-switcher
 */
function removeFontLinks() {
  const existing = document.querySelectorAll('link[data-tweakcn-switcher-font="true"]');
  existing.forEach((el) => el.remove());
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

  // Apply mode-specific variables (excluding theme-level variables)
  const modeVars = cssVars[mode];
  if (modeVars) {
    Object.entries(modeVars).forEach(([key, value]) => {
      // Skip theme-level variables (radius, font-*, shadow, tracking-*, spacing)
      // These should only come from cssVars.theme
      if (
        !key.startsWith("font-") &&
        !key.startsWith("radius") &&
        !key.startsWith("shadow") &&
        !key.startsWith("tracking-") &&
        !key.startsWith("spacing")
      ) {
        applyCSSVariable(key, value, root);
      }
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

/**
 * Validates if a string is a valid URL
 * Handles malformed URIs gracefully
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== "string" || url.trim().length === 0) {
    return { valid: false, error: "URL cannot be empty" };
  }

  const trimmedUrl = url.trim();

  // Try to create a URL object to validate
  try {
    // Attempt to decode URI components first to catch malformed sequences
    try {
      decodeURIComponent(trimmedUrl);
    } catch (_e) {
      return {
        valid: false,
        error: "Invalid URL: contains malformed characters. Please check the URL and try again.",
      };
    }

    // Validate URL structure
    const urlObj = new URL(trimmedUrl);

    // Ensure it's http or https
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return {
        valid: false,
        error: "URL must use http or https protocol",
      };
    }

    return { valid: true };
  } catch (e) {
    // If URL constructor throws, it's invalid
    if (e instanceof TypeError) {
      return {
        valid: false,
        error:
          "Invalid URL format. Please enter a valid URL (e.g., https://example.com/theme.json)",
      };
    }
    // Handle URI malformed errors
    if (e instanceof URIError) {
      return {
        valid: false,
        error: "Invalid URL: contains malformed characters. Please check the URL and try again.",
      };
    }
    return {
      valid: false,
      error: "Invalid URL format",
    };
  }
}

/**
 * Normalizes tweakcn.com editor URLs to theme JSON URLs
 * Transforms: https://tweakcn.com/editor/theme?theme=candyland
 * To: https://tweakcn.com/r/themes/candyland.json
 */
export function normalizeTweakcnUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // Check if it's a tweakcn.com editor URL with a theme query parameter
    if (
      urlObj.hostname === "tweakcn.com" &&
      urlObj.pathname === "/editor/theme" &&
      urlObj.searchParams.has("theme")
    ) {
      const themeName = urlObj.searchParams.get("theme");
      if (themeName) {
        // Transform to the theme JSON URL format
        return `https://tweakcn.com/r/themes/${themeName}.json`;
      }
    }

    // Return the original URL if it doesn't match the pattern
    return url;
  } catch {
    // If URL parsing fails, return the original URL
    return url;
  }
}

export async function fetchThemeFromUrl(url: string): Promise<ThemeRegistryItem> {
  // Normalize the URL first (transform editor URLs to theme JSON URLs)
  const normalizedUrl = normalizeTweakcnUrl(url);

  // Validate URL first
  const validation = validateUrl(normalizedUrl);
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid URL");
  }

  try {
    const response = await fetch(normalizedUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch theme: ${response.statusText} (${response.status})`);
    }
    return response.json();
  } catch (e) {
    // Handle network errors and malformed URI errors
    if (e instanceof TypeError && e.message.includes("Failed to fetch")) {
      throw new Error(
        "Network error: Unable to fetch theme. Please check your connection and the URL.",
      );
    }
    if (e instanceof URIError) {
      throw new Error(
        "Invalid URL: contains malformed characters. Please check the URL and try again.",
      );
    }
    // Re-throw if it's already an Error with a message
    if (e instanceof Error) {
      throw e;
    }
    throw new Error("Failed to fetch theme: Unknown error occurred");
  }
}

export function extractThemeNameFromUrl(url: string): string {
  try {
    const match = url.match(/\/([^/]+)\.json$/);
    if (match && match[1]) {
      // Try to decode the theme name if it's URL encoded
      try {
        return decodeURIComponent(match[1]);
      } catch {
        // If decoding fails, return the raw match
        return match[1];
      }
    }
    return "custom-theme";
  } catch {
    // If anything goes wrong, return a safe default
    return "custom-theme";
  }
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
        // Check if it's a theme-level variable (radius, font, shadow, etc.)
        if (
          key.startsWith("font-") ||
          key.startsWith("radius") ||
          key.startsWith("shadow") ||
          key.startsWith("tracking-") ||
          key.startsWith("spacing")
        ) {
          // Add to theme-level variables
          cssVars.theme![key] = value;
        } else {
          // These are typically color mappings, add to :root in @layer base
          if (!cssLayerBase[":root"]) {
            cssLayerBase[":root"] = {};
          }
          cssLayerBase[":root"][`--${key}`] = value;
        }
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
  const urlValidation = validateUrl(trimmed);
  if (urlValidation.valid) {
    return false;
  }
  // Check for CSS indicators
  return (
    trimmed.includes(":root") ||
    trimmed.includes(".dark") ||
    trimmed.includes("@theme") ||
    trimmed.includes("--") ||
    (trimmed.includes("{") && trimmed.includes("}") && trimmed.includes(":"))
  );
}

export interface ColorSwatch {
  name: string;
  value: string;
}

/**
 * Extract color swatches from a theme registry item
 * Returns an array of color swatches with variable names and values
 */
export function extractColorSwatches(
  registryItem: ThemeRegistryItem,
  mode: "light" | "dark" = "light",
): ColorSwatch[] {
  const colors: ColorSwatch[] = [];
  const modeVars = registryItem.cssVars[mode] || {};
  const usedValues = new Set<string>();

  // Priority order for color extraction
  const colorKeys = [
    "background",
    "foreground",
    "primary",
    "secondary",
    "accent",
    "muted",
    "destructive",
    "border",
    "ring",
    "card",
    "popover",
  ];

  for (const key of colorKeys) {
    if (modeVars[key] && !usedValues.has(modeVars[key])) {
      colors.push({ name: key, value: modeVars[key] });
      usedValues.add(modeVars[key]);
    }
  }

  // If we don't have enough colors, add any remaining color variables
  if (colors.length < 8) {
    for (const [key, value] of Object.entries(modeVars)) {
      if (
        !usedValues.has(value) &&
        !key.startsWith("font-") &&
        !key.startsWith("radius") &&
        !key.startsWith("shadow") &&
        !key.startsWith("tracking-") &&
        !key.startsWith("spacing")
      ) {
        colors.push({ name: key, value });
        usedValues.add(value);
        if (colors.length >= 8) break;
      }
    }
  }

  return colors.slice(0, 8); // Return up to 8 colors
}
