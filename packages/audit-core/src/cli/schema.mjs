import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createSdk, parseJson, retry, runWorkos } from '../workos-client.mjs';

export async function createSchema(config, schema) {
  if (!schema?.action) throw new Error('Schema must include action.');
  const body = { actor: schema.actor, targets: schema.targets, metadata: schema.metadata };
  const workos = createSdk(config);
  if (workos) {
    return await retry(
      () => workos.auditLogs.createSchema({ action: schema.action, ...body }),
      `schema ${schema.action}`,
    );
  }
  const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'workos-audit-harness-'));
  const schemaPath = path.join(tmpDir, 'schema.json');
  try {
    writeFileSync(schemaPath, JSON.stringify(body, null, 2), 'utf8');
    return await retry(
      () => parseJson(runWorkos(['audit-log', 'create-schema', schema.action, '--file', schemaPath, '--json', '--mode', 'agent'])),
      `schema ${schema.action}`,
    );
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}
