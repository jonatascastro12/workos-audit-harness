import { authLoader } from "@workos-inc/authkit-react-router";
import type { LoaderFunctionArgs } from "react-router";
import type { AuditChatEnv } from "../lib/config.server";
import { configureAuthKit } from "../lib/config.server";

export async function loader(args: LoaderFunctionArgs) {
  configureAuthKit(args.context.cloudflare.env as AuditChatEnv);
  return authLoader({ returnPathname: "/" })(args);
}
