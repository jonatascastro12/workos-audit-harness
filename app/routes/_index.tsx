import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { Badge } from "../vendor/design-system/components/badge";
import { Box } from "../vendor/design-system/components/box";
import { Card } from "../vendor/design-system/components/card";
import { Flex } from "../vendor/design-system/components/flex";
import { Heading } from "../vendor/design-system/components/heading";
import { Separator } from "../vendor/design-system/components/separator";
import { Text } from "../vendor/design-system/components/text";

interface AppStateRow {
  key: string;
  value: string;
  updated_at: string;
}

function getTimeAgo(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins === 1) return "1 minute ago";
  if (diffMins < 60) return `${diffMins} minutes ago`;
  const diffHours = Math.floor(diffMins / 60);
  return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
}

export async function loader({ context }: LoaderFunctionArgs) {
  const { env } = context.cloudflare;

  const { results } = await env.DB.prepare(
    "SELECT key, value FROM app_state WHERE key IN ('last_updated', 'fun_fact')",
  ).all<AppStateRow>();

  const lastUpdatedRaw = results.find((r: AppStateRow) => r.key === "last_updated")?.value ?? null;

  const lastUpdated = lastUpdatedRaw ?? "Unknown";
  const timeAgo = lastUpdatedRaw ? getTimeAgo(lastUpdatedRaw) : "";
  const funFact =
    results.find((r: AppStateRow) => r.key === "fun_fact")?.value ?? "No fun fact yet.";

  const imageUrl =
    funFact !== "No fun fact yet. The workflow runs every 15 minutes."
      ? `/api/image?v=${encodeURIComponent(lastUpdatedRaw ?? "")}`
      : null;

  return {
    environment: env.ENVIRONMENT ?? "unknown",
    funFact,
    lastUpdated,
    timeAgo,
    imageUrl,
  };
}

export default function Home() {
  const { environment, funFact, lastUpdated, timeAgo, imageUrl } = useLoaderData<typeof loader>();

  return (
    <Box className="min-h-screen">
      <Flex align="center" justify="center" minHeight="100vh" px="6" py="9">
        <Flex direction="column" gap="6" maxWidth="640px" width="100%">
          <Flex direction="column" gap="2">
            <Badge color="purple" size="2">
              {environment}
            </Badge>
            <Heading as="h1" size="8">
              Cloudflare Internal App Example
            </Heading>
            <Text color="gray" size="3">
              Example internal app using D1, Workers AI, R2, and Workflows on Cloudflare.
            </Text>
          </Flex>

          <Card size="4">
            <Flex direction="column" gap="5">
              <Flex direction="column" gap="2">
                <Text color="gray" size="2" weight="medium">
                  Fun fact
                </Text>
                <Text as="p" size="4">
                  {funFact}
                </Text>
              </Flex>

              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="AI-generated illustration of the fun fact"
                  width={1024}
                  height={1024}
                  loading="lazy"
                  decoding="async"
                  className="h-auto w-full rounded-[var(--radius-4)]"
                />
              )}

              <Separator size="4" />

              <Flex direction="column" gap="2">
                <Text color="gray" size="2" weight="medium">
                  Last updated
                </Text>
                <Text as="p" color="gray" size="2">
                  {lastUpdated}
                  {timeAgo && ` (${timeAgo})`}
                </Text>
              </Flex>
            </Flex>
          </Card>

          <Text as="p" color="gray" size="2">
            Updated every hour by a Cloudflare Workflow using Workers AI. Images stored in R2.
          </Text>
        </Flex>
      </Flex>
    </Box>
  );
}
