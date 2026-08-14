import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ensureOrganization, getEffectiveApiKey, apiUrl, runWorkos, USER_AGENT } from '../workos-client.mjs';
import { getDeviceCertLabel } from '../device-cert.mjs';

// Bound a single attempt. Previously unbounded: a stalled connection would hang
// the caller indefinitely — for a long-lived host that means a wedged emit queue.
const CONNECT_TIMEOUT_SECONDS = 5;
const MAX_TIME_SECONDS = 10;

// Must not exceed the proxy's MAX_BATCH_EVENTS (packages/proxy/src/events.ts),
// which answers 413 above its cap. Chunk here instead of relying on the caller.
const PROXY_MAX_BATCH_EVENTS = 25;

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
//
// The payload travels via a 0600 temp file (--data-binary @file), not stdin:
// inside compiled-Bun hosts (OpenCode) a multi-KB stdin write queued right
// before process exit is silently discarded, so curl POSTed an empty body while
// still exiting 0 — the emission both lost its content and looked successful.
// A file written synchronously before spawn cannot be raced by host shutdown.
// (argv is not an option either: the payload would show up in `ps` output.)
// A host that dies before curl exits leaves its payload dir behind (the
// cleanup handler never runs), so each call opportunistically sweeps payload
// dirs older than an hour — far beyond any curl lifetime — before making its
// own. Payloads are hashed/truncated metadata, so a brief orphan is not a
// leak, but they should not accumulate.
const PAYLOAD_DIR_PREFIX = 'workos-audit-';
const STALE_PAYLOAD_MS = 60 * 60 * 1000;

function sweepStalePayloadDirs() {
  try {
    for (const entry of readdirSync(tmpdir())) {
      if (!entry.startsWith(PAYLOAD_DIR_PREFIX)) continue;
      const dir = join(tmpdir(), entry);
      try {
        if (Date.now() - statSync(dir).mtimeMs > STALE_PAYLOAD_MS) {
          rmSync(dir, { recursive: true, force: true });
        }
      } catch {}
    }
  } catch {}
}

function runCurl(args, input) {
  return new Promise((resolve) => {
    let payloadDir;
    let payloadArgs = args;
    if (input !== undefined) {
      try {
        sweepStalePayloadDirs();
        payloadDir = mkdtempSync(join(tmpdir(), PAYLOAD_DIR_PREFIX));
        const payloadPath = join(payloadDir, 'payload.json');
        writeFileSync(payloadPath, input, { mode: 0o600 });
        payloadArgs = args.map((arg) => (arg === '@-' ? `@${payloadPath}` : arg));
      } catch (error) {
        if (payloadDir) rmSync(payloadDir, { recursive: true, force: true });
        resolve({ code: null, stdout: '', stderr: String(error?.message || error) });
        return;
      }
    }
    const cleanup = () => {
      if (payloadDir) rmSync(payloadDir, { recursive: true, force: true });
      payloadDir = undefined;
    };

    let child;
    try {
      child = spawn('/usr/bin/curl', payloadArgs, {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, CURL_SSL_BACKEND: 'secure-transport' },
      });
    } catch (error) {
      cleanup();
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
      cleanup();
      resolve({ code: null, stdout, stderr: stderr || String(error?.message || error) });
    });
    child.on('close', (code) => {
      cleanup();
      resolve({ code, stdout, stderr });
    });
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
// POST a JSON body to the proxy over mTLS. Returns { status, body } on a 2xx,
// or { error, status } otherwise — never throws.
async function postToProxy(requestBody, label, config) {
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
    JSON.stringify(requestBody),
  );

  // --fail-with-body still writes the body on >= 400, so recover the proxy's
  // explanation from stdout even when curl itself reports failure.
  const { status, body } = splitCurlOutput(stdout);

  if (code !== 0) {
    const reason = stderr.trim() || `curl exited with code ${code === null ? 'unknown' : code}`;
    return { error: body ? `${reason} :: ${body}` : reason, status };
  }
  if (status === null) return { error: 'could not read proxy response status', status: null };
  if (status < 200 || status > 299) {
    return {
      error: body ? `proxy returned HTTP ${status} :: ${body}` : `proxy returned HTTP ${status}`,
      status,
    };
  }
  return { status, body };
}

function warn(detail) {
  process.stderr.write(`workos-audit: proxy emit failed (${detail})\n`);
}

// The proxy sets actor + organization_id itself; never send a client-claimed
// identity. Send only the event payload (action, occurred_at, targets, …).
function proxyPayload(event) {
  const payload = toRestEvent(event);
  delete payload.actor;
  return payload;
}

async function emitViaProxy(event, config) {
  const label = getDeviceCertLabel();
  if (!label) {
    return { ok: false, transport: 'proxy', skipped: true, reason: 'no-device-certificate' };
  }

  // Deliberately a bare event object, not {events:[…]}: this is the wire format
  // every deployed proxy already understands. Client and proxy version
  // independently (MDM hands out the URL; the Worker deploys on its own), so the
  // single-event path must never require a newer proxy than the fleet is running.
  const { error, status } = await postToProxy(proxyPayload(event), label, config);
  if (error) {
    warn(error);
    return { ok: false, transport: 'proxy', error, ...(status ? { status } : {}), action: event.action };
  }
  return { ok: true, transport: 'proxy', status, action: event.action };
}

// Send several events in ONE request — one process, one TLS + mTLS handshake
// instead of one per event. That handshake is the expensive part (~600ms), so
// coalescing a turn's worth of lifecycle events is the difference between
// seconds of background work and a fraction of one.
//
// Chunked to the proxy's documented cap so an oversized batch is split rather
// than rejected wholesale with a 413.
async function emitBatchViaProxy(events, config) {
  const label = getDeviceCertLabel();
  if (!label) {
    return { ok: false, transport: 'proxy', skipped: true, reason: 'no-device-certificate', accepted: 0 };
  }

  let accepted = 0;
  const errors = [];
  for (let i = 0; i < events.length; i += PROXY_MAX_BATCH_EVENTS) {
    const chunk = events.slice(i, i + PROXY_MAX_BATCH_EVENTS);
    const { error, status, body } = await postToProxy(
      { events: chunk.map(proxyPayload) },
      label,
      config,
    );
    if (error) {
      // A proxy that predates batch support answers 422 ("invalid audit event
      // payload") to {events:[…]}, and one with a smaller cap answers 413. The
      // proxy and the clients deploy independently, so that skew is normal
      // during a rollout — resend the chunk one event at a time rather than
      // dropping a whole batch of real audit events over a version mismatch.
      if (status === 422 || status === 413) {
        const single = await Promise.all(chunk.map((event) => emitViaProxy(event, config)));
        accepted += single.filter((r) => r.ok).length;
        const failed = single.filter((r) => !r.ok);
        if (failed.length > 0) errors.push(`${failed.length}/${chunk.length} failed after per-event retry`);
        continue;
      }
      warn(error);
      errors.push(error);
      continue;
    }
    // The proxy reports per-event outcomes; surface rejections rather than
    // treating a 202 as "all landed".
    let report;
    try {
      report = JSON.parse(body);
    } catch {
      report = null;
    }
    accepted += typeof report?.accepted === 'number' ? report.accepted : chunk.length;
    const rejected = Array.isArray(report?.rejected) ? report.rejected : [];
    if (rejected.length > 0) {
      const detail = rejected.map((r) => `#${i + (r?.index ?? 0)} ${r?.reason ?? 'unknown'}`).join(', ');
      warn(`proxy rejected ${rejected.length}/${chunk.length} event(s) (HTTP ${status}): ${detail}`);
      errors.push(detail);
    }
  }

  return {
    ok: errors.length === 0,
    transport: 'proxy',
    accepted,
    total: events.length,
    ...(errors.length > 0 ? { error: errors.join('; ') } : {}),
  };
}

// Emit a list of events. Batches through the proxy when there is one; falls back
// to sequential single emits otherwise, since the direct WorkOS API has no batch
// form. A single event always takes the plain single-event path so it never
// depends on proxy batch support.
export async function emitEvents(events, config) {
  const list = Array.isArray(events) ? events.filter(Boolean) : [];
  if (list.length === 0) return { ok: true, accepted: 0, total: 0 };
  if (list.length === 1) {
    const result = await emitEvent(list[0], config);
    return { ...result, accepted: result.ok ? 1 : 0, total: 1 };
  }
  if (config.proxyUrl) return emitBatchViaProxy(list, config);

  let accepted = 0;
  const errors = [];
  for (const event of list) {
    try {
      await emitEvent(event, config);
      accepted += 1;
    } catch (error) {
      errors.push(String(error?.message || error));
    }
  }
  return {
    ok: errors.length === 0,
    accepted,
    total: list.length,
    ...(errors.length > 0 ? { error: errors.join('; ') } : {}),
  };
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
