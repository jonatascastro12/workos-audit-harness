import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { ensureOrganization, getEffectiveApiKey, apiUrl, runWorkos, USER_AGENT } from '../workos-client.mjs';
import { getDeviceCertLabel } from '../device-cert.mjs';

// Bound a single attempt. Previously unbounded: a stalled connection would hang
// the caller indefinitely — for a long-lived host that means a wedged emit queue.
const CONNECT_TIMEOUT_SECONDS = 5;
const MAX_TIME_SECONDS = 10;

// Run curl WITHOUT blocking the event loop.
//
// This used to be execFileSync. That is fine for the Claude Code hooks, where a
// throwaway process exists only to emit one event — but pi and openclaw load the
// audit extension *in-process* and long-lived. execFileSync stops the whole
// runtime, so an mTLS POST (~600ms: new process, new TLS + mTLS handshake, no
// connection reuse) froze the host's UI on every lifecycle event, several times
// per turn. Those callers already queue emits off their critical path; a
// synchronous exec defeated that entirely, because nothing else can run while it
// blocks. Note the fix is asynchrony, not parallelism — no worker threads
// involved, and ordering is still whatever the caller's queue imposes.
//
// Never rejects: resolves with the exit code plus captured output so the caller
// can classify the failure. An audit emission must not throw into a host hook.
function runCurl(args, input) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn('/usr/bin/curl', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, CURL_SSL_BACKEND: 'secure-transport' },
      });
    } catch (error) {
      resolve({ code: null, stdout: '', stderr: String(error?.message || error) });
      return;
    }

    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    // spawn reports a missing/unexecutable binary via 'error', not a throw.
    child.on('error', (error) => {
      resolve({ code: null, stdout, stderr: stderr || String(error?.message || error) });
    });
    child.on('close', (code) => resolve({ code, stdout, stderr }));
    // curl can exit before reading the body (bad flag, DNS failure), which makes
    // this write EPIPE. Swallow it: 'close' already carries the real outcome.
    child.stdin.on('error', () => {});
    child.stdin.end(input);
  });
}

function toRestEvent(event) {
  const { occurredAt, occurred_at, context, actor, targets, ...rest } = event;
  const normalizedContext = context
    ? {
        location: context.location,
        user_agent: context.user_agent || context.userAgent,
      }
    : undefined;
  return {
    ...rest,
    actor: actor ? { ...actor, metadata: actor.metadata || {} } : actor,
    targets: (targets || []).map((target) => ({ ...target, metadata: target.metadata || {} })),
    occurred_at: occurred_at || occurredAt || new Date().toISOString(),
    ...(normalizedContext ? { context: normalizedContext } : {}),
  };
}

// Emit via the ingestion proxy over mTLS using the on-device Okta cert. No sk_
// key, no org resolution client-side — the proxy authenticates the device, maps
// serial→user, and stamps actor + organization_id authoritatively. Node's fetch
// can't use a keychain key, so we shell out to system `curl` on the Secure
// Transport backend (proxy spec §3.2, §4.3). Failures are non-fatal by design:
// log and no-op so an audit emission can never block/break a Claude Code hook.
async function emitViaProxy(event, config) {
  const label = getDeviceCertLabel();
  if (!label) {
    return { ok: false, transport: 'proxy', skipped: true, reason: 'no-device-certificate' };
  }

  // The proxy sets actor + organization_id itself; never send a client-claimed
  // identity. Send only the event payload (action, occurred_at, targets, …).
  const payload = toRestEvent(event);
  delete payload.actor;

  const fail = (detail, status) => {
    process.stderr.write(`workos-audit: proxy emit failed (${detail})\n`);
    return { ok: false, transport: 'proxy', error: detail, ...(status ? { status } : {}), action: event.action };
  };

  // `--fail-with-body` only fails on >= 400, and we deliberately do NOT follow
  // redirects, so a 3xx would otherwise exit 0 and be reported as a success with
  // the event silently dropped. That is the worst failure mode an audit pipeline
  // can have — a Cloudflare Access policy that stops covering the ingest path
  // answers with a 302 to the login page, which would look like healthy
  // ingestion on every machine at once. So ask curl to append the status code
  // and assert 2xx ourselves rather than trusting its exit code.
  //
  // The body is kept (not sent to /dev/null) because the proxy explains itself
  // in it — "audit ingestion is paused: <reason>", "unknown or unassigned
  // device" — and that text is the whole diagnosis when a fleet goes quiet.
  const { code, stdout, stderr } = await runCurl(
    [
      '-sS',
      '--fail-with-body',
      '--connect-timeout', String(CONNECT_TIMEOUT_SECONDS),
      '--max-time', String(MAX_TIME_SECONDS),
      '-w', '\n%{http_code}',
      '-X', 'POST',
      '--cert', label,
      '-H', 'Content-Type: application/json',
      '--data-binary', '@-',
      config.proxyUrl,
    ],
    JSON.stringify(payload),
  );

  // --fail-with-body still writes the body on >= 400, so recover the proxy's
  // explanation from stdout even when curl itself reports failure.
  const { status, body } = splitCurlOutput(stdout);

  if (code !== 0) {
    const reason = stderr.trim() || `curl exited with code ${code === null ? 'unknown' : code}`;
    return fail(body ? `${reason} :: ${body}` : reason, status);
  }
  if (status === null) return fail('could not read proxy response status');
  if (status < 200 || status > 299) {
    return fail(body ? `proxy returned HTTP ${status} :: ${body}` : `proxy returned HTTP ${status}`, status);
  }

  return { ok: true, transport: 'proxy', status, action: event.action };
}

// Split curl's `<body>\n<http_code>` output. The status is taken from after the
// LAST newline so a multi-line body can't be mistaken for it, and the body is
// truncated because a rejection can be a full HTML error page.
function splitCurlOutput(raw) {
  const text = String(raw ?? '');
  const cut = text.lastIndexOf('\n');
  const parsed = Number.parseInt(cut === -1 ? text : text.slice(cut + 1), 10);
  const body = (cut === -1 ? '' : text.slice(0, cut)).replace(/\s+/g, ' ').trim();
  return {
    status: Number.isInteger(parsed) ? parsed : null,
    body: body.length > 200 ? `${body.slice(0, 200)}…` : body,
  };
}

export async function emitEvent(event, config) {
  // Preferred path: route through the ingestion proxy (no key on the laptop).
  // The direct WorkOS api-key / CLI paths below remain as fallbacks for contexts
  // with no proxy configured (dev, servers, non-Mac).
  if (config.proxyUrl) {
    return emitViaProxy(event, config);
  }

  const orgId = await ensureOrganization(config);

  const effectiveApiKey = getEffectiveApiKey(config);
  if (effectiveApiKey) {
    const response = await fetch(apiUrl(config, '/audit_logs/events'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${effectiveApiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': randomUUID(),
        'User-Agent': USER_AGENT,
      },
      body: JSON.stringify({ organization_id: orgId, event: toRestEvent(event) }),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`WorkOS audit event failed: ${response.status} ${response.statusText}${body ? ` :: ${body}` : ''}`);
    }
    return { ok: true, transport: 'api-key', organizationId: orgId, action: event.action };
  }

  const occurredAt = event.occurredAt || event.occurred_at || new Date().toISOString();
  const context = event.context
    ? { location: event.context.location, user_agent: event.context.user_agent || event.context.userAgent }
    : { location: 'unknown' };
  const args = [
    'audit-log', 'create-event', orgId,
    '--action', event.action,
    '--actor-type', event.actor?.type || 'user',
    '--actor-id', event.actor?.id || 'unknown',
  ];
  if (event.actor?.name) args.push('--actor-name', event.actor.name);
  args.push(
    '--occurred-at', new Date(occurredAt).toISOString(),
    '--targets', JSON.stringify(event.targets || []),
    '--context', JSON.stringify(context),
    '--metadata', JSON.stringify(event.metadata || {}),
    '--json', '--mode', 'agent',
  );
  runWorkos(args);
  return { ok: true, transport: 'workos-cli', organizationId: orgId, action: event.action };
}
