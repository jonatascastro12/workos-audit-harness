import { getSignInUrl } from "@workos-inc/authkit-react-router";
import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { cloudflareContext, configureAuthKit } from "../lib/config.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  configureAuthKit(context.get(cloudflareContext).env);
  const returnTo = new URL(request.url).searchParams.get("returnTo") ?? "/";
  const { url, headers } = await getSignInUrl(returnTo, request);
  return redirect(url, { headers });
}
