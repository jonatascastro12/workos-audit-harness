import { readFileConfig, trimToUndefined } from './config-file.mjs';
import { getClaudeAuditSchemaDefinitions } from './claude-audit-schemas.mjs';

const fileConfig = readFileConfig();
const apiKey = trimToUndefined(process.env.WORKOS_API_KEY) || fileConfig.apiKey;
const dryRun = process.argv.includes('--dry-run');
const prefixArg = process.argv.find((arg) => arg.startsWith('--prefix='));
const prefix = prefixArg ? prefixArg.slice('--prefix='.length) : 'claude';
const schemas = getClaudeAuditSchemaDefinitions(prefix);
const actions = schemas.map((schema) => schema.action);

async function listSchemaVersions(action) {
  if (!apiKey) return undefined;

  const versions = [];
  let after;

  do {
    const url = new URL(`https://api.workos.com/audit_logs/actions/${encodeURIComponent(action)}/schemas`);
    url.searchParams.set('limit', '100');
    url.searchParams.set('order', 'desc');
    if (after) url.searchParams.set('after', after);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (response.status === 404) return [];
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Failed to list schemas for ${action}: ${response.status} ${response.statusText}${body ? ` :: ${body}` : ''}`);
    }

    const page = await response.json();
    versions.push(...(page.data || []).map((schema) => schema.version));
    after = page.list_metadata?.after || page.listMetadata?.after;
  } while (after);

  return versions;
}

console.log(`Claude WorkOS audit schema removal plan for prefix "${prefix}":`);

let foundCount = 0;
for (const action of actions) {
  const versions = await listSchemaVersions(action);
  if (!versions) {
    console.log(`- ${action}`);
    continue;
  }

  foundCount += versions.length;
  const versionText = versions.length > 0
    ? `schema version(s): ${versions.join(', ')}`
    : 'no schemas found';
  console.log(`- ${action}: ${versionText}`);
}

if (!apiKey) {
  console.error('\nMissing WORKOS_API_KEY and no apiKey found in ~/.claude/workos-audit/config.json. Set one to inspect existing schema versions.');
  process.exit(dryRun ? 0 : 1);
}

console.error([
  '',
  'No schemas were removed.',
  'WorkOS currently documents create/list endpoints for Audit Log schemas, but not a public delete endpoint.',
  'The known public DELETE candidates return 404, so this script refuses to pretend removal succeeded.',
  foundCount > 0
    ? 'Remove these schemas/actions manually in the WorkOS Dashboard, or update this script if WorkOS adds a supported delete endpoint.'
    : 'No matching schemas were found for this prefix.',
].join('\n'));

process.exit(dryRun || foundCount === 0 ? 0 : 1);
