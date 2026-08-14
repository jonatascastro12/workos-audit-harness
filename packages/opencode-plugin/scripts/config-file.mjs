import { spawnSync } from 'node:child_process';
import { createConfigLoader } from '@workos-inc/audit-core/config';
import { trimToUndefined } from '@workos-inc/audit-core/util';

export const configLoader = createConfigLoader({
  configFilePathEnvs: ['WORKOS_AUDIT_CONFIG_PATH', 'OPENCODE_WORKOS_AUDIT_CONFIG_PATH'],
  // OpenCode's global config dir; path.join accepts the nested segment, so the
  // per-user config lands at ~/.config/opencode/workos-audit/config.json.
  defaultConfigDir: '.config/opencode',
  envKeyOrder: {
    apiKey:           ['OPENCODE_WORKOS_AUDIT_API_KEY', 'WORKOS_API_KEY'],
    organizationId:   ['OPENCODE_WORKOS_AUDIT_ORGANIZATION_ID', 'WORKOS_ORGANIZATION_ID'],
    actionPrefix:     ['OPENCODE_WORKOS_AUDIT_ACTION_PREFIX', 'WORKOS_ACTION_PREFIX'],
    actorId:          ['OPENCODE_WORKOS_AUDIT_ACTOR_ID', 'WORKOS_ACTOR_ID'],
    actorType:        ['OPENCODE_WORKOS_AUDIT_ACTOR_TYPE', 'WORKOS_ACTOR_TYPE'],
    actorName:        ['OPENCODE_WORKOS_AUDIT_ACTOR_NAME', 'WORKOS_ACTOR_NAME'],
    location:         ['OPENCODE_WORKOS_AUDIT_LOCATION', 'WORKOS_LOCATION'],
    userAgent:        ['OPENCODE_WORKOS_AUDIT_USER_AGENT', 'WORKOS_USER_AGENT'],
    proxyUrl:         ['OPENCODE_WORKOS_AUDIT_PROXY_URL', 'WORKOS_AUDIT_PROXY_URL'],
    recordingEnabled: ['OPENCODE_WORKOS_AUDIT_RECORDING', 'WORKOS_AUDIT_RECORDING'],
  },
  defaults: {
    actionPrefix: 'opencode',
    actorType: 'user',
    location: 'opencode',
    userAgent: 'opencode-workos-audit/1',
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

// The transport a config resolves to — one batcher per destination in the
// plugin, and the detached emitter re-checks it before sending so a config
// change between buffering and emission cannot re-route a batch.
export function destinationFor(config) {
  return config.proxyUrl ?? `direct:${config.organizationId ?? ''}`;
}

// Runner for the detached batch emitter. OpenCode is a standalone binary
// (process.execPath is opencode itself), so a real node or bun must be found on
// PATH — checked once, since PATH does not change over the host's lifetime.
let runnerBin;
let runnerResolved = false;

export function findRunnerBin() {
  if (runnerResolved) return runnerBin;
  runnerResolved = true;
  runnerBin = trimToUndefined(process.env.OPENCODE_WORKOS_AUDIT_NODE_BIN);
  if (!runnerBin) {
    for (const candidate of ['node', 'bun']) {
      // Probe by executing the candidate itself: spawnSync resolves it via
      // PATH on every platform, unlike a hardcoded which/where path.
      const probe = spawnSync(candidate, ['--version'], { stdio: 'ignore' });
      if (probe.status === 0) { runnerBin = candidate; break; }
    }
  }
  return runnerBin;
}

export { trimToUndefined, maskSecret } from '@workos-inc/audit-core/util';
