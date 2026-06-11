import { getSignInUrl } from "@workos-inc/authkit-react-router";
import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import type { AuditChatEnv } from "../lib/config.server";
import { configureAuthKit } from "../lib/config.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  configureAuthKit(context.cloudflare.env as AuditChatEnv);
  const returnTo = new URL(request.url).searchParams.get("returnTo") ?? "/";
  const { url, headers } = await getSignInUrl(returnTo, request);
  return redirect(url, { headers });
}
