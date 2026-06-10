import { runRemoveSchemas } from '@workos-inc/audit-core/schema-cli';
import { configLoader } from './config-file.mjs';
import { getOpenClawAuditSchemaDefinitions } from './openclaw-audit-schemas.mjs';

await runRemoveSchemas({
  getSchemas: getOpenClawAuditSchemaDefinitions,
  defaultPrefix: 'openclaw',
  configLoader,
  label: 'OpenClaw',
});
