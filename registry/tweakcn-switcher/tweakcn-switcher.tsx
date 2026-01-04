/**
 * TweakcnSwitcher - A component for switching shadcn/ui themes
 */

import { Palette, Loader2, Plus, X, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { useTweakcnSwitcher } from "./use-tweakcn-switcher";
import type { TweakcnSwitcherConfig } from "./types";
import { cn } from "@/lib/utils";
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

  const [urlInput, setUrlInput] = useState("");
  const [isAddingTheme, setIsAddingTheme] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleAddTheme = async () => {
    if (!urlInput.trim()) return;

    setIsAddingTheme(true);
    try {
      const newTheme = await addTheme(urlInput.trim());
      if (newTheme !== null) {
        await applyThemeOption(newTheme);
      }
      setUrlInput("");
      setShowUrlInput(false);
    } catch (err) {
      console.error("Failed to add theme:", err);
    } finally {
      setIsAddingTheme(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddTheme();
    } else if (e.key === "Escape") {
      setShowUrlInput(false);
      setUrlInput("");
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
      <DropdownMenuContent align={align} className="w-64">
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

          {showUrlInput ? (
            <div className="px-2 py-1.5 space-y-2">
              <Input
                placeholder="https://tweakcn.com/r/themes/..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-7 text-xs"
                autoFocus
              />
              <div className="flex gap-1">
                <Button
                  variant="default"
                  size="xs"
                  onClick={handleAddTheme}
                  disabled={isAddingTheme || !urlInput.trim()}
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
                  onClick={() => {
                    setShowUrlInput(false);
                    setUrlInput("");
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

        {!showUrlInput && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowUrlInput(true)} className="cursor-pointer">
              <Plus className="size-4 mr-2" />
              Add theme from URL
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

