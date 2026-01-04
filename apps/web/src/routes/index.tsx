import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TweakcnSwitcher } from "@/components/tweakcn-switcher";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="absolute top-4 right-4">
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

      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Tweakcn Switcher Demo</CardTitle>
          <CardDescription>A component for switching shadcn/ui themes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Features</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Switch between multiple themes</li>
              <li>Add custom themes via URL</li>
              <li>Toggle between light and dark modes</li>
              <li>Persistent theme selection</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Try it out</h3>
            <p className="text-sm text-muted-foreground">
              Click the palette icon in the top right to open the theme switcher. You can add a
              theme by entering a URL like:
              <code className="block mt-2 p-2 bg-muted rounded text-xs">
                https://tweakcn.com/r/themes/amethyst-haze.json
              </code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
