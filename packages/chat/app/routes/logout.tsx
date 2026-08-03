import { signOut } from "@workos-inc/authkit-react-router";
import type { ActionFunctionArgs } from "react-router";
import { cloudflareContext, configureAuthKit } from "../lib/config.server";

export async function action({ request, context }: ActionFunctionArgs) {
  configureAuthKit(context.get(cloudflareContext).env);
  return signOut(request);
}
