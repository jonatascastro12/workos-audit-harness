import { runCreateSchemas } from '@workos-inc/audit-core/schema-cli';
import { getOpenCodeAuditSchemaDefinitions } from './opencode-audit-schemas.mjs';
import { configLoader } from './config-file.mjs';

await runCreateSchemas({
  getSchemas: getOpenCodeAuditSchemaDefinitions,
  defaultPrefix: 'opencode',
  configLoader,
});
