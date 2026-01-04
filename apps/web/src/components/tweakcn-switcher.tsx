/**
 * TweakcnSwitcher - A component for switching shadcn/ui themes
 */

import { Palette, Loader2, Plus, X, Moon, Sun, Code, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { useTweakcnSwitcher } from "@/lib/tweakcn-switcher";
import type { TweakcnSwitcherConfig } from "@/lib/tweakcn-switcher/types";
import { cn } from "@/lib/utils";
import { isCssCode } from "@/lib/tweakcn-switcher/utils";
import { type KeyboardEvent, useState } from "react";

export interface TweakcnSwitcherProps extends TweakcnSwitcherConfig {
  className?: string;
  align?: "start" | "center" | "end";
}

export function TweakcnSwitcher({ className, align = "end", ...config }: TweakcnSwitcherProps) {
  const {
    currentTheme,
    themes,
    isLoading,
    error,
    applyThemeOption,
    addTheme,
    removeTheme,
    mode,
    setMode,
  } = useTweakcnSwitcher(config);

  const [input, setInput] = useState("");
  const [title, setTitle] = useState("");
  const [isAddingTheme, setIsAddingTheme] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [inputMode, setInputMode] = useState<"url" | "css">("url");

  const handleAddTheme = async () => {
    if (!input.trim()) return;

    setIsAddingTheme(true);
    try {
      const newTheme = await addTheme(input.trim(), title.trim() || undefined);
      if (newTheme !== null) {
        await applyThemeOption(newTheme);
        setInput("");
        setTitle("");
        // Keep the form open so user can add another theme
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
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className={cn("relative", className)}
            aria-label="Switch theme"
          >
            <Palette className="size-4" />
            {currentTheme && (
              <span className="absolute -top-1 -right-1 size-2 bg-primary rounded-full" />
            )}
          </Button>
        }
      />
      <DropdownMenuContent align={align} className="w-96">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Themes</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setMode(mode === "light" ? "dark" : "light");
                }}
                className="h-6 w-6"
                aria-label={`Switch to ${mode === "light" ? "dark" : "light"} mode`}
              >
                {mode === "light" ? <Moon className="size-3" /> : <Sun className="size-3" />}
              </Button>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {error && <div className="px-2 py-1.5 text-xs text-destructive">{error}</div>}

          {showInput ? (
            <div className="px-2 py-1.5 space-y-2">
              <Input
                placeholder="Theme title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-7 text-xs"
                autoFocus
              />
              <div className="flex gap-1 mb-1">
                <Button
                  variant={inputMode === "url" ? "default" : "ghost"}
                  size="xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setInputMode("url");
                  }}
                  className="h-6 flex-1 text-xs"
                >
                  <Link className="size-3 mr-1" />
                  URL
                </Button>
                <Button
                  variant={inputMode === "css" ? "default" : "ghost"}
                  size="xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setInputMode("css");
                  }}
                  className="h-6 flex-1 text-xs"
                >
                  <Code className="size-3 mr-1" />
                  CSS
                </Button>
              </div>
              {inputMode === "url" ? (
                <Input
                  placeholder="https://tweakcn.com/r/themes/..."
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="h-7 text-xs"
                />
              ) : (
                <textarea
                  placeholder="Paste CSS code here..."
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className={cn(
                    "dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50",
                    "h-32 w-full rounded-none border bg-transparent px-2.5 py-1.5 text-xs",
                    "transition-colors focus-visible:ring-1 outline-none",
                    "resize-none font-mono",
                  )}
                />
              )}
              <div className="flex gap-1">
                <Button
                  variant="default"
                  size="xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddTheme();
                  }}
                  disabled={isAddingTheme || !input.trim()}
                  className="flex-1 h-6"
                >
                  {isAddingTheme ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Plus className="size-3" />
                  )}
                  Add
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowInput(false);
                    setInput("");
                    setTitle("");
                    // Error will be cleared on next addTheme attempt
                  }}
                  className="h-6"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              {themes.length > 0 ? (
                <DropdownMenuRadioGroup
                  value={currentTheme?.id}
                  onValueChange={(value) => {
                    const theme = themes.find((t) => t.id === value);
                    if (theme) {
                      applyThemeOption(theme);
                    }
                  }}
                >
                  {themes.map((theme) => (
                    <DropdownMenuRadioItem
                      key={theme.id}
                      value={theme.id}
                      className="flex items-center justify-between group"
                    >
                      <span className="truncate flex-1">{theme.name}</span>
                      {themes.length > (config.defaultThemes?.length || 0) && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTheme(theme.id);
                          }}
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label={`Remove ${theme.name}`}
                        >
                          <X className="size-3" />
                        </Button>
                      )}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              ) : (
                <div className="px-2 py-4 text-xs text-muted-foreground text-center">
                  No themes available
                </div>
              )}
            </>
          )}

          {isLoading && (
            <div className="px-2 py-1.5 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Loading theme...
            </div>
          )}
        </DropdownMenuGroup>

        {!showInput && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <Button
                variant="ghost"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowInput(true);
                }}
                className="w-full justify-start h-auto py-1.5 px-2 text-xs"
              >
                <Plus className="size-4 mr-2" />
                Add theme
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
