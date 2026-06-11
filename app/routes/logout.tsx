import { signOut } from "@workos-inc/authkit-react-router";
import type { ActionFunctionArgs } from "react-router";
import type { AuditChatEnv } from "../lib/config.server";
import { configureAuthKit } from "../lib/config.server";

export async function action({ request, context }: ActionFunctionArgs) {
  configureAuthKit(context.cloudflare.env as AuditChatEnv);
  return signOut(request);
}
