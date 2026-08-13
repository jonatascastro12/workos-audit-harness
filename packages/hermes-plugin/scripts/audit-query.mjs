import { queryAuditLogs } from '@workos-inc/audit-core/audit-query';
import { readStdin, parseJson } from '@workos-inc/audit-core/hook-runtime';
import { configLoader } from './config-file.mjs';

async function main() {
  const argText = process.argv[2];
  const text = argText && argText.trim() ? argText : await readStdin();
  const params = parseJson(text);
  const result = await queryAuditLogs(configLoader.loadQueryConfig(), params);
  process.stdout.write(`${result.text}\n`);
}

try {
  await main();
} catch (error) {
  console.error(String(error instanceof Error ? error.message : error));
  process.exit(1);
}
