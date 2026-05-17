import { WorkOS } from '@workos-inc/node';
import { getCodexAuditSchemaDefinitions } from './codex-audit-schemas.mjs';

const apiKey = process.env.WORKOS_API_KEY;
const dryRun = process.argv.includes('--dry-run');

if (!dryRun && !apiKey) {
  console.error('Missing WORKOS_API_KEY');
  process.exit(1);
}

const prefixArg = process.argv.find((arg) => arg.startsWith('--prefix='));
const prefix = prefixArg ? prefixArg.slice('--prefix='.length) : 'codex';
const schemas = getCodexAuditSchemaDefinitions(prefix);

if (dryRun) {
  console.log(JSON.stringify({ prefix, schemas }, null, 2));
  process.exit(0);
}

const workos = new WorkOS(apiKey);

for (const schema of schemas) {
  const created = await workos.auditLogs.createSchema({
    action: schema.action,
    actor: schema.actor,
    targets: schema.targets,
    metadata: schema.metadata,
  });

  console.log(`${schema.action} -> schema v${created.version}`);
}
