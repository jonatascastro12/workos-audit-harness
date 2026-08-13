import { runRemoveSchemas } from '@workos-inc/audit-core/schema-cli';
import { configLoader } from './config-file.mjs';
import { getHermesAuditSchemaDefinitions } from './hermes-audit-schemas.mjs';

await runRemoveSchemas({
  getSchemas: getHermesAuditSchemaDefinitions,
  defaultPrefix: 'hermes',
  configLoader,
  label: 'Hermes',
});
