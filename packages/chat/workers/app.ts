import { createRequestHandler, RouterContextProvider } from "react-router";
import { cloudflareContext, type AuditChatEnv } from "../app/lib/config.server";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env, ctx) {
    const context = new RouterContextProvider();
    context.set(cloudflareContext, { env: env as AuditChatEnv, ctx });
    return requestHandler(request, context);
  },
} satisfies ExportedHandler<Env>;
