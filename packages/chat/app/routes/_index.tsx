import { authkitLoader } from "@workos-inc/authkit-react-router";
import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import {
  cloudflareContext,
  configureAuthKit,
  emailAllowed,
  getTenantConfig,
} from "../lib/config.server";
import { latestThreadId } from "../lib/chat-threads.server";

/**
 * `/` means "resume where I left off": redirect to the newest thread, or mint a
 * fresh id when the user has none. The console itself lives at /t/:threadId so
 * the thread survives a refresh and can be deep-linked. Threads are created
 * lazily on the first message, so minting an id here writes nothing.
 */
export async function loader(args: LoaderFunctionArgs) {
  const { env } = args.context.get(cloudflareContext);
  configureAuthKit(env);
  const tenant = getTenantConfig(env);
  return authkitLoader(
    args,
    async ({ auth }) => {
      if (!emailAllowed(auth.user.email, tenant)) {
        throw new Response("This account is not allowed to use the audit console.", {
          status: 403,
        });
      }
      const latest = await latestThreadId(env.DB, auth.user.id);
      // Thrown so it short-circuits authkitLoader's data wrapping.
      throw redirect(`/t/${latest ?? crypto.randomUUID()}`);
    },
    { ensureSignedIn: true },
  );
}
