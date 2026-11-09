import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction, MetaFunction } from "@remix-run/node";

import "./tailwind.css";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:wght@400&display=swap",
  },
];

export const meta: MetaFunction = () => [
  { title: "Jonas Petersen - Portfolio" },
  { 
    name: "description", 
    content: "Computational engineer with AI/robotics expertise. Co-founded and scaled AI startup to €500k revenue. Cambridge MPhil, Imperial MEng. Building the future of human-robot interaction." 
  },
  { property: "og:title", content: "Jonas Petersen - Portfolio" },
  { 
    property: "og:description", 
    content: "Computational engineer with AI/robotics expertise. Cambridge MPhil, Imperial MEng. Building the future of human-robot interaction." 
  },
  { property: "og:type", content: "website" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <link 
          rel="icon" 
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>JP</text></svg>" 
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased"> 
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
