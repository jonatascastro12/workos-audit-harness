import { runCreateSchemas } from '@workos-inc/audit-core/schema-cli';
import { configLoader } from './config-file.mjs';
import { getClaudeAuditSchemaDefinitions } from './claude-audit-schemas.mjs';

await runCreateSchemas({
  getSchemas: getClaudeAuditSchemaDefinitions,
  defaultPrefix: 'claude',
  configLoader,
});
