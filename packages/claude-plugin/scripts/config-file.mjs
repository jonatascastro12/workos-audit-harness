import { createConfigLoader } from '@workos-inc/audit-core/config';

function claudePluginOptionEnvs(name) {
  return [
    `CLAUDE_PLUGIN_OPTION_${name}`,
    `CLAUDE_PLUGIN_OPTION_${name.toLowerCase()}`,
    `CLAUDE_PLUGIN_OPTION_${name.toUpperCase()}`,
  ];
}

export const configLoader = createConfigLoader({
  configFilePathEnvs: ['WORKOS_AUDIT_CONFIG_PATH', 'CLAUDE_WORKOS_AUDIT_CONFIG_PATH'],
  defaultConfigDir: '.claude',
  envKeyOrder: {
    apiKey:           ['WORKOS_API_KEY', ...claudePluginOptionEnvs('API_KEY')],
    organizationId:   ['WORKOS_ORGANIZATION_ID', ...claudePluginOptionEnvs('ORGANIZATION_ID')],
    actionPrefix:     ['WORKOS_ACTION_PREFIX', ...claudePluginOptionEnvs('ACTION_PREFIX')],
    actorId:          ['WORKOS_ACTOR_ID', ...claudePluginOptionEnvs('ACTOR_ID')],
    actorType:        ['WORKOS_ACTOR_TYPE', ...claudePluginOptionEnvs('ACTOR_TYPE')],
    actorName:        ['WORKOS_ACTOR_NAME', ...claudePluginOptionEnvs('ACTOR_NAME')],
    location:         ['WORKOS_LOCATION', ...claudePluginOptionEnvs('LOCATION')],
    userAgent:        ['WORKOS_USER_AGENT', ...claudePluginOptionEnvs('USER_AGENT')],
    proxyUrl:         ['WORKOS_AUDIT_PROXY_URL', ...claudePluginOptionEnvs('PROXY_URL')],
    recordingEnabled: ['CLAUDE_WORKOS_AUDIT_RECORDING', 'WORKOS_AUDIT_RECORDING', ...claudePluginOptionEnvs('RECORDING_ENABLED')],
  },
  defaults: {
    actionPrefix: 'claude',
    actorType: 'user',
    location: 'claude-code',
    userAgent: 'claude-code-workos-audit/1',
    // No default proxyUrl: a fleet sets it via the MDM-managed machine config
    // (see audit-core getManagedConfigPath), an individual via env or config file.
    recordingEnabled: true,
  },
});

export const {
  getConfigFilePath,
  readFileConfig,
  writeFileConfig,
  clearFileConfig,
  loadConfig,
} = configLoader;

export { trimToUndefined, maskSecret } from '@workos-inc/audit-core/util';
