import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
  route("callback", "routes/callback.tsx"),
  route("settings", "routes/settings.tsx"),
  route("api/chat", "routes/api.chat.ts"),
  route("api/image", "routes/api.image.ts"),
] satisfies RouteConfig;
