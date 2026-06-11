import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { LinksFunction, MetaFunction } from "react-router";
import { Theme } from "./vendor/design-system/components/theme";

import "./app.css";
import "./design-system.css";

export const meta: MetaFunction = () => [
  { title: "Cloudflare Internal App Example" },
  {
    name: "description",
    content: "Example internal app using D1, Workers AI, and Workflows on Cloudflare",
  },
];

export const links: LinksFunction = () => [{ rel: "icon", href: "/favicon.ico" }];

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Theme hasBackground={false}>
          <Outlet />
        </Theme>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
