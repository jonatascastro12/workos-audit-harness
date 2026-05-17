import { queryAuditLogs } from '../../audit-query.mjs';
import { configFromFlags, print, readJsonFileOrStdin, readOptionalStdin } from '../args.mjs';

const RESERVED_FLAGS = new Set([
  'json', 'file', 'api-key', 'apiKey', 'org', 'organization-id', 'organizationId',
  'api-base-url', 'apiBaseUrl', 'organization-name', 'organizationName', 'org-name',
]);

export async function run({ flags, json }) {
  const config = configFromFlags(flags);
  const stdinText = await readOptionalStdin(flags.file);
  const fileParams = readJsonFileOrStdin(flags.file, stdinText);
  const params = {
    ...fileParams,
    ...Object.fromEntries(Object.entries(flags).filter(([key]) => !RESERVED_FLAGS.has(key))),
  };
  for (const key of ['actions', 'actorIds', 'actorNames', 'targets']) {
    if (typeof params[key] === 'string') {
      params[key] = params[key].split(',').map((item) => item.trim()).filter(Boolean);
    }
  }
  const result = await queryAuditLogs(config, params);
  print(json ? result : result.text, json);
}
