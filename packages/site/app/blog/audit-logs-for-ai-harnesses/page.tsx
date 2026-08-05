import type { Metadata } from "next";
import Link from "next/link";
import { StatusBar } from "@/components/StatusBar";
import { CodeBlock } from "@/components/CodeBlock";
import { SkillShortcut } from "@/components/SkillShortcut";
import { HarnessLifecycle } from "@/components/HarnessLifecycle";
import { EventAnatomy } from "@/components/EventAnatomy";
import { ServerFlow } from "@/components/ServerFlow";
import { H2, H3, P, UL, LI, OL, OLI, Quote, Mono, HR } from "@/components/Prose";

export const metadata: Metadata = {
  title:
    "Build your own — Add enterprise-grade audit logs to your AI harness · WorkOS Audit Harness",
  description:
    "How to map AI-harness lifecycle hooks to WorkOS Audit Logs: schemas, event ingestion, security posture, and letting the agent query its own trail.",
};

const EVENTS_TABLE: Array<[string, string, string]> = [
  ["Session started",       "agent.session.started",    "Establishes the beginning of an auditable interaction."],
  ["Session ended",         "agent.session.ended",      "Marks session closure and reason."],
  ["Prompt submitted",      "agent.prompt.submitted",   "Records that a user initiated work."],
  ["Agent run started",     "agent.run.started",        "Captures the start of a model-driven operation."],
  ["Agent run completed",   "agent.run.completed",      "Captures duration, status, and outcome."],
  ["Tool call started",     "agent.tool.called",        "Shows which external capability the agent attempted to use."],
  ["Tool call completed",   "agent.tool.completed",     "Shows whether the tool succeeded and how long it took."],
  ["Tool call failed",      "agent.tool.failed",        "Useful for incident review and debugging."],
  ["Shell command executed","agent.command.executed",   "High-value event for security review."],
  ["Model selected",        "agent.model.selected",     "Useful for understanding model usage and policy decisions."],
  ["Approval granted/denied","agent.approval.granted",  "Shows when a human authorized sensitive behavior."],
  ["File changed",          "agent.file.changed",       "Answers “who changed this file?” in agent workflows."],
  ["Audit export created",  "agent.audit_export.created", "Audits access to the audit trail itself."],
];

export default function Post() {
  return (
    <div className="crt">
      <StatusBar />

      {/* ───── article header ───── */}
      <section className="border-b rule">
        <div className="mx-auto max-w-[820px] px-5 md:px-8 pt-14 pb-12 md:pt-20 md:pb-16">
          <div className="text-[11px] uppercase tracking-[0.18em] dim mb-6 flex items-center gap-3">
            <Link href="/" className="link">~/</Link>
            <span className="opacity-50">/</span>
            <span>blog</span>
            <span className="opacity-50">/</span>
            <span className="accent">audit-logs-for-ai-harnesses</span>
          </div>

          <h1 className="text-[32px] md:text-[44px] leading-[1.1] tracking-[-0.025em] font-medium max-w-[24ch]">
            Add enterprise-grade audit&nbsp;logs to your AI&nbsp;harness with WorkOS.
          </h1>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] uppercase tracking-[0.14em] dim">
            <span className="tag on">essay</span>
            <span>2026-05-16</span>
            <span className="opacity-40">·</span>
            <span>~12 min read</span>
            <span className="opacity-40">·</span>
            <span>build your own integration</span>
          </div>
        </div>
      </section>

      {/* ───── body ───── */}
      <article className="mx-auto max-w-[820px] px-5 md:px-8 py-14 md:py-20">
        <P>
          AI products increasingly look less like a single API call and more like a{" "}
          <em>harness</em>: a runtime that accepts user input, chooses a model, invokes
          tools, runs shell commands, reads and writes files, asks for approval, and
          produces an answer over multiple turns.
        </P>
        <P>
          That lifecycle is powerful. It is also exactly the kind of activity enterprise
          customers want to audit.
        </P>
        <P>
          If a customer asks, “Who ran this command?”, “Which user changed this file?”,
          or “What model and tools were used during this investigation?”, the answer
          should not depend on grepping application logs. It should be available as
          structured, organization-scoped audit events that can be exported, filtered,
          and explained.
        </P>
        <P>
          WorkOS Audit Logs gives you the building blocks for that. Most AI harnesses
          already expose hooks around the agent lifecycle. By mapping the right hooks
          into WorkOS Audit Logs, you can add enterprise-grade auditing to your AI
          product without building an audit log system from scratch.
        </P>

        <SkillShortcut />

        <H2 n="01">What is an audit log?</H2>
        <P>
          An audit log is a structured record of something meaningful that happened in
          your application. A useful audit event usually answers five questions:
        </P>
        <UL>
          <LI><b>Who</b> did it? The actor.</LI>
          <LI><b>What</b> did they do? The action.</LI>
          <LI><b>What was affected?</b> The target.</LI>
          <LI><b>When</b> did it happen? The timestamp.</LI>
          <LI><b>Where and with what context?</b> IP, user agent, organization, metadata.</LI>
        </UL>
        <P>For example:</P>
        <Quote>Jonatas signed in to Linear.</Quote>
        <P>In audit log terms:</P>
        <UL>
          <LI><b>Actor:</b> <Mono>user:jonatas</Mono></LI>
          <LI><b>Action:</b> <Mono>user.signed_in</Mono></LI>
          <LI><b>Target:</b> <Mono>application:linear</Mono></LI>
          <LI><b>Occurred at:</b> <Mono>2026-05-12T10:15:00Z</Mono></LI>
          <LI><b>Context:</b> browser, IP, organization, other metadata</LI>
        </UL>
        <P>For an AI harness, the same pattern applies:</P>
        <Quote>Jonatas asked the agent to debug a failing build.</Quote>
        <Quote>The agent called the <Mono>bash</Mono> tool in session <Mono>sess_123</Mono>.</Quote>
        <Quote>A user selected <Mono>openai/gpt-5-codex</Mono> as the model for an agent session.</Quote>
        <P>
          The shape is still actor, action, target, timestamp, and metadata. The
          difference is that the targets are harness-native objects: sessions, prompts,
          tools, commands, files, models, approvals, and exports.
        </P>

        <H2 n="02">Why AI harnesses are a natural fit</H2>
        <P>
          A typical SaaS application might have explicit controller actions such as
          “create project”, “delete user”, or “update billing settings.” An AI harness
          has a more dynamic lifecycle, but it is still full of auditable moments:
        </P>
        <OL>
          <OLI>A user submits a prompt.</OLI>
          <OLI>The harness starts an agent run.</OLI>
          <OLI>The model chooses tools.</OLI>
          <OLI>The harness executes those tools.</OLI>
          <OLI>The agent writes files or runs commands.</OLI>
          <OLI>The user approves or denies an action.</OLI>
          <OLI>The agent completes or fails.</OLI>
          <OLI>The customer exports logs later to investigate what happened.</OLI>
        </OL>

        <HarnessLifecycle />

        <P>
          Most harnesses already expose hooks for these moments — <Mono>onPrompt</Mono>,
          {" "}<Mono>beforeAgentStart</Mono>, <Mono>onToolCall</Mono>,{" "}
          <Mono>onToolResult</Mono>, <Mono>onSessionEnd</Mono>,{" "}
          <Mono>PreToolUse</Mono>, <Mono>PostToolUse</Mono>. The integration point
          already exists. The task is to decide which hooks are audit-worthy, define
          schemas for them, and emit Audit Log events when they happen.
        </P>

        <H2 n="03">Step 1 — Decide which lifecycle events are worth auditing</H2>
        <P>
          Not every hook belongs in an audit log. Audit logs should capture events that
          are meaningful for security, compliance, customer support, or incident
          investigation. They should not capture every token streamed from the model,
          UI render, retry loop, or internal heartbeat.
        </P>
        <P>A good starting set for an AI harness:</P>

        <div className="my-8 border rule overflow-x-auto">
          <div className="grid grid-cols-[1.1fr_1.3fr_1.6fr] text-[11px] uppercase tracking-[0.14em] dim border-b rule bg-[var(--bg-2)]">
            <div className="px-4 py-3">harness event</div>
            <div className="px-4 py-3 border-l rule">action</div>
            <div className="px-4 py-3 border-l rule">why it matters</div>
          </div>
          {EVENTS_TABLE.map(([h, a, w], i, arr) => (
            <div
              key={a}
              className={
                "grid grid-cols-[1.1fr_1.3fr_1.6fr] text-[13px] " +
                (i < arr.length - 1 ? "border-b rule " : "") +
                "hover:bg-[var(--bg-2)] transition-colors"
              }
            >
              <div className="px-4 py-3">{h}</div>
              <div className="px-4 py-3 border-l rule"><Mono>{a}</Mono></div>
              <div className="px-4 py-3 border-l rule text-[var(--fg-2)] leading-[1.55]">{w}</div>
            </div>
          ))}
        </div>

        <P>
          Just as important: decide what <em>not</em> to log. Raw prompts and tool
          outputs can contain secrets, customer data, or source code. A safer default
          is to store metadata such as:
        </P>
        <UL>
          <LI>prompt length</LI>
          <LI>SHA-256 hash of the prompt</LI>
          <LI>optional truncated preview</LI>
          <LI>tool name</LI>
          <LI>input / output byte size</LI>
          <LI>command preview, truncated</LI>
          <LI>command hash · result hash · duration · success / failure</LI>
        </UL>
        <P>
          That gives investigators evidence without turning your audit logs into a
          second data lake of sensitive content.
        </P>

        <H2 n="04">Step 2 — Model actors, actions, and targets</H2>
        <P>
          WorkOS Audit Logs events are organization-scoped. In a B2B SaaS product the
          WorkOS organization usually maps to your customer. A harness event might
          look like this conceptually:
        </P>
        <CodeBlock
          label="jsonc"
          code={`{
  "organization_id": "org_01ABC",
  "event": {
    "action": "agent.tool.called",
    "occurred_at": "2026-05-12T10:15:00.000Z",
    "actor": { "type": "user", "id": "user_01ABC", "name": "Jonatas" },
    "targets": [
      { "type": "session", "id": "sess_01ABC" },
      { "type": "tool", "id": "toolu_01ABC", "metadata": { "tool_name": "bash" } }
    ],
    "context": { "location": "203.0.113.42", "user_agent": "my-ai-harness/1.0" },
    "metadata": {
      "tool_name": "bash",
      "input_sha256": "...",
      "input_bytes": 482,
      "command_preview": "npm test",
      "command_truncated": false
    }
  }
}`}
        />

        <EventAnatomy />

        <P>The exact fields depend on your product, but the structure stays consistent:</P>
        <UL>
          <LI>The <b>actor</b> is usually the end user, admin, service account, or system process.</LI>
          <LI>The <b>action</b> is a stable string such as <Mono>agent.tool.called</Mono>.</LI>
          <LI>The <b>targets</b> are the affected resources: session, tool, command, model, file, project, or export.</LI>
          <LI>The <b>metadata</b> contains typed, action-specific details.</LI>
        </UL>

        <H2 n="05">Step 3 — Create schemas first</H2>
        <P>
          WorkOS Audit Logs validates incoming events against schemas. That is a
          feature: it prevents your audit trail from becoming inconsistent over time.
          It also means you should create schemas before you start sending events — an
          event that does not match a schema is rejected with a validation error.
        </P>
        <P>A simplified TypeScript example using the WorkOS Node SDK:</P>
        <CodeBlock
          label="typescript"
          code={`import { WorkOS } from '@workos-inc/node';

const workos = new WorkOS(process.env.WORKOS_API_KEY!);

await workos.auditLogs.createSchema({
  action: 'agent.tool.called',
  targets: [
    { type: 'session' },
    { type: 'tool', metadata: { tool_name: 'string' } },
  ],
  metadata: {
    tool_name: 'string',
    tool_call_id: 'string',
    input_sha256: 'string',
    input_bytes: 'number',
    command_preview: 'string',
    command_truncated: 'boolean',
    blocked: 'boolean',
  },
});`}
        />
        <P>
          In the Pi example extension, schemas are defined as code and then seeded
          into WorkOS:
        </P>
        <CodeBlock
          label="typescript · pi-extension"
          code={`function getPiAuditSchemaDefinitions(prefix = 'pi') {
  return [
    {
      action: \`\${prefix}.tool.called\`,
      note: 'Pi tool call started.',
      targets: [
        { type: 'session' },
        { type: 'tool', metadata: { tool_name: 'string' } },
      ],
      metadata: {
        tool_name: 'string',
        tool_call_id: 'string',
        input_sha256: 'string',
        input_bytes: 'number',
        command_preview: 'string',
        command_truncated: 'boolean',
        blocked: 'boolean',
      },
    },
  ];
}`}
        />
        <P>The seeder iterates and creates them:</P>
        <CodeBlock
          label="typescript"
          code={`for (const schema of schemas) {
  const created = await workos.auditLogs.createSchema({
    action: schema.action,
    actor: schema.actor,
    targets: schema.targets,
    metadata: schema.metadata,
  });
  console.log(\`\${created.action} -> schema v\${created.version}\`);
}`}
        />
        <P>
          This is a great task for an LLM agent: hand it your harness hook list and
          ask it to generate the WorkOS schema definitions. Then review the proposed
          action names, targets, and metadata before seeding.
        </P>

        <H2 n="06">Step 4 — Emit events from harness hooks</H2>
        <P>Once schemas exist, wire the harness lifecycle hooks. Using the SDK:</P>
        <CodeBlock
          label="typescript"
          code={`import { WorkOS } from '@workos-inc/node';

const workos = new WorkOS(process.env.WORKOS_API_KEY!);

await workos.auditLogs.createEvent(process.env.WORKOS_ORGANIZATION_ID!, {
  action: 'agent.tool.called',
  occurredAt: new Date(),
  actor: { type: 'user', id: currentUser.id, name: currentUser.name },
  targets: [
    { type: 'session', id: session.id },
    { type: 'tool', id: toolCall.id, metadata: { tool_name: toolCall.name } },
  ],
  context: { location: request.ip, userAgent: request.headers['user-agent'] },
  metadata: {
    tool_name: toolCall.name,
    tool_call_id: toolCall.id,
    input_sha256: sha256(toolCall.input),
    input_bytes: byteLength(toolCall.input),
  },
});`}
        />
        <P>You can also call the API directly over HTTP:</P>
        <CodeBlock
          label="typescript · http"
          code={`await fetch('https://api.workos.com/audit_logs/events', {
  method: 'POST',
  headers: {
    Authorization: \`Bearer \${process.env.WORKOS_API_KEY}\`,
    'Content-Type': 'application/json',
    'Idempotency-Key': crypto.randomUUID(),
  },
  body: JSON.stringify({
    organization_id: process.env.WORKOS_ORGANIZATION_ID,
    event,
  }),
});`}
        />
        <P>The Pi extension centralizes this in a small <Mono>emitEvent</Mono> helper:</P>
        <CodeBlock
          label="typescript · pi-extension"
          code={`async function emitEvent(action, ctx, metadata, targets, occurredAt = new Date()) {
  if (!config.enabled || !client || !config.organizationId) return;

  await client.auditLogs.createEvent(config.organizationId, {
    action,
    occurredAt,
    actor: {
      id: config.actorId,
      type: config.actorType,
      name: config.actorName,
      metadata: {},
    },
    targets,
    context: { location: config.location, userAgent: config.userAgent },
    metadata,
  });
}`}
        />
        <P>Individual hooks become small mappings from harness event to audit event:</P>
        <CodeBlock
          label="typescript · pi hook"
          code={`pi.on('tool_call', async (event, ctx) => {
  await emitEvent(
    'pi.tool.called',
    ctx,
    {
      tool_name: event.toolName,
      tool_call_id: event.toolCallId,
      input_sha256: sha256(event.input),
      input_bytes: byteLength(event.input),
      command_preview: event.toolName === 'bash'
        ? truncateMetadataString(event.input.command)
        : undefined,
    },
    [
      { id: ctx.sessionManager.getSessionId(), type: 'session' },
      { id: event.toolCallId, type: 'tool', metadata: { tool_name: event.toolName } },
    ],
  );
});`}
        />
        <P>
          The same pattern applies to prompts, model changes, session starts, session
          shutdown, tool results, and user-triggered shell commands.
        </P>

        <H2 n="07">Step 5 — Keep secrets on the server</H2>
        <P>WorkOS API calls require an API key. For a SaaS product, the safest architecture is usually:</P>
        <OL>
          <OLI>The browser or local harness sends lifecycle events to your backend.</OLI>
          <OLI>Your backend authenticates the user and resolves the WorkOS organization ID for that customer.</OLI>
          <OLI>Your backend emits the WorkOS Audit Log event using a server-side API key.</OLI>
        </OL>

        <ServerFlow />

        <P>
          That keeps the API key out of untrusted clients and gives you one place to
          enforce policy, normalize event shape, redact sensitive values, and retry
          failed ingestion.
        </P>
        <P>
          For internal tools or local-only harnesses, you can use an environment
          variable or secret manager directly in the harness process. Treat the key
          like any other service credential: do not commit, do not print, do not
          expose to model context.
        </P>

        <H2 n="08">Step 6 — Let the agent query the audit trail</H2>
        <P>
          Audit logs become even more useful when your harness can help answer
          questions about them. WorkOS supports creating audit log exports for an
          organization and date range. Your application can request an export, wait
          for it to become ready, download the CSV, and then let the harness answer
          questions with evidence from the rows.
        </P>
        <P>For example, a user could ask:</P>
        <UL>
          <LI>“Who ran <Mono>rm -rf</Mono> last week?”</LI>
          <LI>“Which sessions used the <Mono>bash</Mono> tool yesterday?”</LI>
          <LI>“Show me failed tool calls for this organization.”</LI>
          <LI>“Who changed the model before the incident?”</LI>
          <LI>“What happened in this session before the file was deleted?”</LI>
        </UL>
        <P>The Pi extension includes a <Mono>workos_audit_query</Mono> tool that does this flow:</P>
        <OL>
          <OLI>Create a WorkOS Audit Logs export with filters.</OLI>
          <OLI>Poll until the export is ready.</OLI>
          <OLI>Download the CSV.</OLI>
          <OLI>Parse rows into structured objects.</OLI>
          <OLI>Summarize counts by action, actor, and target type.</OLI>
          <OLI>Return sample rows to the agent so it can answer with evidence.</OLI>
        </OL>
        <CodeBlock
          label="typescript · query tool"
          code={`const auditExport = await workos.auditLogs.createExport({
  organizationId,
  rangeStart,
  rangeEnd,
  actions: ['pi.tool.called'],
  targets: ['tool'],
});

// Poll with workos.auditLogs.getExport(auditExport.id) until ready.

const response = await fetch(auditExport.url);
const csv = await response.text();
const rows = parseAuditLogRows(csv);

return { rowCount: rows.length, rows: rows.slice(0, 50) };`}
        />
        <P>That turns WorkOS Audit Logs into both a compliance feature and an operational debugging tool.</P>

        <H2 n="09">Example — Pi harness integration</H2>
        <P>
          I built a local example as a Pi extension. It demonstrates the full loop:
          define schemas, seed them, emit Audit Log events from Pi hooks, and expose
          a tool that exports and queries logs. The extension captures events such
          as:
        </P>
        <UL>
          <LI><Mono>pi.session.started</Mono></LI>
          <LI><Mono>pi.session.shutdown</Mono></LI>
          <LI><Mono>pi.input.received</Mono></LI>
          <LI><Mono>pi.agent.started</Mono></LI>
          <LI><Mono>pi.agent.completed</Mono></LI>
          <LI><Mono>pi.message.finalized</Mono></LI>
          <LI><Mono>pi.tool.called</Mono></LI>
          <LI><Mono>pi.tool.completed</Mono></LI>
          <LI><Mono>pi.user_bash.executed</Mono></LI>
          <LI><Mono>pi.model.selected</Mono></LI>
        </UL>
        <P>
          One particularly useful event is <Mono>pi.user_bash.executed</Mono>, which
          creates a <Mono>command</Mono> target and stores both a command hash and a
          truncated preview:
        </P>
        <CodeBlock
          label="typescript · pi user_bash"
          code={`pi.on('user_bash', async (event, ctx) => {
  const commandId = \`cmd_\${sha256({ command: event.command, cwd: event.cwd }).slice(0, 24)}\`;

  await emitEvent(
    'pi.user_bash.executed',
    ctx,
    {
      cwd: event.cwd,
      command_sha256: sha256(event.command),
      command_length: event.command.length,
      command_preview: truncateMetadataString(event.command),
      command_truncated: event.command.length > 500,
    },
    [
      { id: ctx.sessionManager.getSessionId(), type: 'session' },
      { id: commandId, type: 'command' },
    ],
  );
});`}
        />
        <P>
          This makes a question like “Who ran this command?” answerable later without
          storing unbounded command output.
        </P>

        <H2 n="10">You can use an agent to build the integration</H2>
        <P>
          Because harnesses have explicit lifecycle hooks and WorkOS Audit Logs has a
          structured API, you can use an LLM agent to implement most of the
          integration. Here is a practical prompt sequence.
        </P>

        <H3>Prompt 1 — Discover audit-worthy hooks</H3>
        <CodeBlock
          label="prompt"
          code={`Inspect this AI harness codebase and identify lifecycle hooks that are relevant
for audit logging.

Only include events that answer security, compliance, or incident-investigation
questions.

For each event, propose:
- action name
- actor
- targets
- metadata
- why this event matters

Do not include token streaming, UI rendering, heartbeats, or internal retries
unless they affect user-visible behavior.`}
        />

        <H3>Prompt 2 — Design WorkOS schemas</H3>
        <CodeBlock
          label="prompt"
          code={`Using the selected lifecycle events, generate WorkOS Audit Logs schema
definitions.

Use stable action names with the prefix \`agent\`.
Use targets such as session, tool, command, model, file, and audit_export.
Keep metadata typed as string, number, or boolean.
Avoid raw prompts and raw tool outputs by default. Prefer length, SHA-256 hash,
byte size, duration, status, and optional truncated previews.`}
        />

        <H3>Prompt 3 — Seed schemas</H3>
        <CodeBlock
          label="prompt"
          code={`Create a script that seeds these WorkOS Audit Logs schemas using the WorkOS
Node SDK.

Requirements:
- read WORKOS_API_KEY from the environment
- support --dry-run
- print created action and schema version
- fail clearly if the API key is missing`}
        />

        <H3>Prompt 4 — Implement ingestion</H3>
        <CodeBlock
          label="prompt"
          code={`Implement WorkOS Audit Log ingestion for the selected harness hooks.

Requirements:
- centralize event emission in an emitAuditEvent helper
- keep the WorkOS API key server-side
- resolve organization ID from the authenticated customer
- include actor, targets, context, occurredAt, and metadata
- hash or truncate sensitive fields
- use idempotency keys for HTTP ingestion
- do not block the agent lifecycle if audit ingestion fails; log the error and
  continue`}
        />

        <H3>Prompt 5 — Add audit querying back into the harness</H3>
        <CodeBlock
          label="prompt"
          code={`Add a tool called audit_log_query that lets the agent answer questions about
past audit activity.

The tool should:
- accept a natural-language question
- accept date range and filters for actions, actors, and targets
- create a WorkOS Audit Logs export
- poll until the export is ready
- download and parse the CSV
- return row counts, summaries, and sample rows
- save the full CSV to a temporary file for deeper inspection`}
        />

        <P>
          This is “vibe coding” with guardrails: the agent can move quickly, but the
          schemas, security posture, and event taxonomy are explicit and reviewable.
        </P>

        <H2 n="11">Implementation checklist</H2>
        <P>Before shipping, review the integration against this checklist:</P>
        <UL>
          <LI>Every emitted action has a WorkOS Audit Logs schema.</LI>
          <LI>Organization IDs map correctly to customers or tenants.</LI>
          <LI>Actors are real users, admins, systems, or service accounts.</LI>
          <LI>Targets use stable IDs and useful types.</LI>
          <LI>Raw prompts, tool inputs, tool outputs, and command output are not logged unless explicitly intended.</LI>
          <LI>Sensitive fields are hashed, truncated, or omitted.</LI>
          <LI>The WorkOS API key is stored server-side or in a trusted secret manager.</LI>
          <LI>Event ingestion failures do not break the agent experience.</LI>
          <LI>High-value actions — commands, approvals, file writes, exports, model changes — are covered.</LI>
          <LI>Audit export access is itself audited.</LI>
          <LI>The harness can query logs with filters and cite evidence from exported rows.</LI>
        </UL>

        <H2 n="12">Conclusion</H2>
        <P>
          AI harnesses already have the lifecycle hooks you need for audit logging.
          WorkOS Audit Logs gives you the schema validation, organization scoping,
          ingestion API, and export workflow needed to turn those hooks into an
          enterprise-ready audit trail.
        </P>
        <P>The integration is straightforward:</P>
        <OL>
          <OLI>Pick the lifecycle events that matter.</OLI>
          <OLI>Define schemas for those events.</OLI>
          <OLI>Seed the schemas into WorkOS.</OLI>
          <OLI>Emit events from your harness hooks.</OLI>
          <OLI>Keep API keys and organization mapping on the server.</OLI>
          <OLI>Let your harness query exported logs when customers need answers.</OLI>
        </OL>
        <P>
          The result is a much stronger enterprise story for any AI product: customers
          can see what happened, who did it, what was affected, and when — with
          structured evidence they can export, review, and trust.
        </P>

        <HR />

        <div className="flex flex-wrap items-center justify-between gap-4 text-[12px] uppercase tracking-[0.14em] dim">
          <Link href="/" className="link">← back to overview</Link>
          <a
            href="https://github.com/workos/workos-audit-harness"
            target="_blank"
            rel="noreferrer"
            className="link"
          >
            github.com/workos/workos-audit-harness →
          </a>
        </div>
      </article>

      <footer className="border-t rule">
        <div className="mx-auto max-w-[820px] px-5 md:px-8 py-10 flex flex-wrap items-center justify-between gap-3 text-[11px] dim uppercase tracking-[0.14em]">
          <span>EOF · workos-audit-harness · blog</span>
          <span>2026</span>
        </div>
      </footer>
    </div>
  );
}
