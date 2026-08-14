import { createConfigLoader } from '@workos-inc/audit-core/config';

export const configLoader = createConfigLoader({
  configFilePathEnvs: ['WORKOS_AUDIT_CONFIG_PATH', 'HERMES_WORKOS_AUDIT_CONFIG_PATH'],
  defaultConfigDir: '.hermes',
  envKeyOrder: {
    apiKey:           ['HERMES_WORKOS_AUDIT_API_KEY', 'WORKOS_API_KEY'],
    organizationId:   ['HERMES_WORKOS_AUDIT_ORGANIZATION_ID', 'WORKOS_ORGANIZATION_ID'],
    actionPrefix:     ['HERMES_WORKOS_AUDIT_ACTION_PREFIX', 'WORKOS_ACTION_PREFIX'],
    actorId:          ['HERMES_WORKOS_AUDIT_ACTOR_ID', 'WORKOS_ACTOR_ID'],
    actorType:        ['HERMES_WORKOS_AUDIT_ACTOR_TYPE', 'WORKOS_ACTOR_TYPE'],
    actorName:        ['HERMES_WORKOS_AUDIT_ACTOR_NAME', 'WORKOS_ACTOR_NAME'],
    location:         ['HERMES_WORKOS_AUDIT_LOCATION', 'WORKOS_LOCATION'],
    userAgent:        ['HERMES_WORKOS_AUDIT_USER_AGENT', 'WORKOS_USER_AGENT'],
    proxyUrl:         ['HERMES_WORKOS_AUDIT_PROXY_URL', 'WORKOS_AUDIT_PROXY_URL'],
    recordingEnabled: ['HERMES_WORKOS_AUDIT_RECORDING', 'WORKOS_AUDIT_RECORDING'],
  },
  defaults: {
    actionPrefix: 'hermes',
    actorType: 'user',
    location: 'hermes',
    userAgent: 'hermes-workos-audit/1',
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
