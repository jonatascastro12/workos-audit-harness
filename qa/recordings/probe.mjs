#!/usr/bin/env node
// Drives a plugin MCP server over stdio for QA recordings.
//
//   probe.mjs <server.mjs> status                   -- print workos_audit_status output
//   probe.mjs <server.mjs> query [target-id]        -- run workos_audit_query, optionally filtered by target id
import { spawn } from 'node:child_process';
import readline from 'node:readline';

const [, , target, mode = 'status', targetId] = process.argv;
if (!target) { console.error('usage: probe.mjs <server.mjs> status|query [target-id]'); process.exit(1); }

const child = spawn(process.execPath, [target], { stdio: ['pipe', 'pipe', 'inherit'], env: { ...process.env } });
const rl = readline.createInterface({ input: child.stdout });
let nextId = 1;
const pending = new Map();

rl.on('line', (line) => {
  if (!line.trim()) return;
  let msg;
  try { msg = JSON.parse(line); } catch { return; }
  if (msg.id && pending.has(msg.id)) {
    const { resolve } = pending.get(msg.id);
    pending.delete(msg.id);
    resolve(msg);
  }
});

function send(method, params) {
  const id = nextId++;
  return new Promise((resolve) => {
    pending.set(id, { resolve });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
}

await send('initialize', {
  protocolVersion: '2024-11-05',
  capabilities: {},
  clientInfo: { name: 'qa-probe', version: '0.0.0' },
});
child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');

if (mode === 'status') {
  const status = await send('tools/call', { name: 'workos_audit_status', arguments: {} });
  console.log(status.result?.content?.[0]?.text || JSON.stringify(status, null, 2));
} else if (mode === 'query') {
  const args = { question: 'qa recording', maxRows: 5 };
  if (targetId) args.actorIds = ['jonatas'];
  const result = await send('tools/call', { name: 'workos_audit_query', arguments: args });
  const text = result.result?.content?.[0]?.text || JSON.stringify(result, null, 2);
  console.log(text.split('\n').slice(0, 16).join('\n'));
}

child.stdin.end();
await new Promise((r) => child.on('exit', r));
