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
          ]}
        />
      </div>
    </div>
  );
}
