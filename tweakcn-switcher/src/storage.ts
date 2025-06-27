const isBrowser =
  typeof window !== "undefined" && typeof localStorage !== "undefined";

export function readStorage<T = unknown>(key: string): T | undefined {
  if (!isBrowser) return undefined;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}

export function writeStorage<T = unknown>(key: string, value: T): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* noop */
  }
}
