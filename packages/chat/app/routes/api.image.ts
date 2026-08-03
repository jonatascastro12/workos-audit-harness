import type { LoaderFunctionArgs } from "react-router";
import { cloudflareContext } from "../lib/config.server";

export async function loader({ context }: LoaderFunctionArgs) {
  const { env } = context.get(cloudflareContext);
  const object = await env.IMAGE_BUCKET.get("fun-fact-image.png");

  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "image/png",
      "Cache-Control": "public, max-age=900",
    },
  });
}
