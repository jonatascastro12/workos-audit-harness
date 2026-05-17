import { randomUUID } from 'node:crypto';
import { ensureOrganization, getEffectiveApiKey, apiUrl, runWorkos, USER_AGENT } from '../workos-client.mjs';

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

export async function emitEvent(event, config) {
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
