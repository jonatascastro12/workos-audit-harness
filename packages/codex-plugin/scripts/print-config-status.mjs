import os from 'node:os';
import { getConfigFilePath, maskSecret, readFileConfig, trimToUndefined } from './config-file.mjs';

function getEnv(name) {
  return trimToUndefined(process.env[`CODEX_WORKOS_AUDIT_${name}`])
    || trimToUndefined(process.env[`WORKOS_${name}`]);
}

const fileConfig = readFileConfig();
const apiKey = getEnv('API_KEY') || fileConfig.apiKey;
const organizationId = getEnv('ORGANIZATION_ID') || fileConfig.organizationId;
const actionPrefix = getEnv('ACTION_PREFIX') || fileConfig.actionPrefix || 'codex';
const actorId = getEnv('ACTOR_ID')
  || fileConfig.actorId
  || trimToUndefined(process.env.USER)
  || trimToUndefined(process.env.USERNAME)
  || os.hostname();
const actorType = getEnv('ACTOR_TYPE') || fileConfig.actorType || 'user';
const actorName = getEnv('ACTOR_NAME') || fileConfig.actorName || trimToUndefined(process.env.USER) || trimToUndefined(process.env.USERNAME);
const location = getEnv('LOCATION') || fileConfig.location || 'codex';
const userAgent = getEnv('USER_AGENT') || fileConfig.userAgent || 'codex-workos-audit/1';

console.log(JSON.stringify({
  configured: true,
  credentialSource: apiKey ? 'api-key' : 'workos-cli',
  organizationResolution: organizationId ? 'explicit' : 'auto-find-or-create Audit Log Harness',
  configPath: getConfigFilePath(),
  apiKey: maskSecret(apiKey),
  organizationId: organizationId || null,
  actionPrefix,
  actorId,
  actorType,
  actorName,
  location,
  userAgent,
  sources: {
    apiKey: getEnv('API_KEY')
      ? 'env'
      : fileConfig.apiKey
        ? 'config_file'
        : null,
    organizationId: getEnv('ORGANIZATION_ID')
      ? 'env'
      : fileConfig.organizationId
        ? 'config_file'
        : null,
  },
}, null, 2));
