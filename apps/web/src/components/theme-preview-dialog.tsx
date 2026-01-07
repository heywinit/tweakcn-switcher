/**
 * ThemePreviewDialog - A dialog to preview theme colors
 */

import { X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ThemeRegistryItem, ThemeOption } from "@/lib/tweakcn-switcher/types";
import { extractColorSwatches } from "@/lib/tweakcn-switcher/utils";

interface ThemePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  theme: ThemeOption | null;
  registryItem: ThemeRegistryItem | null;
  mode: "light" | "dark";
  isLoading?: boolean;
}

/**
 * Convert CSS color value to a displayable color
 * Handles formats like: "0 0% 100%" (HSL), "oklch(...)", hex, rgb, etc.
 */
function cssColorToDisplayColor(cssValue: string): string {
  const trimmed = cssValue.trim();

  // If it's already a valid color format, return as-is
  if (trimmed.startsWith("#") || trimmed.startsWith("rgb") || trimmed.startsWith("hsl")) {
    return trimmed;
  }

  // Handle HSL format: "0 0% 100%" -> "hsl(0, 0%, 100%)"
  const hslMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?%)\s+(\d+(?:\.\d+)?%)$/);
  if (hslMatch) {
    return `hsl(${hslMatch[1]}, ${hslMatch[2]}, ${hslMatch[3]})`;
  }

  // Handle oklch format: "oklch(0.5 0.2 180)" -> return as-is (browser support)
  if (trimmed.startsWith("oklch")) {
    return trimmed;
  }

  // Default: try to use as-is, or return a fallback
  return trimmed || "#000000";
}

/**
 * Normalize variable name to a human-readable format
 * e.g., "primary" -> "Primary", "background" -> "Background"
 */
function normalizeVariableName(name: string): string {
  // Handle kebab-case and snake_case
  return name
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function ThemePreviewDialog({
  open,
  onOpenChange,
  theme,
  registryItem,
  mode,
  isLoading = false,
}: ThemePreviewDialogProps) {
  if (!theme) {
    return null;
  }

  const colors = registryItem ? extractColorSwatches(registryItem, mode) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader className="min-w-0">
          <DialogTitle className="flex items-center justify-between min-w-0 gap-2">
            <span className="truncate">{theme.name}</span>
            <DialogClose
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="h-6 w-6 shrink-0"
                  aria-label="Close preview"
                >
                  <X className="size-3" />
                </Button>
              }
            />
          </DialogTitle>
          <DialogDescription>Color palette preview</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading || !registryItem ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : colors.length > 0 ? (
            <>
              {/* Color Swatch Grid */}
              <div className="grid grid-cols-4 gap-2">
                {colors.map((swatch, index) => {
                  const displayColor = cssColorToDisplayColor(swatch.value);
                  const normalizedName = normalizeVariableName(swatch.name);
                  return (
                    <div
                      key={index}
                      className="relative group aspect-square rounded-md border border-border overflow-hidden"
                      style={{ backgroundColor: displayColor }}
                      title={normalizedName}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/10" />
                      <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-black/60 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity truncate text-center">
                        {normalizedName}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Color List */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Color Values</div>
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                  {colors.map((swatch, index) => {
                    const displayColor = cssColorToDisplayColor(swatch.value);
                    const normalizedName = normalizeVariableName(swatch.name);
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 rounded-md border border-border bg-muted/30"
                      >
                        <div
                          className="size-8 rounded border border-border shrink-0"
                          style={{ backgroundColor: displayColor }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-foreground">
                            {normalizedName}
                          </div>
                          <code className="text-[10px] font-mono text-muted-foreground truncate block">
                            {swatch.value}
                          </code>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-sm text-muted-foreground text-center">
              No color information available
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
