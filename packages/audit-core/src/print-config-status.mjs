import { maskSecret } from './util.mjs';

export function printConfigStatus({ configLoader }) {
  const config = configLoader.loadConfig();
  console.log(JSON.stringify({
    configured: true,
    credentialSource: config.apiKey ? 'api-key' : 'workos-cli',
    organizationResolution: config.organizationId ? 'explicit' : 'auto-find-or-create Audit Log Harness',
    configPath: config.configPath,
    apiKey: maskSecret(config.apiKey),
    organizationId: config.organizationId || null,
    actionPrefix: config.actionPrefix,
    actorId: config.actorId,
    actorType: config.actorType,
    actorName: config.actorName,
    location: config.location,
    userAgent: config.userAgent,
    recordingEnabled: config.recordingEnabled !== false,
    sources: config.sources,
  }, null, 2));
}
