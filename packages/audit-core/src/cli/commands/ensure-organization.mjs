import { ensureOrganization } from '../../workos-client.mjs';
import { configFromFlags, print } from '../args.mjs';

export async function run({ flags, json }) {
  const config = configFromFlags(flags);
  const organizationId = await ensureOrganization(config);
  print({ organizationId, organizationName: config.organizationName }, json);
}
