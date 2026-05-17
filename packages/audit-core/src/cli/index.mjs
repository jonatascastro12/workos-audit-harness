import { parseArgs } from './args.mjs';
import { run as runAuthLogin } from './commands/auth-login.mjs';
import { run as runStatus } from './commands/status.mjs';
import { run as runEnsureOrganization } from './commands/ensure-organization.mjs';
import { run as runEmitEvent } from './commands/emit-event.mjs';
import { run as runQuery } from './commands/query.mjs';
import { run as runCreateSchema } from './commands/create-schema.mjs';
import { run as runSeedGenericSchemas } from './commands/seed-generic-schemas.mjs';

const COMMANDS = {
  'auth-login': runAuthLogin,
  status: runStatus,
  'ensure-organization': runEnsureOrganization,
  'emit-event': runEmitEvent,
  query: runQuery,
  'create-schema': runCreateSchema,
  'seed-generic-schemas': runSeedGenericSchemas,
};

function usage() {
  return `Usage: workos-audit-harness <command> [options]

Commands:
  auth-login                 Run \`workos auth login\` (uses npx workos@latest when missing)
  status                     Show API key / WorkOS CLI credential status
  ensure-organization        Find or create the harness organization and print its id
  emit-event                 Read an audit event JSON from stdin/--file and emit it
  query                      Export, parse, and summarize audit logs
  create-schema              Read one schema JSON from stdin/--file and create it
  seed-generic-schemas       Create broad generic harness schemas

Common options:
  --org, --organization-id   WorkOS organization id. If omitted, the harness finds or creates "Audit Log Harness"
  --organization-name        Organization name to auto-find/create (default: Audit Log Harness)
  --api-key                  Optional WorkOS API key; if omitted, active \`workos\` CLI env is used
  --json                     Print JSON output
`;
}

export async function main(argv = process.argv.slice(2)) {
  const { command, flags } = parseArgs(argv);
  const json = flags.json === true || flags.json === 'true';

  if (!command || command === 'help' || command === '--help') {
    console.log(usage());
    return;
  }

  const handler = COMMANDS[command];
  if (!handler) {
    throw new Error(`Unknown command: ${command}\n${usage()}`);
  }

  await handler({ flags, json });
}

const invokedDirectly = (() => {
  const arg1 = process.argv[1];
  if (!arg1) return false;
  try {
    const here = new URL(import.meta.url).pathname;
    return arg1 === here || arg1.endsWith('/cli/index.mjs') || arg1.endsWith('workos-audit-harness');
  } catch {
    return false;
  }
})();

if (invokedDirectly) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
