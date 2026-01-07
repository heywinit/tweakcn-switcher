/**
 * TweakcnSwitcher - A component for switching shadcn/ui themes
 */

import {
  Palette,
  Loader2,
  Plus,
  X,
  Moon,
  Sun,
  Code,
  Link,
  Search,
  Trash2,
  Star,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTweakcnSwitcher } from "@/lib/tweakcn-switcher";
import type { TweakcnSwitcherConfig } from "@/lib/tweakcn-switcher/types";
import { cn } from "@/lib/utils";
import { isCssCode, fetchThemeFromUrl, parseCssToThemeRegistryItem } from "@/lib/tweakcn-switcher/utils";
import { type KeyboardEvent, useState, useMemo } from "react";
import { toast } from "sonner";
import { ThemePreviewDialog } from "./theme-preview-dialog";
import type { ThemeRegistryItem } from "@/lib/tweakcn-switcher/types";

export interface TweakcnSwitcherProps extends TweakcnSwitcherConfig {
  className?: string;
  trigger?: React.ReactElement;
}

export function TweakcnSwitcher({ className, trigger, ...config }: TweakcnSwitcherProps) {
  const {
    currentTheme,
    themes,
    error,
    applyThemeOption,
    addTheme,
    removeTheme,
    mode,
    setMode,
    isLoading,
    favorites,
    toggleFavorite,
    isFavorite,
  } = useTweakcnSwitcher(config);
  const { allowDeleteDefaults = true, defaultThemes = [] } = config;

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [title, setTitle] = useState("");
  const [isAddingTheme, setIsAddingTheme] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [inputMode, setInputMode] = useState<"url" | "css">("url");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<{ theme: any; registryItem: ThemeRegistryItem | null } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const handleAddTheme = async () => {
    if (!input.trim()) return;

    setIsAddingTheme(true);
    try {
      const newTheme = await addTheme(input.trim(), title.trim() || undefined);
      if (newTheme !== null) {
        await applyThemeOption(newTheme);
        toast.success("Theme added successfully!", {
          description: `"${newTheme.name}" has been added and applied.`,
        });
        setInput("");
        setTitle("");
        setShowInput(false);
      }
    } catch (err) {
      // Error is already set in the hook's error state, which will be displayed
      console.error("Failed to add theme:", err);
      // Keep the input visible so user can fix the input
    } finally {
      setIsAddingTheme(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-detect input mode if user pastes CSS
    if (isCssCode(e.target.value)) {
      setInputMode("css");
    } else if (e.target.value.trim().startsWith("http")) {
      setInputMode("url");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleAddTheme();
    } else if (e.key === "Escape") {
      setShowInput(false);
      setInput("");
      setTitle("");
    }
  };

  // Filter and sort themes: favorites first, then by search query
  const filteredAndSortedThemes = useMemo(() => {
    const filtered = themes.filter((theme) =>
      theme.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    // Sort: favorites first, then alphabetically
    return filtered.sort((a, b) => {
      const aIsFavorite = isFavorite(a.id);
      const bIsFavorite = isFavorite(b.id);

      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;

      return a.name.localeCompare(b.name);
    });
  }, [themes, searchQuery, isFavorite]);

  const handlePreviewTheme = async (theme: typeof themes[0]) => {
    setLoadingPreview(true);
    setPreviewOpen(true);
    setPreviewTheme({ theme, registryItem: null });

    try {
      let registryItem: ThemeRegistryItem;
      if (theme.css) {
        registryItem = parseCssToThemeRegistryItem(theme.css, theme.name);
      } else if (theme.url) {
        registryItem = await fetchThemeFromUrl(theme.url);
      } else {
        setLoadingPreview(false);
        return;
      }

      setPreviewTheme({ theme, registryItem });
    } catch (err) {
      console.error("Failed to load theme for preview:", err);
      toast.error("Failed to load theme preview");
    } finally {
      setLoadingPreview(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" className={cn("relative", className)} aria-label="Switch theme">
      <Palette className="size-4" />
      <span>Switch theme</span>
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ?? defaultTrigger} />
      <DialogContent className="sm:max-w-md overflow-x-hidden" showCloseButton={false}>
        <DialogHeader className="min-w-0">
          <DialogTitle className="flex items-center justify-between min-w-0 gap-2">
            <span className="truncate">Themes</span>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setMode(mode === "light" ? "dark" : "light")}
                className="h-6 w-6 shrink-0"
                aria-label={`Switch to ${mode === "light" ? "dark" : "light"} mode`}
              >
                {mode === "light" ? <Moon className="size-3" /> : <Sun className="size-3" />}
              </Button>
              <DialogClose
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="h-6 w-6 shrink-0"
                    aria-label="Close dialog"
                  >
                    <X className="size-3" />
                  </Button>
                }
              />
            </div>
          </DialogTitle>
          <DialogDescription>Select a theme or add a new one</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 min-w-0 overflow-x-hidden">
          {error && (
            <div className="px-3 py-2 text-sm text-destructive bg-destructive/10 rounded-none border border-destructive/20">
              {error}
            </div>
          )}

          {showInput ? (
            <div className="space-y-3 min-w-0">
              <div className="space-y-2">
                <Label htmlFor="theme-title" className="text-xs">
                  Theme name <span className="text-muted-foreground/70">(optional)</span>
                </Label>
                <Input
                  id="theme-title"
                  placeholder="e.g., My Custom Theme"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-9 text-sm w-full min-w-0"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Source type</Label>
                <div className="flex gap-2 min-w-0">
                  <Button
                    variant={inputMode === "url" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setInputMode("url");
                      setInput("");
                    }}
                    className={cn("flex-1 min-w-0", inputMode === "url" && "border border-primary")}
                  >
                    <Link className="size-3 mr-1.5 shrink-0" />
                    <span className="truncate">URL</span>
                  </Button>
                  <Button
                    variant={inputMode === "css" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setInputMode("css");
                      setInput("");
                    }}
                    className={cn("flex-1 min-w-0", inputMode === "css" && "border border-primary")}
                  >
                    <Code className="size-3 mr-1.5 shrink-0" />
                    <span className="truncate">CSS</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={inputMode === "url" ? "theme-url" : "theme-css"}
                  className="text-xs"
                >
                  {inputMode === "url" ? "Theme URL" : "CSS Variables"}
                </Label>
                {inputMode === "url" ? (
                  <div className="flex gap-2 min-w-0">
                    <Input
                      id="theme-url"
                      placeholder="https://tweakcn.com/r/themes/..."
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      className="h-9 text-sm w-full min-w-0"
                    />
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => window.open("https://tweakcn.com", "_blank")}
                      title="Browse themes on tweakcn.com"
                      aria-label="Browse themes on tweakcn.com"
                      className="shrink-0 size-9 cursor-pointer"
                    >
                      <Link className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <textarea
                    id="theme-css"
                    placeholder=":root {&#10;  --background: 0 0% 100%;&#10;  --foreground: 222.2 84% 4.9%;&#10;  ...&#10;}"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className={cn(
                      "dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50",
                      "h-32 w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-sm",
                      "transition-colors focus-visible:ring-1 outline-none",
                      "resize-none font-mono",
                    )}
                  />
                )}
                <div className="flex gap-2 min-w-0 pt-1">
                  <Button
                    onClick={handleAddTheme}
                    disabled={isAddingTheme || !input.trim()}
                    className="flex-1 min-w-0"
                  >
                    {isAddingTheme ? (
                      <Loader2 className="size-3 animate-spin mr-1.5 shrink-0" />
                    ) : (
                      <Plus className="size-3 mr-1.5 shrink-0" />
                    )}
                    <span className="truncate">Add theme</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowInput(false);
                      setInput("");
                      setTitle("");
                      setInputMode("url");
                    }}
                    className="shrink-0"
                    disabled={isAddingTheme}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="relative min-w-0">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search themes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 text-sm pl-8 w-full min-w-0"
                />
              </div>
              {filteredAndSortedThemes.length > 0 ? (
                <div className="space-y-1 max-h-[300px] overflow-y-auto overflow-x-hidden min-w-0">
                  {filteredAndSortedThemes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => {
                        // Prevent clicks if already loading or if this is the current theme
                        if (isLoading || currentTheme?.id === theme.id) {
                          return;
                        }
                        applyThemeOption(theme);
                      }}
                      type="button"
                      className={cn(
                        "flex items-center w-full text-start justify-between group px-3 py-2 rounded-md border border-transparent hover:bg-muted hover:border-border transition-colors min-w-0 cursor-pointer",
                        currentTheme?.id === theme.id && "bg-muted border-border",
                        (isLoading || currentTheme?.id === theme.id) &&
                          "opacity-50 cursor-not-allowed",
                      )}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(theme.id);
                          }}
                          className={cn(
                            "h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
                            isFavorite(theme.id) && "opacity-100",
                          )}
                          aria-label={isFavorite(theme.id) ? `Unfavorite ${theme.name}` : `Favorite ${theme.name}`}
                        >
                          <Star
                            className={cn(
                              "size-3",
                              isFavorite(theme.id)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground",
                            )}
                          />
                        </Button>
                        <span
                          className={cn(
                            "text-sm truncate flex-1 min-w-0",
                            currentTheme?.id === theme.id
                              ? "font-medium"
                              : "text-muted-foreground",
                          )}
                        >
                          {theme.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await handlePreviewTheme(theme);
                          }}
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label={`Preview ${theme.name}`}
                          title="Preview theme"
                        >
                          <Eye className="size-3" />
                        </Button>
                        {(() => {
                          // Check if this theme is a default theme
                          const isDefaultTheme = defaultThemes.some((dt) => dt.id === theme.id);
                          // Show delete button if allowDeleteDefaults is true (default) or if it's not a default theme
                          const canDelete = allowDeleteDefaults || !isDefaultTheme;
                          if (!canDelete) return null;
                          return (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={async (e) => {
                                e.stopPropagation();
                                const wasCurrentTheme = currentTheme?.id === theme.id;
                                removeTheme(theme.id);

                                // If we deleted the current theme, switch to another one
                                if (wasCurrentTheme) {
                                  // Get the remaining themes after deletion
                                  const remainingThemes = themes.filter((t) => t.id !== theme.id);

                                  if (remainingThemes.length > 0) {
                                    // Switch to the last theme
                                    await applyThemeOption(
                                      remainingThemes[remainingThemes.length - 1],
                                    );
                                  } else if (defaultThemes.length > 0) {
                                    // If no themes remain, switch to the first default theme
                                    await applyThemeOption(defaultThemes[0]);
                                  }
                                  // If no themes and no defaults, do nothing (currentTheme is already null)
                                }
                              }}
                              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label={`Remove ${theme.name}`}
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          );
                        })()}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-8 text-sm text-muted-foreground text-center">
                  {searchQuery ? "No themes found" : "No themes available"}
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInput(true)}
                className="w-full min-w-0"
              >
                <Plus className="size-4 mr-2 shrink-0" />
                <span className="truncate">Add theme</span>
              </Button>
            </>
          )}
        </div>
      </DialogContent>

      {/* Theme Preview Dialog */}
      <ThemePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        theme={previewTheme?.theme || null}
        registryItem={previewTheme?.registryItem || null}
        mode={mode}
        isLoading={loadingPreview}
      />
    </Dialog>
  );
}
