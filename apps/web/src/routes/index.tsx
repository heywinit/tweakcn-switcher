import { TweakcnSwitcher } from "@/components/tweakcn-switcher";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Copy, Check, ChevronDown, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "@/components/theme-provider";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

const defaultThemes = [
  {
    id: "caffeine",
    name: "Caffeine",
    url: "https://tweakcn.com/r/themes/caffeine.json",
  },
  {
    id: "darkmatter",
    name: "Darkmatter",
    url: "https://tweakcn.com/r/themes/darkmatter.json",
  },
  {
    id: "tangerine",
    name: "Tangerine",
    url: "https://tweakcn.com/r/themes/tangerine.json",
  },
];

const componentCode = `import { TweakcnSwitcher } from "@/components/tweakcn-switcher";

function App() {
  return (
    <TweakcnSwitcher
      defaultThemes={[
        {
          id: "caffeine",
          name: "Caffeine",
          url: "https://tweakcn.com/r/themes/caffeine.json",
        },
      ]}
    />
  );
}`;

const hookCode = `import { useTweakcnSwitcher } from "@/lib/tweakcn-switcher";

function CustomSwitcher() {
  const { currentTheme, themes, applyTheme, mode, setMode } =
    useTweakcnSwitcher({
      defaultThemes: [
        {
          id: "caffeine",
          name: "Caffeine",
          url: "https://tweakcn.com/r/themes/caffeine.json",
        },
      ],
    });

  return (
    <div>
      <button onClick={() => applyTheme("https://tweakcn.com/r/themes/...")}>
        Apply Theme
      </button>
    </div>
  );
}`;

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark" || theme === "dark";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <div className="absolute top-3 right-3 z-10">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleCopy}
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
        </Button>
      </div>
      <div className="bg-muted/50 border border-border rounded-lg overflow-hidden">
        <SyntaxHighlighter
          language="tsx"
          style={isDark ? oneDark : oneLight}
          customStyle={{
            margin: 0,
            padding: "1rem",
            fontSize: "0.875rem",
            lineHeight: "1.5",
            background: "transparent",
          }}
          codeTagProps={{
            style: {
              fontFamily:
                "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
            },
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

type PackageManager = "bun" | "npm" | "pnpm" | "yarn";

function HomeComponent() {
  const [activeTab, setActiveTab] = useState<"component" | "hook">("component");
  const [packageManager, setPackageManager] = useState<PackageManager>("bun");
  const [copied, setCopied] = useState(false);

  // Get registry URL from current origin
  const componentUrl = "https://tweakcn-switcher.vercel.app/r/tweakcn-switcher.json";

  // Generate command based on package manager
  const installCommand = useMemo(() => {
    const baseCommand = "shadcn@latest add";

    switch (packageManager) {
      case "bun":
        return `bunx ${baseCommand} ${componentUrl}`;
      case "npm":
        return `npx ${baseCommand} ${componentUrl}`;
      case "pnpm":
        return `pnpm dlx ${baseCommand} ${componentUrl}`;
      case "yarn":
        return `yarn dlx ${baseCommand} ${componentUrl}`;
    }
  }, [packageManager, componentUrl]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">tweakcn-switcher</h1>
          <a
            href="https://github.com/heywinit/tweakcn-switcher"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "flex items-center gap-2",
            )}
          >
            <Github className="size-4" />
            <span className="hidden sm:inline">Source</span>
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-6 space-y-8 py-8 flex flex-col">
          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-3xl md:text-3xl font-semibold tracking-tight text-foreground/90">
                Programmable theme <span className="text-primary">switcher</span> for shadcn/ui
              </h1>
              <p className="text-base text-foreground/60 max-w-xl leading-relaxed">
                A theme switcher component and hook for shadcn/ui. Load themes from{" "}
                <a
                  href="https://tweakcn.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:underline"
                >
                  tweakcn
                </a>
                {", "} any shadcn theme URLs, or pass CSS variables directly.
              </p>
            </div>

            {/* Installation */}
            <div className="group">
              <div className="bg-muted/30 border border-border/50 rounded-md px-3 py-2.5 flex items-center gap-2.5 font-mono text-xs hover:border-border/80 transition-colors">
                <span className="text-muted-foreground/60 select-none">$</span>
                <code className="flex-1 break-all text-foreground/80">{installCommand}</code>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1.5 text-[10px] font-mono text-muted-foreground hover:text-foreground"
                        >
                          {packageManager}
                          <ChevronDown className="ml-0.5 size-2.5" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setPackageManager("bun")}>
                        bun
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPackageManager("npm")}>
                        npm
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPackageManager("pnpm")}>
                        pnpm
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPackageManager("yarn")}>
                        yarn
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={handleCopy}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  >
                    {copied ? (
                      <Check className="size-3 text-green-500/80" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          {/* Interactive Demo Section */}
          <div className="">
            <h2 className="text-2xl font-semibold mb-4">Try it out</h2>
            <div className="flex items-center justify-center w-full h-96 bg-muted/20 border border-border rounded-lg">
              <TweakcnSwitcher defaultThemes={defaultThemes} />
            </div>
          </div>
          {/* Code Examples with Tabs */}
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-semibold">Code Examples</h2>
            <div className="flex gap-2 border-b border-border">
              <button
                onClick={() => setActiveTab("component")}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                  activeTab === "component"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                Component
              </button>
              <button
                onClick={() => setActiveTab("hook")}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                  activeTab === "hook"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                Hook
              </button>
            </div>
            <CodeBlock code={activeTab === "component" ? componentCode : hookCode} />
          </div>

          {/* Props Documentation */}
          <div className="flex flex-col gap-6">
            <h2 className="text-2xl font-semibold">API Reference</h2>

            <div>
              <h3 className="text-xl font-semibold mb-3">TweakcnSwitcher Props</h3>
              <CodeBlock
                code={`interface TweakcnSwitcherProps extends TweakcnSwitcherConfig {
  className?: string;              // Additional CSS classes for the trigger button
  trigger?: React.ReactElement;    // Custom trigger element (default: button)
}

interface TweakcnSwitcherConfig {
  defaultThemes?: ThemeOption[];   // Array of default themes to display
  baseUrl?: string;                // Base URL for fetching themes
  persist?: boolean;               // Persist to localStorage (default: true)
  storageKey?: string;             // localStorage key (default: "tweakcn-switcher-theme")
  allowDeleteDefaults?: boolean;   // Allow deleting default themes (default: true)
}`}
              />
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">useTweakcnSwitcher Returns</h3>
              <CodeBlock
                code={`interface UseTweakcnSwitcherReturn {
  currentTheme: ThemeOption | null;                    // Currently active theme
  themes: ThemeOption[];                               // All available themes
  isLoading: boolean;                                  // Loading state
  error: string | null;                                // Error message
  applyTheme: (url: string) => Promise<void>;          // Apply theme from URL or CSS
  applyThemeOption: (theme: ThemeOption) => Promise<void>; // Apply theme from ThemeOption
  addTheme: (url: string, name?: string) => Promise<ThemeOption | null>; // Add new theme
  removeTheme: (themeId: string) => void;              // Remove theme by ID
  mode: "light" | "dark";                              // Current color mode
  setMode: (mode: "light" | "dark") => void;           // Update color mode
}`}
              />
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Types</h3>
              <CodeBlock
                code={`interface ThemeOption {
  id: string;          // Unique theme identifier
  name: string;        // Theme display name
  url?: string;        // URL to fetch theme from
  css?: string;        // CSS variables as string
  preview?: string;    // Optional preview image URL
}`}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <p className="text-sm text-muted-foreground text-center">
            Powered by{" "}
            <a
              href="https://tweakcn.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:underline"
            >
              tweakcn.com
            </a>{" "}
            by{" "}
            <a
              href="https://x.com/iamsahaj_xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:underline"
            >
              @iamsahaj_xyz
            </a>
            . Built by{" "}
            <a
              href="https://x.com/hiwinit"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:underline"
            >
              @hiwinit
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
