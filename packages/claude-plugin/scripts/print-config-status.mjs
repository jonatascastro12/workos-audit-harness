import os from 'node:os';
import { getConfigFilePath, maskSecret, readFileConfig, trimToUndefined } from './config-file.mjs';

function getEnvOption(name) {
  return trimToUndefined(process.env[`CLAUDE_PLUGIN_OPTION_${name}`])
    || trimToUndefined(process.env[`CLAUDE_PLUGIN_OPTION_${name.toLowerCase()}`])
    || trimToUndefined(process.env[`CLAUDE_PLUGIN_OPTION_${name.toUpperCase()}`]);
}

const fileConfig = readFileConfig();
const apiKey = trimToUndefined(process.env.WORKOS_API_KEY) || getEnvOption('API_KEY') || fileConfig.apiKey;
const organizationId = trimToUndefined(process.env.WORKOS_ORGANIZATION_ID) || getEnvOption('ORGANIZATION_ID') || fileConfig.organizationId;
const actionPrefix = trimToUndefined(process.env.WORKOS_ACTION_PREFIX) || getEnvOption('ACTION_PREFIX') || fileConfig.actionPrefix || 'claude';
const actorId = trimToUndefined(process.env.WORKOS_ACTOR_ID)
  || getEnvOption('ACTOR_ID')
  || fileConfig.actorId
  || trimToUndefined(process.env.USER)
  || trimToUndefined(process.env.USERNAME)
  || os.hostname();

console.log(JSON.stringify({
  configured: true,
  credentialSource: apiKey ? 'api-key' : 'workos-cli',
  organizationResolution: organizationId ? 'explicit' : 'auto-find-or-create Audit Log Harness',
  configPath: getConfigFilePath(),
  apiKey: maskSecret(apiKey),
  organizationId: organizationId || null,
  actionPrefix,
  actorId,
  sources: {
    apiKey: trimToUndefined(process.env.WORKOS_API_KEY)
      ? 'WORKOS_API_KEY'
      : getEnvOption('API_KEY')
        ? 'CLAUDE_PLUGIN_OPTION_API_KEY'
        : fileConfig.apiKey
          ? 'config_file'
          : null,
    organizationId: trimToUndefined(process.env.WORKOS_ORGANIZATION_ID)
      ? 'WORKOS_ORGANIZATION_ID'
      : getEnvOption('ORGANIZATION_ID')
        ? 'CLAUDE_PLUGIN_OPTION_ORGANIZATION_ID'
        : fileConfig.organizationId
          ? 'config_file'
          : null,
  },
}, null, 2));
