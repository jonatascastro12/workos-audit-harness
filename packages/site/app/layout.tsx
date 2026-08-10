import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

export const metadata: Metadata = {
  title: "WorkOS Audit Harness — audit logs for AI coding agents",
  description:
    "Build audit logs into your AI harness and emit them from your own backend, where events can't be forged. Plus working plugins for Claude Code, Codex, OpenClaw, and pi when you need to instrument a harness you don't own.",
  metadataBase: new URL(getSiteUrl()),
  openGraph: {
    title: "WorkOS Audit Harness",
    description:
      "Audit logs for AI coding agents. Emit from your backend if you build the harness; instrument the endpoint if you don't.",
    type: "website",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#efece4" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a09" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,400;0,500;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
