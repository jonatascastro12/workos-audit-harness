import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { LinksFunction, MetaFunction } from "react-router";
import { Theme } from "./vendor/design-system/components/theme";

import "./app.css";
import "./design-system.css";

export const meta: MetaFunction = () => [
  { title: "Audit Chat · WorkOS" },
  {
    name: "description",
    content: "Ask questions about the AI agent fleet's WorkOS audit trail.",
  },
];

export const links: LinksFunction = () => [{ rel: "icon", href: "/favicon.ico" }];

export default function App() {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Theme appearance="dark" hasBackground={false}>
          <Outlet />
        </Theme>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
