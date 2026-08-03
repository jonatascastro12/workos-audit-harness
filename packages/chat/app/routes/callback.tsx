import { authLoader } from "@workos-inc/authkit-react-router";
import type { LoaderFunctionArgs } from "react-router";
import { cloudflareContext, configureAuthKit } from "../lib/config.server";

export async function loader(args: LoaderFunctionArgs) {
  configureAuthKit(args.context.get(cloudflareContext).env);
  return authLoader({ returnPathname: "/" })(args);
}
