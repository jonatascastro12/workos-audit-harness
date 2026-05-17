import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { trimToUndefined, sha256 } from './util.mjs';

export function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

export function parseJson(text) {
  if (!text.trim()) return {};
  return JSON.parse(text);
}

export function compactMetadata(metadata) {
  return Object.fromEntries(Object.entries(metadata).filter(([, value]) => value !== undefined));
}

export function createToolTimingStore({ baseEnvNames, fallbackDirName, timingKeyExtras = {} }) {
  function getStateDir() {
    let base;
    for (const name of baseEnvNames) {
      base = trimToUndefined(process.env[name]);
      if (base) break;
    }
    if (!base) base = path.join(os.tmpdir(), fallbackDirName);
    const dir = path.join(base, 'hook-state', 'tool-timings');
    mkdirSync(dir, { recursive: true });
    return dir;
  }

  function getTimingPath(payload) {
    const toolUseId = payload.tool_use_id || sha256({
      session_id: payload.session_id,
      tool_name: payload.tool_name,
      tool_input: payload.tool_input,
      ...Object.fromEntries(Object.entries(timingKeyExtras).map(([k, field]) => [k, payload[field]])),
    });
    return path.join(getStateDir(), `${toolUseId}.json`);
  }

  function storeToolTiming(payload) {
    writeFileSync(getTimingPath(payload), JSON.stringify({ startedAt: Date.now() }), 'utf8');
  }

  function consumeToolTiming(payload) {
    const timingPath = getTimingPath(payload);
    if (!existsSync(timingPath)) return undefined;
    try {
      const raw = JSON.parse(readFileSync(timingPath, 'utf8'));
      rmSync(timingPath, { force: true });
      return typeof raw.startedAt === 'number' ? Date.now() - raw.startedAt : undefined;
    } catch {
      rmSync(timingPath, { force: true });
      return undefined;
    }
  }

  return { storeToolTiming, consumeToolTiming };
}
