import { maskSecret } from './util.mjs';
import { summarizeWorkosCliAuth } from './workos-client.mjs';

export function printConfigStatus({ configLoader }) {
  const config = configLoader.loadConfig();
  const workosCli = summarizeWorkosCliAuth();
  const credentialSource = config.apiKey
    ? 'api-key'
    : (workosCli.loggedIn ? 'workos-cli' : 'none');
  const configured = credentialSource !== 'none';
  console.log(JSON.stringify({
    configured,
    credentialSource,
    workosCli,
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
