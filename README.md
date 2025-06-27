# tweakcn-switcher

A React component library for seamlessly switching between [tweakcn](https://tweakcn.com) themes with support for registry-based theme fetching. Built with TypeScript and inspired by `next-themes`.

## Features

- 🎨 **Registry-based theme fetching** - Automatically fetch tweakcn themes from a registry
- ⚡ **Zero flash** - Prevents the flash of wrong theme on page load
- 🌓 **System theme support** - Automatically detects user's system preference
- 💾 **Persistent themes** - Remembers user's theme choice across sessions
- 🎯 **TypeScript support** - Full type safety out of the box
- 🔧 **Flexible configuration** - Works with any CSS approach
- 🚀 **SSR/SSG ready** - Perfect for Next.js, Gatsby, and other frameworks

## Installation

```bash
npm install tweakcn-switcher
# or
yarn add tweakcn-switcher
# or
pnpm add tweakcn-switcher
```

## Quick Start

### 1. Wrap your app with ThemeProvider

```tsx
// App.tsx or _app.tsx
import { ThemeProvider } from "tweakcn-switcher";

function App({ children }) {
  return (
    <ThemeProvider
      themes={["light", "dark", "tangerine", "ocean"]}
      defaultTheme="system"
      registryUrl="https://tweakcn.com/r/themes"
    >
      {children}
    </ThemeProvider>
  );
}
```

### 2. Use the theme in your components

```tsx
// ThemeSwitcher.tsx
import { useTheme } from "tweakcn-switcher";

function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme();

  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
      {themes.map((theme) => (
        <option key={theme} value={theme}>
          {theme}
        </option>
      ))}
    </select>
  );
}
```

## Theme Format

Themes follow the tweakcn registry format:

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "tangerine",
  "type": "registry:style",
  "css": {
    "@layer base": {
      "body": {
        "letter-spacing": "var(--tracking-normal)"
      }
    }
  },
  "cssVars": {
    "theme": {
      "font-sans": "Inter, sans-serif",
      "radius": "0.75rem"
    },
    "light": {
      "background": "oklch(0.9383 0.0042 236.4993)",
      "foreground": "oklch(0.3211 0 0)",
      "primary": "oklch(0.6397 0.1720 36.4421)"
    },
    "dark": {
      "background": "oklch(0.2598 0.0306 262.6666)",
      "foreground": "oklch(0.9219 0 0)",
      "primary": "oklch(0.6397 0.1720 36.4421)"
    }
  }
}
```

## API Reference

### ThemeProvider

The main provider component that manages theme state.

```tsx
interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: string; // Default: 'system'
  storageKey?: string; // Default: 'tweakcn-theme'
  enableSystem?: boolean; // Default: true
  disableTransitionOnChange?: boolean; // Default: false
  themes?: string[]; // Default: ['light', 'dark']
  attribute?: string; // Default: 'data-theme'
  value?: Record<string, string>; // Custom attribute values
  nonce?: string; // CSP nonce for the script tag
  scriptProps?: ScriptHTMLAttributes<HTMLScriptElement>;
  registryUrl?: string; // Registry URL for fetching themes
}
```

### useTheme

Hook for accessing and controlling theme state.

```tsx
interface UseThemeProps {
  theme: string | undefined; // Current theme name
  setTheme: (theme: string) => void; // Function to change theme
  resolvedTheme: string | undefined; // Resolved theme (system resolved to light/dark)
  systemTheme: string | undefined; // System preference ('light' | 'dark')
  themes: string[]; // Available themes
  forcedTheme?: string; // Forced theme (if any)
}
```

### ThemeRegistry

Class for managing theme fetching and caching.

```tsx
class ThemeRegistry {
  constructor(baseUrl?: string);
  fetchTheme(themeName: string): Promise<TweakcnTheme | null>;
  fetchThemes(themeNames: string[]): Promise<(TweakcnTheme | null)[]>;
  clearCache(): void;
  getCachedTheme(themeName: string): TweakcnTheme | undefined;
}
```

## Examples

### Basic Usage

```tsx
import { ThemeProvider, useTheme } from "tweakcn-switcher";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
      Current theme: {theme}
    </button>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  );
}
```

### Custom Registry

```tsx
<ThemeProvider
  themes={["light", "dark", "custom-theme"]}
  registryUrl="https://my-registry.com/api/themes"
>
  <App />
</ThemeProvider>
```

### Class-based Styling (Tailwind CSS)

```tsx
<ThemeProvider attribute="class">
  <App />
</ThemeProvider>
```

### Custom Attribute Values

```tsx
<ThemeProvider attribute="data-mode" value={{ light: "day", dark: "night" }}>
  <App />
</ThemeProvider>
```

### Disable System Theme

```tsx
<ThemeProvider enableSystem={false} defaultTheme="light">
  <App />
</ThemeProvider>
```

## CSS Integration

### CSS Custom Properties

The library automatically applies CSS custom properties to the document root:

```css
:root {
  --background: oklch(0.9383 0.0042 236.4993);
  --foreground: oklch(0.3211 0 0);
  --primary: oklch(0.6397 0.172 36.4421);
  /* ... other variables */
}
```

### Tailwind CSS

Configure Tailwind to use the custom properties:

```js
// tailwind.config.js
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--primary)",
      },
    },
  },
};
```

### Styled Components

```tsx
import styled from "styled-components";

const Container = styled.div`
  background-color: var(--background);
  color: var(--foreground);
`;
```

## SSR/SSG Support

The library includes a script injection system to prevent flash of wrong theme:

```tsx
// The ThemeProvider automatically injects this script
<script>
  (function(){" "}
  {
    // Prevents flash by setting theme before React hydration
  }
  )();
</script>
```

## TypeScript Support

Full TypeScript support with proper type definitions:

```tsx
import type { TweakcnTheme, ThemeProviderProps } from "tweakcn-switcher";

const myTheme: TweakcnTheme = {
  name: "custom",
  type: "registry:style",
  cssVars: {
    light: {
      background: "#ffffff",
      foreground: "#000000",
    },
  },
};
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Related

- [tweakcn](https://tweakcn.com) - Visual theme editor for shadcn/ui
- [shadcn/ui](https://ui.shadcn.com) - UI component library
