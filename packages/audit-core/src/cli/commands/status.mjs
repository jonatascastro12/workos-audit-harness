import { maskSecret } from '../../util.mjs';
import { getWorkosCliActiveEnvironment, getWorkosCommandPrefix, parseJson, runWorkos } from '../../workos-client.mjs';
import { configFromFlags, print } from '../args.mjs';

export async function run({ flags, json }) {
  const config = configFromFlags(flags);
  let cliStatus;
  try { cliStatus = parseJson(runWorkos(['auth', 'status', '--json', '--mode', 'agent'])); }
  catch (error) { cliStatus = { available: false, error: error.stderr?.toString?.() || error.message }; }
  let envList;
  try { envList = parseJson(runWorkos(['env', 'list', '--json', '--mode', 'agent'])); }
  catch { envList = undefined; }
  const activeCliEnvironment = getWorkosCliActiveEnvironment();
  print({
    configured: Boolean(config.apiKey || activeCliEnvironment?.apiKey || cliStatus?.authenticated || envList),
    organizationId: config.organizationId || null,
    organizationName: config.organizationName,
    organizationResolution: config.organizationId ? 'explicit' : 'auto-find-or-create',
    apiKey: maskSecret(config.apiKey),
    apiBaseUrl: config.apiBaseUrl,
    credentialSource: config.apiKey ? 'api-key' : (activeCliEnvironment?.apiKey ? 'workos-cli-active-environment' : 'workos-cli'),
    workosCli: { command: getWorkosCommandPrefix().join(' '), auth: cliStatus, environments: envList },
  }, json);
}
