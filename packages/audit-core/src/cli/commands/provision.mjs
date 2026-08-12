import {
  getEffectiveApiKey,
  provisionUnclaimedEnvironment,
  workosCliInvocation,
} from '../../workos-client.mjs';
import { configFromFlags, print } from '../args.mjs';

// Explicit, user-initiated zero-account bootstrap. Never runs implicitly:
// hooks and event emission must not mint environments, and a pipeline that
// wants one has to invoke this command on purpose.
export async function run({ flags, json }) {
  const config = configFromFlags(flags);

  // No-clobber: provisioning is a last resort for people with no credentials,
  // never a replacement for credentials that already exist. An unclaimed env
  // must also never displace a real key as the effective target.
  const existing = getEffectiveApiKey(config);
  if (existing && flags.force !== true) {
    throw new Error(
      'A WorkOS credential is already configured (env var, config, or active WorkOS CLI environment) — refusing to provision over it. '
      + 'Pass --force to provision an additional unclaimed environment anyway.',
    );
  }

  const environment = provisionUnclaimedEnvironment();
  print({
    provisioned: true,
    environment: environment.name,
    clientId: environment.clientId,
    authkitDomain: environment.authkitDomain || null,
    unclaimed: true,
    // The claim token never appears here: it stays in the WorkOS CLI's own
    // config store, and `env claim` is the only consumer.
    claim: `This environment has no owner yet. Run \`${workosCliInvocation()} env claim\` to link it to your WorkOS account and keep its data.`,
  }, json);
}
