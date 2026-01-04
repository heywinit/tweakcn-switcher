# Tweakcn Switcher

A component for switching shadcn/ui themes dynamically.

## Usage

### Basic Usage

```tsx
import { TweakcnSwitcher } from "@/components/tweakcn-switcher";

function App() {
  return (
    <div>
      <TweakcnSwitcher
        defaultThemes={[
          {
            id: "amethyst-haze",
            name: "Amethyst Haze",
            url: "https://tweakcn.com/r/themes/amethyst-haze.json",
          },
        ]}
      />
    </div>
  );
}
```

### Using the Hook Directly

```tsx
import { useTweakcnSwitcher } from "@/lib/tweakcn-switcher";

function CustomThemeSwitcher() {
  const { currentTheme, themes, isLoading, applyTheme, mode, setMode } =
    useTweakcnSwitcher({
      defaultThemes: [
        {
          id: "theme-1",
          name: "My Theme",
          url: "https://tweakcn.com/r/themes/my-theme.json",
        },
      ],
      persist: true,
      storageKey: "my-app-theme",
    });

  return (
    <div>
      <button
        onClick={() =>
          applyTheme("https://tweakcn.com/r/themes/another-theme.json")
        }
      >
        Apply Theme
      </button>
    </div>
  );
}
```

## API

### `TweakcnSwitcher` Component Props

| Prop            | Type                           | Default                          | Description                             |
| --------------- | ------------------------------ | -------------------------------- | --------------------------------------- |
| `defaultThemes` | `ThemeOption[]`                | `[]`                             | Default themes to show in the selector  |
| `baseUrl`       | `string`                       | `"https://tweakcn.com/r/themes"` | Base URL for theme registry             |
| `persist`       | `boolean`                      | `true`                           | Whether to persist theme selection      |
| `storageKey`    | `string`                       | `"tweakcn-switcher-theme"`       | localStorage key for persistence        |
| `className`     | `string`                       | -                                | Custom className for the trigger button |
| `align`         | `"start" \| "center" \| "end"` | `"end"`                          | Position of the dropdown                |

### `useTweakcnSwitcher` Hook

Returns an object with:

- `currentTheme: ThemeOption | null` - Currently active theme
- `themes: ThemeOption[]` - Available themes
- `isLoading: boolean` - Whether a theme is loading
- `error: string | null` - Error message if any
- `applyTheme: (url: string) => Promise<void>` - Apply a theme by URL
- `applyThemeOption: (theme: ThemeOption) => Promise<void>` - Apply a theme by option
- `addTheme: (url: string, name?: string) => Promise<ThemeOption | null>` - Add a custom theme
- `removeTheme: (themeId: string) => void` - Remove a theme from the list
- `mode: "light" \| "dark"` - Current theme mode
- `setMode: (mode: "light" \| "dark") => void` - Set theme mode

## Theme Registry Format

The component expects themes in the shadcn/ui registry format:

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "theme-name",
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
      "radius": "0.5rem",
      "font-sans": "Inter, sans-serif"
    },
    "light": {
      "background": "oklch(1 0 0)",
      "foreground": "oklch(0.145 0 0)"
    },
    "dark": {
      "background": "oklch(0.145 0 0)",
      "foreground": "oklch(1 0 0)"
    }
  }
}
```
