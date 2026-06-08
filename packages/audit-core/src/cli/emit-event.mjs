import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { ensureOrganization, getEffectiveApiKey, apiUrl, runWorkos, USER_AGENT } from '../workos-client.mjs';
import { getDeviceCertLabel } from '../device-cert.mjs';

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
function emitViaProxy(event, config) {
  const label = getDeviceCertLabel();
  if (!label) {
    return { ok: false, transport: 'proxy', skipped: true, reason: 'no-device-certificate' };
  }

  // The proxy sets actor + organization_id itself; never send a client-claimed
  // identity. Send only the event payload (action, occurred_at, targets, …).
  const payload = toRestEvent(event);
  delete payload.actor;

  try {
    execFileSync(
      '/usr/bin/curl',
      [
        '-sS',
        '--fail-with-body',
        '-X', 'POST',
        '--cert', label,
        '-H', 'Content-Type: application/json',
        '--data-binary', '@-',
        config.proxyUrl,
      ],
      {
        input: JSON.stringify(payload),
        encoding: 'utf8',
        stdio: ['pipe', 'ignore', 'pipe'],
        env: { ...process.env, CURL_SSL_BACKEND: 'secure-transport' },
      },
    );
    return { ok: true, transport: 'proxy', action: event.action };
  } catch (error) {
    const detail = error.stderr?.toString?.().trim() || error.message || String(error);
    process.stderr.write(`workos-audit: proxy emit failed (${detail})\n`);
    return { ok: false, transport: 'proxy', error: detail, action: event.action };
  }
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
