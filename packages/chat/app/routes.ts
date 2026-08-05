import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // `/` resolves to the user's most recent thread; the console lives at
  // /t/:threadId so a refresh (or a shared link) lands in the same thread.
  index("routes/_index.tsx"),
  route("t/:threadId", "routes/thread.tsx"),
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
  route("callback", "routes/callback.tsx"),
  route("settings", "routes/settings.tsx"),
  route("api/chat", "routes/api.chat.ts"),
] satisfies RouteConfig;
