import { runRemoveSchemas } from '@workos-inc/audit-core/schema-cli';
import { configLoader } from './config-file.mjs';
import { getCodexAuditSchemaDefinitions } from './codex-audit-schemas.mjs';

await runRemoveSchemas({
  getSchemas: getCodexAuditSchemaDefinitions,
  defaultPrefix: 'codex',
  configLoader,
  label: 'Codex',
});
