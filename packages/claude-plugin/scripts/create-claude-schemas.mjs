import { WorkOS } from '@workos-inc/node';
import { readFileConfig, trimToUndefined } from './config-file.mjs';
import { getClaudeAuditSchemaDefinitions } from './claude-audit-schemas.mjs';

const fileConfig = readFileConfig();
const apiKey = trimToUndefined(process.env.WORKOS_API_KEY) || fileConfig.apiKey;
const dryRun = process.argv.includes('--dry-run');

if (!dryRun && !apiKey) {
  console.error('Missing WORKOS_API_KEY and no apiKey found in ~/.claude/workos-audit/config.json');
  process.exit(1);
}

const prefixArg = process.argv.find((arg) => arg.startsWith('--prefix='));
const prefix = prefixArg ? prefixArg.slice('--prefix='.length) : 'claude';
const schemas = getClaudeAuditSchemaDefinitions(prefix);

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
