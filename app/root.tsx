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
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export const meta: MetaFunction = () => [
  { title: "Calum Steer - Portfolio" },
  { 
    name: "description", 
    content: "Programme Officer for environmental conservation and sustainable development. MPhil Development Studies, Cambridge. First-class Geography degree, Durham. Working on sustainable livelihoods in Madagascar." 
  },
  { property: "og:title", content: "Calum Steer - Portfolio" },
  { 
    property: "og:description", 
    content: "Programme Officer for environmental conservation and sustainable development. MPhil Development Studies, Cambridge. Working on sustainable livelihoods in Madagascar." 
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
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>CS</text></svg>" 
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
