import { TweakcnTheme } from "./types";

const DEFAULT_REGISTRY_URL = "https://tweakcn.com/api/themes";

export class ThemeRegistry {
  private cache = new Map<string, TweakcnTheme>();
  private baseUrl: string;

  constructor(baseUrl: string = DEFAULT_REGISTRY_URL) {
    this.baseUrl = baseUrl;
  }

  async fetchTheme(themeName: string): Promise<TweakcnTheme | null> {
    if (this.cache.has(themeName)) {
      return this.cache.get(themeName)!;
    }

    try {
      const response = await fetch(`${this.baseUrl}/${themeName}.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch theme: ${response.statusText}`);
      }

      const theme: TweakcnTheme = await response.json();
      this.cache.set(themeName, theme);
      return theme;
    } catch (error) {
      console.error(`Error fetching theme "${themeName}":`, error);
      return null;
    }
  }

  async fetchThemes(themeNames: string[]): Promise<(TweakcnTheme | null)[]> {
    return Promise.all(themeNames.map((name) => this.fetchTheme(name)));
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCachedTheme(themeName: string): TweakcnTheme | undefined {
    return this.cache.get(themeName);
  }
}
