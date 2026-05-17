import { trimToUndefined } from '../../util.mjs';
import { getHarnessAuditSchemaDefinitions } from '../../harness-audit-schemas.mjs';
import { configFromFlags, print } from '../args.mjs';
import { createSchema } from '../schema.mjs';

export async function run({ flags, json }) {
  const config = configFromFlags(flags);
  const prefix = trimToUndefined(flags.prefix) || 'harness';
  const schemas = getHarnessAuditSchemaDefinitions(prefix);
  if (flags['dry-run'] || flags.dryRun) {
    print({ prefix, schemaCount: schemas.length, schemas }, json);
    return;
  }
  const created = [];
  for (const [index, schema] of schemas.entries()) {
    process.stderr.write(`Creating schema ${index + 1}/${schemas.length}: ${schema.action}\n`);
    const result = await createSchema(config, schema);
    created.push({ action: schema.action, result });
  }
  print({ prefix, schemaCount: created.length, created }, json);
}
