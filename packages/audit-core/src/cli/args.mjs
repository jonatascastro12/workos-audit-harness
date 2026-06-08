import { readFileSync } from 'node:fs';
import { trimToUndefined } from '../util.mjs';
import { DEFAULT_API_BASE_URL, DEFAULT_ORGANIZATION_NAME } from '../workos-client.mjs';

export function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) {
      positional.push(arg);
      continue;
    }
    const eq = arg.indexOf('=');
    if (eq !== -1) {
      flags[arg.slice(2, eq)] = arg.slice(eq + 1);
      continue;
    }
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      flags[key] = next;
      index += 1;
    } else {
      flags[key] = true;
    }
  }
  return { command: positional[0], positional: positional.slice(1), flags };
}

export function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

export async function readOptionalStdin(file) {
  if (file && file !== '-') return '';
  if (process.stdin.isTTY) return '';
  return await readStdin();
}

export function parseJsonText(text, fallback = {}) {
  if (!text || !text.trim()) return fallback;
  return JSON.parse(text);
}

export function readJsonFileOrStdin(file, stdinText) {
  if (file && file !== '-') return parseJsonText(readFileSync(file, 'utf8'));
  return parseJsonText(stdinText);
}

export function configFromFlags(flags = {}) {
  const apiKey = trimToUndefined(flags.apiKey)
    || trimToUndefined(flags['api-key'])
    || trimToUndefined(process.env.WORKOS_AUDIT_HARNESS_API_KEY)
    || trimToUndefined(process.env.WORKOS_API_KEY);
  const organizationId = trimToUndefined(flags.organizationId)
    || trimToUndefined(flags['organization-id'])
    || trimToUndefined(flags.org)
    || trimToUndefined(process.env.WORKOS_AUDIT_HARNESS_ORGANIZATION_ID)
    || trimToUndefined(process.env.WORKOS_ORGANIZATION_ID);
  const apiBaseUrl = trimToUndefined(flags.apiBaseUrl)
    || trimToUndefined(flags['api-base-url'])
    || trimToUndefined(process.env.WORKOS_AUDIT_HARNESS_API_BASE_URL)
    || DEFAULT_API_BASE_URL;
  const organizationName = trimToUndefined(flags.organizationName)
    || trimToUndefined(flags['organization-name'])
    || trimToUndefined(flags['org-name'])
    || trimToUndefined(process.env.WORKOS_AUDIT_HARNESS_ORGANIZATION_NAME)
    || DEFAULT_ORGANIZATION_NAME;
  const proxyUrl = trimToUndefined(flags.proxyUrl)
    || trimToUndefined(flags['proxy-url'])
    || trimToUndefined(process.env.WORKOS_AUDIT_PROXY_URL)
    || trimToUndefined(process.env.WORKOS_AUDIT_HARNESS_PROXY_URL);
  return { apiKey, organizationId, organizationName, apiBaseUrl, proxyUrl };
}

export function print(value, json) {
  if (json) console.log(JSON.stringify(value, null, 2));
  else if (typeof value === 'string') console.log(value);
  else console.log(JSON.stringify(value, null, 2));
}
