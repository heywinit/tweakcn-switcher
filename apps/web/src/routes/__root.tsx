import { HeadContent, Outlet, createRootRouteWithContext } from "@tanstack/react-router";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

import "../index.css";

export interface RouterAppContext {}

const SITE_URL = "https://tweakcn-switcher.vercel.app";

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => {
    const title = "tweakcn-switcher - Programmable theme switcher for shadcn/ui";
    const description =
      "A theme switcher component and hook for shadcn/ui. Load themes from tweakcn, any shadcn theme URLs, or pass CSS variables directly.";
    const url = SITE_URL;
    return {
      meta: [
        {
          title,
        },
        {
          name: "description",
          content: description,
        },
        {
          name: "keywords",
          content:
            "shadcn, ui, theme, switcher, tweakcn, react, component, tailwindcss, css variables",
        },
        {
          name: "author",
          content: "@hiwinit",
        },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1",
        },
        {
          name: "theme-color",
          content: "#000000",
        },
        // Open Graph
        {
          property: "og:title",
          content: title,
        },
        {
          property: "og:description",
          content: description,
        },
        {
          property: "og:type",
          content: "website",
        },
        {
          property: "og:url",
          content: url,
        },
        {
          property: "og:site_name",
          content: "tweakcn-switcher",
        },
        // Twitter Card
        {
          name: "twitter:card",
          content: "summary_large_image",
        },
        {
          name: "twitter:title",
          content: title,
        },
        {
          name: "twitter:description",
          content: description,
        },
        {
          name: "twitter:creator",
          content: "@hiwinit",
        },
      ],
      links: [
        {
          rel: "icon",
          href: "/favicon.ico",
        },
      ],
    };
  },
});

function RootComponent() {
  return (
    <>
      <HeadContent />
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
        storageKey="vite-ui-theme"
      >
        <Outlet />
        <Toaster richColors />
      </ThemeProvider>
    </>
  );
}
