# tweakcn-switcher

Runtime theme switcher for [tweakcn](https://github.com/jnsahaj/tweakcn) JSON presets. Inspired by `next-themes`, but designed specifically for shadcn/ui projects that want to let their users pick from the growing catalogue of tweakcn themes.

## Features

- 💡 0-flash theme switching using CSS custom properties.
- 🧰 One `<ThemeProvider>` and one `useTheme()` hook — that's it.
- 📦 SSR-friendly (works in Next.js, Remix, Astro… anything React).
- 🗄 Persists user preference to `localStorage` (configurable).
- 🔌 Pluggable theme loader to pull presets from the upcoming **tweakcn registry**.

## Quick start

```bash
npm i tweakcn-switcher
```

```tsx
import { ThemeProvider } from "tweakcn-switcher";
import type { ThemePreset } from "tweakcn-switcher";

const presets: ThemePreset[] = [
  {
    name: "rose",
    tokens: {
      primary: "#e11d48",
      background: "#fff",
      // ...
    },
  },
];

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider presets={presets} defaultTheme="rose">
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
```

Toggle anywhere:

```tsx
import { useTheme } from "tweakcn-switcher";

function Switcher() {
  const { theme, setTheme, themes } = useTheme();

  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
      {Object.keys(themes).map((name) => (
        <option key={name}>{name}</option>
      ))}
    </select>
  );
}
```

---

This package is still **experimental**. API may change until the tweakcn registry is stabilised. PRs & feedback welcome!
