import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel, UIMessage } from "ai";
import { convertToModelMessages, stepCountIs, streamText, tool } from "ai";
import { createAiGateway } from "ai-gateway-provider";
import { createUnified } from "ai-gateway-provider/providers/unified";
import { withAuth } from "@workos-inc/authkit-react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import {
  HARNESS_PREFIXES,
  KNOWN_ACTION_SUFFIXES,
  listOrganizations,
  MAX_MAX_ROWS,
  queryAuditLogs,
} from "../lib/audit-logs.server";
import {
  claimThread,
  isValidThreadId,
  loadTranscript,
  saveMessage,
  threadTitle,
} from "../lib/chat-threads.server";
import type { AuditChatEnv, TenantConfig } from "../lib/config.server";
import {
  cloudflareContext,
  configureAuthKit,
  emailAllowed,
  getTenantConfig,
} from "../lib/config.server";

function resolveModel(env: AuditChatEnv, tenant: TenantConfig): LanguageModel {
  const [provider, ...rest] = tenant.modelId.split("/");
  const bareModel = rest.join("/");
  if (provider === "anthropic" && env.AUDIT_CHAT_ANTHROPIC_API_KEY) {
    return createAnthropic({ apiKey: env.AUDIT_CHAT_ANTHROPIC_API_KEY })(bareModel);
  }
  if (provider === "openai" && env.AUDIT_CHAT_OPENAI_API_KEY) {
    return createOpenAI({ apiKey: env.AUDIT_CHAT_OPENAI_API_KEY })(bareModel);
  }
  const aigateway = createAiGateway({
    binding: env.AI.gateway(env.AUDIT_CHAT_AI_GATEWAY ?? "internal-app-gateway"),
  });
  return aigateway(createUnified()(tenant.modelId));
}

function systemPrompt(tenant: TenantConfig, organizationId: string, userEmail: string): string {
  return [
    "You are the audit investigator for a WorkOS Audit Logs tenant. Admins ask you questions about",
    "what happened in their fleet of AI coding agents (Claude Code, Codex, OpenClaw, pi) whose audit",
    "events are ingested through a device-attested proxy into WorkOS Audit Logs.",
    "",
    `Organization: ${organizationId} (${tenant.environmentLabel} environment).`,
    `Current time: ${new Date().toISOString()}. Signed-in admin: ${userEmail}.`,
    "",
    "Event shape: occurred_at (ISO timestamp), action, actor (id = user email, name, metadata with",
    "device_serial), context (location = IP, user_agent), targets (type/id/name/metadata, e.g. type",
    '"tool" with tool_name, or "session", "message", "model", "file"), and a free-form metadata',
    "object (harness, turn_id, model, tool_name, token counts, etc.).",
    "",
    `Actions follow "{prefix}.{object}.{verb}". Known prefixes: ${HARNESS_PREFIXES.join(", ")}.`,
    `Known suffixes: ${KNOWN_ACTION_SUFFIXES.join(", ")}.`,
    "",
    "Investigate with the query_audit_logs tool (WorkOS Audit Logs Export API):",
    "- Start broad: query the relevant time range with no action filter; the returned counts reveal",
    "  which actions and actors are present. Then narrow with actions / actor filters.",
    "- actor ids are user emails. Filter file or tool questions via metadata in returned rows —",
    "  the export filter only supports actions, actor_ids, actor_names, and target types.",
    "- Keep ranges tight (hours-days) when the user names a date; widen up to ~30 days otherwise.",
    "- rows are newest-first and capped; raise max_rows or narrow filters if row_count exceeds the sample.",
    "",
    "Answer rules: cite concrete events (timestamp + actor + action) for every claim. If the export",
    "has no matching events, say so plainly — never invent activity. Distinguish 'no events recorded'",
    "from 'the event exists but lacks detail'. Format answers in Markdown: use short bullet lists,",
    "**bold** for key findings, and `inline code` for actions, emails, and file paths. Use a compact",
    "table when comparing actors or tallying counts. Keep prose tight; skip headers unless the answer",
    "has distinct sections.",
  ].join("\n");
}

export async function action(args: ActionFunctionArgs) {
  const { env, ctx } = args.context.get(cloudflareContext);
  configureAuthKit(env);
  const tenant = getTenantConfig(env);

  const auth = await withAuth(args as unknown as LoaderFunctionArgs);
  if (!auth.user) return new Response("Unauthorized", { status: 401 });
  if (!emailAllowed(auth.user.email, tenant)) return new Response("Forbidden", { status: 403 });

  // This endpoint writes to the database now, so it gets the same
  // belt-and-braces same-origin check the settings action uses.
  const origin = args.request.headers.get("Origin");
  if (origin) {
    let originHost: string | null = null;
    try {
      originHost = new URL(origin).host;
    } catch {
      // Malformed Origin — treat as cross-origin.
    }
    if (originHost !== new URL(args.request.url).host) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const {
    message: incoming,
    threadId,
    organizationId: requestedOrg,
  } = (await args.request.json()) as {
    message?: UIMessage;
    threadId?: string;
    organizationId?: string;
  };

  if (!incoming || incoming.role !== "user") {
    return new Response("Expected a user message", { status: 400 });
  }

  // The org comes from the user's selection; fall back to the configured default.
  // Validate against the live org list so a stale/forged id can't reach the export API.
  const organizations = await listOrganizations(tenant.apiKey);
  const organizationId = requestedOrg ?? tenant.defaultOrganizationId ?? organizations[0]?.id;
  if (!organizationId || !organizations.some((org) => org.id === organizationId)) {
    return new Response(`Unknown organization: ${organizationId ?? "(none selected)"}`, {
      status: 400,
    });
  }

  // Rebuild prior turns from the database — the client only sent the newest
  // message. If the store is unavailable this comes back empty and the model
  // answers the question without history: degraded, never broken.
  const priorMessages = isValidThreadId(threadId)
    ? await loadTranscript(env.DB, auth.user.id, threadId)
    : [];
  const messages: UIMessage[] = [...priorMessages, incoming];

  // Persist the question before the model runs, so a tab closed mid-answer
  // still keeps what was asked. claimThread creates-or-verifies in one atomic
  // statement; "forbidden" means the id belongs to another user.
  let persistTo: string | null = null;
  if (isValidThreadId(threadId)) {
    const claim = await claimThread(
      env.DB,
      auth.user.id,
      auth.user.email ?? auth.user.id,
      threadId,
      threadTitle(priorMessages[0] ?? incoming),
    );
    if (claim === "forbidden") return new Response("Forbidden", { status: 403 });
    if (claim === "claimed") {
      persistTo = threadId;
      await saveMessage(env.DB, auth.user.id, threadId, incoming);
    }
  }

  const result = streamText({
    model: resolveModel(env, tenant),
    system: systemPrompt(tenant, organizationId, auth.user.email),
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(10),
    tools: {
      query_audit_logs: tool({
        description:
          "Query the tenant's WorkOS Audit Logs via the Export API. Creates an export for the given " +
          "time range and filters, waits for it, and returns parsed events (newest first) plus " +
          "action/actor/target-type counts across ALL matching rows.",
        inputSchema: z.object({
          range_start: z
            .string()
            .describe(
              "ISO 8601 start of the range, e.g. 2026-06-10T00:00:00Z. Defaults to 7 days ago.",
            )
            .optional(),
          range_end: z.string().describe("ISO 8601 end of the range. Defaults to now.").optional(),
          actions: z
            .array(z.string())
            .describe('Exact action names to filter, e.g. ["claude.tool.called"].')
            .optional(),
          actor_ids: z.array(z.string()).describe("Actor ids (user emails).").optional(),
          actor_names: z.array(z.string()).describe("Actor display names.").optional(),
          targets: z
            .array(z.string())
            .describe('Target types, e.g. ["tool", "session"].')
            .optional(),
          max_rows: z
            .number()
            .int()
            .min(1)
            .max(MAX_MAX_ROWS)
            .describe(`How many rows to return (default 50, max ${MAX_MAX_ROWS}).`)
            .optional(),
        }),
        execute: async (input) =>
          queryAuditLogs(tenant.apiKey, organizationId, {
            rangeStart: input.range_start,
            rangeEnd: input.range_end,
            actions: input.actions,
            actorIds: input.actor_ids,
            actorNames: input.actor_names,
            targets: input.targets,
            maxRows: input.max_rows,
          }),
      }),
      list_known_actions: tool({
        description:
          "List the audit action names the coding-agent harnesses emit (prefix × suffix catalog).",
        inputSchema: z.object({}),
        execute: async () => ({
          prefixes: HARNESS_PREFIXES,
          suffixes: KNOWN_ACTION_SUFFIXES,
          examples: HARNESS_PREFIXES.map((prefix) => `${prefix}.tool.called`),
        }),
      }),
    },
  });

  // Keep the model run alive even if the browser goes away mid-stream, so the
  // assistant turn still completes and gets persisted.
  ctx.waitUntil(result.consumeStream());

  return result.toUIMessageStreamResponse({
    onError: (error) => (error instanceof Error ? error.message : String(error)),
    // Passing originalMessages puts the stream in persistence mode: the
    // response message gets a stable id, so re-running a turn overwrites its
    // own row instead of appending a duplicate.
    originalMessages: messages,
    // Fires on normal completion AND on cancel (verified in the installed
    // ai@6 sources), so an interrupted answer is still saved.
    onFinish: ({ responseMessage }) => {
      if (!persistTo) return;
      ctx.waitUntil(saveMessage(env.DB, auth.user.id, persistTo, responseMessage));
    },
  });
}
