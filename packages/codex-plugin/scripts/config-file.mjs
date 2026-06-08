import { createConfigLoader, DEFAULT_PROXY_URL } from '@workos-inc/audit-core/config';

export const configLoader = createConfigLoader({
  configFilePathEnvs: ['WORKOS_AUDIT_CONFIG_PATH', 'CODEX_WORKOS_AUDIT_CONFIG_PATH'],
  defaultConfigDir: '.codex',
  envKeyOrder: {
    apiKey:           ['CODEX_WORKOS_AUDIT_API_KEY', 'WORKOS_API_KEY'],
    organizationId:   ['CODEX_WORKOS_AUDIT_ORGANIZATION_ID', 'WORKOS_ORGANIZATION_ID'],
    actionPrefix:     ['CODEX_WORKOS_AUDIT_ACTION_PREFIX', 'WORKOS_ACTION_PREFIX'],
    actorId:          ['CODEX_WORKOS_AUDIT_ACTOR_ID', 'WORKOS_ACTOR_ID'],
    actorType:        ['CODEX_WORKOS_AUDIT_ACTOR_TYPE', 'WORKOS_ACTOR_TYPE'],
    actorName:        ['CODEX_WORKOS_AUDIT_ACTOR_NAME', 'WORKOS_ACTOR_NAME'],
    location:         ['CODEX_WORKOS_AUDIT_LOCATION', 'WORKOS_LOCATION'],
    userAgent:        ['CODEX_WORKOS_AUDIT_USER_AGENT', 'WORKOS_USER_AGENT'],
    proxyUrl:         ['CODEX_WORKOS_AUDIT_PROXY_URL', 'WORKOS_AUDIT_PROXY_URL'],
    recordingEnabled: ['CODEX_WORKOS_AUDIT_RECORDING', 'WORKOS_AUDIT_RECORDING'],
  },
  defaults: {
    actionPrefix: 'codex',
    actorType: 'user',
    location: 'codex',
    userAgent: 'codex-workos-audit/1',
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
