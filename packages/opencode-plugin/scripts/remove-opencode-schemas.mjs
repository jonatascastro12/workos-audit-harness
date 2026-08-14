import { runRemoveSchemas } from '@workos-inc/audit-core/schema-cli';
import { getOpenCodeAuditSchemaDefinitions } from './opencode-audit-schemas.mjs';
import { configLoader } from './config-file.mjs';

await runRemoveSchemas({
  getSchemas: getOpenCodeAuditSchemaDefinitions,
  defaultPrefix: 'opencode',
  configLoader,
  label: 'OpenCode',
});
