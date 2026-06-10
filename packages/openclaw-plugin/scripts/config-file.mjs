import { createConfigLoader, DEFAULT_PROXY_URL } from '@workos-inc/audit-core/config';

export const configLoader = createConfigLoader({
  configFilePathEnvs: ['WORKOS_AUDIT_CONFIG_PATH', 'OPENCLAW_WORKOS_AUDIT_CONFIG_PATH'],
  defaultConfigDir: '.openclaw',
  envKeyOrder: {
    apiKey:           ['OPENCLAW_WORKOS_AUDIT_API_KEY', 'WORKOS_API_KEY'],
    organizationId:   ['OPENCLAW_WORKOS_AUDIT_ORGANIZATION_ID', 'WORKOS_ORGANIZATION_ID'],
    actionPrefix:     ['OPENCLAW_WORKOS_AUDIT_ACTION_PREFIX', 'WORKOS_ACTION_PREFIX'],
    actorId:          ['OPENCLAW_WORKOS_AUDIT_ACTOR_ID', 'WORKOS_ACTOR_ID'],
    actorType:        ['OPENCLAW_WORKOS_AUDIT_ACTOR_TYPE', 'WORKOS_ACTOR_TYPE'],
    actorName:        ['OPENCLAW_WORKOS_AUDIT_ACTOR_NAME', 'WORKOS_ACTOR_NAME'],
    location:         ['OPENCLAW_WORKOS_AUDIT_LOCATION', 'WORKOS_LOCATION'],
    userAgent:        ['OPENCLAW_WORKOS_AUDIT_USER_AGENT', 'WORKOS_USER_AGENT'],
    proxyUrl:         ['OPENCLAW_WORKOS_AUDIT_PROXY_URL', 'WORKOS_AUDIT_PROXY_URL'],
    recordingEnabled: ['OPENCLAW_WORKOS_AUDIT_RECORDING', 'WORKOS_AUDIT_RECORDING'],
  },
  defaults: {
    actionPrefix: 'openclaw',
    actorType: 'user',
    location: 'openclaw',
    userAgent: 'openclaw-workos-audit/1',
    proxyUrl: DEFAULT_PROXY_URL,
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
