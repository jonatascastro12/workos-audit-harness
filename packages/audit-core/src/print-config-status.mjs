import { maskSecret } from './util.mjs';
import { summarizeWorkosCliAuth } from './workos-client.mjs';
import { getDeviceCertLabel } from './device-cert.mjs';

// Report the configuration the way the emit path actually resolves it.
//
// The write path is proxy-first: `emitEvent` returns via the ingestion proxy
// before it ever looks at a credential (see src/cli/emit-event.mjs). So a
// credential-only status report is actively misleading on a fleet machine —
// it names a WorkOS CLI environment that nothing will use, and reports
// `configured: false` on a machine whose ingestion is working perfectly.
// `writeTransport` is therefore the headline field: it is the single answer to
// "where do my events go?".
export function printConfigStatus({ configLoader }) {
  const config = configLoader.loadConfig();
  const workosCli = summarizeWorkosCliAuth();
  const credentialSource = config.apiKey
    ? 'api-key'
    : (workosCli.loggedIn ? 'workos-cli' : 'none');

  // Mirror emitEvent's branch order exactly, so this can never disagree with
  // what a hook will really do.
  const proxyUrl = config.proxyUrl || null;
  // mTLS needs the on-device cert; without it emitViaProxy skips the event
  // rather than falling back, so surface that as its own state.
  const deviceCertLabel = proxyUrl ? getDeviceCertLabel() : null;
  let writeTransport;
  if (proxyUrl) {
    writeTransport = deviceCertLabel ? 'proxy' : 'proxy-no-device-certificate';
  } else {
    writeTransport = credentialSource === 'none' ? 'none' : credentialSource;
  }

  // A proxy-managed machine is fully configured for writes with no credential
  // of its own — the proxy holds the key. Only the query path needs one.
  const configured = writeTransport === 'proxy' || credentialSource !== 'none';

  console.log(JSON.stringify({
    configured,
    writeTransport,
    proxyUrl,
    proxySource: proxyUrl ? config.sources.proxyUrl : null,
    deviceCertificate: proxyUrl ? (deviceCertLabel ?? null) : null,
    credentialSource,
    workosCli,
    organizationResolution: proxyUrl
      // Under the proxy the org is server-side policy; a local organizationId
      // is ignored for writes, so don't imply it applies.
      ? 'proxy-controlled (server-side)'
      : (config.organizationId ? 'explicit' : 'auto-find-or-create Audit Log Harness'),
    // Under the proxy, actor and context are stamped server-side from the device
    // certificate: the local actorId/actorName/location/userAgent below are sent
    // but overwritten, so they describe intent, not what lands in the audit log.
    identitySource: proxyUrl ? 'proxy (device certificate -> MDM assignment)' : 'local config',
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
