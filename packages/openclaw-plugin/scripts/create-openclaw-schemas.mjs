import { runCreateSchemas } from '@workos-inc/audit-core/schema-cli';
import { configLoader } from './config-file.mjs';
import { getOpenClawAuditSchemaDefinitions } from './openclaw-audit-schemas.mjs';

await runCreateSchemas({
  getSchemas: getOpenClawAuditSchemaDefinitions,
  defaultPrefix: 'openclaw',
  configLoader,
});
