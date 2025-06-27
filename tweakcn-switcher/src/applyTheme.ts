import type { ThemePreset } from "./types";

/**
 * Inject theme tokens into :root as CSS variables.
 * This keeps specificity low and plays nicely with shadcn/ui which relies on vars.
 */
export function applyTheme(
  preset: ThemePreset,
  opts?: { disableTransitions?: boolean }
) {
  if (typeof document === "undefined") return;

  const { disableTransitions } = opts || {};
  const root = document.documentElement;

  let transitionStyleEl: HTMLStyleElement | null = null;
  if (disableTransitions) {
    transitionStyleEl = document.createElement("style");
    transitionStyleEl.innerHTML = "*{transition:none !important}";
    document.head.appendChild(transitionStyleEl);
  }

  for (const [token, value] of Object.entries(preset.tokens)) {
    root.style.setProperty(`--${token}`, value);
  }

  if (disableTransitions && transitionStyleEl) {
    /* allow the browser one frame to apply style without transitions */
    requestAnimationFrame(() => {
      transitionStyleEl?.parentNode?.removeChild(transitionStyleEl);
    });
  }
}
