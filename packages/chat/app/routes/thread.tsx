import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { authkitLoader, withAuth } from "@workos-inc/authkit-react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, Link, redirect, useFetcher, useLoaderData, useNavigate } from "react-router";
import * as AlertDialog from "../vendor/design-system/components/alert-dialog";
import { Separator } from "../vendor/design-system/components/separator";
import { Badge } from "../vendor/design-system/components/badge";
import { Box } from "../vendor/design-system/components/box";
import { Button } from "../vendor/design-system/components/button";
import { Callout } from "../vendor/design-system/components/callout";
import { Card } from "../vendor/design-system/components/card";
import { Code } from "../vendor/design-system/components/code";
import { Flex } from "../vendor/design-system/components/flex";
import { Heading } from "../vendor/design-system/components/heading";
import { Spinner } from "../vendor/design-system/components/spinner";
import { Text } from "../vendor/design-system/components/text";
import { TextArea } from "../vendor/design-system/components/text-area";
import * as Select from "../vendor/design-system/components/select";
import type { AuditLogRow, AuditQueryResult } from "../lib/audit-logs.server";
import { listOrganizations } from "../lib/audit-logs.server";
import {
  cloudflareContext,
  configureAuthKit,
  emailAllowed,
  getTenantConfig,
} from "../lib/config.server";
import type { ThreadSummary } from "../lib/chat-threads.server";
import { deleteThread, isValidThreadId, loadThreadPage } from "../lib/chat-threads.server";

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
      const threadId = args.params.threadId;
      if (!isValidThreadId(threadId)) {
        throw redirect("/");
      }
      const [organizations, page] = await Promise.all([
        listOrganizations(tenant.apiKey),
        loadThreadPage(env.DB, auth.user.id, threadId),
      ]);
      const defaultOrganizationId =
        (tenant.defaultOrganizationId &&
        organizations.some((org) => org.id === tenant.defaultOrganizationId)
          ? tenant.defaultOrganizationId
          : organizations[0]?.id) ?? null;
      return {
        organizations,
        defaultOrganizationId,
        environmentLabel: tenant.environmentLabel,
        publicHostname: tenant.publicHostname,
        modelId: tenant.modelId,
        threadId,
        threads: page.threads,
        initialMessages: page.messages,
        historyAvailable: page.storeAvailable,
      };
    },
    { ensureSignedIn: true },
  );
}

/** Thread deletion. Ownership lives in the SQL predicate; the gate is re-run
 * here per request exactly as the settings action does. */
export async function action(args: ActionFunctionArgs) {
  const { env } = args.context.get(cloudflareContext);
  configureAuthKit(env);
  const tenant = getTenantConfig(env);

  const auth = await withAuth(args as unknown as LoaderFunctionArgs);
  if (!auth.user) return { error: "Your session has expired. Reload the page and sign in again." };
  if (!emailAllowed(auth.user.email, tenant)) {
    return { error: "This account is not allowed to use the audit console." };
  }

  // Belt-and-braces same-origin check on top of the SameSite session cookie.
  const origin = args.request.headers.get("Origin");
  if (origin) {
    let originHost: string | null = null;
    try {
      originHost = new URL(origin).host;
    } catch {
      // Malformed Origin — treat as cross-origin.
    }
    if (originHost !== new URL(args.request.url).host) {
      return { error: "Cross-origin requests are not allowed." };
    }
  }

  const formData = await args.request.formData();
  if (formData.get("intent") !== "delete-thread") return { error: "Unknown action." };
  const target = String(formData.get("threadId") ?? "");
  if (!isValidThreadId(target)) return { error: "That thread id is not valid." };

  const ok = await deleteThread(env.DB, auth.user.id, target);
  if (!ok) return { error: "Could not delete the thread. Try again." };
  // Land on `/`, which resumes the next most recent thread (or a fresh one).
  throw redirect("/");
}

const ORG_STORAGE_KEY = "audit-chat.organizationId";

const SUGGESTIONS = [
  {
    label: "Fleet overview",
    question: "What happened across the agent fleet in the last 24 hours?",
  },
  {
    label: "Shell activity",
    question: "Who ran bash commands this week, and what did they run?",
  },
  {
    label: "Failures",
    question: "Which tool calls failed in the last 7 days, and for whom?",
  },
  {
    label: "Actor trace",
    question: "Show me the latest actions of the most active user this week.",
  },
];

interface QueryToolPart {
  type: "tool-query_audit_logs";
  toolCallId: string;
  state: "input-streaming" | "input-available" | "output-available" | "output-error";
  input?: {
    range_start?: string;
    range_end?: string;
    actions?: string[];
    actor_ids?: string[];
    actor_names?: string[];
    targets?: string[];
    max_rows?: number;
  };
  output?: AuditQueryResult;
  errorText?: string;
}

function formatStamp(iso?: string): string {
  if (!iso) return "····-··-·· ··:··:··";
  return iso
    .replace("T", " ")
    .replace(/\.\d+Z?$/, "")
    .slice(0, 19);
}

function describeActor(row: AuditLogRow): string {
  return row.actor.id || row.actor.name || "unknown actor";
}

function describeTargets(row: AuditLogRow): string {
  if (row.targets.length === 0) return "";
  return row.targets
    .map((target) => `${target.type ?? "?"}:${target.name || target.id || "?"}`)
    .join(", ");
}

function EventRow({ row }: { row: AuditLogRow }) {
  return (
    <Flex align="start" gap="3" className="event-row">
      <Text size="1" className="font-mono event-stamp">
        {formatStamp(row.occurredAt)}
      </Text>
      <Flex direction="column" gap="0" className="min-w-0">
        <Flex align="center" gap="2" wrap="wrap">
          <Code size="1" color="purple" variant="ghost">
            {row.action}
          </Code>
          <Text size="1" color="gray" truncate>
            {describeActor(row)}
          </Text>
        </Flex>
        {describeTargets(row) ? (
          <Text size="1" color="gray" className="font-mono event-targets" truncate>
            → {describeTargets(row)}
          </Text>
        ) : null}
      </Flex>
    </Flex>
  );
}

function FilterChips({ values, color }: { values?: string[]; color: "purple" | "gray" }) {
  if (!values?.length) return null;
  return (
    <>
      {values.map((value) => (
        <Code key={value} size="1" color={color} variant="soft">
          {value}
        </Code>
      ))}
    </>
  );
}

function QueryCard({ part }: { part: QueryToolPart }) {
  const [expanded, setExpanded] = useState(false);
  const input = part.input ?? {};
  const output = part.state === "output-available" ? part.output : undefined;
  const pending = part.state === "input-streaming" || part.state === "input-available";
  const visibleRows = output ? (expanded ? output.rows : output.rows.slice(0, 6)) : [];

  return (
    <Card size="2" className="query-card">
      <Flex direction="column" gap="3">
        <Flex align="center" justify="between" gap="3" wrap="wrap">
          <Flex align="center" gap="2">
            <Text size="1" weight="medium" className="font-mono query-label">
              AUDIT EXPORT
            </Text>
            {pending ? <Spinner size="1" /> : null}
            {part.state === "output-error" ? (
              <Badge color="red" size="1">
                failed
              </Badge>
            ) : null}
            {output ? (
              <Badge color="green" size="1">
                {output.rowCount} event{output.rowCount === 1 ? "" : "s"}
              </Badge>
            ) : null}
          </Flex>
          <Text size="1" color="gray" className="font-mono">
            {formatStamp(input.range_start)} →{" "}
            {input.range_end ? formatStamp(input.range_end) : "now"}
          </Text>
        </Flex>

        <Flex gap="2" wrap="wrap">
          <FilterChips values={input.actions} color="purple" />
          <FilterChips values={input.actor_ids} color="gray" />
          <FilterChips values={input.actor_names} color="gray" />
          <FilterChips values={input.targets} color="gray" />
        </Flex>

        {part.state === "output-error" ? (
          <Text size="1" color="red">
            {part.errorText || "Export failed."}
          </Text>
        ) : null}

        {output ? (
          output.rowCount === 0 ? (
            <Text size="1" color="gray">
              No events matched this export.
            </Text>
          ) : (
            <Flex direction="column" gap="2">
              <Text size="1" color="gray" className="font-mono query-counts">
                actions: {output.counts.actions}
              </Text>
              <Flex direction="column" gap="2" className="event-list">
                {visibleRows.map((row, index) => (
                  <EventRow key={`${row.occurredAt}-${index}`} row={row} />
                ))}
              </Flex>
              {output.rows.length > 6 ? (
                <Button
                  size="1"
                  variant="ghost"
                  color="gray"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? "Collapse" : `Show all ${output.rows.length} sampled events`}
                </Button>
              ) : null}
            </Flex>
          )
        ) : null}
      </Flex>
    </Card>
  );
}

function MessageParts({ message }: { message: UIMessage }) {
  return (
    <>
      {message.parts.map((part, index) => {
        if (part.type === "text") {
          if (message.role === "assistant") {
            return (
              <div key={index} className="message-markdown">
                <Markdown remarkPlugins={[remarkGfm]}>{part.text}</Markdown>
              </div>
            );
          }
          return (
            <Text key={index} as="p" size="2" className="message-text">
              {part.text}
            </Text>
          );
        }
        if (part.type === "tool-query_audit_logs") {
          return <QueryCard key={index} part={part as unknown as QueryToolPart} />;
        }
        return null;
      })}
    </>
  );
}

function ThreadSwitcher({
  threads,
  threadId,
  disabled,
}: {
  threads: ThreadSummary[];
  threadId: string;
  disabled: boolean;
}) {
  const navigate = useNavigate();
  const fetcher = useFetcher<{ error?: string }>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const current = threads.find((thread) => thread.id === threadId);

  return (
    <Flex align="center" gap="2">
      {threads.length > 0 ? (
        <Select.Root
          value={current ? threadId : ""}
          onValueChange={(id) => navigate(`/t/${id}`)}
          disabled={disabled}
        >
          <Select.Trigger ghost className="console-threads" aria-label="Conversation" />
          <Select.Content>
            {!current ? (
              <Select.Item value="" disabled>
                New investigation
              </Select.Item>
            ) : null}
            {threads.map((thread) => (
              <Select.Item key={thread.id} value={thread.id}>
                {thread.title}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      ) : null}
      <Button
        asChild
        size="1"
        variant="ghost"
        color="gray"
        title="Start a new investigation"
        aria-label="New investigation"
      >
        <Link to={`/t/${crypto.randomUUID()}`}>New</Link>
      </Button>
      {current ? (
        <AlertDialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialog.Trigger>
            <Button size="1" variant="ghost" color="red" disabled={disabled}>
              Delete
            </Button>
          </AlertDialog.Trigger>
          <AlertDialog.Content>
            <fetcher.Form method="post">
              <Flex direction="column" gap="4">
                <AlertDialog.Header
                  title="Delete this investigation?"
                  description={`"${current.title}" and all of its messages are removed permanently. This cannot be undone.`}
                  error={fetcher.data?.error}
                />
                <AlertDialog.Footer>
                  <AlertDialog.Cancel>
                    <Button variant="soft" color="gray" type="button">
                      Keep it
                    </Button>
                  </AlertDialog.Cancel>
                  <Button
                    color="red"
                    type="submit"
                    name="intent"
                    value="delete-thread"
                    disabled={fetcher.state !== "idle"}
                  >
                    {fetcher.state !== "idle" ? <Spinner size="1" /> : null}
                    Delete investigation
                  </Button>
                </AlertDialog.Footer>
                <input type="hidden" name="threadId" value={threadId} />
              </Flex>
            </fetcher.Form>
          </AlertDialog.Content>
        </AlertDialog.Root>
      ) : null}
    </Flex>
  );
}

export default function Home() {
  const {
    user,
    organizations,
    defaultOrganizationId,
    environmentLabel,
    publicHostname,
    modelId,
    threadId,
    threads,
    initialMessages,
    historyAvailable,
  } = useLoaderData<typeof loader>();
  const [input, setInput] = useState("");
  const [organizationId, setOrganizationId] = useState(defaultOrganizationId ?? "");
  const scrollRef = useRef<HTMLDivElement>(null);

  // The transport sends ONLY the newest message plus the thread id; the server
  // rebuilds prior turns from D1. That keeps a client from fabricating earlier
  // assistant turns or tool outputs, and keeps large audit payloads out of the
  // request. `organizationId` is read through a ref so changing the org picker
  // never has to re-create the transport (which would re-key the chat).
  const orgRef = useRef(organizationId);
  orgRef.current = organizationId;
  const transport = useMemo(
    () =>
      new DefaultChatTransport<UIMessage>({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages: outgoing, body }) => ({
          body: {
            ...body,
            threadId,
            organizationId: orgRef.current,
            message: outgoing[outgoing.length - 1],
          },
        }),
      }),
    [threadId],
  );

  // `id` is the re-key trigger: navigating to another thread constructs a fresh
  // Chat seeded with that thread's messages, so transcripts never bleed.
  const { messages, sendMessage, status, error } = useChat({
    id: threadId,
    messages: initialMessages as UIMessage[],
    transport,
  });

  const busy = status === "submitted" || status === "streaming";

  // Restore the last-used org after mount (avoids an SSR/client hydration mismatch).
  useEffect(() => {
    const stored = window.localStorage.getItem(ORG_STORAGE_KEY);
    if (stored && organizations.some((org) => org.id === stored)) setOrganizationId(stored);
  }, [organizations]);

  function selectOrganization(id: string) {
    setOrganizationId(id);
    window.localStorage.setItem(ORG_STORAGE_KEY, id);
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy || !organizationId) return;
    // org + threadId are attached by prepareSendMessagesRequest.
    void sendMessage({ text: trimmed });
    setInput("");
  }

  return (
    <Flex direction="column" className="console-root">
      <header className="console-header">
        <Flex align="center" justify="between" px="5" py="3" gap="4">
          <Flex align="center" gap="3">
            <span className="console-glyph" aria-hidden />
            <Heading as="h1" size="3" className="console-title">
              Audit Chat
            </Heading>
            <Badge color={environmentLabel === "production" ? "purple" : "yellow"} size="1">
              {environmentLabel}
            </Badge>
            {organizations.length > 0 ? (
              <Select.Root
                value={organizationId}
                onValueChange={selectOrganization}
                disabled={busy}
              >
                <Select.Trigger ghost className="console-org" aria-label="Organization" />
                <Select.Content>
                  {organizations.map((org) => (
                    <Select.Item key={org.id} value={org.id}>
                      {org.name || org.id}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            ) : (
              <Code size="1" color="gray" variant="ghost" className="console-org">
                no organizations
              </Code>
            )}
            <Separator orientation="vertical" size="1" />
            <ThreadSwitcher threads={threads} threadId={threadId} disabled={busy} />
          </Flex>
          <Flex align="center" gap="3">
            <Code size="1" color="gray" variant="ghost">
              {modelId}
            </Code>
            <Button asChild size="1" variant="ghost" color="gray">
              <Link to="/settings">Settings</Link>
            </Button>
            <Text size="1" color="gray">
              {user.email}
            </Text>
            <Form method="post" action="/logout">
              <Button size="1" variant="ghost" color="gray" type="submit">
                Sign out
              </Button>
            </Form>
          </Flex>
        </Flex>
      </header>

      <div className="console-scroll" ref={scrollRef}>
        <Flex direction="column" gap="5" className="console-thread">
          {!historyAvailable ? (
            <Callout.Root color="yellow" size="1">
              <Callout.Text>
                Conversation history is unavailable right now, so this thread will not be saved and
                earlier messages cannot be loaded. You can still ask questions — answers just
                won&apos;t have the earlier context.
              </Callout.Text>
            </Callout.Root>
          ) : null}
          {messages.length === 0 ? (
            <Flex direction="column" gap="6" className="console-hero">
              <Flex direction="column" gap="3">
                <Text size="1" className="font-mono hero-kicker">
                  {publicHostname} · every agent action, on the record
                </Text>
                <Heading as="h2" size="8" className="hero-title">
                  Ask the audit trail.
                </Heading>
                <Text size="3" color="gray" className="hero-sub">
                  Every session, prompt, tool call, and shell command from the agent fleet lands in
                  WorkOS Audit Logs. Ask who did what, when, and to which file — answers cite the
                  events.
                </Text>
              </Flex>
              <div className="suggestion-grid">
                {SUGGESTIONS.map((suggestion, index) => (
                  <button
                    key={suggestion.label}
                    type="button"
                    className="suggestion-card"
                    style={{ animationDelay: `${120 + index * 70}ms` }}
                    onClick={() => submit(suggestion.question)}
                  >
                    <Text size="1" weight="medium" className="font-mono suggestion-label">
                      {suggestion.label}
                    </Text>
                    <Text size="2">{suggestion.question}</Text>
                  </button>
                ))}
              </div>
            </Flex>
          ) : (
            messages.map((message) => (
              <Flex
                key={message.id}
                direction="column"
                gap="3"
                className={message.role === "user" ? "msg msg-user" : "msg msg-assistant"}
              >
                {message.role === "user" ? (
                  <Card size="2" className="user-bubble">
                    <MessageParts message={message} />
                  </Card>
                ) : (
                  <Flex direction="column" gap="3">
                    <Text size="1" className="font-mono analyst-label">
                      ANALYST
                    </Text>
                    <MessageParts message={message} />
                  </Flex>
                )}
              </Flex>
            ))
          )}

          {status === "submitted" ? (
            <Flex align="center" gap="2" className="msg">
              <Spinner size="1" />
              <Text size="1" color="gray" className="font-mono">
                opening export…
              </Text>
            </Flex>
          ) : null}

          {error ? (
            <Callout.Root color="red" size="1">
              <Callout.Text>{error.message || "Something went wrong. Try again."}</Callout.Text>
            </Callout.Root>
          ) : null}
        </Flex>
      </div>

      <footer className="console-footer">
        <Box className="composer">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit(input);
            }}
          >
            <Flex direction="column" gap="2">
              <TextArea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    submit(input);
                  }
                }}
                placeholder="Who deleted that file? When? Ask the trail…"
                rows={2}
                size="3"
                disabled={busy}
              />
              <Flex align="center" justify="between">
                <Text size="1" color="gray" className="font-mono">
                  enter to send · shift+enter for a new line
                </Text>
                <Button size="2" type="submit" disabled={busy || !input.trim()}>
                  {busy ? <Spinner size="1" /> : null}
                  Investigate
                </Button>
              </Flex>
            </Flex>
          </form>
        </Box>
      </footer>
    </Flex>
  );
}
