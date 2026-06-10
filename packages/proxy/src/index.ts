import { handleEvents } from "./events";
import type { Env } from "./types";

export default {
  async fetch(request, env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/events") {
      return handleEvents(request, env);
    }

    // Unauthenticated liveness probe — also what the plugins' setup preflight
    // hits to confirm the proxy is reachable. Reveals nothing about config.
    if (pathname === "/" || pathname === "/healthz") {
      return Response.json({ service: "workos-audit-proxy", ok: true });
    }

    return new Response("not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
